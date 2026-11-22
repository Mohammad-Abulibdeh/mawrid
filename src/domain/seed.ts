import { addDays } from './dates';
import { DEFAULT_SETTINGS, type Dataset, type Delivery, type Governorate, type QualityTest, type Site, type WaterPoint } from './types';

/**
 * SYNTHETIC DEMONSTRATION DATA.
 * Names, coordinates, populations, capacities and deliveries are invented to exercise the
 * software. Magnitudes are chosen to resemble the situation reported by OCHA/UNICEF (average
 * supply well below 15 L/person/day), but no record corresponds to a real site or facility.
 */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Approximate the Gaza coastline as a line and place points `offset` degrees of longitude inland. */
const inland = (lat: number, offset: number) => Math.round((34.22 + (lat - 31.3) * 1.04 + offset) * 10000) / 10000;

type SiteSeed = [string, Governorate, number, number, number, number, number];
// [name, governorate, lat, inland offset, population, vulnerability, fixed supply L/day]
const SITES: SiteSeed[] = [
  ['Demo Site N-1 (Beit Lahia area)', 'North Gaza', 31.545, 0.03, 9200, 1.2, 8000],
  ['Demo Site N-2 (Jabalia area)', 'North Gaza', 31.53, 0.045, 14500, 1.0, 12000],
  ['Demo Site G-1 (Gaza City west)', 'Gaza', 31.515, 0.02, 21000, 1.0, 40000],
  ['Demo Site G-2 (Gaza City centre)', 'Gaza', 31.5, 0.035, 17800, 1.4, 25000],
  ['Demo Site G-3 (Gaza City south)', 'Gaza', 31.475, 0.03, 6400, 1.0, 0],
  ['Demo Site M-1 (Nuseirat area)', 'Deir al-Balah', 31.445, 0.025, 12300, 1.0, 15000],
  ['Demo Site M-2 (Bureij area)', 'Deir al-Balah', 31.435, 0.05, 5600, 1.3, 0],
  ['Demo Site M-3 (Deir al-Balah west)', 'Deir al-Balah', 31.415, 0.018, 26000, 1.0, 30000],
  ['Demo Site M-4 (Deir al-Balah east)', 'Deir al-Balah', 31.405, 0.045, 7300, 1.0, 0],
  ['Demo Site K-1 (Khan Younis west)', 'Khan Younis', 31.355, 0.02, 31000, 1.2, 20000],
  ['Demo Site K-2 (Khan Younis centre)', 'Khan Younis', 31.345, 0.04, 11000, 1.0, 5000],
  ['Demo Site K-3 (Al-Mawasi north)', 'Khan Younis', 31.37, 0.012, 38500, 1.5, 10000],
  ['Demo Site K-4 (Al-Mawasi south)', 'Khan Younis', 31.33, 0.012, 24000, 1.0, 0],
  ['Demo Site K-5 (Bani Suhaila area)', 'Khan Younis', 31.338, 0.06, 4200, 1.0, 0],
  ['Demo Site R-1 (Rafah west)', 'Rafah', 31.31, 0.025, 3800, 1.0, 0],
  ['Demo Site G-4 (Shati area)', 'Gaza', 31.53, 0.012, 15600, 1.1, 18000],
];

type PointSeed = [string, WaterPoint['type'], WaterPoint['status'], number, number, number, number];
// [name, type, status, lat, inland offset, capacity L/day, taps]
const POINTS: PointSeed[] = [
  ['Demo Desalination Plant A (south)', 'desalination', 'functional', 31.36, 0.01, 1_200_000, 0],
  ['Demo Desalination Plant B (middle)', 'desalination', 'partial', 31.42, 0.012, 450_000, 0],
  ['Demo Desalination Plant C (north)', 'desalination', 'down', 31.53, 0.008, 0, 0],
  ['Demo Private Desal Unit 1', 'filling', 'functional', 31.5, 0.025, 120_000, 4],
  ['Demo Private Desal Unit 2', 'filling', 'functional', 31.35, 0.03, 90_000, 4],
  ['Demo Municipal Well 1', 'well', 'partial', 31.44, 0.035, 150_000, 6],
  ['Demo Municipal Well 2', 'well', 'functional', 31.54, 0.04, 80_000, 4],
  ['Demo Network Connection Point', 'network', 'partial', 31.4, 0.05, 300_000, 0],
  ['Demo Distribution Point K-3a', 'distribution', 'functional', 31.371, 0.0135, 0, 12],
  ['Demo Distribution Point M-3a', 'distribution', 'functional', 31.4155, 0.02, 0, 10],
  ['Demo Distribution Point G-1a', 'distribution', 'functional', 31.516, 0.022, 0, 8],
  ['Demo Distribution Point K-1a', 'distribution', 'down', 31.354, 0.021, 0, 6],
];

