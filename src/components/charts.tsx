import { useState } from 'react';
import type { CoverageBand, SiteMetrics } from '../domain/analytics';
import { useI18n } from '../i18n/i18n';

/** Status colours (reserved; always paired with icon + label in the legend). */
export const BAND_COLOR: Record<CoverageBand, string> = {
  critical: '#d03b3b',
  below: '#fab219',
  meets: '#0ca30c',
};
/** Single-series colour for volumes and plan routes. */
export const SERIES_COLOR = '#2a6fdb';

interface Tip {
  x: number;
  y: number;
  lines: string[];
}

function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return (
    <div className="chart-tip" style={{ left: tip.x, top: tip.y }} role="tooltip">
      {tip.lines.map((l, i) => (
        <div key={i} className={i === 0 ? 'tip-title' : ''}>
          {l}
        </div>
      ))}
    </div>
  );
}

/** Horizontal bars, one per site, sorted worst first. Single measure → one axis. */
export function CoverageChart({ metrics, target, critical }: { metrics: SiteMetrics[]; target: number; critical: number }) {
  const { t, num, dir } = useI18n();
  const [tip, setTip] = useState<Tip | null>(null);
  const rows = [...metrics].sort((a, b) => a.perCapita - b.perCapita);
  const max = Math.max(target * 1.25, ...rows.map((r) => r.perCapita));
  const rowH = 26;
  const labelW = 200;
  const W = 640;
  const plotW = W - labelW - 56;
  const H = rows.length * rowH + 28;
  const x = (v: number) => (v / max) * plotW;
  const rtl = dir === 'rtl';
  // In RTL, mirror the plot so bars grow from the right like the reading direction.
  const px = (v: number) => (rtl ? W - labelW - x(v) : labelW + x(v));

  const ticks = [0, critical, target, Math.round(max)].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="chart-wrap" onMouseLeave={() => setTip(null)}>
      <div className="legend" aria-label="legend">
        {(['critical', 'below', 'meets'] as CoverageBand[]).map((b) => (
          <span key={b} className="legend-item">
            <span className="swatch" style={{ background: BAND_COLOR[b] }} />
            {t(`band.${b}`, { n: num(critical) })}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" direction="ltr" role="img" aria-label={t('dash.coverage')}>
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={px(v)}
              x2={px(v)}
              y1={0}
              y2={H - 22}
              className={v === target ? 'target-line' : v === critical ? 'critical-line' : 'grid-line'}
            />
            <text x={px(v)} y={H - 6} className="axis-text" textAnchor="middle">
              {num(v)}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = i * rowH + 4;
          const w = Math.max(2, x(r.perCapita));
          const bx = rtl ? W - labelW - w : labelW;
          return (
            <g
              key={r.site.id}
              onMouseMove={(e) => {
                const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setTip({
                  x: e.clientX - box.left + 12,
                  y: e.clientY - box.top + 12,
                  lines: [
                    r.site.name,
                    `${num(r.perCapita, 1)} ${t('col.perCapita')}`,
                    `${t('col.population')}: ${num(r.site.population)}`,
                    `${t('col.gap')}: ${num(r.gapLpd)}`,
                  ],
                });
              }}
            >
              <rect x={0} y={y - 2} width={W} height={rowH} fill="transparent" />
              <text
                x={rtl ? W - 4 : 4}
                y={y + 13}
                className="bar-label"
                textAnchor={rtl ? 'end' : 'start'}
              >
                {r.site.name.length > 30 ? r.site.name.slice(0, 29) + '…' : r.site.name}
              </text>
              <rect x={bx} y={y} width={w} height={rowH - 10} rx={3} fill={BAND_COLOR[r.band]} />
              <text
                x={rtl ? bx - 4 : bx + w + 4}
                y={y + 12}
                className="value-text"
                textAnchor={rtl ? 'end' : 'start'}
              >
                {num(r.perCapita, 1)}
              </text>
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

/** Daily total trucked volume, single series. */
export function DailyChart({ series }: { series: { date: string; litres: number }[] }) {
  const { num, t, dir } = useI18n();
  const [tip, setTip] = useState<Tip | null>(null);
  const W = 640;
  const H = 200;
  const padL = 56;
  const padB = 26;
  const plotW = W - padL - 8;
  const plotH = H - padB - 10;
  const max = Math.max(1, ...series.map((s) => s.litres));
  const niceMax = Math.ceil(max / 100_000) * 100_000 || max;
  const bw = plotW / series.length;
  const rtl = dir === 'rtl';
  const ordered = rtl ? [...series].reverse() : series;

  return (
    <div className="chart-wrap" onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" direction="ltr" role="img" aria-label={t('dash.daily')}>
        {[0, 0.5, 1].map((f) => {
          const y = 10 + plotH - f * plotH;
          return (
            <g key={f}>
              <line x1={padL} x2={W - 8} y1={y} y2={y} className="grid-line" />
              <text x={padL - 6} y={y + 4} className="axis-text" textAnchor="end">
                {num((niceMax * f) / 1000)}k
              </text>
            </g>
          );
        })}
        {ordered.map((s, i) => {
          const h = (s.litres / niceMax) * plotH;
          const x = padL + i * bw + 2;
          return (
            <g
              key={s.date}
              onMouseMove={(e) => {
                const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setTip({ x: e.clientX - box.left + 12, y: e.clientY - box.top - 40, lines: [s.date, `${num(s.litres)} L`] });
              }}
            >
              <rect x={padL + i * bw} y={10} width={bw} height={plotH} fill="transparent" />
              <rect x={x} y={10 + plotH - h} width={Math.max(1, bw - 4)} height={h} rx={3} className="bar-series" />
              {(i === 0 || i === ordered.length - 1 || i % 3 === 0) && (
                <text x={x + (bw - 4) / 2} y={H - 8} className="axis-text" textAnchor="middle">
                  {s.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}
