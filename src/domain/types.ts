/** Core data model. All records are site-level aggregates — no personal data. */

export type PointType = 'desalination' | 'well' | 'network' | 'filling' | 'distribution';
export type PointStatus = 'functional' | 'partial' | 'down';
export type Governorate = 'North Gaza' | 'Gaza' | 'Deir al-Balah' | 'Khan Younis' | 'Rafah';

export const POINT_TYPES: PointType[] = ['desalination', 'well', 'network', 'filling', 'distribution'];
export const POINT_STATUSES: PointStatus[] = ['functional', 'partial', 'down'];
export const GOVERNORATES: Governorate[] = ['North Gaza', 'Gaza', 'Deir al-Balah', 'Khan Younis', 'Rafah'];

/** Point types that trucks can be filled at (i.e. bulk sources). */
export const FILL_SOURCE_TYPES: PointType[] = ['desalination', 'well', 'network', 'filling'];

export interface WaterPoint {
  id: string;
  name: string;
  type: PointType;
  status: PointStatus;
  lat: number;
  lng: number;
  /** Current output available for collection or truck filling, litres/day. */
  capacityLpd: number;
  /** Number of taps people can collect from directly at this point (0 for truck-only sources). */
  taps: number;
  notes?: string;
}

export interface Site {
  id: string;
  name: string;
  governorate: Governorate;
  lat: number;
  lng: number;
  population: number;
  /** Priority multiplier 1.0–2.0 (e.g. health facility on site, many young children). */
  vulnerability: number;
  /** Water reaching the site each day without trucking (piped, on-site well), litres/day. */
  fixedSupplyLpd: number;
  notes?: string;
}

export interface Delivery {
  id: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  pointId: string;
  siteId: string;
  litres: number;
}

export interface QualityTest {
  id: string;
  date: string;
  pointId: string;
  /** Free residual chlorine, mg/L. */
  frc?: number;
  /** Turbidity, NTU. */
  turbidity?: number;
  /** E. coli, CFU per 100 mL. */
  ecoli?: number;
}

export type ChlorineMode = 'normal' | 'outbreak';

export interface Settings {
  /** Target litres per person per day (Sphere: 15, hot climate: 20). */
  targetLpd: number;
  /** Critical floor (WASH Cluster Gaza drinking + cooking minimum). */
  criticalLpd: number;
  /** Maximum acceptable distance to nearest functional water point, metres. */
  maxDistanceM: number;
  /** Maximum people per tap. */
  peoplePerTap: number;
  chlorineMode: ChlorineMode;
  /** Number of days averaged for delivered supply. */
  windowDays: number;
  /** Quality tests older than this are ignored. */
  testMaxAgeDays: number;
}

export interface Dataset {
  schemaVersion: 1;
  demo: boolean;
  updatedAt: string;
  sites: Site[];
  points: WaterPoint[];
  deliveries: Delivery[];
  tests: QualityTest[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  targetLpd: 15,
  criticalLpd: 6,
  maxDistanceM: 500,
  peoplePerTap: 250,
  chlorineMode: 'normal',
  windowDays: 7,
  testMaxAgeDays: 7,
};
