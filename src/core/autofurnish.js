// Auto-furnish: lay out a sensible arrangement for a rectangular room with
// one tap. Items are anchored against walls with clearances, and anything
// that doesn't fit the room size is skipped.
import { ITEM_MAP } from '../catalog/items.js';
import { pointInPolygon } from './geometry.js';

const R = Math.PI / 2;

/**
 * Each template lists placements as functions of the room rect.
 * rect: {minX, maxX, minY, maxY}; cx/cy center; w/d inner size (cm).
 * Poses use rotation 0 = front faces +y (south).
 */
const TEMPLATES = {
  bedroom(r) {
    const { cx, minY, minX, maxX, cy, w, d } = r;
    return [
      { id: 'bed_double', x: cx, y: minY + 130, rot: 0, need: [180, 260] },
      { id: 'nightstand', x: cx - 110, y: minY + 40, rot: 0, need: [300, 260] },
      { id: 'nightstand', x: cx + 110, y: minY + 40, rot: 0, need: [300, 260] },
      { id: 'rug_round', x: cx, y: minY + 260, rot: 0, need: [220, 330] },
      { id: 'wardrobe', x: maxX - 45, y: cy, rot: R, need: [300, 200] },
      { id: 'dresser', x: minX + 40, y: cy + 60, rot: -R, need: [280, 300] },
      { id: 'ceiling_light', x: cx, y: cy, rot: 0, need: [150, 150] }
    ];
  },
  living(r) {
    const { cx, cy, minY, maxY, minX, w, d } = r;
    return [
      { id: 'sofa3', x: cx, y: maxY - 70, rot: Math.PI, need: [240, 250] },
      { id: 'coffee_table', x: cx, y: maxY - 175, rot: 0, need: [240, 320] },
      { id: 'rug_rect', x: cx, y: maxY - 165, rot: 0, need: [260, 330] },
      { id: 'tv_wall', x: cx, y: minY + 16, rot: 0, need: [150, 200] },
      { id: 'tv_stand', x: cx, y: minY + 35, rot: 0, need: [200, 280] },
      { id: 'armchair', x: cx - 160, y: maxY - 130, rot: -R * 0.7, need: [340, 280] },
      { id: 'floor_lamp', x: cx + 140, y: maxY - 60, rot: 0, need: [320, 250] },
      { id: 'plant_large', x: minX + 40, y: minY + 45, rot: 0, need: [200, 200] },
      { id: 'ceiling_light', x: cx, y: cy, rot: 0, need: [150, 150] }
    ];
  },
  dining(r) {
    const { cx, cy, w, d } = r;
    const chairs = [
      { id: 'chair', x: cx - 60, y: cy - 80, rot: 0, need: [220, 220] },
      { id: 'chair', x: cx + 60, y: cy - 80, rot: 0, need: [220, 220] },
      { id: 'chair', x: cx - 60, y: cy + 80, rot: Math.PI, need: [220, 220] },
      { id: 'chair', x: cx + 60, y: cy + 80, rot: Math.PI, need: [220, 220] }
    ];
    return [
      { id: 'dining_table', x: cx, y: cy, rot: 0, need: [220, 220] },
      ...chairs,
      { id: 'pendant_light', x: cx, y: cy, rot: 0, need: [150, 150] }
    ];
  },
  office(r) {
    const { cx, cy, minY, minX, maxX } = r;
    return [
      { id: 'desk', x: cx, y: minY + 50, rot: Math.PI, need: [180, 200] },
      { id: 'office_chair', x: cx, y: minY + 130, rot: 0, need: [180, 220] },
      { id: 'bookshelf', x: minX + 20, y: cy, rot: -R, need: [220, 160] },
      { id: 'plant_large', x: maxX - 40, y: minY + 45, rot: 0, need: [220, 160] },
      { id: 'ceiling_light', x: cx, y: cy, rot: 0, need: [120, 120] }
    ];
  },
  bathroom(r) {
    const { cx, cy, minX, maxX, minY, maxY } = r;
    return [
      { id: 'vanity', x: minX + 60, y: maxY - 30, rot: Math.PI, need: [160, 140] },
      { id: 'mirror_wall', x: minX + 60, y: maxY - 8, rot: Math.PI, need: [160, 140] },
      { id: 'toilet', x: minX + 150, y: maxY - 40, rot: Math.PI, need: [220, 140] },
      { id: 'shower', x: maxX - 55, y: minY + 55, rot: 0, need: [160, 160] },
      { id: 'bathtub', x: cx, y: minY + 48, rot: 0, need: [260, 200] },
      { id: 'ceiling_light', x: cx, y: cy, rot: 0, need: [100, 100] }
    ];
  },
  kitchen(r) {
    const { minX, minY, cx, cy, w, d } = r;
    const run = (i) => minX + 40 + i * 65;
    return [
      { id: 'fridge', x: run(0), y: minY + 40, rot: 0, need: [300, 200] },
      { id: 'counter', x: run(1) + 8, y: minY + 38, rot: 0, need: [300, 200] },
      { id: 'counter_sink', x: run(2) + 18, y: minY + 38, rot: 0, need: [300, 200] },
      { id: 'stove', x: run(3) + 28, y: minY + 38, rot: 0, need: [300, 200] },
      { id: 'counter', x: run(4) + 36, y: minY + 38, rot: 0, need: [380, 200] },
      { id: 'hood', x: run(3) + 28, y: minY + 28, rot: 0, need: [300, 200] },
      { id: 'wall_cabinet', x: run(1) + 8, y: minY + 24, rot: 0, need: [300, 200] },
      { id: 'island', x: cx, y: cy + 40, rot: 0, need: [320, 320] },
      { id: 'bar_stool', x: cx - 50, y: cy + 110, rot: 0, need: [320, 320] },
      { id: 'bar_stool', x: cx + 50, y: cy + 110, rot: 0, need: [320, 320] },
      { id: 'ceiling_light', x: cx, y: cy, rot: 0, need: [150, 150] }
    ];
  }
};

