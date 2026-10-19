import * as THREE from 'three';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { Controls } from './controls.js';
import { prepareMap, drawMap } from './minimap.js';
import { Store, formatNaira } from './storage.js';

window.__naijaBooted = true;
const $ = id => document.getElementById(id);
const SUYA_PRICE = 1500;
const state = { started: false, panelOpen: false, mapOpen: false };
let renderer, scene, camera, world, player, controls, store, nearIt = null;
let camYaw = Math.PI, camPitch = 0.35, camDist = 7, orbit = 0, last = 0, frameN = 0;
let route = null, dest = null, beacon = null, mapView = { cx: 0, cz: 0, s: 1, fit: 1 };

function showError(title, msg) { $('errTitle').textContent = title; $('errMsg').textContent = msg; $('error').hidden = false; }
window.addEventListener('error', e => { if (!state.started) showError('Something went wrong', e.message || 'Unknown error'); console.error(e.error || e.message); });
window.addEventListener('unhandledrejection', e => { showError('Something went wrong', String((e.reason && e.reason.message) || e.reason)); });

const nextFrame = () => new Promise(r => requestAnimationFrame(r));
function setLoading(t) { $('loadMsg').textContent = t; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
let toastTimer = 0;
function toast(t) { const el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.hidden = true, 2600); }
function updateWallet() { $('walletAmt').textContent = formatNaira(store.data.wallet.balance); }

async function loadGeo(entry) {
  if (!entry || !entry.dataFile) return { geo: null, note: 'Using the hand-built test district.' };
  try {
    const res = await fetch(entry.dataFile, { cache: 'no-cache' });
    if (!res.ok) return { geo: null, note: 'Map data file not found (' + entry.dataFile + '). Using the hand-built test district.' };
    const g = await res.json();
    if (!g.meta || !Array.isArray(g.roads) || !Array.isArray(g.buildings) || !g.meta.extent) throw new Error('missing fields');
    return { geo: g, note: '' };
  } catch (e) { return { geo: null, note: 'Map data file could not be read (' + e.message + '). Using the hand-built test district.' }; }
}

async function init() {
  setLoading('Checking your device…');
  try { renderer = new THREE.WebGLRenderer({ canvas: $('game'), antialias: false, powerPreference: 'high-performance' }); }
  catch (e) { throw new Error('3D graphics (WebGL) are not available on this browser or device.'); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.3, 2500);

  setLoading('Loading world list…');
  let registry;
  try {
    const res = await fetch('data/worlds.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    registry = await res.json();
  } catch (e) { throw new Error('Could not load data/worlds.json (' + e.message + '). Check the file exists in your repository.'); }
  const list = $('worldList');
  for (const w of registry.worlds) {
    const li = document.createElement('li');
    li.textContent = w.name + (w.status === 'playable' ? ' - playable' : w.status === 'in_development' ? ' - in development' : ' - planned');
    if (w.status === 'playable') li.className = 'live';
    list.appendChild(li);
  }

  setLoading('Loading your save…');
  store = new Store();
  const how = store.load();
  if (store.notice) toast(store.notice);
  updateWallet();

  setLoading('Loading map data…');
  const { geo, note } = await loadGeo(registry.worlds.find(w => w.status === 'playable'));
  await nextFrame();

  setLoading('Building the world…');
  world = buildWorld(scene, geo);
  prepareMap(world.mapData);
  $('attrib').textContent = world.attribution ? 'Map data ' + world.attribution : 'Hand-built test district. Not real map data.';
  if (world.stats) setLoading('Loaded OpenStreetMap data: ' + world.stats.roads + ' roads, ' + world.stats.buildings + ' buildings, ' + world.stats.bridges + ' bridges.');
  else if (note) toast(note);

  player = new Player(store.data.appearance);
  const sp = store.data.player;
  const savedWorld = sp && (sp.worldId || 'abuja-test');
  if (sp && savedWorld === world.id && Number.isFinite(sp.x) && Number.isFinite(sp.z)) { player.setPosition(sp.x, sp.z); camYaw = Number.isFinite(sp.camYaw) ? sp.camYaw : Math.PI; }
  else { player.setPosition(world.spawn.x, world.spawn.z); camYaw = world.spawn.camYaw; }
  world.resolve(player.pos, player.radius);
  scene.add(player.group);

  beacon = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 80, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }));
  beacon.visible = false; scene.add(beacon);

  controls = new Controls({
    stickZone: $('stickZone'), stickBase: $('stickBase'), stickKnob: $('stickKnob'), lookZone: $('lookZone'),
    btnRun: $('btnRun'), btnAct: $('btnAct'), btnMap: $('btnMap'), btnMenu: $('btnMenu'), mini: $('mini')
  });
  controls.sens = 0.005 * (store.data.settings.sens || 1);
  setupMapUi();

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 250));
  document.addEventListener('visibilitychange', () => { if (document.hidden) savePos(); });
  window.addEventListener('pagehide', savePos);
  setInterval(savePos, 5000);
  setInterval(tickClock, 1000); tickClock();
  $('panelClose').onclick = closePanel;
  $('mapClose').onclick = closeMap;

  if (!world.stats) setLoading(how === 'new' ? 'Ready. Your ₦100,000 starting money is in your wallet.' : 'Ready. Welcome back.');
  const play = $('playBtn'); play.disabled = false; play.textContent = 'Play';
  play.onclick = startGame;
  requestAnimationFrame(loop);
}

