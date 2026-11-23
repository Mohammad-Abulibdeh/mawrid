import { useState } from 'react';
import { MARKER_SVG } from '../components/icons';
import { pointQualityMap } from '../domain/analytics';
import WaterMap from '../components/WaterMap';
import { BAND_COLOR } from '../components/charts';
import { Card, PageHeader } from '../components/ui';
import { useI18n } from '../i18n/i18n';
import { useStore } from '../state/store';

export default function MapPage() {
  const { ds, metrics, refDate } = useStore();
  const { t, num } = useI18n();
  const [showSites, setShowSites] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showRadius, setShowRadius] = useState(false);
  const quality = pointQualityMap(ds, refDate);

  return (
    <>
      <PageHeader title={t('nav.map')} intro={t('map.tiles')} hint={t('map.hint')} />
      <Card>
        <div className="toolbar">
          <label className="check">
            <input type="checkbox" checked={showSites} onChange={(e) => setShowSites(e.target.checked)} /> {t('map.sites')}
          </label>
          <label className="check">
            <input type="checkbox" checked={showPoints} onChange={(e) => setShowPoints(e.target.checked)} /> {t('map.points')}
          </label>
          <label className="check">
            <input type="checkbox" checked={showRadius} onChange={(e) => setShowRadius(e.target.checked)} />{' '}
            {t('map.radius', { m: num(ds.settings.maxDistanceM) })}
          </label>
        </div>
        <WaterMap
          metrics={showSites ? metrics : []}
          points={showPoints ? ds.points : []}
          quality={quality}
          radiusM={showRadius ? ds.settings.maxDistanceM : undefined}
          height="calc(100vh - 300px)"
        />
        <div className="legend map-legend">
          {(['critical', 'below', 'meets'] as const).map((b) => (
            <span key={b} className="legend-item">
              <span className="swatch round" style={{ background: BAND_COLOR[b] }} />
              {t(`band.${b}`, { n: num(ds.settings.criticalLpd) })}
            </span>
          ))}
          <span className="legend-item muted">{t('map.legendSize')}</span>
          <span className="legend-item">
            <span className="pt-icon pt-ok pt-source legend-pt" dangerouslySetInnerHTML={{ __html: MARKER_SVG.ok }} />
            {t('pstatus.functional')}
          </span>
          <span className="legend-item">
            <span className="pt-icon pt-warn pt-source legend-pt" dangerouslySetInnerHTML={{ __html: MARKER_SVG.warn }} />
            {t('pstatus.partial')} / {t('q.untested')}
          </span>
          <span className="legend-item">
            <span className="pt-icon pt-unsafe pt-source legend-pt" dangerouslySetInnerHTML={{ __html: MARKER_SVG.unsafe }} />
            {t('q.unsafe')}
          </span>
          <span className="legend-item">
            <span className="pt-icon pt-down pt-source legend-pt" dangerouslySetInnerHTML={{ __html: MARKER_SVG.down }} />
            {t('pstatus.down')}
          </span>
        </div>
      </Card>
    </>
  );
}
