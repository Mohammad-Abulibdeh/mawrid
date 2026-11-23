import { ArrowLeft, CalendarDays, Tent, TriangleExclamationPoint, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dailyDeliveredSeries, pointQualityMap, rankByPriority } from '../domain/analytics';
import { pointQuality } from '../domain/quality';
import { CoverageChart, DailyChart } from '../components/charts';
import { BandBadge, Card, Empty, Kpi, PageHeader } from '../components/ui';
import { useI18n } from '../i18n/i18n';
import type { StringKey } from '../i18n/strings';
import { useStore } from '../state/store';

export default function Dashboard() {
  const { ds, metrics, summary, refDate } = useStore();
  const { t, num } = useI18n();
  const s = ds.settings;

  if (metrics.length === 0)
    return (
      <>
        <PageHeader title={t('nav.dashboard')} intro={t('dash.intro')} />
        <Empty icon={Tent}>
          <p style={{ margin: 0 }}>{t('dash.empty')}</p>
          <div className="empty-actions">
            <Link className="btn btn-primary" to="/sites">
              {t('sites.add')}
            </Link>
            <Link className="btn" to="/data">
              <Upload className="icon" aria-hidden="true" /> {t('btn.import')}
            </Link>
            <Link className="btn btn-ghost" to="/">
              <ArrowLeft className="icon flip-rtl" aria-hidden="true" /> {t('dash.backToSteps')}
            </Link>
          </div>
        </Empty>
      </>
    );

  const quality = pointQualityMap(ds, refDate);
  const usable = ds.points.filter((p) => p.status !== 'down' && quality.get(p.id) !== 'unsafe').length;
  const ranked = rankByPriority(metrics).slice(0, 8);

  const alerts: string[] = [];
  for (const p of ds.points) {
    const q = pointQuality(p.id, ds.tests, s.chlorineMode, refDate, s.testMaxAgeDays);
    if (q.status === 'unsafe')
      alerts.push(t('dash.alert.unsafe', { name: p.name, issues: q.issues.map((i) => t(`issue.${i}` as StringKey)).join(', ') }));
  }
  for (const m of rankByPriority(metrics)) {
    if (m.nearestDistanceM === undefined) alerts.push(t('dash.alert.notap', { name: m.site.name }));
    else if (!m.withinDistance)
      alerts.push(
        t('dash.alert.distance', {
          name: m.site.name,
          d: t('common.m', { n: num(m.nearestDistanceM) }),
          max: t('common.m', { n: num(s.maxDistanceM) }),
        }),
      );
    else if (m.peoplePerTap > s.peoplePerTap)
      alerts.push(t('dash.alert.crowded', { name: m.site.name, n: num(m.peoplePerTap), max: num(s.peoplePerTap) }));
  }

  return (
    <>
      <PageHeader
        title={t('nav.dashboard')}
        intro={t('dash.intro')}
        hint={t('dash.hint')}
        actions={
          <Link className="btn btn-primary" to="/planner">
            <CalendarDays className="icon" aria-hidden="true" /> {t('dash.openPlanner')}
          </Link>
        }
      />
      <div className="kpi-row">
        <Kpi label={t('dash.population')} value={num(summary.population)} sub={`${num(summary.sites)} ${t('nav.sites')}`} />
        <Kpi
          label={t('dash.avg')}
          value={num(summary.avgPerCapita, 1)}
          sub={t('dash.avgSub', { t: num(s.targetLpd) })}
          tone={summary.avgPerCapita < s.criticalLpd ? 'critical' : summary.avgPerCapita < s.targetLpd ? 'warning' : 'good'}
        />
        <Kpi
          label={t('dash.critical', { n: num(s.criticalLpd) })}
          value={num(summary.populationCritical)}
          sub={summary.population ? `${num((100 * summary.populationCritical) / summary.population)}%` : undefined}
          tone={summary.populationCritical > 0 ? 'critical' : 'good'}
        />
        <Kpi label={t('dash.gap')} value={num(summary.totalGapLpd)} sub={t('dash.gapSub', { n: num(Math.ceil(summary.totalGapLpd / 10_000)) })} />
        <Kpi
          label={t('dash.points')}
          value={t('common.of', { a: num(usable), b: num(ds.points.length) })}
          sub={t('dash.pointsSub', { u: num(summary.pointsUnsafe), d: num(summary.pointsDown), x: num(summary.pointsUntested) })}
          tone={summary.pointsUnsafe > 0 ? 'warning' : undefined}
        />
      </div>

      <div className="grid-2">
        <Card title={t('dash.coverage')} aside={<span className="muted small">{t('dash.coverageNote', { d: num(s.windowDays) })}</span>}>
          <CoverageChart metrics={metrics} target={s.targetLpd} critical={s.criticalLpd} />
        </Card>
        <div className="stack">
          <Card title={t('dash.alerts')}>
            {alerts.length === 0 ? (
              <p className="muted">{t('dash.noAlerts')}</p>
            ) : (
              <ul className="alerts">
                {alerts.slice(0, 10).map((a) => (
                  <li key={a}>
                    <TriangleExclamationPoint className="icon" size={16} aria-hidden="true" />
                    <span>{a}</span>
                  </li>
                ))}
                {alerts.length > 10 && <li className="muted">+{num(alerts.length - 10)}</li>}
              </ul>
            )}
          </Card>
          <Card title={t('dash.daily')}>
            <DailyChart series={dailyDeliveredSeries(ds.deliveries, refDate, 14)} />
          </Card>
        </div>
      </div>

      <Card title={t('dash.priority')}>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t('col.site')}</th>
                <th className="num">{t('col.population')}</th>
                <th className="num">{t('col.perCapita')}</th>
                <th>{t('col.status')}</th>
                <th className="num">{t('col.gap')}</th>
                <th className="num">{t('col.nearest')}</th>
                <th className="num">{t('col.priority')}</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((m) => (
                <tr key={m.site.id}>
                  <td>{m.site.name}</td>
                  <td className="num">{num(m.site.population)}</td>
                  <td className="num">{num(m.perCapita, 1)}</td>
                  <td>
                    <BandBadge band={m.band} />
                  </td>
                  <td className="num">{num(m.gapLpd)}</td>
                  <td className="num">
                    {m.nearestDistanceM === undefined ? t('common.none') : t('common.m', { n: num(m.nearestDistanceM) })}
                  </td>
                  <td className="num">{num(m.priority, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
