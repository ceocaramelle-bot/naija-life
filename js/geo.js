// Single source of truth for latitude/longitude <-> game metres.
// Local equirectangular approximation around an origin (fine for a few km; error well under 1%).
// x = metres east of origin, z = metres SOUTH of origin (matches the Three.js world), y = up.
const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LON = 111320;

export function makeProjection(lat0, lon0) {
  const kx = M_PER_DEG_LON * Math.cos(lat0 * Math.PI / 180);
  return {
    lat0, lon0,
    toLocal: (lat, lon) => ({ x: (lon - lon0) * kx, z: -(lat - lat0) * M_PER_DEG_LAT }),
    toLatLon: (x, z) => ({ lat: lat0 - z / M_PER_DEG_LAT, lon: lon0 + x / kx })
  };
}
