// Converts an Overpass API JSON response (OpenStreetMap data) into the game's district file.
// Pure function: used by tools/import.html in the browser and testable in Node.
import { makeProjection } from './geo.js';

const SKIP_HW = new Set(['construction', 'proposed', 'abandoned', 'raceway', 'bus_guideway', 'corridor', 'platform', 'elevator']);
const MINOR = new Set(['bench', 'waste_basket', 'parking', 'parking_space', 'parking_entrance', 'bicycle_parking', 'post_box', 'drinking_water', 'telephone', 'clock', 'recycling', 'shelter', 'toilets', 'vending_machine', 'waste_disposal']);
const PARK_LEISURE = new Set(['park', 'garden', 'pitch', 'playground', 'recreation_ground', 'sports_centre', 'stadium']);
const PARK_LANDUSE = new Set(['grass', 'recreation_ground', 'village_green', 'forest']);

export function overpassQuery(lat, lon, r) {
  const a = `(around:${r},${lat},${lon})`;
  return `[out:json][timeout:60];(way["highway"]${a};way["building"]${a};way["leisure"~"park|garden|pitch|playground|recreation_ground|sports_centre|stadium"]${a};way["landuse"~"grass|recreation_ground|village_green|forest"]${a};node["amenity"]${a};node["shop"]${a};node["tourism"]${a};node["highway"~"traffic_signals|crossing"]${a};);out body;>;out skel qt;`;
}

const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };

export function convertOverpass(data, o) {
  const proj = makeProjection(o.lat, o.lon), r1 = v => Math.round(v * 10) / 10;
  const nodes = new Map();
  for (const el of data.elements || []) if (el.type === 'node') {
    const prev = nodes.get(el.id);
    nodes.set(el.id, { lat: el.lat, lon: el.lon, tags: el.tags || (prev && prev.tags) || null });
  }
  const loc = id => { const n = nodes.get(id); if (!n) return null; const p = proj.toLocal(n.lat, n.lon); return [r1(p.x), r1(p.z)]; };
  const roads = [], buildings = [], parks = [], pois = [], signals = [];

  for (const el of data.elements || []) {
    if (el.type === 'way' && el.tags) {
      const t = el.tags, ids = [], pts = [];
      for (const id of el.nodes || []) { const p = loc(id); if (p) { ids.push(id); pts.push(p); } }
      if (t.highway && !SKIP_HW.has(t.highway)) {
        if (pts.length >= 2) roads.push({
          id: el.id, n: ids, p: pts, hw: t.highway, name: t.name || t.ref || '',
          lanes: num(t.lanes) || 0, oneway: t.oneway === 'yes' || t.oneway === '-1',
          br: !!t.bridge && t.bridge !== 'no', tun: !!t.tunnel && t.tunnel !== 'no',
          layer: Math.round(num(t.layer) || 0), speed: t.maxspeed || '', surf: t.surface || ''
        });
      } else if (t.building) {
        const closed = ids.length >= 4 && ids[0] === ids[ids.length - 1];
        if (closed) buildings.push({ id: el.id, p: pts.slice(0, -1), h: num(t.height) || (num(t['building:levels']) ? num(t['building:levels']) * 3.2 : 0), kind: t.building, name: t.name || '' });
      } else if (PARK_LEISURE.has(t.leisure) || PARK_LANDUSE.has(t.landuse)) {
        if (ids.length >= 4 && ids[0] === ids[ids.length - 1]) parks.push({ id: el.id, p: pts.slice(0, -1), name: t.name || '' });
      }
    } else if (el.type === 'node' && el.tags) {
      const t = el.tags, p = loc(el.id); if (!p) continue;
      if (t.highway === 'traffic_signals' || t.highway === 'crossing') signals.push({ x: p[0], z: p[1], t: t.highway === 'crossing' ? 'crossing' : 'signal' });
      const type = t.amenity || t.shop || t.tourism;
      if (type && !MINOR.has(type) && (t.name || ['hospital', 'police', 'fuel', 'bank', 'atm', 'school', 'pharmacy', 'place_of_worship'].includes(type))) {
        if (Math.hypot(p[0], p[1]) <= o.radius * 1.05) pois.push({ name: t.name || type, type, x: p[0], z: p[1] });
      }
    }
  }
  return {
    meta: {
      id: o.id, name: o.name, source: 'OpenStreetMap contributors', license: 'ODbL 1.0', licenseUrl: 'https://www.openstreetmap.org/copyright',
      attribution: '© OpenStreetMap contributors', fetchedAt: new Date().toISOString(),
      center: { lat: o.lat, lon: o.lon }, projection: { type: 'local-equirectangular', lat0: o.lat, lon0: o.lon }, extent: o.radius,
      notes: ['Geometry is as mapped in OpenStreetMap and may be incomplete or out of date.', 'Building heights are estimated where OSM has no height or levels.', 'Multipolygon (complex) buildings are skipped.', 'Not all OSM data is verified on the ground.'],
      counts: { roads: roads.length, buildings: buildings.length, parks: parks.length, pois: pois.length, signals: signals.length, bridges: roads.filter(r => r.br).length }
    },
    roads, buildings, parks, pois: pois.slice(0, 300), signals
  };
    }
      
