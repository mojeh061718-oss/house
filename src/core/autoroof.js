// One-tap roofs: fit a roof over the whole house automatically instead of
// making the user free-place and hand-size it.
import { ITEM_MAP } from '../catalog/items.js';
import { clamp } from './geometry.js';

const SLAB = 30; // must match the structural slab in viewer3d.js

/** The primary roof shapes that auto-fit (dormers/chimneys stay manual). */
export const AUTO_ROOF_IDS = new Set(['roof_gable', 'roof_hip', 'roof_shed', 'roof_flat']);

const OVERHANG = 40;  // eave overhang past the walls, each side (cm)
const SEAM = 6;       // drop below the wall top so no gap line shows (cm)

/**
 * Replace any existing primary roof with one sized to cover the house:
 * footprint of the topmost built level + eave overhang, seated on the wall
 * top (minus a small overlap that hides the seam), ridge along the long axis.
 * Returns the new item or null when there are no walls to cover.
 */
export function autoRoof(store, defId) {
  const p = store.project;
  const def = ITEM_MAP.get(defId);
  if (!def) return null;
  // the roof covers the highest level that actually has walls
  let li = -1;
  for (let i = p.levels.length - 1; i >= 0; i--) {
    if (p.levels[i].walls.length) { li = i; break; }
  }
  if (li < 0) return null;
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const w of p.levels[li].walls) {
    minX = Math.min(minX, w.ax, w.bx); maxX = Math.max(maxX, w.ax, w.bx);
    minY = Math.min(minY, w.ay, w.by); maxY = Math.max(maxY, w.ay, w.by);
  }
  const spanX = maxX - minX + OVERHANG * 2;
  const spanY = maxY - minY + OVERHANG * 2;

  store.checkpoint();
  // out with the old primary roof(s), on every floor
  for (const lvl of p.levels) {
    for (let i = lvl.items.length - 1; i >= 0; i--) {
      if (AUTO_ROOF_IDS.has(lvl.items[i].defId)) lvl.items.splice(i, 1);
    }
  }

  // items are posed at elevation + levelY(activeLevel); make the roof land on
  // the top of the covered level's walls no matter which floor is active
  const wallH = p.settings.wallHeight;
  const topAbs = li * (wallH + SLAB) + wallH;
  const elevation = Math.max(0, topAbs - p.activeLevel * (wallH + SLAB) - SEAM);

  const long = Math.max(spanX, spanY), short = Math.min(spanX, spanY);
  const it = store.addItem(defId, (minX + maxX) / 2, (minY + maxY) / 2,
    spanX >= spanY ? 0 : Math.PI / 2, def);
  it.w = Math.round(long);
  it.d = Math.round(short);
  it.h = defId === 'roof_flat' ? def.h : Math.round(clamp(0.28 * short, 140, 330));
  it.elevation = Math.round(elevation);
  store.commit(false);
  store.select({ kind: 'item', id: it.id });
  return it;
}
