// Shared placement logic: wall snapping for furniture in both the 2D editor
// and the 3D viewer. Items dragged near a wall seat their back against it and
// align their rotation, like mainstream home-design apps.
import { pointSegDist, wallAngle } from './geometry.js';
import { ITEM_MAP } from '../catalog/items.js';

const GRID = 10;
const NO_WALL_SNAP = new Set([
  'rug', 'rugRound', 'plant', 'slab', 'car', 'hedge', 'fence', 'box', 'pond', 'pool',
  'rings', 'hottub', 'swingset', 'patioset', 'pergola', 'hoop', 'path', 'roof',
  // stairs keep the rotation you give them — wall snapping used to spin them to
  // face whatever wall was nearby, which read as them "turning weirdly"
  'stairs'
]);

function nearestWall(walls, x, y, maxDist) {
  let best = null, bestD = maxDist;
  for (const w of walls) {
    const r = pointSegDist(x, y, w.ax, w.ay, w.bx, w.by);
    if (r.d < bestD) { bestD = r.d; best = { wall: w, ...r }; }
  }
  return best;
}

function poseAgainstWall(near, x, y, depth, gap = 0.5) {
  const ang = wallAngle(near.wall);
  const nx = Math.sin(ang), ny = -Math.cos(ang);
  const side = ((x - near.x) * nx + (y - near.y) * ny) >= 0 ? 1 : -1;
  const off = near.wall.thickness / 2 + depth / 2 + gap;
  return {
    x: near.x + nx * off * side,
    y: near.y + ny * off * side,
    rot: ang + (side > 0 ? Math.PI : 0),
    snapped: true
  };
}

/** Record which wall a wall-mounted item is fixed to (id + parametric position
 *  along it + which side), so it can follow the wall if the wall later moves. */
export function anchorWallItem(walls, it, def) {
  if (!it || def?.mount !== 'wall') return;
  const near = nearestWall(walls, it.x, it.y, 140);
  if (!near) { it.hostWall = null; return; }
  const w = near.wall;
  const dx = w.bx - w.ax, dy = w.by - w.ay;
  const len2 = dx * dx + dy * dy || 1;
  const t = ((it.x - w.ax) * dx + (it.y - w.ay) * dy) / len2;
  const ang = wallAngle(w);
  const nx = Math.sin(ang), ny = -Math.cos(ang);
  it.hostWall = w.id;
  it.wallT = Math.max(0, Math.min(1, t));
  it.wallSide = ((it.x - near.x) * nx + (it.y - near.y) * ny) >= 0 ? 1 : -1;
}

/** Reposition every wall-mounted item onto its (possibly moved) host wall.
 *  `defOf(defId)` resolves a catalog def. Items whose host wall is gone stay put. */
export function reanchorWallItems(walls, items, defOf) {
  for (const it of items) {
    if (it.hostWall == null) continue;
    const def = defOf(it.defId);
    if (def?.mount !== 'wall') continue;
    const w = walls.find(ww => ww.id === it.hostWall);
    if (!w) continue;
    const t = it.wallT ?? 0.5;
    const px = w.ax + t * (w.bx - w.ax), py = w.ay + t * (w.by - w.ay);
    const ang = wallAngle(w);
    const nx = Math.sin(ang), ny = -Math.cos(ang);
    const side = it.wallSide ?? 1;
    const off = w.thickness / 2 + (it.d ?? def.d) / 2 + 0.5;
    it.x = px + nx * off * side;
    it.y = py + ny * off * side;
    it.rotation = ang + (side > 0 ? Math.PI : 0);
  }
}

/** Build a path polyline for a drawn shape from two corner points a,b.
 *  'rect'/'circle' return a closed loop; 'line' a single segment. Free-draw
 *  collects its own points live, so it never comes through here. */
