import { daysBetween } from './dates';
import type { ChlorineMode, QualityTest } from './types';

export type QualityStatus = 'safe' | 'warning' | 'unsafe' | 'untested';

export type QualityIssue =
  | 'ecoli_detected'
  | 'frc_low'
  | 'frc_high'
  | 'frc_toxic'
  | 'turbidity_high'
  | 'turbidity_extreme'
  | 'incomplete';

/**
 * Thresholds. FRC: Sphere/IFRC 0.2–0.5 mg/L normally, 0.5–1.0 mg/L in outbreak conditions,
 * never above 5 mg/L (WHO). Turbidity: <5 NTU target, <20 NTU tolerated early in an emergency (MSF).
 * E. coli: 0 CFU/100 mL in treated water.
 */
export const CHLORINE_RANGE: Record<ChlorineMode, { min: number; max: number }> = {
  normal: { min: 0.2, max: 0.5 },
  outbreak: { min: 0.5, max: 1.0 },
};
export const FRC_TOXIC = 5;
export const TURBIDITY_TARGET = 5;
export const TURBIDITY_LIMIT = 20;

export interface QualityResult {
  status: Exclude<QualityStatus, 'untested'>;
  issues: QualityIssue[];
}

export function evaluateTest(test: QualityTest, mode: ChlorineMode): QualityResult {
  const issues: QualityIssue[] = [];
  let unsafe = false;
  let warning = false;
  const range = CHLORINE_RANGE[mode];

  if (test.ecoli !== undefined && test.ecoli > 0) {
    issues.push('ecoli_detected');
    unsafe = true;
  }
  if (test.frc !== undefined) {
    if (test.frc > FRC_TOXIC) {
      issues.push('frc_toxic');
      unsafe = true;
    } else if (test.frc < range.min) {
      issues.push('frc_low');
      unsafe = true;
    } else if (test.frc > range.max) {
      issues.push('frc_high');
      warning = true;
    }
  }
  if (test.turbidity !== undefined) {
    if (test.turbidity >= TURBIDITY_LIMIT) {
      issues.push('turbidity_extreme');
      unsafe = true;
    } else if (test.turbidity >= TURBIDITY_TARGET) {
      issues.push('turbidity_high');
      warning = true;
    }
  }
  if (test.frc === undefined && test.ecoli === undefined) {
    // Without either a chlorine reading or a microbiological result we cannot call it safe.
    issues.push('incomplete');
    warning = true;
  }
  return { status: unsafe ? 'unsafe' : warning ? 'warning' : 'safe', issues };
}

export interface PointQuality {
  status: QualityStatus;
  latest?: QualityTest;
  issues: QualityIssue[];
}

/** Quality of a point = evaluation of its most recent test within the max age window. */
export function pointQuality(
  pointId: string,
  tests: QualityTest[],
  mode: ChlorineMode,
  refDate: string,
  maxAgeDays: number,
): PointQuality {
  let latest: QualityTest | undefined;
  for (const t of tests) {
    if (t.pointId !== pointId) continue;
    const age = daysBetween(t.date, refDate);
    if (age < 0 || age > maxAgeDays) continue;
    if (!latest || t.date > latest.date || (t.date === latest.date && t.id > latest.id)) latest = t;
  }
  if (!latest) return { status: 'untested', issues: [] };
  const r = evaluateTest(latest, mode);
  return { status: r.status, latest, issues: r.issues };
}
