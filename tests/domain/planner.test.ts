import { describe, expect, it } from 'vitest';
import { planDispatch, type PlanParams } from '../../src/domain/planner';
import { buildDemoDataset } from '../../src/domain/seed';
import { dataset, point, REF, site } from './fixtures';

const params = (over: Partial<PlanParams> = {}): PlanParams => ({
  trucks: 1,
  tripsPerTruck: 10,
  loadLitres: 1000,
  maxHaulKm: 50,
  includeUntested: true,
  ...over,
});

describe('planDispatch', () => {
  it('raises the worst-off site first (max-min fairness)', () => {
    const ds = dataset({
      sites: [site('a', { population: 1000, fixedSupplyLpd: 10_000 }), site('b', { population: 1000 })],
      points: [point('p')],
    });
    const r = planDispatch(ds, REF, params({ tripsPerTruck: 6 }));
    const b = r.sites.find((s) => s.site.id === 'b')!;
    const a = r.sites.find((s) => s.site.id === 'a')!;
    // b starts at 0, a at 10 L/p/d. 6 loads of 1 L/p/d each all go to b.
    expect(b.loads).toBe(6);
    expect(a.loads).toBe(0);
    expect(r.minBefore).toBe(0);
    expect(r.minAfter).toBe(6);
    expect(r.stopReason).toBe('no_trucks');
  });

  it('equalises sites once they reach the same level', () => {
    const ds = dataset({
      sites: [site('a', { population: 1000, fixedSupplyLpd: 2000 }), site('b', { population: 1000 })],
      points: [point('p')],
    });
    const r = planDispatch(ds, REF, params({ tripsPerTruck: 10 }));
    expect(r.sites.map((s) => s.afterPerCapita).sort()).toEqual([6, 6]);
  });

  it('stops when every site reaches the target', () => {
    const ds = dataset({ sites: [site('a', { population: 100 })], points: [point('p')] });
    const r = planDispatch(ds, REF, params({ tripsPerTruck: 100 }));
    expect(r.loadsUsed).toBe(2); // 100 people × 15 L = 1500 L → 2 loads of 1000 L
    expect(r.sites[0].afterPerCapita).toBe(20);
    expect(r.stopReason).toBe('target_reached');
  });

  it('respects source capacity and reports no_capacity', () => {
    const ds = dataset({ sites: [site('a', { population: 1000 })], points: [point('p', { capacityLpd: 2500 })] });
    const r = planDispatch(ds, REF, params());
    expect(r.loadsUsed).toBe(2);
    expect(r.stopReason).toBe('no_capacity');
    expect(r.sites[0].sourcesExhausted).toBe(true);
    expect(r.sites[0].unreachable).toBe(false);
  });

  it('never uses down, unsafe, distribution-only, or (optionally) untested sources', () => {
    const ds = dataset({
      sites: [site('a')],
      points: [
        point('down', { status: 'down' }),
        point('unsafe'),
        point('tap', { type: 'distribution', taps: 4 }),
        point('untested'),
      ],
      tests: [{ id: 'q', date: REF, pointId: 'unsafe', frc: 0.3, ecoli: 5 }],
    });
    const r = planDispatch(ds, REF, params({ includeUntested: false }));
    expect(r.loadsUsed).toBe(0);
    expect(Object.fromEntries(r.excludedSources.map((e) => [e.point.id, e.reason]))).toEqual({
      down: 'down',
      unsafe: 'unsafe',
      tap: 'not_fill_source',
      untested: 'untested',
    });
    expect(planDispatch(ds, REF, params()).trips[0].pointId).toBe('untested');
  });

  it('marks sites beyond the haul limit as unreachable', () => {
    const ds = dataset({ sites: [site('far', { lat: 31.55 })], points: [point('p')] });
    const r = planDispatch(ds, REF, params({ maxHaulKm: 5 }));
    expect(r.sites[0].unreachable).toBe(true);
    expect(r.stopReason).toBe('all_unreachable');
  });

  it('prefers the nearest source', () => {
    const ds = dataset({
      sites: [site('a', { population: 100 })],
      points: [point('far', { lat: 31.48 }), point('near', { lat: 31.421 })],
    });
    expect(planDispatch(ds, REF, params()).trips[0].pointId).toBe('near');
  });

  it('gives priority to more vulnerable sites at equal coverage', () => {
    const ds = dataset({
      sites: [site('a', { population: 1000 }), site('v', { population: 1000, vulnerability: 1.5 })],
      points: [point('p')],
    });
    const r = planDispatch(ds, REF, params({ tripsPerTruck: 1 }));
    expect(r.trips[0].siteId).toBe('v');
  });

  it('does not give extra water to a vulnerable site that already meets target', () => {
    const ds = dataset({
      sites: [site('v', { population: 100, vulnerability: 2, fixedSupplyLpd: 1600 }), site('b', { population: 1000, fixedSupplyLpd: 12_000 })],
      points: [point('p')],
    });
    // v: 16 L/p/d (already at target), b: 12 L/p/d → b needs 3 loads to reach 15.
    const r = planDispatch(ds, REF, params({ tripsPerTruck: 5 }));
    expect(r.sites.find((s) => s.site.id === 'v')!.loads).toBe(0);
    expect(r.sites.find((s) => s.site.id === 'b')!.loads).toBe(3);
    expect(r.stopReason).toBe('target_reached');
  });

  it('starts from non-trucked supply only (plans the whole trucking round)', () => {
    const ds = dataset({
      sites: [site('a', { population: 1000 })],
      points: [point('p')],
      deliveries: Array.from({ length: 7 }, (_, i) => ({ id: `d${i}`, date: `2026-11-${14 + i}`, pointId: 'p', siteId: 'a', litres: 10_000 })),
    });
    const r = planDispatch(ds, REF, params({ tripsPerTruck: 3 }));
    expect(r.sites[0].beforePerCapita).toBe(10); // today's actual coverage
    expect(r.sites[0].afterPerCapita).toBe(3); // 3 planned loads from a zero non-trucked baseline
  });

  it('with a fleet the size of current trucking, raises the worst-off sites on the demo dataset', () => {
    const ds = buildDemoDataset(REF);
    const r = planDispatch(ds, REF, { trucks: 25, tripsPerTruck: 4, loadLitres: 10_000, maxHaulKm: 20, includeUntested: true });
    expect(r.loadsUsed).toBeGreaterThan(0);
    expect(r.minAfter).toBeGreaterThan(r.minBefore);
    expect(r.popCriticalAfter).toBeLessThanOrEqual(r.popCriticalBefore);
    const used = new Map<string, number>();
    for (const t of r.trips) used.set(t.pointId, (used.get(t.pointId) ?? 0) + t.litres);
    for (const [id, litres] of used) expect(litres).toBeLessThanOrEqual(ds.points.find((p) => p.id === id)!.capacityLpd);
    expect(r.trips.some((t) => t.pointId === 'pt-04')).toBe(false); // unsafe in demo data
  });
});