export function buildDemoDataset(refDate: string): Dataset {
  const rnd = mulberry32(20231007);
  const sites: Site[] = SITES.map(([name, governorate, lat, off, population, vulnerability, fixedSupplyLpd], i) => ({
    id: `site-${String(i + 1).padStart(2, '0')}`,
    name,
    governorate,
    lat,
    lng: inland(lat, off),
    population,
    vulnerability,
    fixedSupplyLpd,
  }));
  const points: WaterPoint[] = POINTS.map(([name, type, status, lat, off, capacityLpd, taps], i) => ({
    id: `pt-${String(i + 1).padStart(2, '0')}`,
    name,
    type,
    status,
    lat,
    lng: inland(lat, off),
    capacityLpd,
    taps,
  }));

  // Habitual trucking: each source serves a few "regular" sites, regardless of need — the
  // pattern the planner is meant to correct.
  const routes: [string, string[]][] = [
    ['pt-01', ['site-10', 'site-11', 'site-12']],
    ['pt-02', ['site-06', 'site-08']],
    ['pt-04', ['site-03', 'site-04', 'site-16']],
    ['pt-05', ['site-11', 'site-10']],
    ['pt-06', ['site-06', 'site-07']],
    ['pt-07', ['site-01', 'site-02']],
    ['pt-08', ['site-08', 'site-09']],
  ];
  const deliveries: Delivery[] = [];
  let n = 0;
  for (let day = 13; day >= 0; day--) {
    const date = addDays(refDate, -day);
    for (const [pointId, siteIds] of routes) {
      for (const siteId of siteIds) {
        if (rnd() < 0.3) continue; // fuel shortages, access denials
        const loads = 1 + Math.floor(rnd() * 4);
        deliveries.push({ id: `dl-${++n}`, date, pointId, siteId, litres: loads * 10_000 });
      }
    }
  }

  const tests: QualityTest[] = [
    { id: 'qt-1', date: addDays(refDate, -1), pointId: 'pt-01', frc: 0.4, turbidity: 1.2, ecoli: 0 },
    { id: 'qt-2', date: addDays(refDate, -2), pointId: 'pt-02', frc: 0.3, turbidity: 2.5, ecoli: 0 },
    { id: 'qt-3', date: addDays(refDate, -1), pointId: 'pt-04', frc: 0.05, turbidity: 3, ecoli: 12 },
    { id: 'qt-4', date: addDays(refDate, -3), pointId: 'pt-05', frc: 0.5, turbidity: 1 },
    { id: 'qt-5', date: addDays(refDate, -2), pointId: 'pt-06', frc: 0.25, turbidity: 7.5, ecoli: 0 },
    { id: 'qt-6', date: addDays(refDate, -4), pointId: 'pt-07', frc: 0.35, turbidity: 2, ecoli: 0 },
    { id: 'qt-7', date: addDays(refDate, -20), pointId: 'pt-08', frc: 0.3, turbidity: 2, ecoli: 0 },
    { id: 'qt-8', date: addDays(refDate, -1), pointId: 'pt-09', frc: 0.2, turbidity: 4 },
    { id: 'qt-9', date: addDays(refDate, -1), pointId: 'pt-10', frc: 0.1, turbidity: 2 },
  ];

  return {
    schemaVersion: 1,
    demo: true,
    updatedAt: new Date().toISOString(),
    sites,
    points,
    deliveries,
    tests,
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function emptyDataset(): Dataset {
  return {
    schemaVersion: 1,
    demo: false,
    updatedAt: new Date().toISOString(),
    sites: [],
    points: [],
    deliveries: [],
    tests: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}
