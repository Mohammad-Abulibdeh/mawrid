import { useRef, useState } from 'react';
import { Card, PageHeader, downloadFile, readFileText, useToast } from '../components/ui';
import { csvTemplate, exportCsv, importCsv, type EntityKind } from '../domain/io';
import type { ChlorineMode, Settings } from '../domain/types';
import { validateDataset, validateSettings } from '../domain/validate';
import { useI18n } from '../i18n/i18n';
import type { StringKey } from '../i18n/strings';
import { useStore } from '../state/store';

const KINDS: { kind: EntityKind; label: StringKey }[] = [
  { kind: 'sites', label: 'nav.sites' },
  { kind: 'points', label: 'nav.points' },
  { kind: 'deliveries', label: 'nav.deliveries' },
  { kind: 'tests', label: 'nav.quality' },
];

const NUM_SETTINGS: (keyof Settings)[] = ['targetLpd', 'criticalLpd', 'maxDistanceM', 'peoplePerTap', 'windowDays', 'testMaxAgeDays'];

export default function DataPage() {
  const { ds, dispatch, refDate, resetDemo, clearAll } = useStore();
  const { t, num } = useI18n();
  const toast = useToast();
  const jsonInput = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<{ ok: number; errors: string[] } | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(ds.settings).map(([k, v]) => [k, String(v)])),
  );

  const exportJson = () =>
    downloadFile(`mawrid-dataset-${refDate}.json`, JSON.stringify(ds, null, 2), 'application/json');

  const onJson = async (file?: File) => {
    if (!file) return;
    try {
      const r = validateDataset(JSON.parse(await readFileText(file)));
      if (!r.dataset) {
        setReport({ ok: 0, errors: [t('data.badFile'), ...r.errors] });
        return;
      }
      if (!window.confirm(t('confirm.replace'))) return;
      dispatch({ type: 'replace', dataset: r.dataset });
      const d = r.dataset;
      setReport({ ok: d.sites.length + d.points.length + d.deliveries.length + d.tests.length, errors: r.errors });
    } catch {
      setReport({ ok: 0, errors: [t('data.badFile')] });
    } finally {
      if (jsonInput.current) jsonInput.current.value = '';
    }
  };

  const onCsv = async (kind: EntityKind, input: HTMLInputElement) => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const r = importCsv(ds, kind, await readFileText(file), refDate);
      dispatch({ type: 'merge', [kind]: r[kind] });
      setReport({ ok: r.accepted, errors: r.rejected.map((x) => `${t(KINDS.find((k) => k.kind === kind)!.label)} row ${x.row}: ${x.errors.join('; ')}`) });
    } catch {
      setReport({ ok: 0, errors: [t('data.badFile')] });
    } finally {
      input.value = '';
    }
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const s = validateSettings(settings);
    dispatch({ type: 'setSettings', settings: s });
    setSettings(Object.fromEntries(Object.entries(s).map(([k, v]) => [k, String(v)])));
    toast(t('common.saved'));
  };

  return (
    <>
      <PageHeader title={t('nav.data')} intro={t('data.intro')} />
      <p className="muted">
        {t('data.counts', { s: num(ds.sites.length), p: num(ds.points.length), d: num(ds.deliveries.length), q: num(ds.tests.length) })}
      </p>

      {report && (
        <Card className="report" aside={<button className="btn btn-sm" onClick={() => setReport(null)}>{t('btn.close')}</button>}>
          <p role="status">{t('data.importResult', { ok: num(report.ok), bad: num(report.errors.length) })}</p>
          {report.errors.length > 0 && (
            <details open>
              <summary>{t('data.importErrors')}</summary>
              <ul className="plain small">
                {report.errors.slice(0, 50).map((e, i) => (
                  <li key={i}>
                    <code>{e}</code>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Card>
      )}

      <div className="grid-2">
        <Card title="JSON">
          <div className="button-col">
            <button className="btn btn-primary" onClick={exportJson}>
              ⬇ {t('data.exportJson')}
            </button>
            <label className="btn file-btn">
              ⬆ {t('data.importJson')}
              <input ref={jsonInput} type="file" accept="application/json,.json" onChange={(e) => onJson(e.target.files?.[0])} />
            </label>
          </div>
        </Card>

        <Card title={t('data.settings')}>
          <form className="form" onSubmit={saveSettings}>
            <div className="row-2">
              {NUM_SETTINGS.map((k) => (
                <label className="field" key={k}>
                  <span className="field-label">{t(`data.${k}` as StringKey)}</span>
                  <input inputMode="decimal" value={settings[k]} onChange={(e) => setSettings((s) => ({ ...s, [k]: e.target.value }))} />
                </label>
              ))}
              <label className="field">
                <span className="field-label">{t('data.chlorineMode')}</span>
                <select value={settings.chlorineMode} onChange={(e) => setSettings((s) => ({ ...s, chlorineMode: e.target.value as ChlorineMode }))}>
                  <option value="normal">{t('data.mode.normal')}</option>
                  <option value="outbreak">{t('data.mode.outbreak')}</option>
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">
                {t('btn.save')}
              </button>
            </div>
          </form>
        </Card>
      </div>

      <Card title={t('data.csvTitle')}>
        <p className="muted small">{t('data.csvHelp')}</p>
        <div className="table-scroll">
          <table>
            <tbody>
              {KINDS.map(({ kind, label }) => (
                <tr key={kind}>
                  <th scope="row">{t(label)}</th>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => downloadFile(`mawrid-${kind}-${refDate}.csv`, exportCsv(ds, kind), 'text/csv;charset=utf-8')}>
                      ⬇ {t('btn.exportCsv')}
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => downloadFile(`mawrid-${kind}-template.csv`, csvTemplate(kind), 'text/csv;charset=utf-8')}>
                      {t('btn.template')}
                    </button>
                    <label className="btn btn-sm file-btn">
                      ⬆ {t('btn.import')}
                      <input type="file" accept=".csv,text/csv" aria-label={`${t('btn.import')} ${t(label)}`} onChange={(e) => onCsv(kind, e.target)} />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={t('data.danger')} className="danger-zone">
        <div className="form-actions">
          <button className="btn" onClick={() => window.confirm(t('confirm.reset')) && resetDemo()}>
            {t('data.loadDemo')}
          </button>
          <button className="btn btn-danger" onClick={() => window.confirm(t('confirm.clear')) && clearAll()}>
            {t('data.clear')}
          </button>
        </div>
      </Card>
    </>
  );
}