function tickClock() {
  try { $('clock').textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' }).format(new Date()) + ' WAT'; }
  catch (e) { $('clock').textContent = ''; }
}

async function startGame() {
  try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch (e) {}
  try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) {}
  $('start').hidden = true; $('hud').hidden = false; state.started = true; onResize();
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  if (state.mapOpen) sizeBigMap();
}

function savePos() {
  if (!store || !store.data || !player) return;
  store.data.player = { worldId: world.id, x: +player.pos.x.toFixed(2), z: +player.pos.z.toFixed(2), camYaw: +camYaw.toFixed(3) };
  store.save();
}

// ---- Panels ----
function historyRows() {
  const rows = store.data.transactions.slice(0, 8).map(t =>
    '<tr><td>' + esc(t.desc) + '</td><td class="amt ' + (t.amount >= 0 ? 'pos' : 'neg') + '">' + (t.amount >= 0 ? '+' : '') + formatNaira(t.amount) + '</td></tr>').join('');
  return rows || '<tr><td>No transactions yet.</td></tr>';
}
function openPanel(title, html) { $('panelTitle').textContent = title; $('panelBody').innerHTML = html; $('panel').hidden = false; state.panelOpen = true; controls.reset(); }
function closePanel() { $('panel').hidden = true; state.panelOpen = false; savePos(); }
function walletHtml() {
  return '<h3>Balance</h3><div style="font-size:26px;font-weight:700;color:#f2b632">' + formatNaira(store.data.wallet.balance) + '</div>' +
    '<p class="small">Virtual game money only. It has no real-world value.</p>' +
    '<h3>Recent transactions</h3><table>' + historyRows() + '</table>' +
    '<h3>Inventory</h3><div>Suya: ' + (store.data.inventory.suya || 0) + '</div>';
}
function openATM() { openPanel('Bank ATM', walletHtml() + '<p class="small">Deposits, transfers and bills are planned for Phase 4.</p>'); }
function openMenu() {
  openPanel('Menu', walletHtml() +
    '<h3>Camera sensitivity</h3><input id="sensRange" type="range" min="0.4" max="2.5" step="0.1" value="' + (store.data.settings.sens || 1) + '">' +
    '<h3>Save</h3><p class="small">' + (store.persistent ? 'Progress is saved on this device only.' : 'Saving is blocked in this browser; progress will be lost when you close the page.') + '</p>' +
    '<h3>About this map</h3><p class="small">' + esc($('attrib').textContent) + '</p>' +
    '<button id="wipeBtn" class="danger">Delete save on this device</button>');
  $('sensRange').oninput = e => { const v = parseFloat(e.target.value); store.data.settings.sens = v; controls.sens = 0.005 * v; store.save(); };
  $('wipeBtn').onclick = () => { if (confirm('Delete your local save? You will start a new game on this device.')) { store.wipe(); location.reload(); } };
}

// ---- Full map: drag to pan, +/- to zoom, tap to set a destination ----
function sizeBigMap() {
  const c = $('big'); const s = Math.floor(Math.min(window.innerWidth * 0.9, window.innerHeight - 70)); c.width = s; c.height = s;
  mapView.fit = s / (2 * world.mapData.extent * 1.02);
}
function openMap() {
  $('fullmap').hidden = false; state.mapOpen = true; controls.reset(); sizeBigMap();
  mapView.s = Math.max(mapView.fit, 0.5 * Math.min(1, 1)); mapView.s = Math.min(Math.max(mapView.fit * 1.6, mapView.fit), 6);
  mapView.cx = player.pos.x; mapView.cz = player.pos.z;
}
function closeMap() { $('fullmap').hidden = true; state.mapOpen = false; }
function routeLength(r) { let L = 0; for (let i = 1; i < r.length; i++) L += Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]); return L; }
function setDestination(wx, wz) {
  if (!world.graph) { toast('Routes need real map data. Add the Abuja data file (see README).'); return; }
  const r = world.graph.route(player.pos.x, player.pos.z, wx, wz);
  if (!r) { toast('No road route found to that spot.'); return; }
  route = r; dest = { x: wx, z: wz }; beacon.position.set(wx, 40, wz); beacon.visible = true;
  toast('Route set: ' + Math.round(routeLength(r)) + ' m along roads');
}
function clearRoute() { route = null; dest = null; if (beacon) beacon.visible = false; }
function setupMapUi() {
  const big = $('big'); let drag = null;
  big.addEventListener('pointerdown', e => { big.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId }; });
  big.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const k = big.width / big.getBoundingClientRect().width, dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k;
    drag.moved += Math.abs(dx) + Math.abs(dy); mapView.cx -= dx / mapView.s; mapView.cz -= dy / mapView.s; drag.x = e.clientX; drag.y = e.clientY;
  });
  big.addEventListener('pointerup', e => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.moved < 8) { const r = big.getBoundingClientRect(), k = big.width / r.width; setDestination(mapView.cx + ((e.clientX - r.left) * k - big.width / 2) / mapView.s, mapView.cz + ((e.clientY - r.top) * k - big.height / 2) / mapView.s); }
    drag = null;
  });
  big.addEventListener('pointercancel', () => { drag = null; });
  $('mapIn').onclick = () => { mapView.s = Math.min(8, mapView.s * 1.5); };
  $('mapOut').onclick = () => { mapView.s = Math.max(mapView.fit * 0.8, mapView.s / 1.5); };
  $('mapClear').onclick = clearRoute;
}

