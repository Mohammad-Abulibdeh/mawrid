import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { computeSiteMetrics, summarize, type SiteMetrics, type Summary } from '../domain/analytics';
import { todayIso } from '../domain/dates';
import { buildDemoDataset, emptyDataset } from '../domain/seed';
import type { Dataset, Delivery, QualityTest, Settings, Site, WaterPoint } from '../domain/types';
import { validateDataset } from '../domain/validate';

export const STORAGE_KEY = 'mawrid.dataset.v1';

export type Action =
  | { type: 'upsertSite'; site: Site }
  | { type: 'deleteSite'; id: string }
  | { type: 'upsertPoint'; point: WaterPoint }
  | { type: 'deletePoint'; id: string }
  | { type: 'addDelivery'; delivery: Delivery }
  | { type: 'deleteDelivery'; id: string }
  | { type: 'addTest'; test: QualityTest }
  | { type: 'deleteTest'; id: string }
  | { type: 'setSettings'; settings: Settings }
  | { type: 'replace'; dataset: Dataset }
  | { type: 'merge'; sites?: Site[]; points?: WaterPoint[]; deliveries?: Delivery[]; tests?: QualityTest[] };

const upsert = <T extends { id: string }>(list: T[], item: T) => {
  const i = list.findIndex((x) => x.id === item.id);
  if (i < 0) return [...list, item];
  const copy = list.slice();
  copy[i] = item;
  return copy;
};
const mergeAll = <T extends { id: string }>(list: T[], items: T[] = []) => items.reduce(upsert, list);

export function reducer(ds: Dataset, a: Action): Dataset {
  const touch = (next: Partial<Dataset>): Dataset => ({ ...ds, ...next, updatedAt: new Date().toISOString() });
  switch (a.type) {
    case 'upsertSite':
      return touch({ sites: upsert(ds.sites, a.site) });
    case 'deleteSite':
      return touch({ sites: ds.sites.filter((s) => s.id !== a.id), deliveries: ds.deliveries.filter((d) => d.siteId !== a.id) });
    case 'upsertPoint':
      return touch({ points: upsert(ds.points, a.point) });
    case 'deletePoint':
      return touch({
        points: ds.points.filter((p) => p.id !== a.id),
        deliveries: ds.deliveries.filter((d) => d.pointId !== a.id),
        tests: ds.tests.filter((t) => t.pointId !== a.id),
      });
    case 'addDelivery':
      return touch({ deliveries: upsert(ds.deliveries, a.delivery) });
    case 'deleteDelivery':
      return touch({ deliveries: ds.deliveries.filter((d) => d.id !== a.id) });
    case 'addTest':
      return touch({ tests: upsert(ds.tests, a.test) });
    case 'deleteTest':
      return touch({ tests: ds.tests.filter((t) => t.id !== a.id) });
    case 'setSettings':
      return touch({ settings: a.settings });
    case 'replace':
      return a.dataset;
    case 'merge':
      return touch({
        sites: mergeAll(ds.sites, a.sites),
        points: mergeAll(ds.points, a.points),
        deliveries: mergeAll(ds.deliveries, a.deliveries),
        tests: mergeAll(ds.tests, a.tests),
      });
  }
}

export function loadDataset(refDate: string): Dataset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const r = validateDataset(JSON.parse(raw));
      if (r.dataset) return r.dataset;
    }
  } catch {
    /* corrupt or unavailable storage → fall back to demo */
  }
  return buildDemoDataset(refDate);
}

interface Store {
  ds: Dataset;
  dispatch: (a: Action) => void;
  refDate: string;
  setRefDate: (d: string) => void;
  metrics: SiteMetrics[];
  summary: Summary;
  storageError: boolean;
  resetDemo: () => void;
  clearAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children, initial }: { children: ReactNode; initial?: Dataset }) {
  const [refDate, setRefDate] = useState(todayIso);
  const [ds, dispatch] = useReducer(reducer, undefined, () => initial ?? loadDataset(todayIso()));
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    if (initial) return; // tests: do not persist
    const h = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ds));
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
    }, 250);
    return () => clearTimeout(h);
  }, [ds, initial]);

  const value = useMemo<Store>(() => {
    const metrics = computeSiteMetrics(ds, refDate);
    return {
      ds,
      dispatch,
      refDate,
      setRefDate,
      metrics,
      summary: summarize(ds, metrics, refDate),
      storageError,
      resetDemo: () => dispatch({ type: 'replace', dataset: buildDemoDataset(todayIso()) }),
      clearAll: () => dispatch({ type: 'replace', dataset: emptyDataset() }),
    };
  }, [ds, refDate, storageError]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}
