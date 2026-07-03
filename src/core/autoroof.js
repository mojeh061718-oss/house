// Auto-fit roofs: pick a roof type and the app sizes and places it to cover
// the whole house footprint, instead of the user hand-sizing it. L/T/U
// shaped houses get one roof section per rectangular wing.
import { clamp, pointInPolygon } from './geometry.js';
import { ITEM_MAP } from '../catalog/items.js';

const SLAB = 30;        // structural slab between stacked levels (viewer3d)
const OVERHANG = 40;    // eave overhang past the walls, each side (cm)
const MAX_SECTIONS = 3; // more than this → fall back to one covering rect

/** Bounding rect of a level's walls (centerlines + half thickness), or null. */
function wallsBBox(walls) {
  if (!walls.length) return null;
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const w of walls) {
    const half = (w.thickness || 12) / 2;
    minX = Math.min(minX, w.ax - half, w.bx - half);
    maxX = Math.max(maxX, w.ax + half, w.bx + half);
    minY = Math.min(minY, w.ay - half, w.by - half);
    maxY = Math.max(maxY, w.ay + half, w.by + half);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Decompose the footprint (union of detected rooms) into up to MAX_SECTIONS
 * axis-aligned rectangles: build an occupancy grid from the rooms' vertex
 * lines, then greedily claim the largest remaining rectangle. Returns null
 * when the shape is too complex or not rectilinear — caller uses the bbox.
 */
function footprintRects(rooms) {
  if (!rooms.length) return null;
  const xs = new Set(), ys = new Set();
  for (const r of rooms) {
    for (const p of r.polygon) { xs.add(Math.round(p.x)); ys.add(Math.round(p.y)); }
  }
  const X = [...xs].sort((a, b) => a - b);
  const Y = [...ys].sort((a, b) => a - b);
  const nx = X.length - 1, ny = Y.length - 1;
  if (nx < 1 || ny < 1 || nx * ny > 900) return null;
  const inside = [], claimed = [];
  for (let j = 0; j < ny; j++) {
    inside[j] = []; claimed[j] = [];
    for (let i = 0; i < nx; i++) {
      const cx = (X[i] + X[i + 1]) / 2, cy = (Y[j] + Y[j + 1]) / 2;
      inside[j][i] = rooms.some(r => pointInPolygon(cx, cy, r.polygon));
      claimed[j][i] = false;
    }
  }
  const rects = [];
  for (let n = 0; n < MAX_SECTIONS; n++) {
    let best = null;
    for (let j0 = 0; j0 < ny; j0++) {
      for (let i0 = 0; i0 < nx; i0++) {
        if (!inside[j0][i0] || claimed[j0][i0]) continue;
        let i1 = i0;
        while (i1 + 1 < nx && inside[j0][i1 + 1] && !claimed[j0][i1 + 1]) i1++;
        let j1 = j0;
        grow: while (j1 + 1 < ny) {
          for (let i = i0; i <= i1; i++) if (!inside[j1 + 1][i] || claimed[j1 + 1][i]) break grow;
          j1++;
        }
        const area = (X[i1 + 1] - X[i0]) * (Y[j1 + 1] - Y[j0]);
        if (!best || area > best.area) best = { i0, i1, j0, j1, area };
      }
    }
    if (!best) break;
    for (let j = best.j0; j <= best.j1; j++) {
      for (let i = best.i0; i <= best.i1; i++) claimed[j][i] = true;
    }
    rects.push({ minX: X[best.i0], maxX: X[best.i1 + 1], minY: Y[best.j0], maxY: Y[best.j1 + 1] });
  }
  // anything left unclaimed means the shape needs more sections than we place
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) if (inside[j][i] && !claimed[j][i]) return null;
  }
  // a sliver wing would make a silly roof — let the bbox handle those plans
  for (const r of rects) {
    if (Math.min(r.maxX - r.minX, r.maxY - r.minY) < 90) return null;
  }
  return rects.length ? rects : null;
}

/**
 * Replace any existing roofs with roofs that cover the house footprint.
 * Returns the first created roof item, or null when there are no walls
 * (the caller should fall back to normal free placement).
 */
export function autoRoof(store, defId, palette = 0) {
  const def = ITEM_MAP.get(defId);
  if (!def) return null;
  const p = store.project;

  // footprint: the active level's rooms decomposed into wings; else bboxes
  let rects = def.id === 'roof_flat' ? null : footprintRects(store.rooms);
  if (!rects) {
    let bbox = wallsBBox(p.walls);
    if (!bbox) bbox = wallsBBox(p.levels.flatMap(l => l.walls));
    if (!bbox) return null;
    rects = [bbox];
  } else {
    // rooms trace wall centerlines — push each wing out half a wall
    rects = rects.map(r => ({
      minX: r.minX - 10, maxX: r.maxX + 10, minY: r.minY - 10, maxY: r.maxY + 10
    }));
  }

  store.checkpoint();

  // one house, one roof: clear roofs from every level first
  for (const lvl of p.levels) {
    for (let i = lvl.items.length - 1; i >= 0; i--) {
      const d = ITEM_MAP.get(lvl.items[i].defId);
      if (d?.plan?.type === 'roof' && d.autoFit) lvl.items.splice(i, 1);
    }
  }

  // the roof sits on top of the highest level regardless of which floor is
  // active; items are posed relative to the active level's base
  const wallH = p.settings.wallHeight;
  const levels = p.levels.length;
  const topAbs = levels * wallH + (levels - 1) * SLAB;
  const activeY = (p.activeLevel ?? 0) * (wallH + SLAB);

  // all sections share one ridge height so wings meet cleanly at valleys
  const shortest = Math.min(...rects.map(r =>
    Math.min(r.maxX - r.minX, r.maxY - r.minY))) + OVERHANG * 2;
  const height = def.id === 'roof_flat' ? def.h
    : Math.round(clamp(0.28 * shortest, 140, 330));

  let first = null;
  rects.forEach((r, i) => {
    const spanX = r.maxX - r.minX + OVERHANG * 2;
    const spanY = r.maxY - r.minY + OVERHANG * 2;
    const it = store.addItem(
      def.id,
      Math.round((r.minX + r.maxX) / 2),
      Math.round((r.minY + r.maxY) / 2),
      spanX >= spanY ? 0 : Math.PI / 2,
      def
    );
    it.w = Math.round(Math.max(spanX, spanY));
    it.d = Math.round(Math.min(spanX, spanY));
    it.h = height;
    // tiny stagger keeps overlapping fascia slabs from flickering
    it.elevation = Math.round(topAbs - activeY) + i * 0.5;
    if (def.palettes) it.palette = palette;
    if (!first) first = it;
  });

  store.commit(false);
  if (first) store.select({ kind: 'item', id: first.id });
  return first;
}
