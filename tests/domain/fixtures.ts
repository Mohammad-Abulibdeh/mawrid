import { DEFAULT_SETTINGS, type Dataset, type Site, type WaterPoint } from '../../src/domain/types';

export const REF = '2026-11-20';

export const site = (id: string, over: Partial<Site> = {}): Site => ({
  id,
  name: id,
  governorate: 'Deir al-Balah',
  lat: 31.42,
  lng: 34.36,
  population: 1000,
  vulnerability: 1,
  fixedSupplyLpd: 0,
  ...over,
});

export const point = (id: string, over: Partial<WaterPoint> = {}): WaterPoint => ({
  id,
  name: id,
  type: 'desalination',
  status: 'functional',
  lat: 31.42,
  lng: 34.36,
  capacityLpd: 100_000,
  taps: 0,
  ...over,
});

export const dataset = (over: Partial<Dataset> = {}): Dataset => ({
  schemaVersion: 1,
  demo: false,
  updatedAt: '2026-11-20T00:00:00Z',
  sites: [],
  points: [],
  deliveries: [],
  tests: [],
  settings: { ...DEFAULT_SETTINGS },
  ...over,
});
