// Auto-fit roofs: pick a roof type and the app sizes and places it to cover
// the whole house footprint, instead of the user hand-sizing it.
import { clamp } from './geometry.js';
import { ITEM_MAP } from '../catalog/items.js';

const SLAB = 30;        // structural slab between stacked levels (viewer3d)
const OVERHANG = 40;    // eave overhang past the walls, each side (cm)

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
 * Replace any existing roofs with one that covers the house footprint.
 * Returns the created roof item, or null when there are no walls to cover
 * (the caller should fall back to normal free placement).
 */
export function autoRoof(store, defId, palette = 0) {
  const def = ITEM_MAP.get(defId);
  if (!def) return null;
  const p = store.project;

  // footprint: the active level's walls, else the whole house
  let bbox = wallsBBox(p.walls);
  if (!bbox) {
    const all = p.levels.flatMap(l => l.walls);
    bbox = wallsBBox(all);
  }
  if (!bbox) return null;

  const spanX = bbox.maxX - bbox.minX + OVERHANG * 2;
  const spanY = bbox.maxY - bbox.minY + OVERHANG * 2;
  const long = Math.max(spanX, spanY);
  const short = Math.min(spanX, spanY);

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

  const it = store.addItem(
    def.id,
    Math.round((bbox.minX + bbox.maxX) / 2),
    Math.round((bbox.minY + bbox.maxY) / 2),
    spanX >= spanY ? 0 : Math.PI / 2,
    def
  );
  it.w = Math.round(long);
  it.d = Math.round(short);
  it.h = def.id === 'roof_flat' ? def.h : Math.round(clamp(0.28 * short, 140, 330));
  it.elevation = Math.round(topAbs - activeY);
  if (def.palettes) it.palette = palette;

  store.commit(false);
  store.select({ kind: 'item', id: it.id });
  return it;
}
