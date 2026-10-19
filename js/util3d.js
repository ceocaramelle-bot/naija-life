import * as THREE from 'three';

export function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; }
export function rng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function makeLabel(text, w = 9) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(7,43,30,.8)'; g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#fff'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text.slice(0, 22), 128, 33);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(w, w / 4, 1); return s;
}

export function setupSky(scene, fogNear, fogFar) {
  scene.background = new THREE.Color(0x9ecdf0);
  scene.fog = new THREE.Fog(0x9ecdf0, fogNear, fogFar);
  scene.add(new THREE.HemisphereLight(0xdfefff, 0x6b7a4a, 0.95));
  const sun = new THREE.DirectionalLight(0xfff1d0, 1.1); sun.position.set(80, 120, 40); scene.add(sun);
}

export function flatPlane(scene, w, d, color, y) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ color }));
  m.rotation.x = -Math.PI / 2; m.position.y = y; scene.add(m); return m;
}

// A small blocky kiosk with a name label. Returns nothing; caller adds the collider.
export function addKiosk(scene, x, z, color, name, withScreen) {
  const k = new THREE.Mesh(new THREE.BoxGeometry(3, 3.2, 3), new THREE.MeshLambertMaterial({ color }));
  k.position.set(x, 1.6, z); scene.add(k);
  if (withScreen) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.1), new THREE.MeshBasicMaterial({ color: 0x66ff99 })); s.position.set(x, 1.9, z + 1.55); scene.add(s); }
  const l = makeLabel(name, 7); l.position.set(x, 5, z); scene.add(l);
    }
