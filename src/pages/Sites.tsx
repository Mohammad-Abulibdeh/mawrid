import { Pencil, Plus, Tent, Trash } from 'lucide-react';
import { useState } from 'react';
import { CoordFields } from '../components/CoordFields';
import { BandBadge, Card, Empty, Field, JourneyBar, PageHeader, useToast } from '../components/ui';
import { GOVERNORATES, type Site } from '../domain/types';
import { newId, validateSite, type FieldError } from '../domain/validate';
import { useI18n } from '../i18n/i18n';
import { useStore } from '../state/store';

type Form = Record<'name' | 'governorate' | 'lat' | 'lng' | 'population' | 'vulnerability' | 'fixedSupplyLpd' | 'notes', string>;

const blank: Form = { name: '', governorate: '', lat: '', lng: '', population: '', vulnerability: '1', fixedSupplyLpd: '0', notes: '' };
const toForm = (s: Site): Form => ({
  name: s.name,
  governorate: s.governorate,
  lat: String(s.lat),
  lng: String(s.lng),
  population: String(s.population),
  vulnerability: String(s.vulnerability),
  fixedSupplyLpd: String(s.fixedSupplyLpd),
  notes: s.notes ?? '',
});

export default function Sites() {
  const { ds, dispatch, metrics } = useStore();
  const { t, num } = useI18n();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null); // id, 'new', or null
  const [form, setForm] = useState<Form>(blank);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const metricById = new Map(metrics.map((m) => [m.site.id, m]));

  const open = (s?: Site) => {
    setEditing(s ? s.id : 'new');
    setForm(s ? toForm(s) : blank);
    setErrors([]);
  };
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = validateSite({ ...form, id: editing === 'new' ? newId('site') : editing });
    if (!r.ok) return setErrors(r.errors);
    dispatch({ type: 'upsertSite', site: r.value });
    toast(t('common.saved'));
    setEditing(null);
  };

  const remove = (s: Site) => {
    const linked = ds.deliveries.filter((d) => d.siteId === s.id).length;
    if (!window.confirm(t('confirm.delete', { name: s.name, n: num(linked) }))) return;
    dispatch({ type: 'deleteSite', id: s.id });
    toast(t('common.deleted'));
  };

  return (
    <>
      <PageHeader
        eyebrow={t('journey.stepOf', { n: num(1), b: num(4) })}
        title={t('step.sites.title')}
        intro={t('sites.intro')}
        hint={t('sites.hint')}
        actions={
          editing === null && (
            <button className="btn btn-primary" onClick={() => open()}>
              <Plus className="icon" aria-hidden="true" /> {t('sites.add')}
            </button>
          )
        }
      />
      <JourneyBar current="sites" />
      {editing !== null && (
        <Card title={editing === 'new' ? t('sites.add') : t('sites.edit')}>
          <form className="form" onSubmit={submit} noValidate>
            <div className="row-2">
              <Field name="name" label={t('f.name')} errors={errors}>
                <input id="f-name" value={form.name} onChange={set('name')} />
              </Field>
              <Field name="governorate" label={t('f.governorate')} errors={errors}>
                <select id="f-governorate" value={form.governorate} onChange={set('governorate')}>
                  <option value="">{t('f.choose')}</option>
                  {GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <CoordFields lat={form.lat} lng={form.lng} errors={errors} onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
            <div className="row-3">
              <Field name="population" label={t('f.population')} errors={errors}>
                <input id="f-population" inputMode="numeric" value={form.population} onChange={set('population')} />
              </Field>
              <Field name="vulnerability" label={t('f.vulnerability')} errors={errors} help={t('f.vulnerabilityHelp')}>
                <input id="f-vulnerability" inputMode="decimal" value={form.vulnerability} onChange={set('vulnerability')} />
              </Field>
              <Field name="fixedSupplyLpd" label={t('f.fixedSupplyLpd')} errors={errors} help={t('f.fixedHelp')}>
                <input id="f-fixedSupplyLpd" inputMode="numeric" value={form.fixedSupplyLpd} onChange={set('fixedSupplyLpd')} />
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
        {ds.sites.length === 0 ? (
          <Empty icon={Tent}>{t('common.noRecords')}</Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('col.name')}</th>
                  <th>{t('col.governorate')}</th>
                  <th className="num">{t('col.population')}</th>
                  <th className="num">{t('col.vulnerability')}</th>
                  <th className="num">{t('col.fixed')}</th>
                  <th className="num">{t('col.perCapita')}</th>
                  <th>{t('col.status')}</th>
                  <th>{t('col.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {ds.sites.map((s) => {
                  const m = metricById.get(s.id);
                  return (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.governorate}</td>
                      <td className="num">{num(s.population)}</td>
                      <td className="num">{num(s.vulnerability, 1)}</td>
                      <td className="num">{num(s.fixedSupplyLpd)}</td>
                      <td className="num">{m ? num(m.perCapita, 1) : ''}</td>
                      <td>{m && <BandBadge band={m.band} />}</td>
                      <td className="actions">
                        <button className="btn btn-sm" onClick={() => open(s)}>
                          <Pencil className="icon" aria-hidden="true" /> {t('btn.edit')}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => remove(s)}>
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
