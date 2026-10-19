// Collision for the character (circle) and camera (point) against boxes and building footprints.
function closestOnPoly(pts, x, z) {
  let best = Infinity, bx = 0, bz = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz;
    let t = l2 > 0 ? ((x - a[0]) * dx + (z - a[1]) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = a[0] + dx * t, qz = a[1] + dz * t, d2 = (x - qx) ** 2 + (z - qz) ** 2;
    if (d2 < best) { best = d2; bx = qx; bz = qz; }
  }
  return { d2: best, qx: bx, qz: bz };
}
function inPoly(pts, x, z) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], zi = pts[i][1], xj = pts[j][0], zj = pts[j][1];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export class Collision {
  constructor(bounds) { this.items = []; this.bounds = bounds; }
  addBox(x, z, w, d, h) { this.items.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, h, poly: null }); }
  addPoly(pts, h) {
    let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
    for (const p of pts) { if (p[0] < a) a = p[0]; if (p[0] > b) b = p[0]; if (p[1] < c) c = p[1]; if (p[1] > d) d = p[1]; }
    this.items.push({ minX: a, maxX: b, minZ: c, maxZ: d, h, poly: pts });
  }
  resolve(p, r) {
    for (let pass = 0; pass < 2; pass++) for (const it of this.items) {
      if (p.x < it.minX - r || p.x > it.maxX + r || p.z < it.minZ - r || p.z > it.maxZ + r) continue;
      if (it.poly) this._poly(p, r, it.poly); else this._box(p, r, it);
    }
    const B = this.bounds; p.x = Math.max(-B, Math.min(B, p.x)); p.z = Math.max(-B, Math.min(B, p.z));
  }
  _box(p, r, b) {
    const cx = Math.max(b.minX, Math.min(p.x, b.maxX)), cz = Math.max(b.minZ, Math.min(p.z, b.maxZ));
    const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) return;
    if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; p.x += dx * k; p.z += dz * k; return; }
    const l = p.x - b.minX, rr = b.maxX - p.x, t = p.z - b.minZ, bt = b.maxZ - p.z, mn = Math.min(l, rr, t, bt);
    if (mn === l) p.x = b.minX - r; else if (mn === rr) p.x = b.maxX + r; else if (mn === t) p.z = b.minZ - r; else p.z = b.maxZ + r;
  }
  _poly(p, r, pts) {
    const c = closestOnPoly(pts, p.x, p.z), d = Math.sqrt(c.d2);
    const inside = inPoly(pts, p.x, p.z);
    if (!inside && d >= r) return;
    let ux, uz;
    if (inside) { ux = c.qx - p.x; uz = c.qz - p.z; const l = Math.hypot(ux, uz) || 1; ux /= l; uz /= l; p.x = c.qx + ux * r; p.z = c.qz + uz * r; }
    else { ux = (p.x - c.qx) / d; uz = (p.z - c.qz) / d; p.x = c.qx + ux * r; p.z = c.qz + uz * r; }
  }
  pointInside(x, y, z, m) {
    for (const it of this.items) {
      if (y >= it.h || x < it.minX - m || x > it.maxX + m || z < it.minZ - m || z > it.maxZ + m) continue;
      if (!it.poly) return true;
      if (inPoly(it.poly, x, z) || closestOnPoly(it.poly, x, z).d2 < m * m) return true;
    }
    return false;
  }
  }
    
