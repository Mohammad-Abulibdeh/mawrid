import {
  ArrowRight,
  Check,
  CircleCheck,
  CircleDashed,
  CircleQuestionMark,
  CircleX,
  Lightbulb,
  ShieldCheck,
  ShieldX,
  TriangleExclamationPoint,
  type LucideIcon,
} from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CoverageBand } from '../domain/analytics';
import type { QualityStatus } from '../domain/quality';
import type { PointStatus } from '../domain/types';
import type { FieldError } from '../domain/validate';
import { useI18n } from '../i18n/i18n';
import type { StringKey } from '../i18n/strings';
import { hasMadePlan, journeySteps, nextStep, type StepId } from '../state/journey';
import { useStore } from '../state/store';

/* ---------- status badges: colour is always paired with an icon and a label ---------- */

const BAND_ICON: Record<CoverageBand, LucideIcon> = { critical: TriangleExclamationPoint, below: CircleDashed, meets: CircleCheck };
const Q_ICON: Record<QualityStatus, LucideIcon> = { safe: ShieldCheck, warning: TriangleExclamationPoint, unsafe: ShieldX, untested: CircleQuestionMark };
const P_ICON: Record<PointStatus, LucideIcon> = { functional: CircleCheck, partial: CircleDashed, down: CircleX };

function Badge({ cls, Icon, label }: { cls: string; Icon: LucideIcon; label: string }) {
  return (
    <span className={`badge ${cls}`}>
      <Icon className="icon" aria-hidden="true" strokeWidth={2.5} /> {label}
    </span>
  );
}

export function BandBadge({ band }: { band: CoverageBand }) {
  const { t, num } = useI18n();
  return <Badge cls={`badge-${band}`} Icon={BAND_ICON[band]} label={t(`band.${band}`, { n: num(6) })} />;
}

export function QualityBadge({ status }: { status: QualityStatus }) {
  const { t } = useI18n();
  return <Badge cls={`badge-q-${status}`} Icon={Q_ICON[status]} label={t(`q.${status}`)} />;
}

export function PointStatusBadge({ status }: { status: PointStatus }) {
  const { t } = useI18n();
  return <Badge cls={`badge-p-${status}`} Icon={P_ICON[status]} label={t(`pstatus.${status}`)} />;
}

export function PlanFlag({ tone, label }: { tone: 'critical' | 'below'; label: string }) {
  return <Badge cls={`badge-${tone}`} Icon={tone === 'critical' ? TriangleExclamationPoint : CircleDashed} label={label} />;
}

/* ---------- layout ---------- */

export function PageHeader({
  title,
  intro,
  actions,
  eyebrow,
  hint,
}: {
  title: string;
  intro?: string;
  actions?: ReactNode;
  eyebrow?: string;
  hint?: string;
}) {
  return (
    <>
      <header className="page-header">
        <div className="page-header-text">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {intro && <p className="intro">{intro}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </header>
      {hint && <Hint>{hint}</Hint>}
    </>
  );
}

/** Short guidance placed next to the tools it explains. */
export function Hint({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <p className="hint">
      <Lightbulb className="icon" size={18} aria-hidden="true" />
      <span>
        <strong>{t('hint.label')}:</strong> {children}
      </span>
    </p>
  );
}

/** Progress through the four workflow steps, shown at the top of each step page. */
export function JourneyBar({ current }: { current: StepId }) {
  const { t, num } = useI18n();
  const { ds } = useStore();
  const steps = journeySteps(ds, hasMadePlan());
  const done = steps.filter((s) => s.done).length;
  const here = steps.find((s) => s.id === current)!;
  const next = nextStep(steps.filter((s) => s.id !== current)) ?? (current !== 'plan' ? steps[here.n] : undefined);
  return (
    <nav className="journey" aria-label={t('journey.label')}>
      <div className="journey-meta">
        <span className="journey-count">{t('journey.count', { a: num(done), b: num(steps.length) })}</span>
        <div className="meter" aria-hidden="true">
          <span style={{ width: `${(100 * done) / steps.length}%` }} />
        </div>
      </div>
      <ol>
        {steps.map((s) => (
          <li key={s.id}>
            <Link to={s.to} aria-current={s.id === current ? 'step' : undefined}>
              <span className={`step-dot ${s.done ? 'done' : ''}`} aria-hidden="true">
                {s.done ? <Check size={14} strokeWidth={3} /> : num(s.n)}
              </span>
              {t(s.title)}
            </Link>
          </li>
        ))}
      </ol>
      <div className="journey-next">
        {next ? (
          <Link className="btn btn-sm" to={next.to}>
            {t('journey.next', { step: t(next.title) })} <ArrowRight className="icon flip-rtl" aria-hidden="true" />
          </Link>
        ) : (
          <Link className="btn btn-sm" to="/dashboard">
            {done === steps.length ? t('journey.allDone') : t('journey.next', { step: t('nav.dashboard') })}{' '}
            <ArrowRight className="icon flip-rtl" aria-hidden="true" />
          </Link>
        )}
      </div>
    </nav>
  );
}

export function Card({ title, children, className = '', aside }: { title?: string; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <section className={`card ${className}`}>
      {(title || aside) && (
        <div className="card-head">
          {title && <h2>{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'critical' | 'warning' | 'good' }) {
  return (
    <div className={`kpi ${tone ? `kpi-${tone}` : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export function Empty({ children, icon: Icon }: { children: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="empty">
      {Icon && <Icon className="icon" size={32} aria-hidden="true" />}
      {children}
    </div>
  );
}

/* ---------- forms ---------- */

export function Field({
  name,
  label,
  errors,
  help,
  children,
}: {
  name: string;
  label: string;
  errors?: FieldError[];
  help?: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const err = errors?.find((e) => e.field === name);
  return (
    <div className={`field ${err ? 'has-error' : ''}`}>
      <label className="field-label" htmlFor={`f-${name}`}>
        {label}
      </label>
      {children}
      {help && !err && (
        <span className="field-help" id={`h-${name}`}>
          {help}
        </span>
      )}
      {err && (
        <span className="field-error" role="alert" id={`e-${name}`}>
          {t(`err.${err.code}` as StringKey)}
        </span>
      )}
    </div>
  );
}

/* ---------- toast ---------- */

const ToastCtx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {msg && (
          <div className="toast">
            <CircleCheck size={18} aria-hidden="true" />
            {msg}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/* ---------- files ---------- */

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([mime.startsWith('text/csv') ? '﻿' + content : content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}
