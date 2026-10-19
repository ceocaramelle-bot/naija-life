// Builds the 3D world from a district file made by tools/import.html (OpenStreetMap data).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Collision } from './collision.js';
import { RoadGraph, roadWidth, roadRank } from './roadgraph.js';
import { hash, makeLabel, setupSky, flatPlane, addKiosk } from './util3d.js';

const RANK_COLOR = [0xb8b09a, 0x4a4a50, 0x40404a, 0x3a3a42, 0x36363e, 0x32323a, 0x2e2e36];
const PALETTE = ['#e8d8b8', '#d9c7a6', '#c9b7a1', '#efe3cf', '#cfd8dc', '#bcc8d0', '#e6c9a8', '#d9e3c8', '#f1ece0'];
const IMPORTANT = new Set(['hospital', 'police', 'school', 'university', 'place_of_worship', 'bank', 'fuel', 'restaurant', 'marketplace', 'supermarket', 'mall', 'hotel', 'pharmacy']);

function ribbon(acc, pts, width, ys) {
  const n = pts.length; if (n < 2) return;
  const hw = width / 2, base = acc.pos.length / 3, nx = [], nz = [];
  for (let i = 0; i < n - 1; i++) { const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dz) || 1; nx.push(-dz / l); nz.push(dx / l); }
  for (let i = 0; i < n; i++) {
    let ax, az;
    if (i === 0) { ax = nx[0]; az = nz[0]; }
    else if (i === n - 1) { ax = nx[n - 2]; az = nz[n - 2]; }
    else { ax = nx[i - 1] + nx[i]; az = nz[i - 1] + nz[i]; const l = Math.hypot(ax, az) || 1; ax /= l; az /= l; const k = 1 / Math.max(0.5, ax * nx[i] + az * nz[i]); ax *= k; az *= k; }
    const x = pts[i][0], z = pts[i][1], y = ys[i];
    acc.pos.push(x + ax * hw, y, z + az * hw, x - ax * hw, y, z - az * hw);
  }
  for (let i = 0; i < n - 1; i++) { const a = base + 2 * i; acc.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
}
function accMesh(acc, color, rank, scene) {
  if (!acc.idx.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3)); g.setIndex(acc.idx); g.computeVertexNormals();
  const m = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -rank, polygonOffsetUnits: -rank });
  scene.add(new THREE.Mesh(g, m));
}