export function shapePolyline(shape, a, b) {
  const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x);
  const y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
  // a near-flat rectangle/circle is a degenerate doubled-over loop — treat it
  // as a straight line instead of overlapping coincident geometry
  const MIN = 24;
  if ((shape === 'rect' || shape === 'circle') && (x2 - x1 < MIN || y2 - y1 < MIN)) return [a, b];
  if (shape === 'rect') {
    return [
      { x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 },
      { x: x1, y: y2 }, { x: x1, y: y1 }
    ];
  }
  if (shape === 'circle') {
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const rx = (x2 - x1) / 2, ry = (y2 - y1) / 2;
    const n = Math.max(24, Math.round((rx + ry) / 6));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry });
    }
    return pts;
  }
  return [a, b];
}

/** Create a path item (sidewalk/driveway/water) from a drawn stroke.
 *  Takes a checkpoint and commits; returns the created item. */
export function createPathItem(store, def, pts) {
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const p of pts) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const scale = store.drawWidthScale || 1;
  const width = Math.max(4, Math.min(600, Math.round(def.path.width * scale)));
  store.checkpoint();
  const it = store.addItem(def.id, (minX + maxX) / 2, (minY + maxY) / 2, 0, def);
  it.path = pts.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
  it.pw = width;
  it.w = Math.max(maxX - minX + width, width);
  it.d = Math.max(maxY - minY + width, width);
  store.commit(false);
  store.setTool('select');
  store.select({ kind: 'item', id: it.id });
  return it;
}

/**
 * Compute the pose for an item at cursor position (x, y).
 * @param walls   project walls
 * @param def     catalog definition
 * @param x,y     cursor/drag position (item center, cm)
 * @param opts    { rot: current rotation, fine: 2cm grid instead of 10cm }
 */
export function snapPose(walls, def, x, y, opts = {}) {
  const grid = opts.noSnap ? 1 : (opts.fine ? 2 : GRID);
  const free = {
    x: Math.round(x / grid) * grid,
    y: Math.round(y / grid) * grid,
    rot: opts.rot ?? 0,
    snapped: false
  };

  // snapping off: drop exactly where the finger is, ignore walls entirely
  // (wall/ceiling mounts still need a host to attach to)
  if (opts.noSnap && def?.mount !== 'wall' && def?.mount !== 'ceiling') return free;

  if (def?.mount === 'ceiling') return free;

  if (def?.mount === 'wall') {
    const near = nearestWall(walls, x, y, 60);
    return near ? poseAgainstWall(near, x, y, def.d) : free;
  }

  if (def && !NO_WALL_SNAP.has(def.plan?.type)) {
    // regular furniture: snap when the cursor is within reach of a wall
    const depth = opts.d ?? def.d;
    const near = nearestWall(walls, x, y, depth / 2 + 30);
    if (near) {
      const pose = poseAgainstWall(near, x, y, depth);
      // keep the item sliding along the wall on the grid
      const ang = wallAngle(near.wall);
      const tx = Math.cos(ang), ty = Math.sin(ang);
      const along = pose.x * tx + pose.y * ty;
      const snappedAlong = Math.round(along / grid) * grid;
      pose.x += (snappedAlong - along) * tx;
      pose.y += (snappedAlong - along) * ty;
      return pose;
    }
  }
  return free;
}


/** Height of the tallest drag-to-size surface (pad, deck, patio) under a
 *  point — so a welcome mat dropped on a paver pad SITS ON the pavers
 *  instead of being buried inside the slab. */
export function surfaceTopAt(items, x, y, excludeId = null) {
  let top = 0;
  for (const it of items) {
    if (it.id === excludeId || it.path) continue;
    const def = ITEM_MAP.get(it.defId);
    if (!def?.areaDraw) continue;
    const cos = Math.cos(-(it.rotation || 0)), sin = Math.sin(-(it.rotation || 0));
    const dx = x - it.x, dy = y - it.y;
    const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
    if (Math.abs(lx) <= (it.w || 0) / 2 && Math.abs(ly) <= (it.d || 0) / 2) {
      top = Math.max(top, it.h || 0);
    }
  }
  return top;
}
