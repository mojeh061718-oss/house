// Interactive 2D floor-plan editor on <canvas>. Handles mouse, touch (pinch
// zoom / two-finger pan) and pen via Pointer Events. World units: centimeters.
import {
  dist, pointSegDist, wallLength, wallAngle, wallPoint, snapAngle,
  pointInPolygon, pointInItemRect, clamp, EPS
} from '../core/geometry.js';
import { getTextureCanvases, MATERIAL_MAP, watchTextures } from '../core/textures.js';
import { ITEM_MAP } from '../catalog/items.js';
import { drawPlanSymbol } from './plansymbols.js';
import { DEFAULTS } from '../core/state.js';
import { openingDefaults } from '../core/openings.js';
import { localPos } from '../core/orientation.js';
import { fmtFtIn, fmtArea } from '../core/units.js';
import { snapPose, createPathItem } from '../core/placement.js';

const GRID = 10;            // snap grid (cm)

export class Editor2D {
  constructor(canvas, store) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.store = store;
    this.view = { x: 0, y: 0, scale: 0.55 }; // world center + px per cm
    this.pointers = new Map();
    this.mode = { name: 'idle' };
    this.hover = { x: 0, y: 0, sx: 0, sy: 0 };
    this.pinch = null;
    this.dirty = true;
    this.patternCache = new Map();
    watchTextures((matId) => {
      this.patternCache.delete(matId);
      this.requestRender();
    });
    // touch ergonomics: big handles + generous hit radius on coarse pointers
    this.coarse = window.matchMedia('(pointer: coarse)').matches;
    this.handleR = this.coarse ? 14 : 9;      // drawn radius (px)
    this.handleHit = this.handleR + 16;       // hit-test radius (px)

    store.on('change', () => this.requestRender());
    store.on('selection', () => this.requestRender());
    store.on('tool', () => { this.cancelMode(); this.requestRender(); });
    store.on('projectLoaded', () => { this.fitToContent(); });

    canvas.addEventListener('pointerdown', e => this.onDown(e));
    canvas.addEventListener('pointermove', e => this.onMove(e));
    canvas.addEventListener('pointerup', e => this.onUp(e));
    canvas.addEventListener('pointercancel', e => this.onUp(e));
    canvas.addEventListener('wheel', e => this.onWheel(e), { passive: false });
    canvas.addEventListener('dblclick', e => e.preventDefault());
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('keydown', e => this.onKey(e));

    const loop = () => {
      if (this.dirty && this.canvas.offsetParent !== null) {
        this.dirty = false;
        this.render();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    this.resize();
  }

  requestRender() { this.dirty = true; }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.offsetWidth, h = this.canvas.offsetHeight;
    if (!w) return;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.dpr = dpr;
    this.requestRender();
  }

  fitToContent() {
    const p = this.store.project;
    const pts = [];
    for (const w of p.walls) pts.push([w.ax, w.ay], [w.bx, w.by]);
    for (const it of p.items) pts.push([it.x, it.y]);
    const cw = this.canvas.offsetWidth, ch = this.canvas.offsetHeight;
    if (!pts.length || !cw) {
      this.view = { x: 0, y: 0, scale: 0.55 };
      this.requestRender();
      return;
    }
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (const [x, y] of pts) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    this.view.x = (minX + maxX) / 2;
    this.view.y = (minY + maxY) / 2;
    const spanX = Math.max(maxX - minX, 200), spanY = Math.max(maxY - minY, 200);
    this.view.scale = clamp(Math.min(cw / (spanX + 220), ch / (spanY + 220)), 0.05, 4);
    this.requestRender();
  }

  // ---- coordinate transforms ----------------------------------------------

  toWorld(sx, sy) {
    return {
      x: (sx - this.canvas.offsetWidth / 2) / this.view.scale + this.view.x,
      y: (sy - this.canvas.offsetHeight / 2) / this.view.scale + this.view.y
    };
  }

  toScreen(wx, wy) {
    return {
      x: (wx - this.view.x) * this.view.scale + this.canvas.offsetWidth / 2,
      y: (wy - this.view.y) * this.view.scale + this.canvas.offsetHeight / 2
    };
  }

  // ---- snapping ------------------------------------------------------------

  snapPoint(x, y, opts = {}) {
    const p = this.store.project;
    const tol = (this.coarse ? 24 : 14) / this.view.scale;

    const endpointNear = (px, py) => {
      let best = null, bestD = tol;
      for (const w of p.walls) {
        if (opts.excludeWall === w.id) continue;
        for (const [ex, ey] of [[w.ax, w.ay], [w.bx, w.by]]) {
          const d = dist(px, py, ex, ey);
          if (d < bestD) { bestD = d; best = { x: ex, y: ey, kind: 'endpoint' }; }
        }
      }
      return best;
    };

    // 1. strongest: an existing wall endpoint near the cursor
    const ep = endpointNear(x, y);
    if (ep) return ep;

    if (opts.ref) {
      // constrain to a clean angle from the reference point
      const dx = x - opts.ref.x, dy = y - opts.ref.y;
      const ang = snapAngle(Math.atan2(dy, dx));
      const len = Math.hypot(dx, dy);
      let ax = opts.ref.x + Math.cos(ang) * len;
      let ay = opts.ref.y + Math.sin(ang) * len;
      // if an endpoint sits near the constrained tip, close onto it exactly
      const ep2 = endpointNear(ax, ay);
      if (ep2) return ep2;
      // landing on another wall's edge makes a clean T-junction
      const onWall = this.nearestWall(ax, ay, tol);
      if (onWall && onWall.wall.id !== opts.excludeWall) {
        return { x: onWall.px, y: onWall.py, kind: 'onwall' };
      }
      const horiz = Math.abs(Math.cos(ang)) > 0.99;
      const vert = Math.abs(Math.sin(ang)) > 0.99;
      let guide = null;
      if (horiz) {
        ay = opts.ref.y;
        // align the free end with other walls' endpoints
        for (const w of p.walls) {
          for (const [ex, ey] of [[w.ax, w.ay], [w.bx, w.by]]) {
            if (Math.abs(ax - ex) < tol && dist(ex, ey, opts.ref.x, opts.ref.y) > 1) {
              ax = ex; guide = { x: ex, y: ey };
            }
          }
        }
        if (!guide) ax = Math.round(ax / GRID) * GRID;
      } else if (vert) {
        ax = opts.ref.x;
        for (const w of p.walls) {
          for (const [ex, ey] of [[w.ax, w.ay], [w.bx, w.by]]) {
            if (Math.abs(ay - ey) < tol && dist(ex, ey, opts.ref.x, opts.ref.y) > 1) {
              ay = ey; guide = { x: ex, y: ey };
            }
          }
        }
        if (!guide) ay = Math.round(ay / GRID) * GRID;
      }
      return { x: ax, y: ay, kind: guide ? 'align' : 'axis', guide };
    }

    // free placement: snap onto a nearby wall edge (clean T-junction start)
    const onWall = this.nearestWall(x, y, tol);
    if (onWall && onWall.wall.id !== opts.excludeWall) {
      return { x: onWall.px, y: onWall.py, kind: 'onwall' };
    }
    // alignment with existing endpoints, else grid
    let gx = Math.round(x / GRID) * GRID;
    let gy = Math.round(y / GRID) * GRID;
    let guide = null;
    for (const w of p.walls) {
      for (const [ex, ey] of [[w.ax, w.ay], [w.bx, w.by]]) {
        if (Math.abs(x - ex) < tol) { gx = ex; guide = { x: ex, y: ey }; }
        if (Math.abs(y - ey) < tol) { gy = ey; guide = guide || { x: ex, y: ey }; }
      }
    }
    return { x: gx, y: gy, kind: guide ? 'align' : 'grid', guide };
  }

  // ---- hit testing -----------------------------------------------------------

