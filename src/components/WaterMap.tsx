import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMemo } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import type { SiteMetrics } from '../domain/analytics';
import { GAZA_CENTER } from '../domain/geo';
import type { PlanTrip } from '../domain/planner';
import type { QualityStatus } from '../domain/quality';
import type { WaterPoint } from '../domain/types';
import { useI18n } from '../i18n/i18n';
import { BAND_COLOR, SERIES_COLOR } from './charts';
import { MARKER_SVG } from './icons';

export interface WaterMapProps {
  metrics?: SiteMetrics[];
  points?: WaterPoint[];
  quality?: Map<string, QualityStatus>;
  trips?: PlanTrip[];
  radiusM?: number;
  height?: number | string;
  onPick?: (lat: number, lng: number) => void;
  picked?: { lat: number; lng: number } | null;
}

function pointState(p: WaterPoint, q: QualityStatus | undefined): 'down' | 'unsafe' | 'warn' | 'ok' {
  if (p.status === 'down') return 'down';
  if (q === 'unsafe') return 'unsafe';
  if (p.status === 'partial' || q === 'warning' || q === 'untested') return 'warn';
  return 'ok';
}
const GLYPH = MARKER_SVG;

function PickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(Math.round(e.latlng.lat * 1e5) / 1e5, Math.round(e.latlng.lng * 1e5) / 1e5) });
  return null;
}

export default function WaterMap({ metrics = [], points = [], quality, trips = [], radiusM, height = 520, onPick, picked }: WaterMapProps) {
  const { t, num, dir } = useI18n();
  const icons = useMemo(() => {
    const make = (s: keyof typeof GLYPH, fill: boolean) =>
      L.divIcon({
        className: `pt-icon pt-${s} ${fill ? 'pt-source' : 'pt-tap'}`,
        html: GLYPH[s],
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
    const out: Record<string, L.DivIcon> = {};
    for (const s of Object.keys(GLYPH) as (keyof typeof GLYPH)[]) {
      out[`${s}-1`] = make(s, true);
      out[`${s}-0`] = make(s, false);
    }
    return out;
  }, []);
  const siteById = new Map(metrics.map((m) => [m.site.id, m.site]));
  const pointById = new Map(points.map((p) => [p.id, p]));
  const maxLoads = Math.max(1, ...trips.map((tr) => tr.loads));

  return (
    <div className="map-frame" style={{ height }}>
      <MapContainer center={GAZA_CENTER} zoom={11} minZoom={9} maxZoom={18} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onPick && <PickHandler onPick={onPick} />}
        {picked && <CircleMarker center={[picked.lat, picked.lng]} radius={8} pathOptions={{ color: '#2a2420', weight: 3, fillOpacity: 0 }} />}

        {trips.map((tr) => {
          const p = pointById.get(tr.pointId);
          const s = siteById.get(tr.siteId);
          if (!p || !s) return null;
          return (
            <Polyline
              key={`${tr.pointId}-${tr.siteId}`}
              positions={[
                [p.lat, p.lng],
                [s.lat, s.lng],
              ]}
              pathOptions={{ color: SERIES_COLOR, weight: 2 + (4 * tr.loads) / maxLoads, opacity: 0.75 }}
            >
              <Popup>
                {p.name} {dir === 'rtl' ? '←' : '→'} {s.name}
                <br />
                {num(tr.loads)} × · {num(tr.litres)} L · {t('common.km', { n: num(tr.distanceKm, 1) })}
              </Popup>
            </Polyline>
          );
        })}

        {radiusM &&
          points
            .filter((p) => p.taps > 0 && p.status !== 'down' && quality?.get(p.id) !== 'unsafe')
            .map((p) => (
              <Circle
                key={`r-${p.id}`}
                center={[p.lat, p.lng]}
                radius={radiusM}
                pathOptions={{ color: SERIES_COLOR, weight: 1, fillOpacity: 0.06, dashArray: '4 4' }}
              />
            ))}

        {metrics.map((m) => (
          <CircleMarker
            key={m.site.id}
            center={[m.site.lat, m.site.lng]}
            radius={5 + Math.sqrt(m.site.population) / 18}
            pathOptions={{ color: '#2a2420', weight: 2, fillColor: BAND_COLOR[m.band], fillOpacity: 0.85 }}
          >
            <Popup>
              <strong>{m.site.name}</strong>
              <br />
              {num(m.perCapita, 1)} {t('col.perCapita')} — {t(`band.${m.band}`, { n: num(6) })}
              <br />
              {t('col.population')}: {num(m.site.population)}
              <br />
              {t('col.nearest')}:{' '}
              {m.nearestDistanceM !== undefined ? t('common.m', { n: num(m.nearestDistanceM) }) : t('common.none')}
            </Popup>
          </CircleMarker>
        ))}

        {points.map((p) => {
          const st = pointState(p, quality?.get(p.id));
          return (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={icons[`${st}-${p.type === 'distribution' ? 0 : 1}`]}>
              <Popup>
                <strong>{p.name}</strong>
                <br />
                {t(`ptype.${p.type}`)} · {t(`pstatus.${p.status}`)}
                <br />
                {t('col.quality')}: {t(`q.${quality?.get(p.id) ?? 'untested'}`)}
                <br />
                {p.capacityLpd > 0 && (
                  <>
                    {t('col.capacity')}: {num(p.capacityLpd)}
                    <br />
                  </>
                )}
                {p.taps > 0 && (
                  <>
                    {t('col.taps')}: {num(p.taps)}
                  </>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
