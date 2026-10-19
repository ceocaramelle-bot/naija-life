import * as THREE from 'three';
import { LAYOUT } from './layout.js';
import { Collision } from './collision.js';
import { buildGeoWorld } from './geoworld.js';
import { rng, makeLabel, setupSky, flatPlane } from './util3d.js';

const texCache = {};
function baseTex(color) {
  if (texCache[color]) return texCache[color];
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 60, 64, 4);
  for (let i = 0; i < 2; i++) { g.fillStyle = '#2a465f'; g.fillRect(8 + i * 32, 14, 18, 26); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(8 + i * 32, 14, 18, 5); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
  return (texCache[color] = t);
}
function sideMat(color, len, h) {
  const t = baseTex(color).clone(); t.needsUpdate = true;
  t.repeat.set(Math.max(1, Math.round(len / 6)), Math.max(1, Math.round(h / 4)));
  return new THREE.MeshLambertMaterial({ map: t });
}
function roadTex() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#3a3a40'; g.fillRect(0, 0, 16, 64); g.fillStyle = '#e8e8e0'; g.fillRect(7, 0, 2, 32);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const rect = (x, z, w, d) => [[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2]];

// buildWorld(scene, geo): uses real map data when a district file was loaded, otherwise the hand-built Phase 1 test district.
export function buildWorld(scene, geo) {
  if (geo) return buildGeoWorld(scene, geo);
  return buildHandBuilt(scene);
}

