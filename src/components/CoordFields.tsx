import { lazy, Suspense, useState } from 'react';
import type { FieldError } from '../domain/validate';
import { useI18n } from '../i18n/i18n';
import { Field } from './ui';

const WaterMap = lazy(() => import('./WaterMap'));

export function CoordFields({
  lat,
  lng,
  onChange,
  errors,
}: {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
  errors?: FieldError[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const picked = lat && lng && Number.isFinite(+lat) && Number.isFinite(+lng) ? { lat: +lat, lng: +lng } : null;
  return (
    <div className="coord-fields">
      <div className="row-2">
        <Field name="lat" label={t('f.lat')} errors={errors}>
          <input id="f-lat" inputMode="decimal" value={lat} onChange={(e) => onChange(e.target.value, lng)} />
        </Field>
        <Field name="lng" label={t('f.lng')} errors={errors}>
          <input id="f-lng" inputMode="decimal" value={lng} onChange={(e) => onChange(lat, e.target.value)} />
        </Field>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        📍 {t('f.pickOnMap')}
      </button>
      {open && (
        <div className="picker">
          <p className="muted small">{t('f.pickHint')}</p>
          <Suspense fallback={<div className="map-loading">{t('common.loading')}</div>}>
            <WaterMap height={280} picked={picked} onPick={(a, b) => onChange(String(a), String(b))} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