  hitTest(wx, wy) {
    const p = this.store.project;
    const tol = 10 / this.view.scale;
    // items: among everything under the cursor, grab the one whose center is
    // proportionally closest — so a small ceiling lamp over a sofa doesn't
    // steal every tap meant for the sofa.
    let bestItem = null, bestScore = Infinity;
    for (const it of this.sortedItems()) {
      const def = ITEM_MAP.get(it.defId);
      if (it.path && def?.path) {
        // paths hit along their stroke, and always lose to furniture on top
        const hw = (it.pw || def.path.width) / 2 + tol;
        let d = Infinity;
        for (let i = 1; i < it.path.length; i++) {
          const a = it.path[i - 1], b = it.path[i];
          d = Math.min(d, pointSegDist(wx, wy, a.x, a.y, b.x, b.y).d);
        }
        if (d < hw) {
          const score = 1.5 + d / hw;
          if (score <= bestScore) { bestScore = score; bestItem = it; }
        }
        continue;
      }
      // very shallow items (wall TVs, shelves) get a minimum hit depth
      const hitD = Math.max(it.d, 22);
      if (pointInItemRect(wx, wy, it, it.w + tol, hitD + tol)) {
        const score = Math.hypot(wx - it.x, wy - it.y) / Math.max(it.w, it.d);
        if (score <= bestScore) { bestScore = score; bestItem = it; }
      }
    }
    if (bestItem) return { kind: 'item', id: bestItem.id };
    // openings
    for (const o of p.openings) {
      const w = this.store.wall(o.wallId);
      if (!w) continue;
      const c = wallPoint(w, o.t);
      if (dist(wx, wy, c.x, c.y) < o.width / 2 + tol) return { kind: 'opening', id: o.id };
    }
    // walls
    let bestWall = null, bestD = tol + 6;
    for (const w of p.walls) {
      const { d } = pointSegDist(wx, wy, w.ax, w.ay, w.bx, w.by);
      const lim = w.thickness / 2 + tol;
      if (d < lim && d < bestD) { bestD = d; bestWall = w; }
    }
    if (bestWall) return { kind: 'wall', id: bestWall.id };
    // rooms
    for (const r of this.store.rooms) {
      if (pointInPolygon(wx, wy, r.polygon)) return { kind: 'room', id: r.key };
    }
    return null;
  }

  sortedItems() {
    // draw rugs below everything, wall/ceiling-mounted above
    const rank = it => {
      const def = ITEM_MAP.get(it.defId);
      if (!def) return 1;
      if (def.plan?.type === 'path') return -1; // ground surfaces under everything
      if (def.plan?.type === 'rug' || def.plan?.type === 'rugRound') return 0;
      if (def.mount === 'wall' || def.mount === 'ceiling') return 2;
      return 1;
    };
    return this.store.project.items.slice().sort((a, b) => rank(a) - rank(b));
  }

  nearestWall(wx, wy, maxDist) {
    const cands = [];
    for (const w of this.store.project.walls) {
      const r = pointSegDist(wx, wy, w.ax, w.ay, w.bx, w.by);
      if (r.d < maxDist) cands.push({ wall: w, t: r.t, px: r.x, py: r.y, d: r.d });
    }
    if (!cands.length) return null;
    cands.sort((a, b) => a.d - b.d);
    // near a corner two walls are almost equidistant — prefer the one whose
    // closest point is along its length rather than at its very end
    const best = cands[0];
    const mid = cands.find(c => c.d < best.d + 8 && c.t > 0.12 && c.t < 0.88);
    return mid || best;
  }

  // ---- pointer handling -------------------------------------------------------

  evtPos(e) {
    const p = localPos(e, this.canvas);
    return { sx: p.x, sy: p.y };
  }

