import { lazy, Suspense, useMemo, useState } from 'react';
import { pointQualityMap } from '../domain/analytics';
import { toCsv } from '../domain/csv';
import { DEFAULT_PLAN_PARAMS, planDispatch, type PlanParams, type PlanResult } from '../domain/planner';
import { Card, Empty, Kpi, PageHeader, downloadFile } from '../components/ui';
import { useI18n } from '../i18n/i18n';
import { useStore } from '../state/store';

const WaterMap = lazy(() => import('../components/WaterMap'));
const PARAMS_KEY = 'mawrid.planParams';

function loadParams(): PlanParams {
  try {
    const raw = localStorage.getItem(PARAMS_KEY);
    if (raw) return { ...DEFAULT_PLAN_PARAMS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_PLAN_PARAMS;
}

export default function Planner() {
  const { ds, metrics, refDate } = useStore();
  const { t, num } = useI18n();
  const [form, setForm] = useState(() => {
    const p = loadParams();
    return {
      trucks: String(p.trucks),
      tripsPerTruck: String(p.tripsPerTruck),
      loadLitres: String(p.loadLitres),
      maxHaulKm: String(p.maxHaulKm),
      targetLpd: String(ds.settings.targetLpd),
      includeUntested: p.includeUntested,
    };
  });
  const [result, setResult] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const quality = useMemo(() => pointQualityMap(ds, refDate), [ds, refDate]);
  const siteName = new Map(ds.sites.map((s) => [s.id, s.name]));
  const pointName = new Map(ds.points.map((p) => [p.id, p.name]));

  const run = (e: React.FormEvent) => {
    e.preventDefault();
    const n = (s: string) => Number(s);
    const params: PlanParams = {
      trucks: n(form.trucks),
      tripsPerTruck: n(form.tripsPerTruck),
      loadLitres: n(form.loadLitres),
      maxHaulKm: n(form.maxHaulKm),
      targetLpd: n(form.targetLpd),
      includeUntested: form.includeUntested,
    };
    const bad = (['trucks', 'tripsPerTruck', 'loadLitres', 'maxHaulKm', 'targetLpd'] as const).find(
      (k) => !Number.isFinite(params[k]) || (params[k] as number) <= 0,
    );
    if (bad) {
      setError(t('err.number'));
      return;
    }
    setError(null);
    try {
      localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
    } catch {
      /* ignore */
    }
    setResult(planDispatch(ds, refDate, params));
  };

  const exportCsv = () => {
    if (!result) return;
    const rows = result.trips.map((tr) => ({
      date: refDate,
      source: pointName.get(tr.pointId) ?? tr.pointId,
      site: siteName.get(tr.siteId) ?? tr.siteId,
      loads: tr.loads,
      litres: tr.litres,
      distance_km: tr.distanceKm,
      source_id: tr.pointId,
      site_id: tr.siteId,
    }));
    downloadFile(`mawrid-dispatch-plan-${refDate}.csv`, toCsv(rows, ['date', 'source', 'site', 'loads', 'litres', 'distance_km', 'source_id', 'site_id']), 'text/csv;charset=utf-8');
  };

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const crit = ds.settings.criticalLpd;

  return (
    <>
      <PageHeader title={t('nav.planner')} intro={t('plan.intro')} />
      <Card>
        <form className="form" onSubmit={run}>
          <div className="row-5">
            <label className="field">
              <span className="field-label">{t('plan.trucks')}</span>
              <input inputMode="numeric" value={form.trucks} onChange={set('trucks')} />
            </label>
            <label className="field">
              <span className="field-label">{t('plan.trips')}</span>
              <input inputMode="numeric" value={form.tripsPerTruck} onChange={set('tripsPerTruck')} />
            </label>
            <label className="field">
              <span className="field-label">{t('plan.load')}</span>
              <input inputMode="numeric" value={form.loadLitres} onChange={set('loadLitres')} />
            </label>
            <label className="field">
              <span className="field-label">{t('plan.haul')}</span>
              <input inputMode="decimal" value={form.maxHaulKm} onChange={set('maxHaulKm')} />
            </label>
            <label className="field">
              <span className="field-label">{t('plan.target')}</span>
              <input inputMode="decimal" value={form.targetLpd} onChange={set('targetLpd')} />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={form.includeUntested} onChange={(e) => setForm((f) => ({ ...f, includeUntested: e.target.checked }))} />{' '}
            {t('plan.untested')}
          </label>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={metrics.length === 0}>
              ▶ {t('btn.run')}
            </button>
            {result && result.trips.length > 0 && (
              <button className="btn" type="button" onClick={exportCsv}>
                ⬇ {t('btn.exportCsv')}
              </button>
            )}
          </div>
        </form>
      </Card>

      {!result ? (
        <Empty>{t('plan.none')}</Empty>
      ) : (
        <>
          <Card title={t('plan.summary')}>
            <p className="stop-reason" role="status">
              {result.eligibleSources.length === 0 ? t('plan.noSources') : t(`plan.stop.${result.stopReason}`)}
            </p>
            <div className="kpi-row">
              <Kpi label={t('plan.loadsUsed')} value={t('common.of', { a: num(result.loadsUsed), b: num(result.loadsAvailable) })} />
              <Kpi label={t('plan.litres')} value={num(result.litresAllocated)} />
              <Kpi label={t('plan.km')} value={num(result.truckKm, 1)} />
              <Kpi label={t('plan.min')} value={`${num(result.minBefore, 1)} → ${num(result.minAfter, 1)}`} tone={result.minAfter >= crit ? 'good' : 'critical'} />
              <Kpi
                label={t('plan.critical', { n: num(crit) })}
                value={`${num(result.popCriticalBefore)} → ${num(result.popCriticalAfter)}`}
                tone={result.popCriticalAfter > 0 ? 'critical' : 'good'}
              />
              <Kpi label={t('plan.meets')} value={`${num(result.popMeetsBefore)} → ${num(result.popMeetsAfter)}`} />
            </div>
          </Card>

          <div className="grid-2">
            <Card title={t('plan.trips.title')}>
              {result.trips.length === 0 ? (
                <Empty>{t('common.noRecords')}</Empty>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('col.source')}</th>
                        <th>{t('col.site')}</th>
                        <th className="num">{t('col.loads')}</th>
                        <th className="num">{t('col.litres')}</th>
                        <th className="num">{t('col.distance')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.trips.map((tr) => (
                        <tr key={`${tr.pointId}-${tr.siteId}`}>
                          <td>{pointName.get(tr.pointId)}</td>
                          <td>{siteName.get(tr.siteId)}</td>
                          <td className="num">{num(tr.loads)}</td>
                          <td className="num">{num(tr.litres)}</td>
                          <td className="num">{t('common.km', { n: num(tr.distanceKm, 1) })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
            <Card title={t('plan.map')}>
              <Suspense fallback={<div className="map-loading">{t('common.loading')}</div>}>
                <WaterMap metrics={metrics} points={result.eligibleSources} quality={quality} trips={result.trips} height={420} />
              </Suspense>
            </Card>
          </div>

          <Card title={t('plan.sites.title')}>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t('col.site')}</th>
                    <th className="num">{t('col.population')}</th>
                    <th className="num">{t('col.before')}</th>
                    <th className="num">{t('col.after')}</th>
                    <th className="num">{t('col.loads')}</th>
                    <th>{t('col.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...result.sites]
                    .sort((a, b) => a.beforePerCapita - b.beforePerCapita)
                    .map((s) => (
                      <tr key={s.site.id}>
                        <td>{s.site.name}</td>
                        <td className="num">{num(s.site.population)}</td>
                        <td className="num">{num(s.beforePerCapita, 1)}</td>
                        <td className="num">
                          <strong>{num(s.afterPerCapita, 1)}</strong>
                        </td>
                        <td className="num">{num(s.loads)}</td>
                        <td>{s.unreachable && <span className="badge badge-critical">▲ {t('plan.unreachable')}</span>}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>

          {result.excludedSources.length > 0 && (
            <Card title={t('plan.excluded')}>
              <ul className="plain">
                {result.excludedSources.map((x) => (
                  <li key={x.point.id}>
                    {x.point.name} — <span className="muted">{t(`plan.reason.${x.reason}`)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </>
  );
}
