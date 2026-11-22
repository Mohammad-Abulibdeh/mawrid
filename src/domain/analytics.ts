import { dateWindow, daysBetween } from './dates';
import { distanceM } from './geo';
import { pointQuality, type QualityStatus } from './quality';
import type { Dataset, Delivery, Settings, Site, WaterPoint } from './types';

export type CoverageBand = 'critical' | 'below' | 'meets';

export interface SiteMetrics {
  site: Site;
  /** Average trucked litres/day over the window. */
  deliveredLpd: number;
  /** deliveredLpd + fixed supply. */
  supplyLpd: number;
  /** Litres per person per day. */
  perCapita: number;
  band: CoverageBand;
  /** Additional litres/day needed to reach the target. */
  gapLpd: number;
  nearestPoint?: WaterPoint;
  nearestDistanceM?: number;
  withinDistance: boolean;
  /** Taps at functional/partial, not-unsafe points within the max distance. */
  tapsInReach: number;
  /** People per accessible tap (Infinity when no tap in reach). */
  peoplePerTap: number;
  /** Ranking score: higher = more urgent. */
  priority: number;
}

export function bandFor(perCapita: number, settings: Settings): CoverageBand {
  if (perCapita < settings.criticalLpd) return 'critical';
  if (perCapita < settings.targetLpd) return 'below';
  return 'meets';
}

/** Average daily trucked volume per site over the `windowDays` ending at refDate (days with no delivery count as 0). */
export function deliveredBySite(deliveries: Delivery[], refDate: string, windowDays: number): Map<string, number> {
  const totals = new Map<string, number>();
  for (const d of deliveries) {
    const age = daysBetween(d.date, refDate);
    if (age < 0 || age >= windowDays) continue;
    totals.set(d.siteId, (totals.get(d.siteId) ?? 0) + d.litres);
  }
  for (const [k, v] of totals) totals.set(k, v / windowDays);
  return totals;
}

export function pointQualityMap(ds: Dataset, refDate: string): Map<string, QualityStatus> {
  const m = new Map<string, QualityStatus>();
  for (const p of ds.points) {
    m.set(p.id, pointQuality(p.id, ds.tests, ds.settings.chlorineMode, refDate, ds.settings.testMaxAgeDays).status);
  }
  return m;
}

/** A point people can actually collect from: not down and not known-unsafe. */
export function isUsablePoint(p: WaterPoint, quality: QualityStatus | undefined): boolean {
  return p.status !== 'down' && quality !== 'unsafe';
}

/**
 * Priority score. Combines how far below target the site is (relative shortfall, 0–1),
 * the size of the shortfall in litres, vulnerability, and an access penalty when there is no
 * usable water point within the max distance. Kept deliberately simple and explainable.
 */
export function priorityScore(
  perCapita: number,
  population: number,
  vulnerability: number,
  withinDistance: boolean,
  settings: Settings,
): number {
  const shortfall = Math.max(0, settings.targetLpd - perCapita) / settings.targetLpd; // 0..1
  const critical = perCapita < settings.criticalLpd ? 1 : 0;
  const scale = Math.log10(Math.max(10, population)); // 1..~5, avoids huge sites drowning out others
  const access = withinDistance ? 0 : 0.25;
  return Math.round((shortfall + 0.5 * critical + access) * vulnerability * scale * 100) / 100;
}