  onDown(e) {
    try { this.canvas.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    const { sx, sy } = this.evtPos(e);
    this.pointers.set(e.pointerId, { sx, sy });

    if (this.pointers.size === 2) {
      // second finger: switch to pinch (cancel any drag in progress)
      const pts = [...this.pointers.values()];
      this.pinch = {
        d: Math.hypot(pts[0].sx - pts[1].sx, pts[0].sy - pts[1].sy),
        cx: (pts[0].sx + pts[1].sx) / 2,
        cy: (pts[0].sy + pts[1].sy) / 2,
        scale: this.view.scale,
        vx: this.view.x, vy: this.view.y
      };
      if (this.mode.dragging) this.cancelMode(true);
      return;
    }
    if (this.pointers.size > 2) return;

    const w = this.toWorld(sx, sy);
    const store = this.store;
    const isPanButton = e.button === 1 || e.button === 2;

    if (isPanButton) {
      this.mode = { name: 'pan', sx, sy, vx: this.view.x, vy: this.view.y };
      return;
    }

    switch (store.tool) {
      case 'select': this.downSelect(w, sx, sy); break;
      case 'wall': this.downWall(w); break;
      case 'room': this.mode = { name: 'roomRect', start: this.snapPoint(w.x, w.y), cur: null, dragging: true }; break;
      case 'door': case 'window': this.downOpening(w, store.tool); break;
      case 'multi': this.downMulti(w, sx, sy); break;
      case 'place': this.downPlace(w); break;
    }
    this.requestRender();
  }

  /** Multi-select tool: tap toggles an item, drag sweeps a marquee. */
  downMulti(w, sx, sy) {
    this.mode = { name: 'marquee', start: { x: w.x, y: w.y }, cur: null, sx, sy, dragging: true };
  }

  downSelect(w, sx, sy) {
    const store = this.store;
    const sel = store.selection;

    // 0. jamb-end resize handles of current opening selection
    if (sel?.kind === 'opening') {
      const o = store.opening(sel.id);
      if (o) {
        const h = this.openingHandleAt(o, sx, sy);
        if (h) {
          store.checkpoint();
          this.mode = { name: 'resizeOpening', id: o.id, end: h, dragging: true };
          return;
        }
      }
    }
    // 1. manipulation handles of current item selection
    if (sel?.kind === 'item') {
      const it = store.item(sel.id);
      if (it) {
        const h = this.itemHandleAt(it, sx, sy);
        if (h === 'rotate') {
          store.checkpoint();
          this.mode = { name: 'rotateItem', id: it.id, dragging: true };
          return;
        }
        if (h) {
          store.checkpoint();
          this.mode = { name: 'resizeItem', id: it.id, handle: h, startW: it.w, startD: it.d, dragging: true };
          return;
        }
      }
    }
    // 2. wall endpoint handles of current wall selection
    if (sel?.kind === 'wall') {
      const wall = store.wall(sel.id);
      if (wall) {
        const tolPx = this.handleHit;
        for (const end of ['a', 'b']) {
          const pt = this.toScreen(wall[end + 'x'], wall[end + 'y']);
          if (Math.hypot(pt.x - sx, pt.y - sy) < tolPx) {
            store.checkpoint();
            this.mode = {
              name: 'dragEndpoint', id: wall.id, end, dragging: true,
              linked: this.coincidentEndpoints(wall[end + 'x'], wall[end + 'y'])
            };
            return;
          }
        }
      }
    }

    const hit = this.hitTest(w.x, w.y);
    if (hit?.kind === 'item' && sel?.kind === 'multi' && sel.ids.includes(hit.id)) {
      // drag the whole group together
      store.checkpoint();
      this.mode = {
        name: 'dragMulti', startX: w.x, startY: w.y, moved: false, dragging: true,
        origins: sel.ids.map(id => {
          const it = store.item(id);
          return it && {
            id, x: it.x, y: it.y,
            path: it.path ? it.path.map(p => ({ x: p.x, y: p.y })) : null
          };
        }).filter(Boolean)
      };
      return;
    }
    if (hit?.kind === 'item') {
      const it = store.item(hit.id);
      store.select(hit);
      store.checkpoint();
      this.mode = { name: 'dragItem', id: it.id, offX: w.x - it.x, offY: w.y - it.y, moved: false, dragging: true };
    } else if (hit?.kind === 'opening') {
      store.select(hit);
      store.checkpoint();
      this.mode = { name: 'dragOpening', id: hit.id, moved: false, dragging: true };
    } else if (hit?.kind === 'wall') {
      const wall = store.wall(hit.id);
      store.select(hit);
      store.checkpoint();
      this.mode = {
        name: 'dragWall', id: hit.id, startX: w.x, startY: w.y, moved: false, dragging: true,
        origin: { ax: wall.ax, ay: wall.ay, bx: wall.bx, by: wall.by },
        linkedA: this.coincidentEndpoints(wall.ax, wall.ay, hit.id),
        linkedB: this.coincidentEndpoints(wall.bx, wall.by, hit.id)
      };
    } else {
      // empty space or room → pan; decide on pointerup whether it was a click
      this.mode = {
        name: 'pan', sx, sy, vx: this.view.x, vy: this.view.y,
        clickHit: hit, clickW: w
      };
    }
  }

  coincidentEndpoints(x, y, excludeId = null) {
    const linked = [];
    for (const w of this.store.project.walls) {
      if (w.id === excludeId) continue;
      if (dist(w.ax, w.ay, x, y) < EPS * 2) linked.push({ id: w.id, end: 'a' });
      if (dist(w.bx, w.by, x, y) < EPS * 2) linked.push({ id: w.id, end: 'b' });
    }
    return linked;
  }

  downWall(w) {
    // drag-to-draw: press starts the wall, release finishes it
    const pt = this.snapPoint(w.x, w.y);
    this.mode = { name: 'wallDraw', start: pt, preview: pt, dragging: true };
  }

  downOpening(w, tool) {
    const store = this.store;
    const near = this.nearestWall(w.x, w.y, 40 / this.view.scale + 20);
    if (!near) return;
    const type = tool === 'door' ? store.doorType : store.windowType;
    const width = openingDefaults(type).width;
    const len = wallLength(near.wall);
    if (len < width + 12) return;
    const t = clamp(near.t, (width / 2 + 6) / len, 1 - (width / 2 + 6) / len);
    store.checkpoint();
    const o = store.addOpening(near.wall.id, type, t);
    store.commit(true);
    store.select({ kind: 'opening', id: o.id });
    store.setTool('select');
  }

  downPlace(w) {
    const store = this.store;
    const def = ITEM_MAP.get(store.placeDefId);
    if (!def) return;
    if (def.path) {
      // paths are laid by dragging: collect the stroke, commit on release
      this.mode = { name: 'pathDraw', def, pts: [{ x: w.x, y: w.y }], cur: null, dragging: true };
      return;
    }
    const pos = this.placePose(w, def);
    store.checkpoint();
    const it = store.addItem(def.id, pos.x, pos.y, pos.rot, def);
    store.commit(false);
    store.setTool('select');
    store.select({ kind: 'item', id: it.id });
  }

  /** Create a path item from a drawn stroke (absolute plan points). */
  commitPath(def, pts) {
    createPathItem(this.store, def, pts);
  }

  /** Position + rotation for placing an item, snapping to walls where sensible. */
  placePose(w, def, opts = {}) {
    return snapPose(this.store.project.walls, def, w.x, w.y, opts);
  }

  /** While dragging: snap into center-alignment with other items and measure
   *  live gaps to the nearest wall in each direction (drawn as guides). */
  updateDragGuides(it, m) {
    m.alignV = m.alignH = null;
    m.gaps = null;
    const tol = 10 / this.view.scale;
    let bestX = tol, bestY = tol;
    for (const o of this.store.project.items) {
      if (o.id === it.id || o.path) continue;
      const dx = Math.abs(o.x - it.x), dy = Math.abs(o.y - it.y);
      if (dx < bestX) { bestX = dx; m.alignV = o; }
      if (dy < bestY) { bestY = dy; m.alignH = o; }
    }
    if (m.alignV) it.x = m.alignV.x;
    if (m.alignH) it.y = m.alignH.y;
    m.gaps = this.wallGaps(it);
  }

  /** Clear gap from each side of an item to the nearest facing wall. */
  wallGaps(it) {
    const cos = Math.cos(it.rotation), sin = Math.sin(it.rotation);
    const hx = (Math.abs(it.w * cos) + Math.abs(it.d * sin)) / 2;
    const hy = (Math.abs(it.w * sin) + Math.abs(it.d * cos)) / 2;
    const walls = this.store.project.walls;
    const probe = (dx, dy) => {
      let best = null;
      for (const w of walls) {
        let hit, d;
        if (dx) {
          if ((w.ay - it.y) * (w.by - it.y) > 0 || Math.abs(w.ay - w.by) < EPS) continue;
          const t = (it.y - w.ay) / (w.by - w.ay);
          hit = { x: w.ax + (w.bx - w.ax) * t, y: it.y };
          d = (hit.x - it.x) * dx;
        } else {
          if ((w.ax - it.x) * (w.bx - it.x) > 0 || Math.abs(w.ax - w.bx) < EPS) continue;
          const t = (it.x - w.ax) / (w.bx - w.ax);
          hit = { x: it.x, y: w.ay + (w.by - w.ay) * t };
          d = (hit.y - it.y) * dy;
        }
        if (d > 0 && (!best || d < best.d)) best = { d, hit, th: w.thickness };
      }
      if (!best) return null;
      const half = dx ? hx : hy;
      const gap = best.d - half - best.th / 2;
      if (gap < 2 || gap > 900) return null;
      return {
        x1: it.x + dx * half, y1: it.y + dy * half,
        x2: best.hit.x - dx * best.th / 2, y2: best.hit.y - dy * best.th / 2,
        gap
      };
    };
    return [probe(1, 0), probe(-1, 0), probe(0, 1), probe(0, -1)].filter(Boolean);
  }

  itemHandleAt(it, sx, sy) {
    const handles = this.itemHandles(it);
    let best = null, bestD = this.handleHit;
    for (const h of handles) {
      const d = Math.hypot(h.sx - sx, h.sy - sy);
      // rotate handle wins ties — it's the one users reach for most
      if (d <= bestD + (h.id === 'rotate' ? 6 : 0)) { bestD = d; best = h.id; }
    }
    return best;
  }

  itemHandles(it) {
    if (it.path) return []; // paths just move — no rotate/resize handles
    const cos = Math.cos(it.rotation), sin = Math.sin(it.rotation);
    const loc = (lx, ly) => {
      const wx = it.x + lx * cos - ly * sin;
      const wy = it.y + lx * sin + ly * cos;
      const s = this.toScreen(wx, wy);
      return { sx: s.x, sy: s.y };
    };
    const rotDist = it.d / 2 + (this.coarse ? 40 : 28) / this.view.scale;
    return [
      { id: 'rotate', ...loc(0, -rotDist) },
      { id: 'br', ...loc(it.w / 2, it.d / 2) },
      { id: 'tr', ...loc(it.w / 2, -it.d / 2) },
      { id: 'bl', ...loc(-it.w / 2, it.d / 2) },
      { id: 'tl', ...loc(-it.w / 2, -it.d / 2) }
    ];
  }

  /** Screen-space handles at an opening's jamb ends (drag to resize width). */
  openingHandles(o) {
    const w = this.store.wall(o.wallId);
    if (!w) return [];
    const len = wallLength(w);
    if (len < 1) return [];
    const dt = (o.width / 2) / len;
    return [
      { id: 'a', ...this.toScreenPt(wallPoint(w, o.t - dt)) },
      { id: 'b', ...this.toScreenPt(wallPoint(w, o.t + dt)) }
    ];
  }

  toScreenPt(pt) {
    const s = this.toScreen(pt.x, pt.y);
    return { sx: s.x, sy: s.y };
  }

  openingHandleAt(o, sx, sy) {
    let best = null, bestD = this.handleHit;
    for (const h of this.openingHandles(o)) {
      const d = Math.hypot(h.sx - sx, h.sy - sy);
      if (d <= bestD) { bestD = d; best = h.id; }
    }
    return best;
  }

  onMove(e) {
    const { sx, sy } = this.evtPos(e);
    if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { sx, sy });
    const w = this.toWorld(sx, sy);
    this.hover = { x: w.x, y: w.y, sx, sy };
    this.store.emit('status', { x: w.x, y: w.y });

    // pinch zoom / two-finger pan
    if (this.pinch && this.pointers.size >= 2) {
      const pts = [...this.pointers.values()];
      const d = Math.hypot(pts[0].sx - pts[1].sx, pts[0].sy - pts[1].sy);
      const cx = (pts[0].sx + pts[1].sx) / 2;
      const cy = (pts[0].sy + pts[1].sy) / 2;
      const factor = clamp(d / Math.max(this.pinch.d, 1), 0.2, 5);
      const newScale = clamp(this.pinch.scale * factor, 0.04, 6);
      // keep pinch center anchored + apply two-finger pan
      const cw = this.canvas.offsetWidth, ch = this.canvas.offsetHeight;
      const wx = (this.pinch.cx - cw / 2) / this.pinch.scale + this.pinch.vx;
      const wy = (this.pinch.cy - ch / 2) / this.pinch.scale + this.pinch.vy;
      this.view.scale = newScale;
      this.view.x = wx - (cx - cw / 2) / newScale;
      this.view.y = wy - (cy - ch / 2) / newScale;
      this.requestRender();
      return;
    }

    const m = this.mode;
    const store = this.store;
    switch (m.name) {
      case 'pan': {
        this.view.x = m.vx - (sx - m.sx) / this.view.scale;
        this.view.y = m.vy - (sy - m.sy) / this.view.scale;
        if (Math.hypot(sx - m.sx, sy - m.sy) > 5) m.clickHit = undefined, m.clickW = undefined;
        break;
      }
      case 'wallDraw': {
        m.preview = this.snapPoint(w.x, w.y, { ref: m.start });
        break;
      }
      case 'roomRect': {
        m.cur = this.snapPoint(w.x, w.y);
        break;
      }
      case 'marquee': {
        m.cur = { x: w.x, y: w.y };
        if (Math.hypot(sx - m.sx, sy - m.sy) > 6) m.swept = true;
        break;
      }
      case 'dragMulti': {
        m.moved = true;
        const dx = Math.round((w.x - m.startX) / GRID) * GRID;
        const dy = Math.round((w.y - m.startY) / GRID) * GRID;
        for (const org of m.origins) {
          const it = store.item(org.id);
          if (!it) continue;
          it.x = org.x + dx;
          it.y = org.y + dy;
          if (org.path && it.path) {
            for (let i = 0; i < it.path.length && i < org.path.length; i++) {
              it.path[i].x = org.path[i].x + dx;
              it.path[i].y = org.path[i].y + dy;
            }
          }
        }
        store.commit(false);
        break;
      }
      case 'resizeOpening': {
        const o = store.opening(m.id);
        const wall = o && store.wall(o.wallId);
        if (!wall) break;
        const len = wallLength(wall);
        // the grabbed jamb follows the pointer along the wall; the other stays
        const r = pointSegDist(w.x, w.y, wall.ax, wall.ay, wall.bx, wall.by);
        const fixed = o.t + (m.end === 'a' ? 1 : -1) * (o.width / 2) / len;
        let width = Math.abs(clamp(r.t, 0, 1) - fixed) * len;
        width = clamp(Math.round(width), 40, Math.max(40, len - 12));
        const dir = m.end === 'a' ? -1 : 1;
        let t = fixed + dir * (width / 2) / len;
        t = clamp(t, (width / 2 + 6) / len, 1 - (width / 2 + 6) / len);
        o.width = width;
        o.t = t;
        store.commit(true);
        break;
      }
      case 'pathDraw': {
        const last = m.pts[m.pts.length - 1];
        const step = Math.max(24, m.def.path.width / 4);
        if (dist(w.x, w.y, last.x, last.y) >= step) m.pts.push({ x: w.x, y: w.y });
        m.cur = { x: w.x, y: w.y };
        break;
      }
      case 'dragItem': {
        const it = store.item(m.id);
        if (!it) break;
        m.moved = true;
        const def = ITEM_MAP.get(it.defId);
        if (it.path) {
          // translate the whole stroke with the drag
          const nx = w.x - m.offX, ny = w.y - m.offY;
          const dx = nx - it.x, dy = ny - it.y;
          it.x = nx; it.y = ny;
          for (const p of it.path) { p.x += dx; p.y += dy; }
          store.commit(false);
          break;
        }
        const target = def?.mount === 'wall'
          ? w
          : { x: w.x - m.offX, y: w.y - m.offY };
        const pose = this.placePose(target, def, { fine: true, rot: it.rotation, d: it.d });
        it.x = pose.x;
        it.y = pose.y;
        if (pose.snapped) it.rotation = pose.rot;
        this.updateDragGuides(it, m);
        store.commit(false);
        break;
      }
      case 'rotateItem': {
        const it = store.item(m.id);
        if (!it) break;
        let ang = Math.atan2(w.y - it.y, w.x - it.x) + Math.PI / 2;
        const stepped = Math.round(ang / (Math.PI / 12)) * (Math.PI / 12);
        it.rotation = Math.abs(ang - stepped) < 0.06 ? stepped : ang;
        store.commit(false);
        break;
      }
      case 'resizeItem': {
        const it = store.item(m.id);
        if (!it) break;
        const cos = Math.cos(-it.rotation), sin = Math.sin(-it.rotation);
        const dx = w.x - it.x, dy = w.y - it.y;
        const lx = Math.abs(dx * cos - dy * sin), ly = Math.abs(dx * sin + dy * cos);
        it.w = clamp(Math.round(lx * 2), 20, 800);
        it.d = clamp(Math.round(ly * 2), 20, 800);
        store.commit(false);
        break;
      }
      case 'dragOpening': {
        const o = store.opening(m.id);
        if (!o) break;
        m.moved = true;
        const near = this.nearestWall(w.x, w.y, 60 / this.view.scale + 30);
        if (near) {
          const len = wallLength(near.wall);
          if (len > o.width + 12) {
            o.wallId = near.wall.id;
            o.t = clamp(near.t, (o.width / 2 + 6) / len, 1 - (o.width / 2 + 6) / len);
            store.commit(true);
          }
        }
        break;
      }
      case 'dragWall': {
        const wall = store.wall(m.id);
        if (!wall) break;
        m.moved = true;
        let dx = Math.round((w.x - m.startX) / GRID) * GRID;
        let dy = Math.round((w.y - m.startY) / GRID) * GRID;
        wall.ax = m.origin.ax + dx; wall.ay = m.origin.ay + dy;
        wall.bx = m.origin.bx + dx; wall.by = m.origin.by + dy;
        for (const l of m.linkedA) {
          const lw = store.wall(l.id);
          lw[l.end + 'x'] = wall.ax; lw[l.end + 'y'] = wall.ay;
        }
        for (const l of m.linkedB) {
          const lw = store.wall(l.id);
          lw[l.end + 'x'] = wall.bx; lw[l.end + 'y'] = wall.by;
        }
        store.commit(true);
        break;
      }
      case 'dragEndpoint': {
        const wall = store.wall(m.id);
        if (!wall) break;
        const other = m.end === 'a' ? { x: wall.bx, y: wall.by } : { x: wall.ax, y: wall.ay };
        const pt = this.snapPoint(w.x, w.y, { ref: other, excludeWall: m.id });
        wall[m.end + 'x'] = pt.x; wall[m.end + 'y'] = pt.y;
        for (const l of m.linked) {
          const lw = store.wall(l.id);
          if (lw && lw.id !== wall.id) { lw[l.end + 'x'] = pt.x; lw[l.end + 'y'] = pt.y; }
        }
        store.commit(true);
        break;
      }
    }
    this.requestRender();
  }