function buildHandBuilt(scene) {
  setupSky(scene, 160, 720);
  const col = new Collision(LAYOUT.bounds);
  flatPlane(scene, 3000, 3000, 0x6f8f45, -0.02);
  flatPlane(scene, LAYOUT.size + 10, LAYOUT.size + 10, 0x7da34f, 0);
  for (const p of LAYOUT.parks) { const m = flatPlane(scene, p.w, p.d, 0x4f9a3f, 0.01); m.position.x = p.x; m.position.z = p.z; }

  const rt = roadTex(), sideMatl = new THREE.MeshLambertMaterial({ color: 0xbdbdb4 });
  for (const r of LAYOUT.roads) {
    const len = r.to - r.from;
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(r.width + 5, len).rotateX(-Math.PI / 2), sideMatl);
    const t = rt.clone(); t.needsUpdate = true; t.repeat.set(1, len / 16);
    const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(r.width, len).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: t }));
    sw.position.y = 0.02; asphalt.position.y = r.axis === 'x' ? 0.04 : 0.05;
    if (r.axis === 'x') { sw.rotation.y = asphalt.rotation.y = Math.PI / 2; sw.position.z = asphalt.position.z = r.at; } else { sw.position.x = asphalt.position.x = r.at; }
    scene.add(sw, asphalt);
  }
  const patchMat = new THREE.MeshLambertMaterial({ color: 0x3a3a40 });
  for (const a of LAYOUT.roads.filter(r => r.axis === 'x')) for (const b of LAYOUT.roads.filter(r => r.axis === 'z')) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(b.width, a.width).rotateX(-Math.PI / 2), patchMat); p.position.set(b.at, 0.06, a.at); scene.add(p);
  }

  const roofMat = new THREE.MeshLambertMaterial({ color: 0x55595e }), doorMat = new THREE.MeshLambertMaterial({ color: 0x3b2a20 });
  for (const b of LAYOUT.buildings) {
    const mx = sideMat(b.color, b.d, b.h), mz = sideMat(b.color, b.w, b.h);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), [mx, mx, roofMat, roofMat, mz, mz]);
    mesh.position.set(b.x, b.h / 2, b.z); scene.add(mesh);
    if (b.w >= 5) { const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 0.2), doorMat); door.position.set(b.x, 1.3, b.z + b.d / 2 + 0.05); scene.add(door); }
    if (b.id === 'atm') { const scr = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.1), new THREE.MeshBasicMaterial({ color: 0x66ff99 })); scr.position.set(b.x, 1.9, b.z + b.d / 2 + 0.06); scene.add(scr); }
    if (b.h > 20) { const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 6), roofMat); ant.position.set(b.x, b.h + 3, b.z); scene.add(ant); }
    if (b.label) { const s = makeLabel(b.name); s.position.set(b.x, b.h + 2.8, b.z); scene.add(s); }
    col.addBox(b.x, b.z, b.w, b.d, b.h);
  }

  const m = LAYOUT.landmark, cream = new THREE.MeshLambertMaterial({ color: 0xe9dcc0 }), gold = new THREE.MeshLambertMaterial({ color: 0xe0a82e });
  const base = new THREE.Mesh(new THREE.BoxGeometry(26, 10, 26), cream); base.position.set(m.x, 5, m.z); scene.add(base);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(8, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), gold); dome.position.set(m.x, 10, m.z); scene.add(dome);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const mx = m.x + sx * 14, mz = m.z + sz * 14;
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 34, 10), cream); tower.position.set(mx, 17, mz); scene.add(tower);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.5, 5, 10), gold); cap.position.set(mx, 36.5, mz); scene.add(cap);
  }
  col.addBox(m.x, m.z, m.size, m.size, 36);
  const ms = makeLabel('National Mosque'); ms.position.set(m.x, 44, m.z); scene.add(ms);

  const hill = new THREE.Mesh(new THREE.SphereGeometry(300, 18, 12), new THREE.MeshLambertMaterial({ color: 0x8a7f6e }));
  hill.scale.y = 0.55; hill.position.set(-300, -40, -520); scene.add(hill);

  const r = rng(7), spots = [];
  for (let x = -140; x <= 140; x += 14) { if (Math.abs(x) < 14 || Math.abs(x - 80) < 14) continue; spots.push([x, -10.2], [x, 10.2]); }
  for (let z = -140; z <= 140; z += 14) { if (Math.abs(z) < 14 || Math.abs(z + 80) < 14) continue; spots.push([-9.2, z], [9.2, z]); }
  for (const p of LAYOUT.parks) for (let i = 0; i < 14; i++) spots.push([p.x + (r() - 0.5) * (p.w - 6), p.z + (r() - 0.5) * (p.d - 6)]);
  const trunks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 2.2, 0.5), new THREE.MeshLambertMaterial({ color: 0x6b4a2a }), spots.length);
  const leaves = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 2.2, 2.4), new THREE.MeshLambertMaterial({ color: 0x2f7d32 }), spots.length);
  const mat = new THREE.Matrix4();
  spots.forEach(([x, z], i) => { mat.makeTranslation(x, 1.1, z); trunks.setMatrixAt(i, mat); mat.makeTranslation(x, 3.3, z); leaves.setMatrixAt(i, mat); col.addBox(x, z, 0.8, 0.8, 5); });
  scene.add(trunks, leaves);

  const mapData = {
    extent: LAYOUT.size / 2 + 5,
    roads: LAYOUT.roads.map(r => ({ p: r.axis === 'x' ? [[r.from, r.at], [r.to, r.at]] : [[r.at, r.from], [r.at, r.to]], w: r.width, rank: r.width > 11 ? 4 : 3, name: r.name })),
    buildings: LAYOUT.buildings.map(b => ({ p: rect(b.x, b.z, b.w, b.d), c: b.color })).concat([{ p: rect(m.x, m.z, m.size, m.size), c: '#e9dcc0' }]),
    parks: LAYOUT.parks.map(p => ({ p: rect(p.x, p.z, p.w, p.d) })),
    pois: LAYOUT.buildings.filter(b => b.label).map(b => ({ name: b.name, type: b.kind, x: b.x, z: b.z })), signals: [],
    labels: LAYOUT.roads.map(r => r.axis === 'x' ? { text: r.name, x: r.from + 40, z: r.at + 1.5 } : { text: r.name, x: r.at, z: r.from + 20 })
      .concat(LAYOUT.buildings.filter(b => b.label).map(b => ({ text: b.name, x: b.x, z: b.z })), LAYOUT.parks.map(p => ({ text: p.name, x: p.x, z: p.z })), [{ text: m.name, x: m.x, z: m.z + m.size / 2 + 6 }])
  };
  return {
    id: 'abuja-test', collision: col, resolve: (p, rad) => col.resolve(p, rad), pointInside: (x, y, z, mg) => col.pointInside(x, y, z, mg),
    interactables: LAYOUT.interactables, spawn: LAYOUT.spawn, mapData, graph: null,
    attribution: '', stats: null
  };
      }
