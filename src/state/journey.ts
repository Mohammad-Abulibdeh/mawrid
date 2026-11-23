import { useEffect, useState } from 'react';
import { FILL_SOURCE_TYPES, type Dataset } from '../domain/types';
import type { StringKey } from '../i18n/strings';

/**
 * The guided user journey shown on the home page and at the top of each
 * workflow page. It only reads the dataset; it never changes how the
 * analytics or the planner work.
 */
export type StepId = 'sites' | 'points' | 'record' | 'plan';

export interface JourneyStep {
  id: StepId;
  n: number;
  to: string;
  title: StringKey;
  desc: StringKey;
  done: boolean;
}

const PLAN_KEY = 'mawrid.planMade';

export function hasMadePlan(): boolean {
  try {
    return localStorage.getItem(PLAN_KEY) === '1';
  } catch {
    return false;
  }
}

const PLAN_EVENT = 'mawrid:plan-made';

export function markPlanMade() {
  try {
    localStorage.setItem(PLAN_KEY, '1');
  } catch {
    /* storage unavailable: the step simply stays "to do" */
  }
  window.dispatchEvent(new Event(PLAN_EVENT));
}

/** Reactive version of hasMadePlan(): every progress indicator updates as soon as a plan is built. */
export function usePlanMade(): boolean {
  const [made, setMade] = useState(hasMadePlan);
  useEffect(() => {
    const on = () => setMade(hasMadePlan());
    window.addEventListener(PLAN_EVENT, on);
    return () => window.removeEventListener(PLAN_EVENT, on);
  }, []);
  return made;
}

export function journeySteps(ds: Dataset, planMade: boolean): JourneyStep[] {
  return [
    { id: 'sites', n: 1, to: '/sites', title: 'step.sites.title', desc: 'step.sites.desc', done: ds.sites.length > 0 },
    {
      id: 'points',
      n: 2,
      to: '/points',
      title: 'step.points.title',
      desc: 'step.points.desc',
      done: ds.points.some((p) => FILL_SOURCE_TYPES.includes(p.type)),
    },
    { id: 'record', n: 3, to: '/deliveries', title: 'step.record.title', desc: 'step.record.desc', done: ds.deliveries.length > 0 },
    { id: 'plan', n: 4, to: '/planner', title: 'step.plan.title', desc: 'step.plan.desc', done: planMade },
  ];
}

/** The first step that is not done yet, or undefined when every step is done. */
export function nextStep(steps: JourneyStep[]): JourneyStep | undefined {
  return steps.find((s) => !s.done);
}