export function computeSiteMetrics(ds: Dataset, refDate: string): SiteMetrics[] {
  const { settings } = ds;
  const delivered = deliveredBySite(ds.deliveries, refDate, settings.windowDays);
  const quality = pointQualityMap(ds, refDate);
  const usable = ds.points.filter((p) => isUsablePoint(p, quality.get(p.id)));

  return ds.sites.map((site) => {
    const deliveredLpd = delivered.get(site.id) ?? 0;
    const supplyLpd = deliveredLpd + (site.fixedSupplyLpd || 0);
    const perCapita = site.population > 0 ? supplyLpd / site.population : 0;

    let nearestPoint: WaterPoint | undefined;
    let nearestDistanceM: number | undefined;
    let tapsInReach = 0;
    for (const p of usable) {
      const d = distanceM(site, p);
      if (p.taps > 0 && (nearestDistanceM === undefined || d < nearestDistanceM)) {
        nearestPoint = p;
        nearestDistanceM = d;
      }
      if (d <= settings.maxDistanceM) tapsInReach += p.taps;
    }
    const withinDistance = nearestDistanceM !== undefined && nearestDistanceM <= settings.maxDistanceM;
    const peoplePerTap = tapsInReach > 0 ? site.population / tapsInReach : Infinity;
    const gapLpd = Math.max(0, settings.targetLpd * site.population - supplyLpd);

    return {
      site,
      deliveredLpd,
      supplyLpd,
      perCapita,
      band: bandFor(perCapita, settings),
      gapLpd,
      nearestPoint,
      nearestDistanceM,
      withinDistance,
      tapsInReach,
      peoplePerTap,
      priority: priorityScore(perCapita, site.population, site.vulnerability || 1, withinDistance, settings),
    };
  });
}

export interface Summary {
  sites: number;
  population: number;
  totalSupplyLpd: number;
  /** Population-weighted litres per person per day. */
  avgPerCapita: number;
  populationCritical: number;
  populationBelowTarget: number;
  totalGapLpd: number;
  sitesBeyondDistance: number;
  pointsFunctional: number;
  pointsPartial: number;
  pointsDown: number;
  pointsUnsafe: number;
  pointsUntested: number;
  /** Total usable output of fill sources (litres/day). */
  usableCapacityLpd: number;
}

export function summarize(ds: Dataset, metrics: SiteMetrics[], refDate: string): Summary {
  const quality = pointQualityMap(ds, refDate);
  const population = metrics.reduce((a, m) => a + m.site.population, 0);
  const totalSupplyLpd = metrics.reduce((a, m) => a + m.supplyLpd, 0);
  let usableCapacityLpd = 0;
  let pointsUnsafe = 0;
  let pointsUntested = 0;
  for (const p of ds.points) {
    const q = quality.get(p.id);
    if (q === 'unsafe') pointsUnsafe++;
    if (q === 'untested') pointsUntested++;
    if (p.type !== 'distribution' && isUsablePoint(p, q)) usableCapacityLpd += p.capacityLpd;
  }
  return {
    sites: metrics.length,
    population,
    totalSupplyLpd,
    avgPerCapita: population > 0 ? totalSupplyLpd / population : 0,
    populationCritical: metrics.filter((m) => m.band === 'critical').reduce((a, m) => a + m.site.population, 0),
    populationBelowTarget: metrics.filter((m) => m.band !== 'meets').reduce((a, m) => a + m.site.population, 0),
    totalGapLpd: metrics.reduce((a, m) => a + m.gapLpd, 0),
    sitesBeyondDistance: metrics.filter((m) => !m.withinDistance).length,
    pointsFunctional: ds.points.filter((p) => p.status === 'functional').length,
    pointsPartial: ds.points.filter((p) => p.status === 'partial').length,
    pointsDown: ds.points.filter((p) => p.status === 'down').length,
    pointsUnsafe,
    pointsUntested,
    usableCapacityLpd,
  };
}

/** Total litres delivered per day over the last `days` days, oldest first. */
export function dailyDeliveredSeries(deliveries: Delivery[], refDate: string, days: number) {
  const dates = dateWindow(refDate, days);
  const totals = new Map(dates.map((d) => [d, 0]));
  for (const d of deliveries) if (totals.has(d.date)) totals.set(d.date, totals.get(d.date)! + d.litres);
  return dates.map((date) => ({ date, litres: totals.get(date)! }));
}

export function rankByPriority(metrics: SiteMetrics[]): SiteMetrics[] {
  return [...metrics].sort((a, b) => b.priority - a.priority || a.perCapita - b.perCapita);
}
