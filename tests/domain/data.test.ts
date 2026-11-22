import { describe, expect, it } from 'vitest';
import { parseCsv, parseCsvObjects, toCsv } from '../../src/domain/csv';
import { addDays, dateWindow, daysBetween, isIsoDate } from '../../src/domain/dates';
import { isInGazaBounds } from '../../src/domain/geo';
import { csvTemplate, exportCsv, importCsv } from '../../src/domain/io';
import { buildDemoDataset } from '../../src/domain/seed';
import { validateDataset, validateDelivery, validateSite, validateTest } from '../../src/domain/validate';
import { REF, point, site } from './fixtures';

describe('csv', () => {
  it('round-trips quoted fields with commas, quotes and newlines', () => {
    const rows = [{ a: 'x, y', b: 'say "hi"', c: 'line1\nline2' }];
    const csv = toCsv(rows, ['a', 'b', 'c']);
    expect(parseCsvObjects(csv)).toEqual(rows);
  });
  it('handles CRLF, BOM and trailing blank lines', () => {
    expect(parseCsv('﻿a,b\r\n1,2\r\n\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
  it('neutralises formula injection but keeps negative numbers', () => {
    const csv = toCsv([{ a: '=HYPERLINK("x")', b: '-3' }], ['a', 'b']);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain(',-3');
  });
});

describe('dates', () => {
  it('validates ISO dates strictly', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('26-2-1')).toBe(false);
  });
  it('does date arithmetic across month ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(daysBetween('2026-11-01', '2026-12-01')).toBe(30);
    expect(dateWindow('2026-03-01', 2)).toEqual(['2026-02-28', '2026-03-01']);
  });
});

describe('validation', () => {
  it('accepts a valid site from string input (as from CSV or a form)', () => {
    const r = validateSite({ name: 'X', governorate: 'Rafah', lat: '31.3', lng: '34.26', population: '1200' });
    expect(r.ok && r.value.population).toBe(1200);
  });
  it('rejects coordinates outside the Gaza Strip and bad enums', () => {
    const r = validateSite({ name: 'X', governorate: 'Paris', lat: '48.8', lng: '2.3', population: '5' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.code).sort()).toEqual(['bounds', 'enum']);
  });
  it('rejects deliveries that reference unknown records or future dates', () => {
    const r = validateDelivery({ date: '2026-12-01', pointId: 'nope', siteId: 's', litres: '10' }, [site('s')], [point('p')], REF);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.code).sort()).toEqual(['future', 'ref']);
  });
  it('requires at least one measurement in a quality test', () => {
    expect(validateTest({ date: REF, pointId: 'p' }, [point('p')]).ok).toBe(false);
  });
  it('validates a full exported dataset and drops bad records with a report', () => {
    const ds = buildDemoDataset(REF);
    const json = JSON.parse(JSON.stringify(ds));
    json.sites.push({ id: 'site-01', name: 'dup', governorate: 'Rafah', lat: 31.3, lng: 34.26, population: 5 });
    json.deliveries.push({ id: 'bad', date: 'x', pointId: 'pt-01', siteId: 'site-01', litres: 1 });
    const r = validateDataset(json);
    expect(r.dataset!.sites).toHaveLength(ds.sites.length);
    expect(r.dataset!.deliveries).toHaveLength(ds.deliveries.length);
    expect(r.errors).toHaveLength(2);
  });
  it('rejects unknown schema versions', () => {
    expect(validateDataset({ schemaVersion: 9 }).errors).toEqual(['unsupported_schema']);
  });
});

describe('CSV import/export', () => {
  const ds = buildDemoDataset(REF);

  it('round-trips every entity type through CSV', () => {
    for (const kind of ['sites', 'points', 'deliveries', 'tests'] as const) {
      const r = importCsv(ds, kind, exportCsv(ds, kind), REF);
      expect(r.rejected).toEqual([]);
      expect(r[kind]).toEqual(JSON.parse(JSON.stringify(ds[kind])));
    }
  });

  it('matches headers case-insensitively, assigns ids, and reports bad rows with line numbers', () => {
    const csv = 'DATE,POINTID,SITEID,LITRES\n2026-11-19,pt-01,site-01,20000\n2026-11-19,pt-99,site-01,5\n';
    const r = importCsv(ds, 'deliveries', csv, REF);
    expect(r.accepted).toBe(1);
    expect(r.deliveries![0].id).toMatch(/^dl-/);
    expect(r.rejected).toEqual([{ row: 3, errors: ['pointId: ref'] }]);
  });

  it('provides a header-only template', () => {
    expect(csvTemplate('tests')).toBe('id,date,pointId,frc,turbidity,ecoli\r\n');
  });
});

describe('demo dataset', () => {
  const ds = buildDemoDataset(REF);
  it('is flagged as demo and places every record inside the Gaza Strip bounds', () => {
    expect(ds.demo).toBe(true);
    for (const r of [...ds.sites, ...ds.points]) expect(isInGazaBounds(r.lat, r.lng)).toBe(true);
  });
  it('is deterministic', () => {
    expect(buildDemoDataset(REF).deliveries).toEqual(ds.deliveries);
  });
  it('passes its own validation', () => {
    expect(validateDataset(ds).errors).toEqual([]);
  });
});
