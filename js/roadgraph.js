// Road widths, draw order, and the road graph used for routing.
const W = { motorway: 14, trunk: 13, primary: 12, secondary: 10, tertiary: 9, unclassified: 7, residential: 7, living_street: 6, service: 5, pedestrian: 5, track: 4, cycleway: 2, footway: 2, steps: 2, path: 1.6 };
const RANK = { motorway: 6, trunk: 6, primary: 5, secondary: 4, tertiary: 3, unclassified: 2, residential: 2, living_street: 2, service: 1, pedestrian: 1, track: 1, cycleway: 0, footway: 0, steps: 0, path: 0 };
const base = hw => String(hw || '').replace('_link', '');
export function roadWidth(hw, lanes) { let w = W[base(hw)] || 6; if (lanes) w = Math.max(w, lanes * 3.4); return Math.min(w, 26); }
export function roadRank(hw) { const r = RANK[base(hw)]; return r === undefined ? 1 : r; }

export class RoadGraph {
  constructor(roads) {
    this.nodes = new Map(); this.segs = [];
    for (const r of roads) {
      const ok = !r.br && !r.tun && !/^(motorway|trunk)/.test(r.hw || '');
      const w = roadWidth(r.hw, r.lanes);
      for (let i = 0; i < r.p.length; i++) {
        const id = r.n[i]; let nd = this.nodes.get(id);
        if (!nd) { nd = { id, x: r.p[i][0], z: r.p[i][1], adj: [], ok: false }; this.nodes.set(id, nd); }
        if (ok) nd.ok = true;
        if (i > 0) {
          const a = this.nodes.get(r.n[i - 1]), d = Math.hypot(nd.x - a.x, nd.z - a.z);
          a.adj.push({ to: nd, d }); nd.adj.push({ to: a, d });
          this.segs.push([a.x, a.z, nd.x, nd.z, w]);
        }
      }
    }
  }
  nearest(x, z, okOnly = true) {
    let best = null, bd = Infinity;
    for (const n of this.nodes.values()) {
      if (okOnly && !n.ok) continue;
      const d = (n.x - x) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; best = n; }
    }
    return best || (okOnly ? this.nearest(x, z, false) : null);
  }
  // Distance from (x,z) to the nearest road EDGE (negative = on a road).
  clearance(x, z) {
    let best = Infinity;
    for (const [ax, az, bx, bz, w] of this.segs) {
      const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
      let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t)) - w / 2; if (d < best) best = d;
    }
    return best;
  }
  // A* over the road network. Returns [[x,z],...] following roads, or null if no connection.
  route(ax, az, bx, bz) {
    const s = this.nearest(ax, az), t = this.nearest(bx, bz);
    if (!s || !t) return null;
    const g = new Map([[s, 0]]), prev = new Map(), closed = new Set(), heap = [[0, s]];
    const h = n => Math.hypot(n.x - t.x, n.z - t.z);
    const push = e => { heap.push(e); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    while (heap.length) {
      const [, n] = pop();
      if (n === t) {
        const path = []; for (let c = t; c; c = prev.get(c)) path.push([c.x, c.z]);
        path.reverse(); path.unshift([ax, az]); path.push([bx, bz]); return path;
      }
      if (closed.has(n)) continue; closed.add(n);
      for (const e of n.adj) {
        const ng = g.get(n) + e.d;
        if (ng < (g.has(e.to) ? g.get(e.to) : Infinity)) { g.set(e.to, ng); prev.set(e.to, n); push([ng + h(e.to), e.to]); }
      }
    }
    return null;
  }
                                  }
        