  onUp(e) {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    const m = this.mode;
    const store = this.store;

    if (m.name === 'pan' && m.clickHit !== undefined) {
      // treated as a click on empty space / room
      store.select(m.clickHit); // null or {kind:'room'}
    }
    if (m.name === 'wallDraw' && m.preview) {
      if (dist(m.start.x, m.start.y, m.preview.x, m.preview.y) > GRID * 2) {
        store.checkpoint();
        store.addWall(m.start.x, m.start.y, m.preview.x, m.preview.y);
        store.commit(true);
      }
    }
    if (m.name === 'pathDraw') {
      const pts = m.pts.slice();
      if (m.cur && dist(m.cur.x, m.cur.y, pts[pts.length - 1].x, pts[pts.length - 1].y) > 8) {
        pts.push(m.cur);
      }
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += dist(pts[i].x, pts[i].y, pts[i - 1].x, pts[i - 1].y);
      if (pts.length >= 2 && len > 50) this.commitPath(m.def, pts);
    }
    if (m.name === 'roomRect' && m.start && m.cur) {
      const { start: s, cur: c } = m;
      if (Math.abs(c.x - s.x) > 40 && Math.abs(c.y - s.y) > 40) {
        store.checkpoint();
        const x1 = Math.min(s.x, c.x), x2 = Math.max(s.x, c.x);
        const y1 = Math.min(s.y, c.y), y2 = Math.max(s.y, c.y);
        store.addWall(x1, y1, x2, y1);
        store.addWall(x2, y1, x2, y2);
        store.addWall(x2, y2, x1, y2);
        store.addWall(x1, y2, x1, y1);
        store.commit(true);
      }
    }
    if (m.name === 'marquee') {
      if (m.swept && m.cur) {
        const x1 = Math.min(m.start.x, m.cur.x), x2 = Math.max(m.start.x, m.cur.x);
        const y1 = Math.min(m.start.y, m.cur.y), y2 = Math.max(m.start.y, m.cur.y);
        const ids = store.project.items
          .filter(it => it.x >= x1 && it.x <= x2 && it.y >= y1 && it.y <= y2)
          .map(it => it.id);
        // sweeping again grows the existing group
        if (store.selection?.kind === 'multi') {
          for (const id of store.selection.ids) if (!ids.includes(id)) ids.push(id);
        }
        store.select(ids.length ? { kind: 'multi', ids } : null);
      } else {
        // tap: toggle the item under the finger in/out of the group
        const hit = this.hitTest(m.start.x, m.start.y);
        if (hit?.kind === 'item') {
          const cur = store.selection?.kind === 'multi' ? store.selection.ids.slice() : [];
          const i = cur.indexOf(hit.id);
          if (i >= 0) cur.splice(i, 1); else cur.push(hit.id);
          store.select(cur.length ? { kind: 'multi', ids: cur } : null);
        }
      }
    }
    if (['dragItem', 'dragOpening', 'dragWall', 'dragMulti'].includes(m.name) && m.moved === false) {
      // click without movement — the checkpoint taken on pointerdown is redundant
      store.undoStack.pop();
      store.emit('history');
    }
    if (['dragItem', 'rotateItem', 'resizeItem', 'dragMulti'].includes(m.name)) {
      store.commit(false);
    }
    this.mode = { name: 'idle' };
    this.requestRender();
  }

