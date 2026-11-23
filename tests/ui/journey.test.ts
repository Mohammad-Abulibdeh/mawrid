import { beforeEach, describe, expect, it } from 'vitest';
import { todayIso } from '../../src/domain/dates';
import { buildDemoDataset, emptyDataset } from '../../src/domain/seed';
import { STRINGS } from '../../src/i18n/strings';
import { hasMadePlan, journeySteps, markPlanMade, nextStep } from '../../src/state/journey';

beforeEach(() => localStorage.clear());

describe('guided journey', () => {
  it('starts at step 1 with an empty dataset', () => {
    const steps = journeySteps(emptyDataset(), false);
    expect(steps.map((s) => s.done)).toEqual([false, false, false, false]);
    expect(nextStep(steps)?.id).toBe('sites');
  });

  it('counts a tap-only water point as not yet a truck source', () => {
    const ds = emptyDataset();
    ds.points.push({ id: 'p', name: 'Tap', type: 'distribution', status: 'functional', lat: 31.4, lng: 34.4, capacityLpd: 0, taps: 4 });
    expect(journeySteps(ds, false)[1].done).toBe(false);
  });

  it('with demo data only the plan is left, and remembers when a plan was made', () => {
    const ds = buildDemoDataset(todayIso());
    expect(nextStep(journeySteps(ds, hasMadePlan()))?.id).toBe('plan');
    markPlanMade();
    expect(nextStep(journeySteps(ds, hasMadePlan()))).toBeUndefined();
  });
});

// Requirement: no emoji anywhere in the interface. Text symbols such as "≥" or "→" are allowed.
const EMOJI = /\p{Extended_Pictographic}/u;

describe('no emoji in the interface', () => {
  it('has none in any English or Arabic string', () => {
    for (const lang of ['en', 'ar'] as const)
      for (const [key, value] of Object.entries(STRINGS[lang])) expect(EMOJI.test(String(value)), `${lang}:${key}`).toBe(false);
  });

  it('has none in source files', () => {
    const files = import.meta.glob('../../src/**/*.{ts,tsx,css}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    expect(Object.keys(files).length).toBeGreaterThan(20);
    for (const [path, text] of Object.entries(files)) expect(EMOJI.test(text), path).toBe(false);
  });

  it('every English string has an Arabic translation', () => {
    const missing = Object.keys(STRINGS.en).filter((k) => !(k in STRINGS.ar));
    expect(missing).toEqual([]);
  });
});