// ---- Interaction ----
function doInteract(it) {
  if (it.id === 'suya') {
    const r = store.spend(SUYA_PRICE, 'Suya Spot - 1 suya');
    if (!r.ok) { toast(r.reason); return; }
    store.data.inventory.suya = (store.data.inventory.suya || 0) + 1; store.save(); updateWallet();
    toast('Bought suya for ' + formatNaira(SUYA_PRICE));
  } else if (it.id === 'atm') openATM();
}

// ---- Camera ----
function updateCamera(dt) {
  const look = controls.consumeLook();
  camYaw -= look.x; camPitch = Math.max(-0.1, Math.min(1.2, camPitch + look.y));
  const tx = player.pos.x, ty = 1.6, tz = player.pos.z;
  const ox = Math.sin(camYaw) * Math.cos(camPitch), oy = Math.sin(camPitch), oz = Math.cos(camYaw) * Math.cos(camPitch);
  let lim = camDist;
  for (let i = 1; i <= 16; i++) {
    const d = camDist * i / 16;
    if (world.pointInside(tx + ox * d, Math.max(0.3, ty + oy * d), tz + oz * d, 0.4)) { lim = Math.max(1.2, camDist * (i - 1) / 16); break; }
  }
  camera.userData.d = camera.userData.d === undefined ? lim : camera.userData.d + (lim - camera.userData.d) * Math.min(1, dt * (lim < camera.userData.d ? 25 : 6));
  const d = camera.userData.d;
  camera.position.set(tx + ox * d, Math.max(0.4, ty + oy * d), tz + oz * d);
  camera.lookAt(tx, ty, tz);
}

// ---- Main loop ----
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
  if (!state.started) {
    orbit += dt * 0.12;
    const sx = world.spawn.x, sz = world.spawn.z;
    camera.position.set(sx + Math.sin(orbit) * 55, 22, sz + Math.cos(orbit) * 55); camera.lookAt(sx, 6, sz);
    renderer.render(scene, camera); return;
  }
  const portrait = window.matchMedia('(orientation: portrait)').matches;
  const paused = portrait || document.hidden || state.panelOpen || state.mapOpen;
  if (controls.consumeMenu()) { if (state.mapOpen) closeMap(); else if (state.panelOpen) closePanel(); else openMenu(); }
  if (controls.consumeMap()) { if (state.mapOpen) closeMap(); else if (!state.panelOpen) openMap(); }

  if (!paused) {
    const mv = controls.getMove();
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
    const f = -mv.y, s = mv.x;
    player.update(dt, fx * f + rx * s, fz * f + rz * s, controls.run, world);

    nearIt = null; let best = 1e9;
    for (const it of world.interactables) { const d = Math.hypot(it.x - player.pos.x, it.z - player.pos.z); if (d < it.r && d < best) { best = d; nearIt = it; } }
    const pr = $('prompt');
    if (nearIt) { pr.hidden = false; pr.textContent = nearIt.label + ' - tap Use'; } else pr.hidden = true;
    $('btnAct').classList.toggle('ready', !!nearIt);
    if (controls.consumeInteract() && nearIt) doInteract(nearIt);
    if (dest && Math.hypot(dest.x - player.pos.x, dest.z - player.pos.z) < 10) { toast('You have arrived'); clearRoute(); }
    updateCamera(dt);
  } else { controls.consumeInteract(); }

  const pl = { x: player.pos.x, z: player.pos.z, heading: player.heading };
  if (++frameN % 3 === 0 && !state.mapOpen) drawMap($('mini'), pl.x, pl.z, 170 / 110, pl, false, world.mapData, route, dest, world.interactables);
  if (state.mapOpen) drawMap($('big'), mapView.cx, mapView.cz, mapView.s, pl, true, world.mapData, route, dest, world.interactables);
  renderer.render(scene, camera);
}

init().catch(e => { console.error(e); showError('The game could not start', e.message); });
    
