import { describe, expect, it } from 'vitest';
import {
  bandFor,
  computeSiteMetrics,
  dailyDeliveredSeries,
  deliveredBySite,
  rankByPriority,
  summarize,
} from '../../src/domain/analytics';
import { distanceM } from '../../src/domain/geo';
import { DEFAULT_SETTINGS } from '../../src/domain/types';
import { dataset, point, REF, site } from './fixtures';

describe('distanceM', () => {
  it('is ~111 km per degree of latitude', () => {
    expect(distanceM({ lat: 31, lng: 34 }, { lat: 32, lng: 34 })).toBeCloseTo(111_195, -2);
  });
  it('is zero for the same point', () => {
    expect(distanceM({ lat: 31.4, lng: 34.3 }, { lat: 31.4, lng: 34.3 })).toBe(0);
  });
});

describe('deliveredBySite', () => {
  it('averages over the full window, counting days with no delivery as zero', () => {
    const m = deliveredBySite(
      [
        { id: '1', date: REF, pointId: 'p', siteId: 's', litres: 7000 },
        { id: '2', date: '2026-11-14', pointId: 'p', siteId: 's', litres: 7000 },
        { id: '3', date: '2026-11-13', pointId: 'p', siteId: 's', litres: 99999 }, // outside 7-day window
        { id: '4', date: '2026-11-21', pointId: 'p', siteId: 's', litres: 99999 }, // future
      ],
      REF,
      7,
    );
    expect(m.get('s')).toBe(2000);
  });
});

describe('bandFor', () => {
  it('uses critical floor and target', () => {
    expect(bandFor(5.9, DEFAULT_SETTINGS)).toBe('critical');
    expect(bandFor(6, DEFAULT_SETTINGS)).toBe('below');
    expect(bandFor(15, DEFAULT_SETTINGS)).toBe('meets');
  });
});

describe('computeSiteMetrics', () => {
  const ds = dataset({
    sites: [site('s1', { population: 1000, fixedSupplyLpd: 3000 }), site('s2', { population: 2000, lat: 31.5 })],
    points: [
      point('tap', { type: 'distribution', taps: 4, lat: 31.4203, lng: 34.36, capacityLpd: 0 }), // ~33 m from s1
      point('bad', { type: 'distribution', taps: 10, lat: 31.4201, lng: 34.36 }),
    ],
    deliveries: Array.from({ length: 7 }, (_, i) => ({
      id: `d${i}`,
      date: `2026-11-${14 + i}`,
      pointId: 'tap',
      siteId: 's1',
      litres: 4000,
    })),
    tests: [{ id: 'q', date: REF, pointId: 'bad', frc: 0, ecoli: 50 }],
  });
  const [m1, m2] = computeSiteMetrics(ds, REF);

  it('computes per-capita supply from deliveries plus fixed supply', () => {
    expect(m1.deliveredLpd).toBe(4000);
    expect(m1.supplyLpd).toBe(7000);
    expect(m1.perCapita).toBe(7);
    expect(m1.band).toBe('below');
    expect(m1.gapLpd).toBe(8000);
  });

  it('excludes unsafe points from access and tap counts', () => {
    expect(m1.nearestPoint?.id).toBe('tap');
    expect(m1.tapsInReach).toBe(4);
    expect(m1.peoplePerTap).toBe(250);
    expect(m1.withinDistance).toBe(true);
  });

  it('marks a far site as beyond distance and ranks it more urgent', () => {
    expect(m2.withinDistance).toBe(false);
    expect(m2.band).toBe('critical');
    expect(rankByPriority([m1, m2])[0].site.id).toBe('s2');
  });

  it('summarises population-weighted coverage', () => {
    const s = summarize(ds, [m1, m2], REF);
    expect(s.population).toBe(3000);
    expect(s.avgPerCapita).toBeCloseTo(7000 / 3000);
    expect(s.populationCritical).toBe(2000);
    expect(s.populationBelowTarget).toBe(3000);
    expect(s.pointsUnsafe).toBe(1);
    expect(s.sitesBeyondDistance).toBe(1);
  });
});

describe('dailyDeliveredSeries', () => {
  it('returns one entry per day including zeros', () => {
    const s = dailyDeliveredSeries([{ id: '1', date: REF, pointId: 'p', siteId: 's', litres: 5 }], REF, 3);
    expect(s).toEqual([
      { date: '2026-11-18', litres: 0 },
      { date: '2026-11-19', litres: 0 },
      { date: '2026-11-20', litres: 5 },
    ]);
  });
});
