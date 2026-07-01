// Shared placement logic: wall snapping for furniture in both the 2D editor
// and the 3D viewer. Items dragged near a wall seat their back against it and
// align their rotation, like mainstream home-design apps.
import { pointSegDist, wallAngle } from './geometry.js';

const GRID = 10;
const NO_WALL_SNAP = new Set(['rug', 'rugRound', 'plant']);

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

/**
 * Compute the pose for an item at cursor position (x, y).
 * @param walls   project walls
 * @param def     catalog definition
 * @param x,y     cursor/drag position (item center, cm)
 * @param opts    { rot: current rotation, fine: 2cm grid instead of 10cm }
 */
export function snapPose(walls, def, x, y, opts = {}) {
  const grid = opts.fine ? 2 : GRID;
  const free = {
    x: Math.round(x / grid) * grid,
    y: Math.round(y / grid) * grid,
    rot: opts.rot ?? 0,
    snapped: false
  };

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
