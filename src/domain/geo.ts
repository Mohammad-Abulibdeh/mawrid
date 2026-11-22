const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres (haversine). */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rough bounding box of the Gaza Strip, used to validate coordinates and centre the map. */
export const GAZA_BOUNDS = {
  minLat: 31.21,
  maxLat: 31.6,
  minLng: 34.2,
  maxLng: 34.58,
} as const;

export const GAZA_CENTER: [number, number] = [31.42, 34.38];

export function isInGazaBounds(lat: number, lng: number): boolean {
  return (
    lat >= GAZA_BOUNDS.minLat && lat <= GAZA_BOUNDS.maxLat && lng >= GAZA_BOUNDS.minLng && lng <= GAZA_BOUNDS.maxLng
  );
}
