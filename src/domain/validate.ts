import { isIsoDate } from './dates';
import { isInGazaBounds } from './geo';
import {
  DEFAULT_SETTINGS,
  GOVERNORATES,
  POINT_STATUSES,
  POINT_TYPES,
  type Dataset,
  type Delivery,
  type Governorate,
  type PointStatus,
  type PointType,
  type QualityTest,
  type Settings,
  type Site,
  type WaterPoint,
} from './types';

/** Error codes are translated in the UI (see i18n `err.*`). */
export interface FieldError {
  field: string;
  code: 'required' | 'number' | 'min' | 'max' | 'bounds' | 'date' | 'enum' | 'ref' | 'future';
}

export type Result<T> = { ok: true; value: T } | { ok: false; errors: FieldError[] };

type Raw = Record<string, unknown>;

const str = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim());
const optNum = (v: unknown): number | undefined | null => {
  const s = str(v);
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

class Checker {
  errors: FieldError[] = [];
  text(raw: Raw, field: string): string {
    const s = str(raw[field]);
    if (!s) this.errors.push({ field, code: 'required' });
    return s;
  }
  num(raw: Raw, field: string, min?: number, max?: number, required = true): number | undefined {
    const n = optNum(raw[field]);
    if (n === undefined) {
      if (required) this.errors.push({ field, code: 'required' });
      return undefined;
    }
    if (n === null) {
      this.errors.push({ field, code: 'number' });
      return undefined;
    }
    if (min !== undefined && n < min) this.errors.push({ field, code: 'min' });
    if (max !== undefined && n > max) this.errors.push({ field, code: 'max' });
    return n;
  }
  oneOf<T extends string>(raw: Raw, field: string, allowed: readonly T[]): T {
    const s = str(raw[field]) as T;
    if (!allowed.includes(s)) this.errors.push({ field, code: s ? 'enum' : 'required' });
    return s;
  }
  date(raw: Raw, field: string, today?: string): string {
    const s = str(raw[field]);
    if (!isIsoDate(s)) this.errors.push({ field, code: s ? 'date' : 'required' });
    else if (today && s > today) this.errors.push({ field, code: 'future' });
    return s;
  }
  coords(raw: Raw): { lat: number; lng: number } {
    const lat = this.num(raw, 'lat', -90, 90);
    const lng = this.num(raw, 'lng', -180, 180);
    if (lat !== undefined && lng !== undefined && !isInGazaBounds(lat, lng)) this.errors.push({ field: 'lat', code: 'bounds' });
    return { lat: lat ?? 0, lng: lng ?? 0 };
  }
  done<T>(value: T): Result<T> {
    return this.errors.length ? { ok: false, errors: this.errors } : { ok: true, value };
  }
}

export function validateSite(raw: Raw): Result<Site> {
  const c = new Checker();
  const site: Site = {
    id: str(raw.id),
    name: c.text(raw, 'name'),
    governorate: c.oneOf<Governorate>(raw, 'governorate', GOVERNORATES),
    ...c.coords(raw),
    population: Math.round(c.num(raw, 'population', 1, 2_500_000) ?? 0),
    vulnerability: c.num(raw, 'vulnerability', 1, 2, false) ?? 1,
    fixedSupplyLpd: c.num(raw, 'fixedSupplyLpd', 0, 1e8, false) ?? 0,
    notes: str(raw.notes) || undefined,
  };
  return c.done(site);
}

export function validatePoint(raw: Raw): Result<WaterPoint> {
  const c = new Checker();
  const point: WaterPoint = {
    id: str(raw.id),
    name: c.text(raw, 'name'),
    type: c.oneOf<PointType>(raw, 'type', POINT_TYPES),
    status: c.oneOf<PointStatus>(raw, 'status', POINT_STATUSES),
    ...c.coords(raw),
    capacityLpd: c.num(raw, 'capacityLpd', 0, 1e9) ?? 0,
    taps: Math.round(c.num(raw, 'taps', 0, 1000, false) ?? 0),
    notes: str(raw.notes) || undefined,
  };
  return c.done(point);
}

export function validateDelivery(raw: Raw, sites: Site[], points: WaterPoint[], today?: string): Result<Delivery> {
  const c = new Checker();
  const d: Delivery = {
    id: str(raw.id),
    date: c.date(raw, 'date', today),
    pointId: c.text(raw, 'pointId'),
    siteId: c.text(raw, 'siteId'),
    litres: c.num(raw, 'litres', 1, 1e8) ?? 0,
  };
  if (d.pointId && !points.some((p) => p.id === d.pointId)) c.errors.push({ field: 'pointId', code: 'ref' });
  if (d.siteId && !sites.some((s) => s.id === d.siteId)) c.errors.push({ field: 'siteId', code: 'ref' });
  return c.done(d);
}

export function validateTest(raw: Raw, points: WaterPoint[], today?: string): Result<QualityTest> {
  const c = new Checker();
  const t: QualityTest = {
    id: str(raw.id),
    date: c.date(raw, 'date', today),
    pointId: c.text(raw, 'pointId'),
    frc: c.num(raw, 'frc', 0, 50, false),
    turbidity: c.num(raw, 'turbidity', 0, 10_000, false),
    ecoli: c.num(raw, 'ecoli', 0, 1e7, false),
  };
  if (t.pointId && !points.some((p) => p.id === t.pointId)) c.errors.push({ field: 'pointId', code: 'ref' });
  if (t.frc === undefined && t.turbidity === undefined && t.ecoli === undefined)
    c.errors.push({ field: 'frc', code: 'required' });
  return c.done(t);
}

export function validateSettings(raw: Raw): Settings {
  const n = (k: keyof Settings, min: number, max: number) => {
    const v = optNum(raw[k]);
    return typeof v === 'number' && v >= min && v <= max ? v : (DEFAULT_SETTINGS[k] as number);
  };
  return {
    targetLpd: n('targetLpd', 1, 200),
    criticalLpd: n('criticalLpd', 1, 100),
    maxDistanceM: n('maxDistanceM', 50, 10_000),
    peoplePerTap: n('peoplePerTap', 10, 5000),
    chlorineMode: raw.chlorineMode === 'outbreak' ? 'outbreak' : 'normal',
    windowDays: Math.round(n('windowDays', 1, 60)),
    testMaxAgeDays: Math.round(n('testMaxAgeDays', 1, 90)),
  };
}

export interface ImportReport {
  dataset?: Dataset;
  errors: string[];
}

/** Validate an imported JSON dataset. Invalid records are dropped and reported, not silently kept. */
export function validateDataset(input: unknown): ImportReport {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return { errors: ['not_an_object'] };
  const raw = input as Raw;
  if (raw.schemaVersion !== 1) return { errors: ['unsupported_schema'] };
  const arr = (k: string) => (Array.isArray(raw[k]) ? (raw[k] as Raw[]) : []);

  const keep = <T extends { id: string }>(kind: string, items: Raw[], fn: (r: Raw) => Result<T>): T[] => {
    const out: T[] = [];
    const seen = new Set<string>();
    items.forEach((r, i) => {
      const res = fn(r);
      if (!res.ok) errors.push(`${kind}[${i}]: ${res.errors.map((e) => `${e.field}:${e.code}`).join(', ')}`);
      else if (!res.value.id || seen.has(res.value.id)) errors.push(`${kind}[${i}]: id:duplicate_or_missing`);
      else {
        seen.add(res.value.id);
        out.push(res.value);
      }
    });
    return out;
  };

  const sites = keep('sites', arr('sites'), validateSite);
  const points = keep('points', arr('points'), validatePoint);
  const deliveries = keep('deliveries', arr('deliveries'), (r) => validateDelivery(r, sites, points));
  const tests = keep('tests', arr('tests'), (r) => validateTest(r, points));
  const settings = validateSettings((raw.settings as Raw) ?? {});

  return {
    dataset: {
      schemaVersion: 1,
      demo: raw.demo === true,
      updatedAt: new Date().toISOString(),
      sites,
      points,
      deliveries,
      tests,
      settings,
    },
    errors,
  };
}

export function newId(prefix: string): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rnd}`;
}