  cancelMode(keepTool = false) {
    this.mode = { name: 'idle' };
    if (!keepTool) this.requestRender();
  }

  onWheel(e) {
    e.preventDefault();
    const { sx, sy } = this.evtPos(e);
    const w = this.toWorld(sx, sy);
    const factor = Math.exp(-e.deltaY * 0.0012);
    const ns = clamp(this.view.scale * factor, 0.04, 6);
    this.view.scale = ns;
    this.view.x = w.x - (sx - this.canvas.offsetWidth / 2) / ns;
    this.view.y = w.y - (sy - this.canvas.offsetHeight / 2) / ns;
    this.requestRender();
  }

  onKey(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    const store = this.store;
    if (e.key === 'Escape') {
      if (this.mode.name !== 'idle') this.cancelMode();
      else if (store.tool !== 'select') store.setTool('select');
      else store.select(null);
    } else if ((e.key === 'Delete' || e.key === 'Backspace')) {
      if (store.deleteSelection()) e.preventDefault();
    } else if (e.key === 'r' || e.key === 'R') {
      const sel = store.selection;
      if (sel?.kind === 'item') {
        const it = store.item(sel.id);
        store.checkpoint();
        it.rotation += Math.PI / 12;
        store.commit(false);
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault(); store.undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey) || e.key === 'Z')) {
      e.preventDefault(); store.redo();
    }
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  floorPattern(matId) {
    let pat = this.patternCache.get(matId);
    if (!pat) {
      const { color } = getTextureCanvases(matId);
      pat = this.ctx.createPattern(color, 'repeat');
      this.patternCache.set(matId, pat);
    }
    const def = MATERIAL_MAP.get(matId);
    const { color } = getTextureCanvases(matId);
    const s = (def?.scale ?? 200) / color.width;
    pat.setTransform(new DOMMatrix().scale(s, s));
    return pat;
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.offsetWidth, H = this.canvas.offsetHeight;
    const { scale } = this.view;
    const store = this.store;
    const p = store.project;
    const px = 1 / scale;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#eef0f2';
    ctx.fillRect(0, 0, W, H);

    // world transform
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-this.view.x, -this.view.y);

    this.drawGrid(ctx, W, H, px);
    this.drawGhostLevel(ctx, px);

