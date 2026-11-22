import { parseCsvObjects, toCsv } from './csv';
import type { Dataset, Delivery, QualityTest, Site, WaterPoint } from './types';
import { newId, validateDelivery, validatePoint, validateSite, validateTest, type Result } from './validate';

export type EntityKind = 'sites' | 'points' | 'deliveries' | 'tests';

export const CSV_COLUMNS = {
  sites: ['id', 'name', 'governorate', 'lat', 'lng', 'population', 'vulnerability', 'fixedSupplyLpd', 'notes'],
  points: ['id', 'name', 'type', 'status', 'lat', 'lng', 'capacityLpd', 'taps', 'notes'],
  deliveries: ['id', 'date', 'pointId', 'siteId', 'litres'],
  tests: ['id', 'date', 'pointId', 'frc', 'turbidity', 'ecoli'],
} as const satisfies Record<EntityKind, readonly string[]>;

export function exportCsv(ds: Dataset, kind: EntityKind): string {
  return toCsv(ds[kind] as object[], [...CSV_COLUMNS[kind]] as never[]);
}

export function csvTemplate(kind: EntityKind): string {
  return CSV_COLUMNS[kind].join(',') + '\r\n';
}

export interface CsvImport {
  sites?: Site[];
  points?: WaterPoint[];
  deliveries?: Delivery[];
  tests?: QualityTest[];
  accepted: number;
  rejected: { row: number; errors: string[] }[];
}

/**
 * Parse and validate a CSV for one entity type. Headers are matched case-insensitively.
 * Rows without an id get a new one. Delivery/test references are checked against the sites and
 * points already in the dataset, so import sites and points before their logs.
 */
export function importCsv(ds: Dataset, kind: EntityKind, text: string, today?: string): CsvImport {
  const canonical = new Map<string, string>(CSV_COLUMNS[kind].map((c) => [c.toLowerCase(), c]));
  const rows = parseCsvObjects(text).map((r) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) out[canonical.get(k) ?? k] = v;
    return out;
  });
  const prefix = { sites: 'site', points: 'pt', deliveries: 'dl', tests: 'qt' }[kind];
  const validate = (r: Record<string, string>): Result<{ id: string }> => {
    switch (kind) {
      case 'sites':
        return validateSite(r);
      case 'points':
        return validatePoint(r);
      case 'deliveries':
        return validateDelivery(r, ds.sites, ds.points, today);
      case 'tests':
        return validateTest(r, ds.points, today);
    }
  };
  const accepted: { id: string }[] = [];
  const rejected: CsvImport['rejected'] = [];
  rows.forEach((r, i) => {
    if (!r.id) r.id = newId(prefix);
    const res = validate(r);
    if (res.ok) accepted.push(res.value);
    else rejected.push({ row: i + 2, errors: res.errors.map((e) => `${e.field}: ${e.code}`) });
  });
  return { [kind]: accepted, accepted: accepted.length, rejected } as CsvImport;
}