export function buildGeoWorld(scene, geo) {
  const ext = geo.meta.extent;
  setupSky(scene, ext * 0.7, ext * 2.2);
  flatPlane(scene, 8000, 8000, 0x6f8f45, -0.05);
  flatPlane(scene, ext * 2 + 60, ext * 2 + 60, 0x7da34f, -0.01);
  const col = new Collision(ext * 0.95);

  // Parks (flat green polygons)
  const pg = [];
  for (const p of geo.parks) {
    if (p.p.length < 3) continue;
    const s = new THREE.Shape(p.p.map(q => new THREE.Vector2(q[0], -q[1])));
    const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.translate(0, 0.02, 0); pg.push(g);
  }
  if (pg.length) scene.add(new THREE.Mesh(mergeGeometries(pg), new THREE.MeshLambertMaterial({ color: 0x4f9a3f, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })));

  // Roads (tunnels are not drawn on the surface). Bridges rise on ramps and have a deck and pillars.
  const accs = RANK_COLOR.map(() => ({ pos: [], idx: [] })), deck = { pos: [], idx: [] }, under = { pos: [], idx: [] }, pillars = [];
  let bridgeCount = 0;
  for (const r of geo.roads) {
    if (r.tun || r.p.length < 2) continue;
    const w = roadWidth(r.hw, r.lanes), rank = roadRank(r.hw);
    if (r.br) {
      bridgeCount++;
      const cum = [0]; for (let i = 1; i < r.p.length; i++) cum.push(cum[i - 1] + Math.hypot(r.p[i][0] - r.p[i - 1][0], r.p[i][1] - r.p[i - 1][1]));
      const L = cum[cum.length - 1], H = 5.5 * Math.max(1, Math.abs(r.layer || 1)), ramp = 45;
      const ys = cum.map(s => 0.06 + H * Math.max(0, Math.min(1, Math.min(s, L - s) / ramp)));
      ribbon(deck, r.p, w, ys); ribbon(under, r.p, w + 0.8, ys.map(y => y - 0.7));
      for (let i = 0; i < r.p.length; i++) if (ys[i] > 2.5 && i % 2 === 0) { const b = new THREE.BoxGeometry(1.2, ys[i] - 0.7, 1.2); b.translate(r.p[i][0], (ys[i] - 0.7) / 2, r.p[i][1]); pillars.push(b); }
    } else ribbon(accs[rank], r.p, w, r.p.map(() => 0.05));
  }
  accs.forEach((a, i) => accMesh(a, RANK_COLOR[i], i, scene));
  accMesh(under, 0x555555, 6, scene); accMesh(deck, 0x4a4a52, 8, scene);
  if (pillars.length) scene.add(new THREE.Mesh(mergeGeometries(pillars), new THREE.MeshLambertMaterial({ color: 0x9a9a9a })));

  // Buildings: the nearest 1200 footprints, extruded, merged into one mesh.
  const bl = geo.buildings.filter(b => b.p.length >= 3).map(b => ({ b, d: Math.hypot(b.p[0][0], b.p[0][1]) })).sort((a, c) => a.d - c.d).slice(0, 1200).map(o => o.b);
  const bgs = [], tmp = new THREE.Color();
  for (const b of bl) {
    const kind = b.kind || 'yes';
    let h = b.h || (kind === 'apartments' ? 16 : /commercial|retail|office|hotel|hospital|university/.test(kind) ? 12 : /industrial|warehouse/.test(kind) ? 8 : /house|detached|residential|bungalow/.test(kind) ? 5.5 : 8);
    h = Math.max(3, Math.min(90, h));
    const pts = b.p.filter((q, i, a) => i === 0 || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]);
    if (pts.length < 3) continue;
    let g;
    try { g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(q => new THREE.Vector2(q[0], -q[1]))), { depth: h, bevelEnabled: false }); } catch (e) { continue; }
    g.rotateX(-Math.PI / 2);
    tmp.set(PALETTE[hash(String(b.id)) % PALETTE.length]);
    const nrm = g.attributes.normal, n = nrm.count, cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const roof = nrm.getY(i) > 0.5, k = roof ? 0.55 : 1; cols[i * 3] = tmp.r * k; cols[i * 3 + 1] = tmp.g * k; cols[i * 3 + 2] = tmp.b * k; }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); bgs.push(g);
    col.addPoly(pts, h);
  }
  if (bgs.length) scene.add(new THREE.Mesh(mergeGeometries(bgs), new THREE.MeshLambertMaterial({ vertexColors: true })));

  // Graph, spawn
  const graph = new RoadGraph(geo.roads);
  const sn = graph.nearest(0, 0, true);
  const spawn = { x: 0, z: 0, camYaw: Math.PI };
  if (sn) { spawn.x = sn.x; spawn.z = sn.z; const nb = sn.adj[0]; if (nb) spawn.camYaw = Math.atan2(-(nb.to.x - sn.x), -(nb.to.z - sn.z)); }

  // Two interaction kiosks placed on free ground near the spawn (not on a road, not inside a building)
  const interactables = [], used = [];
  const place = (r0, a0) => {
    for (let r = r0; r <= r0 + 60; r += 3) for (let k = 0; k < 12; k++) {
      const a = a0 + k * Math.PI / 6, x = spawn.x + Math.cos(a) * r, z = spawn.z + Math.sin(a) * r;
      if (Math.abs(x) > ext * 0.9 || Math.abs(z) > ext * 0.9) continue;
      if (col.pointInside(x, 2, z, 3) || graph.clearance(x, z) < 2.5 || used.some(u => Math.hypot(u[0] - x, u[1] - z) < 8)) continue;
      used.push([x, z]); return [x, z];
    }
    return null;
  };
  const sp = place(8, 0), at = place(14, 2.1);
  if (sp) { addKiosk(scene, sp[0], sp[1], 0xe86a33, 'Suya Spot', false); col.addBox(sp[0], sp[1], 3, 3, 3.2); interactables.push({ id: 'suya', x: sp[0], z: sp[1], r: 4.6, label: 'Buy suya (₦1,500)' }); }
  if (at) { addKiosk(scene, at[0], at[1], 0x1f7a4d, 'Bank ATM', true); col.addBox(at[0], at[1], 3, 3, 3.2); interactables.push({ id: 'atm', x: at[0], z: at[1], r: 4.6, label: 'Use ATM' }); }

  // Labels for the most useful named places (max 20) and a few named roads on the map
  const pois = geo.pois.filter(p => IMPORTANT.has(p.type) && p.name).sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z)).slice(0, 20);
  for (const p of pois) { const l = makeLabel(p.name, 10); l.position.set(p.x, 14, p.z); scene.add(l); }
  const roadLabels = []; const seen = new Set();
  for (const r of geo.roads) if (r.name && !seen.has(r.name) && roadRank(r.hw) >= 2 && r.p.length >= 2) { seen.add(r.name); const m = r.p[r.p.length >> 1]; roadLabels.push({ text: r.name, x: m[0], z: m[1] }); }

  const mapData = {
    extent: ext,
    roads: geo.roads.map(r => ({ p: r.p, w: roadWidth(r.hw, r.lanes), rank: roadRank(r.hw), br: r.br, tun: r.tun, name: r.name })),
    buildings: bl.map(b => ({ p: b.p, c: PALETTE[hash(String(b.id)) % PALETTE.length] })),
    parks: geo.parks.map(p => ({ p: p.p })), pois: geo.pois, signals: geo.signals,
    labels: roadLabels.slice(0, 14).concat(pois.slice(0, 12).map(p => ({ text: p.name, x: p.x, z: p.z })))
  };
  return {
    id: geo.meta.id, collision: col, resolve: (p, r) => col.resolve(p, r), pointInside: (x, y, z, m) => col.pointInside(x, y, z, m),
    interactables, spawn, mapData, graph,
    attribution: geo.meta.attribution + ' (' + geo.meta.license + ')',
    stats: { roads: geo.roads.length, buildings: bl.length, bridges: bridgeCount, pois: geo.pois.length }
  };
}
  