export const FURNISH_TYPES = [
  { id: 'living', name: 'Living room' },
  { id: 'bedroom', name: 'Bedroom' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'dining', name: 'Dining' },
  { id: 'office', name: 'Office' },
  { id: 'bathroom', name: 'Bathroom' }
];

/** Guess the room type from its name, if obvious. */
export function guessType(name = '') {
  if (/bed|master|guest/i.test(name)) return 'bedroom';
  if (/living|great|family|lounge/i.test(name)) return 'living';
  if (/kitchen/i.test(name)) return 'kitchen';
  if (/dining/i.test(name)) return 'dining';
  if (/office|study|den/i.test(name)) return 'office';
  if (/bath|shower|wc/i.test(name)) return 'bathroom';
  return null;
}

/**
 * Furnish a rectangular room. rect from the UI's roomRect (wall centerlines);
 * insets by half a wall so furniture seats inside. Returns placed count.
 */
export function furnishRoom(store, rect, type, poly = null) {
  const template = TEMPLATES[type];
  if (!template) return 0;
  const inset = 8;
  const r = {
    minX: rect.minX + inset, maxX: rect.maxX - inset,
    minY: rect.minY + inset, maxY: rect.maxY - inset
  };
  r.w = r.maxX - r.minX;
  r.d = r.maxY - r.minY;
  r.cx = (r.minX + r.maxX) / 2;
  r.cy = (r.minY + r.maxY) / 2;

  let placed = 0;
  for (const spec of template(r)) {
    const def = ITEM_MAP.get(spec.id);
    if (!def) continue;
    if (spec.need && (r.w < spec.need[0] || r.d < spec.need[1])) continue;
    // when a room isn't a clean rectangle (L / T shapes), the template lays out
    // against the bounding box — skip any piece that would land outside the real
    // floor (e.g. in an L's notch) so nothing floats in empty space.
    if (poly && !pointInPolygon(spec.x, spec.y, poly)) continue;
    store.addItem(spec.id, spec.x, spec.y, spec.rot, def);
    placed++;
  }
  return placed;
}
