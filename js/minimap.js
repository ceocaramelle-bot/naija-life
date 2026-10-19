// Map drawing. The static map (roads, buildings, parks, POIs) is painted ONCE into an offscreen canvas
// by prepareMap(), then blitted every frame. Live items (player, route, destination) are drawn on top.
export function prepareMap(map) {
  const ext = map.extent, ppm = Math.min(2, 2048 / (2 * ext)), size = Math.ceil(2 * ext * ppm);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#3d5f33'; g.fillRect(0, 0, size, size);
  g.setTransform(ppm, 0, 0, ppm, ext * ppm, ext * ppm);   // draw in metres
  const poly = (pts, fill) => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fillStyle = fill; g.fill(); };
  for (const p of map.parks) poly(p.p, '#4f8f3f');
  const roads = map.roads.filter(r => !r.tun).sort((a, b) => a.rank - b.rank);
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const pass of [0, 1]) for (const r of roads) {
    if (pass === 0 && r.rank < 1) { /* footpaths drawn in pass 1 on top of nothing */ }
    g.beginPath(); r.p.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
    if (pass === 0) { g.lineWidth = r.w + 4; g.strokeStyle = r.rank === 0 ? 'rgba(0,0,0,0)' : '#b9b9ae'; }
    else { g.lineWidth = Math.max(r.w, 1.6); g.strokeStyle = r.rank === 0 ? '#d8cfb4' : r.br ? '#5a5a66' : '#3a3a40'; }
    g.stroke();
  }
  for (const b of map.buildings) poly(b.p, b.c);
  g.fillStyle = '#ffffff';
  for (const s of map.signals) { g.beginPath(); g.arc(s.x, s.z, s.t === 'signal' ? 2.2 : 1.2, 0, 7); g.fillStyle = s.t === 'signal' ? '#ff5a4d' : '#ffffff'; g.fill(); }
  g.fillStyle = '#4db6ff';
  for (const p of map.pois) { g.beginPath(); g.arc(p.x, p.z, 3, 0, 7); g.fill(); }
  map.cache = { canvas: c, ppm, ext };
}

// canvas: target; (cx,cz) world point at centre; s = screen pixels per metre.
export function drawMap(canvas, cx, cz, s, player, full, map, route, dest, interactables) {
  const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#2d4a2d'; g.fillRect(0, 0, W, H);
  const k = map.cache;
  g.save(); g.translate(W / 2 - cx * s, H / 2 - cz * s); g.scale(s / k.ppm, s / k.ppm); g.drawImage(k.canvas, -k.ext * k.ppm, -k.ext * k.ppm); g.restore();
  const X = x => W / 2 + (x - cx) * s, Y = z => H / 2 + (z - cz) * s;

  g.fillStyle = '#ffd34d';
  for (const it of interactables || []) { g.beginPath(); g.arc(X(it.x), Y(it.z), 4, 0, 7); g.fill(); }

  if (route && route.length > 1) {
    g.beginPath(); route.forEach((q, i) => i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1])));
    g.lineWidth = full ? 5 : 4; g.strokeStyle = '#00d4ff'; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke();
  }
  if (dest) { g.fillStyle = '#ff3b30'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(X(dest.x), Y(dest.z), 7, 0, 7); g.fill(); g.stroke(); }

  if (full) {
    g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = 3;
    for (const l of map.labels) { const x = X(l.x), y = Y(l.z); if (x < 0 || y < 0 || x > W || y > H) continue; g.strokeText(l.text, x, y); g.fillText(l.text, x, y); }
  }
  const dx = Math.sin(player.heading), dz = Math.cos(player.heading);
  g.save(); g.translate(X(player.x), Y(player.z)); g.rotate(Math.atan2(dx, -dz));
  g.fillStyle = '#ff3b30'; g.strokeStyle = '#fff'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 7); g.lineTo(0, 3); g.lineTo(-6, 7); g.closePath(); g.fill(); g.stroke(); g.restore();
  if (!full) { g.fillStyle = '#fff'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText('N', W / 2, 14); }
}
