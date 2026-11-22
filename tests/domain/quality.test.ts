import { describe, expect, it } from 'vitest';
import { evaluateTest, pointQuality } from '../../src/domain/quality';

const t = (over: object) => ({ id: 'q', date: '2026-11-20', pointId: 'p', ...over });

describe('evaluateTest', () => {
  it('passes water inside the normal chlorine range with low turbidity and no E. coli', () => {
    expect(evaluateTest(t({ frc: 0.3, turbidity: 1, ecoli: 0 }), 'normal')).toEqual({ status: 'safe', issues: [] });
  });

  it('fails any E. coli detection', () => {
    expect(evaluateTest(t({ frc: 0.4, ecoli: 1 }), 'normal').status).toBe('unsafe');
  });

  it('fails low chlorine, and the outbreak threshold is stricter', () => {
    expect(evaluateTest(t({ frc: 0.1 }), 'normal').issues).toContain('frc_low');
    expect(evaluateTest(t({ frc: 0.3 }), 'normal').status).toBe('safe');
    expect(evaluateTest(t({ frc: 0.3 }), 'outbreak').status).toBe('unsafe');
  });

  it('warns on chlorine above the recommended range and fails above 5 mg/L', () => {
    expect(evaluateTest(t({ frc: 0.8 }), 'normal')).toEqual({ status: 'warning', issues: ['frc_high'] });
    expect(evaluateTest(t({ frc: 6 }), 'normal').issues).toContain('frc_toxic');
  });

  it('grades turbidity: <5 ok, 5–20 warning, ≥20 unsafe', () => {
    expect(evaluateTest(t({ frc: 0.3, turbidity: 4.9 }), 'normal').status).toBe('safe');
    expect(evaluateTest(t({ frc: 0.3, turbidity: 5 }), 'normal').status).toBe('warning');
    expect(evaluateTest(t({ frc: 0.3, turbidity: 20 }), 'normal').status).toBe('unsafe');
  });

  it('flags a test with neither chlorine nor E. coli as incomplete', () => {
    expect(evaluateTest(t({ turbidity: 1 }), 'normal')).toEqual({ status: 'warning', issues: ['incomplete'] });
  });
});

describe('pointQuality', () => {
  const tests = [
    { id: 'a', date: '2026-11-10', pointId: 'p', frc: 0.3, ecoli: 0 },
    { id: 'b', date: '2026-11-18', pointId: 'p', frc: 0.05 },
    { id: 'c', date: '2026-11-19', pointId: 'other', frc: 0.3 },
  ];

  it('uses the most recent test within the age window', () => {
    expect(pointQuality('p', tests, 'normal', '2026-11-20', 7).status).toBe('unsafe');
  });

  it('is untested when all tests are too old', () => {
    expect(pointQuality('p', tests.slice(0, 1), 'normal', '2026-11-20', 7).status).toBe('untested');
  });

  it('ignores tests dated after the reference date', () => {
    expect(pointQuality('p', tests, 'normal', '2026-11-12', 7).status).toBe('safe');
  });
});
