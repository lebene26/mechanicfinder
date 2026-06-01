/** Haversine distance in kilometers between two WGS84 points. */
export function distanceInKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRad(toLat - fromLat);
  const deltaLng = toRad(toLng - fromLng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRad(fromLat)) *
      Math.cos(toRad(toLat)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export const GHANA_DEFAULT_CENTER = { lat: 7.9465, lng: -1.0232 };

export function hasCoordinates<T extends { latitude: number | null; longitude: number | null }>(
  item: T
): item is T & { latitude: number; longitude: number } {
  return item.latitude != null && item.longitude != null;
}
