// Geometry utilities. All world units are centimeters.

export const EPS = 0.5; // endpoint merge tolerance (cm)

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/** Distance from point P to segment AB, plus the parametric t of the closest point. */
export function pointSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = clamp(t, 0, 1);
  const cx = ax + dx * t, cy = ay + dy * t;
  return { d: Math.hypot(px - cx, py - cy), t, x: cx, y: cy };
}

export function wallLength(w) {
  return dist(w.ax, w.ay, w.bx, w.by);
}

/** If walls A and B are collinear and genuinely OVERLAP (share a real segment,
 *  not merely touch at a corner), return the union segment {ax,ay,bx,by} that
 *  covers both — used to weld snapped-together shared walls into one. Else null.
 *  `perpTol` = how far off the shared line B may sit; `minOverlap` = the least
 *  shared length (cm) that counts as "the same wall". */
export function collinearOverlapUnion(A, B, perpTol = 2, minOverlap = 10) {
  const adx = A.bx - A.ax, ady = A.by - A.ay;
  const alen = Math.hypot(adx, ady);
  const blen = Math.hypot(B.bx - B.ax, B.by - B.ay);
  if (alen < 1 || blen < 1) return null;
  const ux = adx / alen, uy = ady / alen;
  // B's endpoints must lie on A's infinite line
  const perp = (px, py) => Math.abs((px - A.ax) * -uy + (py - A.ay) * ux);
  if (perp(B.ax, B.ay) > perpTol || perp(B.bx, B.by) > perpTol) return null;
  const proj = (px, py) => (px - A.ax) * ux + (py - A.ay) * uy;
  const tb0 = proj(B.ax, B.ay), tb1 = proj(B.bx, B.by);
  const tbLo = Math.min(tb0, tb1), tbHi = Math.max(tb0, tb1);
  // shared span between [0, alen] and [tbLo, tbHi]
  const oLo = Math.max(0, tbLo), oHi = Math.min(alen, tbHi);
  if (oHi - oLo < minOverlap) return null; // just touching / negligible — keep both
  const lo = Math.min(0, tbLo), hi = Math.max(alen, tbHi);
  return { ax: A.ax + ux * lo, ay: A.ay + uy * lo, bx: A.ax + ux * hi, by: A.ay + uy * hi };
}

/** Parametric intersection of segments AB (w) and CD (o). Returns {t, u} where
 *  t is along w and u along o, or null when parallel/collinear. Interior
 *  crossings have both t and u strictly between 0 and 1. */
export function segSegIntersect(w, o) {
  const r1x = w.bx - w.ax, r1y = w.by - w.ay;
  const r2x = o.bx - o.ax, r2y = o.by - o.ay;
  const denom = r1x * r2y - r1y * r2x;
  if (Math.abs(denom) < 1e-9) return null; // parallel or collinear
  const dx = o.ax - w.ax, dy = o.ay - w.ay;
  const t = (dx * r2y - dy * r2x) / denom;
  const u = (dx * r1y - dy * r1x) / denom;
  return { t, u };
}

export function wallAngle(w) {
  return Math.atan2(w.by - w.ay, w.bx - w.ax);
}

/** Point at parametric t along a wall. */
export function wallPoint(w, t) {
  return { x: lerp(w.ax, w.bx, t), y: lerp(w.ay, w.by, t) };
}

/** Signed area of polygon (array of {x,y}). Positive = counter-clockwise in y-up. */
export function polygonArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

export function polygonCentroid(pts) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const cross = p.x * q.y - q.x * p.y;
    a += cross;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  a /= 2;
  if (Math.abs(a) < 1e-9) {
    // degenerate: average the points
    let sx = 0, sy = 0;
    for (const p of pts) { sx += p.x; sy += p.y; }
    return { x: sx / pts.length, y: sy / pts.length };
  }
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

