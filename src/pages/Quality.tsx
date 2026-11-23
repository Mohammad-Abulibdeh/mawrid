import { FlaskConical, Plus, Trash, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Empty, Field, JourneyBar, PageHeader, QualityBadge, useToast } from '../components/ui';
import { evaluateTest } from '../domain/quality';
import { newId, validateTest, type FieldError } from '../domain/validate';
import { useI18n } from '../i18n/i18n';
import type { StringKey } from '../i18n/strings';
import { useStore } from '../state/store';

export default function Quality() {
  const { ds, dispatch, refDate } = useStore();
  const { t, num } = useI18n();
  const toast = useToast();
  const [form, setForm] = useState({ date: refDate, pointId: '', frc: '', turbidity: '', ecoli: '' });
  const [errors, setErrors] = useState<FieldError[]>([]);
  const pointName = new Map(ds.points.map((p) => [p.id, p.name]));
  const mode = ds.settings.chlorineMode;
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = validateTest({ ...form, id: newId('qt') }, ds.points, refDate);
    if (!r.ok) return setErrors(r.errors);
    dispatch({ type: 'addTest', test: r.value });
    setErrors([]);
    setForm((f) => ({ ...f, frc: '', turbidity: '', ecoli: '' }));
    toast(t('q.saved', { status: t(`q.${evaluateTest(r.value, mode).status}`) }));
  };

  const rows = [...ds.tests].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const fmt = (v?: number) => (v === undefined ? t('common.none') : num(v, 2));

  return (
    <>
      <PageHeader
        eyebrow={t('journey.stepOf', { n: num(3), b: num(4) })}
        title={t('nav.quality')}
        intro={t('q.intro', { d: num(ds.settings.testMaxAgeDays) })}
        hint={t('q.hint')}
        actions={
          <>
            <span className="pill">{t('q.mode', { mode: t(`data.mode.${mode}`) })}</span>
            <Link className="btn" to="/deliveries">
              <Truck className="icon" aria-hidden="true" /> {t('del.add')}
            </Link>
          </>
        }
      />
      <JourneyBar current="record" />
      <Card title={t('q.add')}>
        <form className="form" onSubmit={submit} noValidate>
          <div className="row-5">
            <Field name="date" label={t('f.date')} errors={errors}>
              <input id="f-date" type="date" max={refDate} value={form.date} onChange={set('date')} />
            </Field>
            <Field name="pointId" label={t('f.pointId')} errors={errors}>
              <select id="f-pointId" value={form.pointId} onChange={set('pointId')}>
                <option value="">{t('f.choose')}</option>
                {ds.points.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field name="frc" label={t('f.frc')} errors={errors}>
              <input id="f-frc" inputMode="decimal" value={form.frc} onChange={set('frc')} />
            </Field>
            <Field name="turbidity" label={t('f.turbidity')} errors={errors}>
              <input id="f-turbidity" inputMode="decimal" value={form.turbidity} onChange={set('turbidity')} />
            </Field>
            <Field name="ecoli" label={t('f.ecoli')} errors={errors}>
              <input id="f-ecoli" inputMode="numeric" value={form.ecoli} onChange={set('ecoli')} />
            </Field>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              <Plus className="icon" aria-hidden="true" /> {t('btn.add')}
            </button>
          </div>
        </form>
      </Card>
      <Card title={`${t('nav.quality')} (${num(rows.length)})`}>
        {rows.length === 0 ? (
          <Empty icon={FlaskConical}>{t('common.noRecords')}</Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('col.date')}</th>
                  <th>{t('col.source')}</th>
                  <th className="num">{t('col.frc')}</th>
                  <th className="num">{t('col.turbidity')}</th>
                  <th className="num">{t('col.ecoli')}</th>
                  <th>{t('col.result')}</th>
                  <th>{t('col.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => {
                  const r = evaluateTest(q, mode);
                  return (
                    <tr key={q.id}>
                      <td>{q.date}</td>
                      <td>{pointName.get(q.pointId) ?? q.pointId}</td>
                      <td className="num">{fmt(q.frc)}</td>
                      <td className="num">{fmt(q.turbidity)}</td>
                      <td className="num">{fmt(q.ecoli)}</td>
                      <td>
                        <QualityBadge status={r.status} />
                        {r.issues.length > 0 && (
                          <div className="small muted">{r.issues.map((i) => t(`issue.${i}` as StringKey)).join(', ')}</div>
                        )}
                      </td>
                      <td className="actions">
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => window.confirm(t('confirm.deleteSimple')) && dispatch({ type: 'deleteTest', id: q.id })}
                        >
                          <Trash className="icon" aria-hidden="true" /> {t('btn.delete')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
