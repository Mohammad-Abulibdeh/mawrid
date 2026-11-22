import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { CoverageBand } from '../domain/analytics';
import type { QualityStatus } from '../domain/quality';
import type { PointStatus } from '../domain/types';
import type { FieldError } from '../domain/validate';
import { useI18n } from '../i18n/i18n';
import type { StringKey } from '../i18n/strings';

/* ---------- status badges: colour is always paired with an icon and a label ---------- */

const BAND_ICON: Record<CoverageBand, string> = { critical: '▲', below: '●', meets: '✓' };
const Q_ICON: Record<QualityStatus, string> = { safe: '✓', warning: '!', unsafe: '✕', untested: '?' };
const P_ICON: Record<PointStatus, string> = { functional: '✓', partial: '◐', down: '✕' };

export function BandBadge({ band }: { band: CoverageBand }) {
  const { t, num } = useI18n();
  return (
    <span className={`badge badge-${band}`}>
      <span aria-hidden>{BAND_ICON[band]}</span> {t(`band.${band}`, { n: num(6) })}
    </span>
  );
}

export function QualityBadge({ status }: { status: QualityStatus }) {
  const { t } = useI18n();
  return (
    <span className={`badge badge-q-${status}`}>
      <span aria-hidden>{Q_ICON[status]}</span> {t(`q.${status}`)}
    </span>
  );
}

export function PointStatusBadge({ status }: { status: PointStatus }) {
  const { t } = useI18n();
  return (
    <span className={`badge badge-p-${status}`}>
      <span aria-hidden>{P_ICON[status]}</span> {t(`pstatus.${status}`)}
    </span>
  );
}

/* ---------- layout ---------- */

export function PageHeader({ title, intro, actions }: { title: string; intro?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {intro && <p className="intro">{intro}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
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

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
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
        {msg && <div className="toast">{msg}</div>}
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