export function pointInPolygon(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Test whether point is inside the rotated rectangle of a placed item. */
export function pointInItemRect(px, py, item, w, d) {
  const cos = Math.cos(-item.rotation), sin = Math.sin(-item.rotation);
  const dx = px - item.x, dy = py - item.y;
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;
  return Math.abs(lx) <= w / 2 && Math.abs(ly) <= d / 2;
}

function nodeKey(x, y) {
  return `${Math.round(x / EPS)}_${Math.round(y / EPS)}`;
}

/**
 * Detect enclosed rooms from the wall graph using planar face tracing.
 * Returns array of { polygon: [{x,y}], area (cm^2), centroid, wallIds:Set }.
 */
export function detectRooms(walls) {
  // 0. Split walls at T-junctions: an endpoint of one wall lying in the
  //    interior of another must become a shared graph node, or interior
  //    partitions never subdivide the outer shell into rooms.
  const segments = [];
  for (const w of walls) {
    if (wallLength(w) < EPS * 2) continue;
    const cuts = [0, 1];
    for (const o of walls) {
      if (o === w) continue;
      for (const [px, py] of [[o.ax, o.ay], [o.bx, o.by]]) {
        const r = pointSegDist(px, py, w.ax, w.ay, w.bx, w.by);
        if (r.d < EPS * 3 && r.t > 0.001 && r.t < 0.999) cuts.push(r.t);
      }
      // X-crossing: two walls crossing in their interiors (from rooms that
      // overlap) must share a graph node too — otherwise the tracer emits two
      // overlapping faces and their floors z-fight
      const ix = segSegIntersect(w, o);
      if (ix && ix.t > 0.001 && ix.t < 0.999 && ix.u > 0.001 && ix.u < 0.999) cuts.push(ix.t);
    }
    cuts.sort((a, b) => a - b);
    for (let i = 0; i < cuts.length - 1; i++) {
      if (cuts[i + 1] - cuts[i] < 1e-4) continue;
      segments.push({
        id: w.id,
        ax: lerp(w.ax, w.bx, cuts[i]), ay: lerp(w.ay, w.by, cuts[i]),
        bx: lerp(w.ax, w.bx, cuts[i + 1]), by: lerp(w.ay, w.by, cuts[i + 1])
      });
    }
  }

  // 1. Merge endpoints into nodes.
  const nodes = new Map(); // key -> {x, y, edges: []}
  const getNode = (x, y) => {
    const k = nodeKey(x, y);
    let n = nodes.get(k);
    if (!n) { n = { x, y, edges: [] }; nodes.set(k, n); }
    return n;
  };

  const halfEdges = [];
  const seen = new Set(); // dedupe overlapping collinear walls (shared room edges)
  for (const w of segments) {
    if (dist(w.ax, w.ay, w.bx, w.by) < EPS * 2) continue;
    const a = getNode(w.ax, w.ay);
    const b = getNode(w.bx, w.by);
    if (a === b) continue;
    const ka = nodeKey(a.x, a.y), kb = nodeKey(b.x, b.y);
    const ek = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    if (seen.has(ek)) continue;
    seen.add(ek);
    const e1 = { from: a, to: b, wallId: w.id, visited: false, twin: null };
    const e2 = { from: b, to: a, wallId: w.id, visited: false, twin: null };
    e1.twin = e2; e2.twin = e1;
    a.edges.push(e1);
    b.edges.push(e2);
    halfEdges.push(e1, e2);
  }

  // 2. Sort outgoing edges at every node by angle.
  for (const n of nodes.values()) {
    n.edges.sort((p, q) =>
      Math.atan2(p.to.y - n.y, p.to.x - n.x) - Math.atan2(q.to.y - n.y, q.to.x - n.x));
  }

  // 3. Trace faces: from half-edge u->v, the next edge is the one after twin(e)
  //    in clockwise order around v (yields interior faces with consistent winding).
  const nextEdge = (e) => {
    const v = e.to;
    const idx = v.edges.indexOf(e.twin);
    return v.edges[(idx - 1 + v.edges.length) % v.edges.length];
  };

  const faces = [];
  for (const start of halfEdges) {
    if (start.visited) continue;
    const poly = [];
    const wallIds = new Set();
    let e = start;
    let guard = 0;
    while (!e.visited && guard++ < 10000) {
      e.visited = true;
      poly.push({ x: e.from.x, y: e.from.y });
      wallIds.add(e.wallId);
      e = nextEdge(e);
    }
    if (poly.length >= 3) faces.push({ polygon: poly, wallIds });
  }

  // 4. Keep faces with positive signed area under this trace orientation:
  //    interior faces come out with one sign, the outer face with the other.
  const rooms = [];
  for (const f of faces) {
    const area = polygonArea(f.polygon);
    if (area > 4000) { // ignore slivers below 0.4 m^2
      rooms.push({
        polygon: f.polygon,
        area,
        centroid: polygonCentroid(f.polygon),
        wallIds: f.wallIds
      });
    }
  }
  rooms.sort((a, b) => b.area - a.area);
  return rooms;
}

/** Stable-ish key for a room so styles survive geometry edits. */
export function roomKey(room) {
  return `r_${Math.round(room.centroid.x / 40)}_${Math.round(room.centroid.y / 40)}`;
}

/** Snap an angle to the nearest multiple of `step` if within `tol`. */
export function snapAngle(angle, step = Math.PI / 4, tol = 0.12) {
  const snapped = Math.round(angle / step) * step;
  return Math.abs(angle - snapped) <= tol ? snapped : angle;
}

let idCounter = 0;
export function uid(prefix = 'id') {
  idCounter = (idCounter + 1) % 1e6;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}`;
}
