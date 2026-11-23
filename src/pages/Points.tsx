import { Droplets, Pencil, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { CoordFields } from '../components/CoordFields';
import { Card, Empty, Field, JourneyBar, PageHeader, PointStatusBadge, QualityBadge, useToast } from '../components/ui';
import { pointQualityMap } from '../domain/analytics';
import { POINT_STATUSES, POINT_TYPES, type WaterPoint } from '../domain/types';
import { newId, validatePoint, type FieldError } from '../domain/validate';
import { useI18n } from '../i18n/i18n';
import { useStore } from '../state/store';

type Form = Record<'name' | 'type' | 'status' | 'lat' | 'lng' | 'capacityLpd' | 'taps' | 'notes', string>;
const blank: Form = { name: '', type: '', status: 'functional', lat: '', lng: '', capacityLpd: '0', taps: '0', notes: '' };
const toForm = (p: WaterPoint): Form => ({
  name: p.name,
  type: p.type,
  status: p.status,
  lat: String(p.lat),
  lng: String(p.lng),
  capacityLpd: String(p.capacityLpd),
  taps: String(p.taps),
  notes: p.notes ?? '',
});

export default function Points() {
  const { ds, dispatch, refDate } = useStore();
  const { t, num } = useI18n();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const quality = pointQualityMap(ds, refDate);

  const open = (p?: WaterPoint) => {
    setEditing(p ? p.id : 'new');
    setForm(p ? toForm(p) : blank);
    setErrors([]);
  };
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = validatePoint({ ...form, id: editing === 'new' ? newId('pt') : editing });
    if (!r.ok) return setErrors(r.errors);
    dispatch({ type: 'upsertPoint', point: r.value });
    toast(t('common.saved'));
    setEditing(null);
  };

  const remove = (p: WaterPoint) => {
    const linked = ds.deliveries.filter((d) => d.pointId === p.id).length + ds.tests.filter((x) => x.pointId === p.id).length;
    if (!window.confirm(t('confirm.delete', { name: p.name, n: num(linked) }))) return;
    dispatch({ type: 'deletePoint', id: p.id });
    toast(t('common.deleted'));
  };

  return (
    <>
      <PageHeader
        eyebrow={t('journey.stepOf', { n: num(2), b: num(4) })}
        title={t('step.points.title')}
        intro={t('points.intro')}
        hint={t('points.hint')}
        actions={
          editing === null && (
            <button className="btn btn-primary" onClick={() => open()}>
              <Plus className="icon" aria-hidden="true" /> {t('points.add')}
            </button>
          )
        }
      />
      <JourneyBar current="points" />
      {editing !== null && (
        <Card title={editing === 'new' ? t('points.add') : t('points.edit')}>
          <form className="form" onSubmit={submit} noValidate>
            <div className="row-3">
              <Field name="name" label={t('f.name')} errors={errors}>
                <input id="f-name" value={form.name} onChange={set('name')} />
              </Field>
              <Field name="type" label={t('f.type')} errors={errors}>
                <select id="f-type" value={form.type} onChange={set('type')}>
                  <option value="">{t('f.choose')}</option>
                  {POINT_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {t(`ptype.${v}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field name="status" label={t('f.status')} errors={errors}>
                <select id="f-status" value={form.status} onChange={set('status')}>
                  {POINT_STATUSES.map((v) => (
                    <option key={v} value={v}>
                      {t(`pstatus.${v}`)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <CoordFields lat={form.lat} lng={form.lng} errors={errors} onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
            <div className="row-2">
              <Field name="capacityLpd" label={t('f.capacityLpd')} errors={errors}>
                <input id="f-capacityLpd" inputMode="numeric" value={form.capacityLpd} onChange={set('capacityLpd')} />
              </Field>
              <Field name="taps" label={t('f.taps')} errors={errors}>
                <input id="f-taps" inputMode="numeric" value={form.taps} onChange={set('taps')} />
              </Field>
            </div>
            <Field name="notes" label={t('f.notes')}>
              <textarea id="f-notes" rows={2} value={form.notes} onChange={set('notes')} />
            </Field>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">
                {t('btn.save')}
              </button>
              <button className="btn" type="button" onClick={() => setEditing(null)}>
                {t('btn.cancel')}
              </button>
            </div>
          </form>
        </Card>
      )}
      <Card>
        {ds.points.length === 0 ? (
          <Empty icon={Droplets}>{t('common.noRecords')}</Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('col.name')}</th>
                  <th>{t('col.type')}</th>
                  <th>{t('col.status')}</th>
                  <th>{t('col.quality')}</th>
                  <th className="num">{t('col.capacity')}</th>
                  <th className="num">{t('col.taps')}</th>
                  <th>{t('col.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {ds.points.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{t(`ptype.${p.type}`)}</td>
                    <td>
                      <PointStatusBadge status={p.status} />
                    </td>
                    <td>
                      <QualityBadge status={quality.get(p.id) ?? 'untested'} />
                    </td>
                    <td className="num">{num(p.capacityLpd)}</td>
                    <td className="num">{num(p.taps)}</td>
                    <td className="actions">
                      <button className="btn btn-sm" onClick={() => open(p)}>
                        <Pencil className="icon" aria-hidden="true" /> {t('btn.edit')}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(p)}>
                        <Trash className="icon" aria-hidden="true" /> {t('btn.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
