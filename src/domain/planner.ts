import { computeSiteMetrics, pointQualityMap } from './analytics';
import { distanceM } from './geo';
import { FILL_SOURCE_TYPES, type Dataset, type Site, type WaterPoint } from './types';

export interface PlanParams {
  trucks: number;
  tripsPerTruck: number;
  /** Litres per truck load. */
  loadLitres: number;
  /** Maximum one-way haul distance, km. */
  maxHaulKm: number;
  /** Allow sources with no recent quality test. Unsafe sources are always excluded. */
  includeUntested: boolean;
  /** Fill sites up to this L/person/day. Defaults to settings.targetLpd. */
  targetLpd?: number;
}

export const DEFAULT_PLAN_PARAMS: PlanParams = {
  trucks: 10,
  tripsPerTruck: 4,
  loadLitres: 10_000,
  maxHaulKm: 15,
  includeUntested: true,
};

export interface PlanTrip {
  pointId: string;
  siteId: string;
  loads: number;
  litres: number;
  distanceKm: number;
}

export interface PlanSiteResult {
  site: Site;
  beforePerCapita: number;
  afterPerCapita: number;
  allocatedLitres: number;
  loads: number;
  unreachable: boolean;
}

export interface PlanResult {
  trips: PlanTrip[];
  sites: PlanSiteResult[];
  loadsAvailable: number;
  loadsUsed: number;
  litresAllocated: number;
  /** Round-trip truck kilometres. */
  truckKm: number;
  minBefore: number;
  minAfter: number;
  popCriticalBefore: number;
  popCriticalAfter: number;
  popMeetsBefore: number;
  popMeetsAfter: number;
  eligibleSources: WaterPoint[];
  excludedSources: { point: WaterPoint; reason: 'down' | 'unsafe' | 'untested' | 'not_fill_source' }[];
  stopReason: 'target_reached' | 'no_trucks' | 'no_capacity' | 'all_unreachable';
}

/**
 * Discrete max-min fair allocation ("water-filling") of truck loads.
 *
 * Repeatedly picks the site with the lowest vulnerability-adjusted projected L/person/day,
 * and assigns one load from the nearest eligible source that still has capacity and is within
 * the haul limit. Stops when trucks or capacity run out, or every reachable site is at target.
 * Deterministic: ties break on population (larger first), then id.
 */
