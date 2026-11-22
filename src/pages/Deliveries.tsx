import { useState } from 'react';
import { Card, Empty, Field, PageHeader, useToast } from '../components/ui';
import { newId, validateDelivery, type FieldError } from '../domain/validate';
import { useI18n } from '../i18n/i18n';
import { useStore } from '../state/store';

const PAGE = 50;

export default function Deliveries() {
  const { ds, dispatch, refDate } = useStore();
  const { t, num } = useI18n();
  const toast = useToast();
  const [form, setForm] = useState({ date: refDate, pointId: '', siteId: '', litres: '10000' });
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [filter, setFilter] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const siteName = new Map(ds.sites.map((s) => [s.id, s.name]));
  const pointName = new Map(ds.points.map((p) => [p.id, p.name]));
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = validateDelivery({ ...form, id: newId('dl') }, ds.sites, ds.points, refDate);
    if (!r.ok) return setErrors(r.errors);
    dispatch({ type: 'addDelivery', delivery: r.value });
    setErrors([]);
    toast(t('del.saved'));
  };

  const rows = ds.deliveries
    .filter((d) => !filter || d.siteId === filter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  return (
    <>
      <PageHeader title={t('nav.deliveries')} intro={t('del.intro', { d: num(ds.settings.windowDays) })} />
      <Card title={t('del.add')}>
        <form className="form" onSubmit={submit} noValidate>
          <div className="row-4">
            <Field name="date" label={t('f.date')} errors={errors}>
              <input id="f-date" type="date" max={refDate} value={form.date} onChange={set('date')} />
            </Field>
            <Field name="pointId" label={t('f.pointId')} errors={errors}>
              <select id="f-pointId" value={form.pointId} onChange={set('pointId')}>
                <option value="">{t('f.choose')}</option>
                {ds.points
                  .filter((p) => p.type !== 'distribution')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field name="siteId" label={t('f.siteId')} errors={errors}>
              <select id="f-siteId" value={form.siteId} onChange={set('siteId')}>
                <option value="">{t('f.choose')}</option>
                {ds.sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field name="litres" label={t('f.litres')} errors={errors}>
              <input id="f-litres" inputMode="numeric" value={form.litres} onChange={set('litres')} />
            </Field>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              {t('btn.add')}
            </button>
          </div>
        </form>
      </Card>
      <Card
        aside={
          <label className="inline-field">
            {t('del.filter')}{' '}
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">{t('del.all')}</option>
              {ds.sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        }
        title={`${t('nav.deliveries')} (${num(rows.length)})`}
      >
        {rows.length === 0 ? (
          <Empty>{t('common.noRecords')}</Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('col.date')}</th>
                  <th>{t('col.source')}</th>
                  <th>{t('col.site')}</th>
                  <th className="num">{t('col.litres')}</th>
                  <th>{t('col.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, limit).map((d) => (
                  <tr key={d.id}>
                    <td>{d.date}</td>
                    <td>{pointName.get(d.pointId) ?? d.pointId}</td>
                    <td>{siteName.get(d.siteId) ?? d.siteId}</td>
                    <td className="num">{num(d.litres)}</td>
                    <td className="actions">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => window.confirm(t('confirm.deleteSimple')) && dispatch({ type: 'deleteDelivery', id: d.id })}
                      >
                        {t('btn.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > limit && (
              <button className="btn btn-ghost" onClick={() => setLimit((l) => l + PAGE)}>
                {t('common.of', { a: num(limit), b: num(rows.length) })} — +{num(PAGE)}
              </button>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