    // room floors
    for (const r of store.rooms) {
      const style = p.roomStyles[r.key];
      const matId = style?.floor || p.settings.defaultFloor;
      ctx.beginPath();
      for (let i = 0; i < r.polygon.length; i++) {
        const pt = r.polygon[i];
        i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.fillStyle = this.floorPattern(matId);
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.restore();
      if (store.selection?.kind === 'room' && store.selection.id === r.key) {
        ctx.fillStyle = 'rgba(56,132,255,0.18)';
        ctx.fill();
        ctx.strokeStyle = '#3884ff';
        ctx.lineWidth = 2.5 * px;
        ctx.setLineDash([8 * px, 5 * px]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // items below walls (rugs), then walls, then items, then openings
    const items = this.sortedItems();
    for (const it of items) {
      const def = ITEM_MAP.get(it.defId);
      if (!def) continue;
      const t = def.plan?.type;
      if (t === 'rug' || t === 'rugRound' || t === 'path') this.drawItem(ctx, it, def, px);
    }

    this.drawWalls(ctx, px);

    for (const it of items) {
      const def = ITEM_MAP.get(it.defId);
      if (!def) continue;
      const t = def.plan?.type;
      if (t !== 'rug' && t !== 'rugRound' && t !== 'path') this.drawItem(ctx, it, def, px);
    }

    this.drawOpenings(ctx, px);
    this.drawPreviews(ctx, px);

    ctx.restore();

    // screen-space overlays (rulers, labels, handles)
    this.drawRulers(ctx, W, H);
    this.drawRoomLabels(ctx);
    this.drawDimensions(ctx);
    this.drawSelectionHandles(ctx);
  }

  drawGrid(ctx, W, H, px) {
    const view = this.view;
    const left = view.x - (W / 2) * px, right = view.x + (W / 2) * px;
    const top = view.y - (H / 2) * px, bottom = view.y + (H / 2) * px;
    const step = view.scale > 0.5 ? 20 : view.scale > 0.18 ? 100 : 500;
    ctx.lineWidth = px;
    for (let x = Math.floor(left / step) * step; x <= right; x += step) {
      const major = Math.round(x) % 100 === 0;
      ctx.strokeStyle = major ? 'rgba(120,130,145,0.28)' : 'rgba(120,130,145,0.13)';
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
    }
    for (let y = Math.floor(top / step) * step; y <= bottom; y += step) {
      const major = Math.round(y) % 100 === 0;
      ctx.strokeStyle = major ? 'rgba(120,130,145,0.28)' : 'rgba(120,130,145,0.13)';
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
    }
  }

  wallPolygon(w, extend = 0) {
    const ang = wallAngle(w);
    const nx = Math.sin(ang) * w.thickness / 2, ny = -Math.cos(ang) * w.thickness / 2;
    const ex = Math.cos(ang) * extend, ey = Math.sin(ang) * extend;
    return [
      { x: w.ax - ex + nx, y: w.ay - ey + ny },
      { x: w.bx + ex + nx, y: w.by + ey + ny },
      { x: w.bx + ex - nx, y: w.by + ey - ny },
      { x: w.ax - ex - nx, y: w.ay - ey - ny }
    ];
  }

  /** Faint underlay of the level below, so upper floors can be traced over it. */
  drawGhostLevel(ctx, px) {
    const p = this.store.project;
    if (!p.levels || p.activeLevel < 1) return;
    const below = p.levels[p.activeLevel - 1];
    ctx.save();
    ctx.globalAlpha = 0.22;
    for (const w of below.walls) {
      const poly = this.wallPolygon(w, w.thickness / 2);
      ctx.beginPath();
      poly.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
      ctx.closePath();
      ctx.fillStyle = '#8a919c';
      ctx.fill();
    }
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = '#5c6570';
    ctx.lineWidth = 1.2 * px;
    for (const it of below.items) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rotation || 0);
      ctx.strokeRect(-(it.w || 60) / 2, -(it.d || 60) / 2, it.w || 60, it.d || 60);
      ctx.restore();
    }
    ctx.restore();
  }

  drawWalls(ctx, px) {
    const store = this.store;
    for (const w of store.project.walls) {
      const selected = store.selection?.kind === 'wall' && store.selection.id === w.id;
      const poly = this.wallPolygon(w, w.thickness / 2);
      ctx.beginPath();
      poly.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
      ctx.closePath();
      ctx.fillStyle = selected ? '#3884ff' : '#3d4148';
      ctx.fill();
    }
  }

  drawOpenings(ctx, px) {
    const store = this.store;
    for (const o of store.project.openings) {
      const w = store.wall(o.wallId);
      if (!w) continue;
      const c = wallPoint(w, o.t);
      const ang = wallAngle(w);
      const selected = store.selection?.kind === 'opening' && store.selection.id === o.id;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(ang);
      const hw = o.width / 2, th = w.thickness / 2 + 0.5;
      // clear the wall
      ctx.fillStyle = '#eef0f2';
      ctx.fillRect(-hw, -th, o.width, th * 2);
      ctx.strokeStyle = selected ? '#3884ff' : '#3d4148';
      ctx.lineWidth = 1.4 * px;
      const jambs = () => {
        ctx.beginPath();
        ctx.moveTo(-hw, -th); ctx.lineTo(-hw, th);
        ctx.moveTo(hw, -th); ctx.lineTo(hw, th);
        ctx.stroke();
      };
      // hinged leaf + quarter-circle swing arc from a jamb
      const leafArc = (hingeX, width, sideY) => {
        ctx.beginPath();
        ctx.moveTo(hingeX, th * sideY);
        ctx.lineTo(hingeX, th * sideY + width * sideY);
        ctx.stroke();
        ctx.beginPath();
        ctx.setLineDash([4 * px, 4 * px]);
        const fromRight = hingeX > 0;
        let a0, a1;
        if (sideY > 0) { [a0, a1] = fromRight ? [Math.PI / 2, Math.PI] : [0, Math.PI / 2]; }
        else { [a0, a1] = fromRight ? [Math.PI, Math.PI * 1.5] : [Math.PI * 1.5, Math.PI * 2]; }
        ctx.arc(hingeX, th * sideY, width, a0, a1);
        ctx.stroke();
        ctx.setLineDash([]);
      };
      const sideY = o.flip ? -1 : 1; // which side of the wall the opening acts on
      switch (o.type) {
        case 'window':
        case 'window_picture': {
          ctx.strokeRect(-hw, -th, o.width, th * 2);
          ctx.beginPath();
          ctx.moveTo(-hw, 0); ctx.lineTo(hw, 0);
          ctx.stroke();
          break;
        }
        case 'window_casement': {
          ctx.strokeRect(-hw, -th, o.width, th * 2);
          leafArc(o.swing ? hw : -hw, o.width * 0.85, sideY);
          break;
        }
        case 'window_sliding': {
          ctx.strokeRect(-hw, -th, o.width, th * 2);
          ctx.beginPath();
          ctx.moveTo(-hw, -th * 0.4); ctx.lineTo(hw * 0.15, -th * 0.4);
          ctx.moveTo(-hw * 0.15, th * 0.4); ctx.lineTo(hw, th * 0.4);
          ctx.stroke();
          break;
        }
        case 'window_bay': {
          ctx.strokeRect(-hw, -th, o.width, th * 2);
          // angled sides + front pane bumped out from the wall
          const out = sideY * -1; // bays default to the exterior side
          const depth = Math.min(60, o.width * 0.3) * out;
          ctx.beginPath();
          ctx.moveTo(-hw, th * out);
          ctx.lineTo(-hw * 0.5, th * out + depth);
          ctx.lineTo(hw * 0.5, th * out + depth);
          ctx.lineTo(hw, th * out);
          ctx.stroke();
          break;
        }
        case 'doorway': {
          ctx.save();
          ctx.setLineDash([6 * px, 5 * px]);
          jambs();
          ctx.restore();
          break;
        }
        case 'slidingDoor': {
          ctx.strokeRect(-hw, -th, o.width, th * 2);
          ctx.beginPath();
          ctx.moveTo(-hw, -th * 0.4); ctx.lineTo(hw * 0.15, -th * 0.4);
          ctx.moveTo(-hw * 0.15, th * 0.4); ctx.lineTo(hw, th * 0.4);
          ctx.stroke();
          break;
        }
        case 'pocket_door': {
          jambs();
          // half panel across the opening + dashed pocket inside the wall
          ctx.beginPath();
          ctx.moveTo(-hw, 0); ctx.lineTo(0, 0);
          ctx.stroke();
          ctx.beginPath();
          ctx.setLineDash([5 * px, 4 * px]);
          ctx.moveTo(-hw, 0); ctx.lineTo(-hw - o.width / 2, 0);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        }
        case 'garage_door': {
          ctx.strokeRect(-hw, -th, o.width, th * 2);
          // segmented panel ticks
          ctx.beginPath();
          for (let i = 1; i < 4; i++) {
            const x = -hw + (o.width / 4) * i;
            ctx.moveTo(x, -th); ctx.lineTo(x, th);
          }
          ctx.stroke();
          // dashed track lines running into the garage
          ctx.beginPath();
          ctx.setLineDash([6 * px, 5 * px]);
          ctx.moveTo(-hw + 6, th * sideY); ctx.lineTo(-hw + 6, (th + 90) * sideY);
          ctx.moveTo(hw - 6, th * sideY); ctx.lineTo(hw - 6, (th + 90) * sideY);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        }
        case 'double_door':
        case 'french_door': {
          jambs();
          leafArc(-hw, hw, sideY);
          leafArc(hw, hw, sideY);
          break;
        }
        default: {
          // hinged door: jambs + panel leaf + swing arc
          jambs();
          leafArc(o.swing ? hw : -hw, o.width, sideY);
        }
      }
      ctx.restore();
    }
  }

  drawItem(ctx, it, def, px) {
    const sel = this.store.selection;
    const selected = (sel?.kind === 'item' && sel.id === it.id) ||
      (sel?.kind === 'multi' && sel.ids.includes(it.id));
    if (it.path && def.path) {
      this.strokePath(ctx, it.path, it.pw || def.path.width, def, px, selected);
      return;
    }
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rotation);
    drawPlanSymbol(ctx, def, it.w, it.d, px);
    if (selected) {
      ctx.strokeStyle = '#3884ff';
      ctx.lineWidth = 1.8 * px;
      ctx.setLineDash([6 * px, 4 * px]);
      ctx.strokeRect(-it.w / 2 - 4, -it.d / 2 - 4, it.w + 8, it.d + 8);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  /** Render a laid path (sidewalk/driveway/gravel/water) along its stroke. */
  strokePath(ctx, pts, width, def, px, selected = false, alpha = 1) {
    if (pts.length < 2) return;
    const isWater = def.path?.surface === 'water';
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    };
    // edge/bank line under the fill
    ctx.strokeStyle = isWater ? '#6d98ac' : 'rgba(70,76,88,0.55)';
    ctx.lineWidth = width + 3 * px;
    trace();
    ctx.stroke();
    if (isWater) {
      ctx.strokeStyle = '#a8cede';
      ctx.lineWidth = width;
      trace();
      ctx.stroke();
    } else {
      // oriented surface: fill each segment with the pattern rotated to run
      // along the stroke, carrying the phase over so the texture flows
      ctx.fillStyle = this.floorPattern(def.path.mat);
      let u0 = 0;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        if (len < 0.5) continue;
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
        ctx.translate(-u0, 0);
        ctx.fillRect(u0, -width / 2, len, width);
        ctx.restore();
        u0 += len;
      }
      // round caps and elbows, pattern aligned to the local direction
      let d0 = 0;
      for (let i = 0; i < pts.length; i++) {
        const prev = pts[i - 1], next = pts[i + 1];
        const aIn = prev ? Math.atan2(pts[i].y - prev.y, pts[i].x - prev.x) : null;
        const aOut = next ? Math.atan2(next.y - pts[i].y, next.x - pts[i].x) : null;
        let ang = aIn ?? aOut ?? 0;
        if (aIn !== null && aOut !== null) {
          ang = Math.atan2(Math.sin(aIn) + Math.sin(aOut), Math.cos(aIn) + Math.cos(aOut));
        }
        if (prev) d0 += Math.hypot(pts[i].x - prev.x, pts[i].y - prev.y);
        ctx.save();
        ctx.translate(pts[i].x, pts[i].y);
        ctx.rotate(ang);
        ctx.translate(-d0, 0);
        ctx.beginPath();
        ctx.arc(d0, 0, width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    if (selected) {
      ctx.strokeStyle = '#3884ff';
      ctx.lineWidth = 2 * px;
      ctx.setLineDash([6 * px, 4 * px]);
      ctx.lineCap = 'butt';
      trace();
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  drawPreviews(ctx, px) {
    const store = this.store;
    const m = this.mode;

    if (m.name === 'wallDraw' && m.preview) {
      const { start, preview } = m;
      ctx.strokeStyle = '#3884ff';
      ctx.lineWidth = DEFAULTS.wallThickness;
      ctx.globalAlpha = 0.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(preview.x, preview.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineCap = 'butt';
      // dashed guide when aligning with a distant endpoint
      if (preview.guide) {
        ctx.strokeStyle = 'rgba(47,191,113,0.8)';
        ctx.lineWidth = 1.2 * px;
        ctx.setLineDash([6 * px, 5 * px]);
        ctx.beginPath();
        ctx.moveTo(preview.guide.x, preview.guide.y);
        ctx.lineTo(preview.x, preview.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      this.drawNode(ctx, start.x, start.y, px, start.kind);
      this.drawNode(ctx, preview.x, preview.y, px, preview.kind);
    }
    if (m.name === 'pathDraw' && m.pts.length) {
      const pts = m.cur ? [...m.pts, m.cur] : m.pts;
      this.strokePath(ctx, pts, m.def.path.width, m.def, px, false, 0.65);
    }
    if (m.name === 'roomRect' && m.cur) {
      const { start: s, cur: c } = m;
      ctx.strokeStyle = '#3884ff';
      ctx.lineWidth = DEFAULTS.wallThickness;
      ctx.globalAlpha = 0.5;
      ctx.strokeRect(Math.min(s.x, c.x), Math.min(s.y, c.y), Math.abs(c.x - s.x), Math.abs(c.y - s.y));
      ctx.globalAlpha = 1;
    }
    if (m.name === 'dragItem' && m.moved) {
      const it = store.item(m.id);
      if (it) {
        // green alignment guides through matching item centers
        ctx.strokeStyle = 'rgba(47,191,113,0.85)';
        ctx.lineWidth = 1.4 * px;
        ctx.setLineDash([7 * px, 5 * px]);
        for (const [o, vert] of [[m.alignV, true], [m.alignH, false]]) {
          if (!o) continue;
          ctx.beginPath();
          if (vert) {
            ctx.moveTo(it.x, Math.min(it.y, o.y) - 40);
            ctx.lineTo(it.x, Math.max(it.y, o.y) + 40);
          } else {
            ctx.moveTo(Math.min(it.x, o.x) - 40, it.y);
            ctx.lineTo(Math.max(it.x, o.x) + 40, it.y);
          }
          ctx.stroke();
        }
        ctx.setLineDash([]);
        // blue gap lines from the item's sides to the facing walls
        ctx.strokeStyle = 'rgba(56,132,255,0.85)';
        ctx.lineWidth = 1.3 * px;
        for (const g of m.gaps || []) {
          const tx = g.y1 === g.y2 ? 0 : 6, ty = g.x1 === g.x2 ? 0 : 6; // tick dir
          ctx.beginPath();
          ctx.moveTo(g.x1, g.y1); ctx.lineTo(g.x2, g.y2);
          ctx.moveTo(g.x1 - tx, g.y1 - ty); ctx.lineTo(g.x1 + tx, g.y1 + ty);
          ctx.moveTo(g.x2 - tx, g.y2 - ty); ctx.lineTo(g.x2 + tx, g.y2 + ty);
          ctx.stroke();
        }
      }
    }
    if (m.name === 'marquee' && m.cur) {
      const { start: s, cur: c } = m;
      ctx.fillStyle = 'rgba(56,132,255,0.12)';
      ctx.strokeStyle = '#3884ff';
      ctx.lineWidth = 1.4 * px;
      ctx.setLineDash([7 * px, 5 * px]);
      const x = Math.min(s.x, c.x), y = Math.min(s.y, c.y);
      ctx.fillRect(x, y, Math.abs(c.x - s.x), Math.abs(c.y - s.y));
      ctx.strokeRect(x, y, Math.abs(c.x - s.x), Math.abs(c.y - s.y));
      ctx.setLineDash([]);
    }
    if ((store.tool === 'door' || store.tool === 'window') && this.hover) {
      const near = this.nearestWall(this.hover.x, this.hover.y, 40 / this.view.scale + 20);
      if (near) {
        const ang = wallAngle(near.wall);
        const width = openingDefaults(store.tool === 'door' ? store.doorType : store.windowType).width;
        ctx.save();
        ctx.translate(near.px, near.py);
        ctx.rotate(ang);
        ctx.fillStyle = 'rgba(56,132,255,0.45)';
        ctx.fillRect(-width / 2, -near.wall.thickness / 2 - 2, width, near.wall.thickness + 4);
        ctx.restore();
      }
    }
    if (store.tool === 'place' && store.placeDefId && this.hover) {
      const def = ITEM_MAP.get(store.placeDefId);
      if (def) {
        const pose = this.placePose(this.hover, def);
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.translate(pose.x, pose.y);
        ctx.rotate(pose.rot);
        drawPlanSymbol(ctx, def, def.w, def.d, px);
        ctx.restore();
      }
    }
  }

  drawNode(ctx, x, y, px, kind = 'grid') {
    // green = this end will connect (endpoint or wall edge)
    const connecting = kind === 'endpoint' || kind === 'onwall';
    ctx.fillStyle = connecting ? '#2fbf71' : '#ffffff';
    ctx.strokeStyle = connecting ? '#ffffff' : '#3884ff';
    ctx.lineWidth = 2.2 * px;
    ctx.beginPath();
    ctx.arc(x, y, (connecting ? 8 : 6) * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (connecting) {
      ctx.strokeStyle = 'rgba(47,191,113,0.55)';
      ctx.lineWidth = 1.5 * px;
      ctx.beginPath();
      ctx.arc(x, y, 14 * px, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /** Screen-space rulers along the top/left edges + a live scale chip. */
  drawRulers(ctx, W, H) {
    const view = this.view;
    const px = 1 / view.scale;
    // whole-feet label spacing, ticks kept ~60px apart on screen
    const FT = 30.48;
    const steps = [1, 2, 5, 10, 20, 50, 100, 200].map(f => f * FT);
    const step = steps.find(s => s * view.scale >= 56) ?? 500 * FT;
    const left = view.x - (W / 2) * px, right = view.x + (W / 2) * px;
    const top = view.y - (H / 2) * px, bottom = view.y + (H / 2) * px;
    // measure from the plan's top-left corner so the numbers read as
    // distance across the house, starting at 0 at its corner
    let ox = 0, oy = 0;
    const walls = this.store.project.walls;
    if (walls.length) {
      ox = 1e9; oy = 1e9;
      for (const w of walls) {
        ox = Math.min(ox, w.ax, w.bx);
        oy = Math.min(oy, w.ay, w.by);
      }
    }
    // labels land on whole feet (5', 10', …) measured from the house corner
    const label = v => `${Math.round(v / FT)}'`;

    ctx.fillStyle = 'rgba(238,240,242,0.9)';
    ctx.fillRect(0, 0, W, 18);
    ctx.fillRect(0, 0, 24, H);
    ctx.strokeStyle = 'rgba(120,130,145,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 18.5); ctx.lineTo(W, 18.5);
    ctx.moveTo(24.5, 0); ctx.lineTo(24.5, H);
    ctx.stroke();

    ctx.font = '9.5px system-ui, sans-serif';
    ctx.strokeStyle = 'rgba(90,98,110,0.55)';
    ctx.textAlign = 'center';
    for (let x = ox + Math.ceil((left - ox) / step) * step; x <= right; x += step) {
      const s = this.toScreen(x, 0).x;
      if (s < 40) continue;
      ctx.beginPath(); ctx.moveTo(s, 13); ctx.lineTo(s, 18); ctx.stroke();
      if (x - ox < -0.5) continue; // empty space before the house: tick only
      ctx.fillStyle = 'rgba(70,77,88,0.85)';
      ctx.fillText(label(x - ox), s, 10.5);
    }
    for (let y = oy + Math.ceil((top - oy) / step) * step; y <= bottom; y += step) {
      const s = this.toScreen(0, y).y;
      if (s < 30) continue;
      ctx.beginPath(); ctx.moveTo(19, s); ctx.lineTo(24, s); ctx.stroke();
      if (y - oy < -0.5) continue;
      ctx.save();
      ctx.translate(10.5, s);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = 'rgba(70,77,88,0.85)';
      ctx.fillText(label(y - oy), 0, 3.5);
      ctx.restore();
    }

    // scale chip: how big one grid square currently is
    const gstep = view.scale > 0.5 ? 20 : view.scale > 0.18 ? 100 : 500;
    const sq = gstep === 20 ? '8 in' : gstep === 100 ? '3.3 ft' : '16.4 ft';
    const text = `1 square = ${sq}`;
    ctx.font = '600 10.5px system-ui, sans-serif';
    const tw = ctx.measureText(text).width;
    const cx = 32, cy = H - 96; // sits clear above the floor-switcher pills
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx, cy, tw + 16, 19, 9.5);
    else ctx.rect(cx, cy, tw + 16, 19);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,130,145,0.4)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(60,66,76,0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(text, cx + 8, cy + 13.5);
  }

  drawRoomLabels(ctx) {
    if (this.view.scale < 0.12) return;
    const store = this.store;
    for (const r of store.rooms) {
      const style = store.project.roomStyles[r.key];
      const name = style?.name || 'Room';
      const s = this.toScreen(r.centroid.x, r.centroid.y);
      const area = fmtArea(r.area);
      ctx.textAlign = 'center';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(40,44,52,0.82)';
      ctx.fillText(name, s.x, s.y - 3);
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(40,44,52,0.55)';
      ctx.fillText(area, s.x, s.y + 12);
    }
  }

  drawDimensions(ctx) {
    if (this.view.scale < 0.25) return;
    const store = this.store;
    const sel = store.selection;
    for (const w of store.project.walls) {
      const len = wallLength(w);
      if (len < 50) continue;
      const selected = sel?.kind === 'wall' && sel.id === w.id;
      const drawAll = this.view.scale > 0.4;
      if (!selected && !drawAll) continue;
      const ang = wallAngle(w);
      const midX = (w.ax + w.bx) / 2, midY = (w.ay + w.by) / 2;
      const off = (w.thickness / 2 + 14 / this.view.scale);
      // offset perpendicular to the wall (normal = (sin, -cos))
      const sx = this.toScreen(midX + Math.sin(ang) * off, midY - Math.cos(ang) * off);
      ctx.save();
      ctx.translate(sx.x, sx.y);
      let rot = ang;
      if (rot > Math.PI / 2 || rot < -Math.PI / 2) rot += Math.PI;
      ctx.rotate(rot);
      ctx.textAlign = 'center';
      ctx.font = selected ? '600 12px system-ui, sans-serif' : '10px system-ui, sans-serif';
      ctx.fillStyle = selected ? '#2b6fe0' : 'rgba(40,44,52,0.5)';
      ctx.fillText(fmtFtIn(len), 0, 0);
      ctx.restore();
    }
    // live wall-draw length
    if (this.mode.name === 'wallDraw' && this.mode.preview) {
      const { start, preview } = this.mode;
      const len = dist(start.x, start.y, preview.x, preview.y);
      if (len > 5) {
        const s = this.toScreen((start.x + preview.x) / 2, (start.y + preview.y) / 2);
        ctx.font = '600 13px system-ui, sans-serif';
        ctx.fillStyle = '#2b6fe0';
        ctx.textAlign = 'center';
        ctx.fillText(fmtFtIn(len), s.x, s.y - 14);
      }
    }
    // live dimensions while dragging out a room
    if (this.mode.name === 'roomRect' && this.mode.cur) {
      const { start: rs, cur: rc } = this.mode;
      const w = Math.abs(rc.x - rs.x), d = Math.abs(rc.y - rs.y);
      if (w > 20 && d > 20) {
        const s = this.toScreen((rs.x + rc.x) / 2, (rs.y + rc.y) / 2);
        ctx.font = '700 14px system-ui, sans-serif';
        ctx.fillStyle = '#2b6fe0';
        ctx.textAlign = 'center';
        ctx.fillText(`${fmtFtIn(w)} × ${fmtFtIn(d)}`, s.x, s.y);
      }
    }
    // live wall-gap labels while dragging an item
    if (this.mode.name === 'dragItem' && this.mode.moved && this.mode.gaps?.length) {
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (const g of this.mode.gaps) {
        const s = this.toScreen((g.x1 + g.x2) / 2, (g.y1 + g.y2) / 2);
        const text = fmtFtIn(g.gap);
        const tw = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(s.x - tw / 2 - 6, s.y - 9, tw + 12, 17, 8.5);
        else ctx.rect(s.x - tw / 2 - 6, s.y - 9, tw + 12, 17);
        ctx.fill();
        ctx.fillStyle = '#2b6fe0';
        ctx.fillText(text, s.x, s.y + 4);
      }
    }
    // selected item dims
    if (sel?.kind === 'item') {
      const it = store.item(sel.id);
      if (it) {
        const s = this.toScreen(it.x, it.y);
        const yOff = (it.d / 2) * this.view.scale + 44;
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillStyle = '#2b6fe0';
        ctx.textAlign = 'center';
        ctx.fillText(`${fmtFtIn(it.w)} × ${fmtFtIn(it.d)}`, s.x, s.y + yOff);
      }
    }
  }

  drawSelectionHandles(ctx) {
    const store = this.store;
    const sel = store.selection;
    if (sel?.kind === 'item') {
      const it = store.item(sel.id);
      if (!it) return;
      const hs = this.itemHandles(it);
      if (!hs.length) return; // paths: move-only, no handles
      // line from item to rotate handle (under the handles)
      const c = this.toScreen(it.x, it.y);
      ctx.strokeStyle = 'rgba(56,132,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(hs[0].sx, hs[0].sy);
      ctx.stroke();
      for (const h of hs) {
        const r = h.id === 'rotate' ? this.handleR + 3 : this.handleR;
        ctx.beginPath();
        ctx.arc(h.sx, h.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = h.id === 'rotate' ? '#3884ff' : '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = h.id === 'rotate' ? '#ffffff' : '#3884ff';
        ctx.stroke();
        if (h.id === 'rotate') {
          // small rotate glyph inside the handle
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(h.sx, h.sy, r * 0.45, -Math.PI * 0.2, Math.PI * 1.2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(h.sx + r * 0.45 - 4, h.sy - r * 0.35);
          ctx.lineTo(h.sx + r * 0.45 + 2, h.sy - r * 0.55);
          ctx.lineTo(h.sx + r * 0.45 + 3, h.sy - r * 0.1);
          ctx.stroke();
        }
      }
    }
    if (sel?.kind === 'wall') {
      const w = store.wall(sel.id);
      if (!w) return;
      for (const [x, y] of [[w.ax, w.ay], [w.bx, w.by]]) {
        const s = this.toScreen(x, y);
        ctx.beginPath();
        ctx.arc(s.x, s.y, this.handleR - 1, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#3884ff';
        ctx.stroke();
      }
    }
    if (sel?.kind === 'opening') {
      // jamb-end handles: drag to make the door/window wider or narrower
      const o = store.opening(sel.id);
      if (!o) return;
      const wall = store.wall(o.wallId);
      const ang = wall ? wallAngle(wall) : 0;
      for (const h of this.openingHandles(o)) {
        ctx.beginPath();
        ctx.arc(h.sx, h.sy, this.handleR - 1, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#3884ff';
        ctx.stroke();
        // double-arrow glyph along the wall direction
        ctx.save();
        ctx.translate(h.sx, h.sy);
        ctx.rotate(ang);
        const r = this.handleR * 0.52;
        ctx.strokeStyle = '#3884ff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
        ctx.moveTo(-r + 3.5, -3.5); ctx.lineTo(-r, 0); ctx.lineTo(-r + 3.5, 3.5);
        ctx.moveTo(r - 3.5, -3.5); ctx.lineTo(r, 0); ctx.lineTo(r - 3.5, 3.5);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}