export function planDispatch(ds: Dataset, refDate: string, params: PlanParams): PlanResult {
  const target = params.targetLpd ?? ds.settings.targetLpd;
  const metrics = computeSiteMetrics(ds, refDate);
  const quality = pointQualityMap(ds, refDate);

  const eligibleSources: WaterPoint[] = [];
  const excludedSources: PlanResult['excludedSources'] = [];
  for (const p of ds.points) {
    const q = quality.get(p.id);
    if (!FILL_SOURCE_TYPES.includes(p.type)) excludedSources.push({ point: p, reason: 'not_fill_source' });
    else if (p.status === 'down') excludedSources.push({ point: p, reason: 'down' });
    else if (q === 'unsafe') excludedSources.push({ point: p, reason: 'unsafe' });
    else if (q === 'untested' && !params.includeUntested) excludedSources.push({ point: p, reason: 'untested' });
    else eligibleSources.push(p);
  }

  const remaining = new Map(eligibleSources.map((p) => [p.id, Math.max(0, p.capacityLpd)]));
  const loadsAvailable = Math.max(0, Math.floor(params.trucks) * Math.floor(params.tripsPerTruck));
  const load = Math.max(1, params.loadLitres);
  const maxHaulM = params.maxHaulKm * 1000;

  // Per-site candidate sources sorted by distance, computed once.
  const candidates = new Map<string, { point: WaterPoint; d: number }[]>();
  for (const m of metrics) {
    const list = eligibleSources
      .map((point) => ({ point, d: distanceM(m.site, point) }))
      .filter((c) => c.d <= maxHaulM)
      .sort((a, b) => a.d - b.d);
    candidates.set(m.site.id, list);
  }

  const state = metrics
    .filter((m) => m.site.population > 0)
    .map((m) => ({
      site: m.site,
      supply: m.supplyLpd,
      before: m.perCapita,
      allocated: 0,
      loads: 0,
      active: true,
      unreachable: false,
    }));
  const per = (s: (typeof state)[number]) => (s.supply + s.allocated) / s.site.population;
  // Weighted shortfall: the site with the largest (target − projected) × vulnerability goes first.
  const need = (s: (typeof state)[number]) => (target - per(s)) * Math.max(1, s.site.vulnerability || 1);

  const tripKey = (p: string, s: string) => `${p}→${s}`;
  const trips = new Map<string, PlanTrip>();
  let loadsUsed = 0;
  let stopReason: PlanResult['stopReason'] = 'no_trucks';

  while (true) {
    if (loadsUsed >= loadsAvailable) {
      stopReason = 'no_trucks';
      break;
    }
    let pick: (typeof state)[number] | undefined;
    for (const s of state) {
      if (!s.active) continue;
      if (
        !pick ||
        need(s) > need(pick) ||
        (need(s) === need(pick) &&
          (s.site.population > pick.site.population ||
            (s.site.population === pick.site.population && s.site.id < pick.site.id)))
      )
        pick = s;
    }
    if (!pick) {
      // Every site was deactivated: either unreachable, or its reachable sources ran dry.
      if (state.length > 0 && state.every((s) => s.unreachable)) stopReason = 'all_unreachable';
      else if (state.some((s) => !s.unreachable && per(s) < target)) stopReason = 'no_capacity';
      else stopReason = 'target_reached';
      break;
    }
    if (per(pick) >= target) {
      // The most-in-need active site already meets target, so all do.
      pick.active = false;
      continue;
    }
    const src = candidates.get(pick.site.id)!.find((c) => (remaining.get(c.point.id) ?? 0) >= load);
    if (!src) {
      pick.active = false;
      if (candidates.get(pick.site.id)!.length === 0) pick.unreachable = true;
      continue;
    }
    remaining.set(src.point.id, remaining.get(src.point.id)! - load);
    pick.allocated += load;
    pick.loads += 1;
    loadsUsed += 1;
    const key = tripKey(src.point.id, pick.site.id);
    const t = trips.get(key) ?? {
      pointId: src.point.id,
      siteId: pick.site.id,
      loads: 0,
      litres: 0,
      distanceKm: Math.round(src.d / 100) / 10,
    };
    t.loads += 1;
    t.litres += load;
    trips.set(key, t);
  }

  const sites: PlanSiteResult[] = state.map((s) => ({
    site: s.site,
    beforePerCapita: s.before,
    afterPerCapita: per(s),
    allocatedLitres: s.allocated,
    loads: s.loads,
    unreachable: s.unreachable,
  }));
  const tripList = [...trips.values()].sort((a, b) => b.litres - a.litres || a.siteId.localeCompare(b.siteId));
  const popWhere = (f: (r: PlanSiteResult) => boolean) =>
    sites.filter(f).reduce((a, r) => a + r.site.population, 0);
  const crit = ds.settings.criticalLpd;

  return {
    trips: tripList,
    sites,
    loadsAvailable,
    loadsUsed,
    litresAllocated: loadsUsed * load,
    truckKm: Math.round(tripList.reduce((a, t) => a + t.loads * t.distanceKm * 2, 0) * 10) / 10,
    minBefore: sites.length ? Math.min(...sites.map((s) => s.beforePerCapita)) : 0,
    minAfter: sites.length ? Math.min(...sites.map((s) => s.afterPerCapita)) : 0,
    popCriticalBefore: popWhere((r) => r.beforePerCapita < crit),
    popCriticalAfter: popWhere((r) => r.afterPerCapita < crit),
    popMeetsBefore: popWhere((r) => r.beforePerCapita >= target),
    popMeetsAfter: popWhere((r) => r.afterPerCapita >= target),
    eligibleSources,
    excludedSources,
    stopReason,
  };
}
