// Interactive 2D floor-plan editor on <canvas>. Handles mouse, touch (pinch
// zoom / two-finger pan) and pen via Pointer Events. World units: centimeters.
import {
  dist, pointSegDist, wallLength, wallAngle, wallPoint, snapAngle,
  pointInPolygon, pointInItemRect, clamp, EPS
} from '../core/geometry.js';
import { getTextureCanvases, MATERIAL_MAP } from '../core/textures.js';
import { ITEM_MAP } from '../catalog/items.js';
import { drawPlanSymbol } from './plansymbols.js';
import { DEFAULTS } from '../core/state.js';
import { localPos } from '../core/orientation.js';
import { snapPose } from '../core/placement.js';

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
    const tolWorld = 12 / this.view.scale;
    // endpoint snap
    let best = null, bestD = tolWorld;
    for (const w of p.walls) {
      if (opts.excludeWall === w.id) continue;
      for (const [ex, ey] of [[w.ax, w.ay], [w.bx, w.by]]) {
        const d = dist(x, y, ex, ey);
        if (d < bestD) { bestD = d; best = { x: ex, y: ey, kind: 'endpoint' }; }
      }
    }
    if (best) return best;
    // axis alignment with reference point
    let gx = Math.round(x / GRID) * GRID;
    let gy = Math.round(y / GRID) * GRID;
    if (opts.ref) {
      const dx = x - opts.ref.x, dy = y - opts.ref.y;
      const ang = snapAngle(Math.atan2(dy, dx));
      const len = Math.hypot(dx, dy);
      const ax = opts.ref.x + Math.cos(ang) * len;
      const ay = opts.ref.y + Math.sin(ang) * len;
      // grid-snap the length along the snapped axis
      return {
        x: Math.abs(Math.cos(ang)) > 0.99 ? Math.round(ax / GRID) * GRID : (Math.abs(Math.cos(ang)) < 0.01 ? opts.ref.x : ax),
        y: Math.abs(Math.sin(ang)) > 0.99 ? Math.round(ay / GRID) * GRID : (Math.abs(Math.sin(ang)) < 0.01 ? opts.ref.y : ay),
        kind: 'axis'
      };
    }
    return { x: gx, y: gy, kind: 'grid' };
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
      if (pointInItemRect(wx, wy, it, it.w + tol, it.d + tol)) {
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
      if (def.plan?.type === 'rug' || def.plan?.type === 'rugRound') return 0;
      if (def.mount === 'wall' || def.mount === 'ceiling') return 2;
      return 1;
    };
    return this.store.project.items.slice().sort((a, b) => rank(a) - rank(b));
  }

  nearestWall(wx, wy, maxDist) {
    let best = null, bestD = maxDist;
    for (const w of this.store.project.walls) {
      const r = pointSegDist(wx, wy, w.ax, w.ay, w.bx, w.by);
      if (r.d < bestD) { bestD = r.d; best = { wall: w, t: r.t, px: r.x, py: r.y, d: r.d }; }
    }
    return best;
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
      case 'place': this.downPlace(w); break;
    }
    this.requestRender();
  }

  downSelect(w, sx, sy) {
    const store = this.store;
    const sel = store.selection;

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
    const type = tool === 'door' ? 'door' : 'window';
    const width = type === 'door' ? DEFAULTS.doorWidth : DEFAULTS.windowWidth;
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
    const pos = this.placePose(w, def);
    store.checkpoint();
    const it = store.addItem(def.id, pos.x, pos.y, pos.rot, def);
    store.commit(false);
    store.setTool('select');
    store.select({ kind: 'item', id: it.id });
  }

  /** Position + rotation for placing an item, snapping to walls where sensible. */
  placePose(w, def, opts = {}) {
    return snapPose(this.store.project.walls, def, w.x, w.y, opts);
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
        m.cur = { x: Math.round(w.x / GRID) * GRID, y: Math.round(w.y / GRID) * GRID };
        break;
      }
      case 'dragItem': {
        const it = store.item(m.id);
        if (!it) break;
        m.moved = true;
        const def = ITEM_MAP.get(it.defId);
        const target = def?.mount === 'wall'
          ? w
          : { x: w.x - m.offX, y: w.y - m.offY };
        const pose = this.placePose(target, def, { fine: true, rot: it.rotation, d: it.d });
        it.x = pose.x;
        it.y = pose.y;
        if (pose.snapped) it.rotation = pose.rot;
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
    if (['dragItem', 'dragOpening', 'dragWall'].includes(m.name) && m.moved === false) {
      // click without movement — the checkpoint taken on pointerdown is redundant
      store.undoStack.pop();
      store.emit('history');
    }
    if (m.name === 'dragItem' || m.name === 'rotateItem' || m.name === 'resizeItem') {
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
    const s = (def?.scale ?? 200) / 512;
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
      if (t === 'rug' || t === 'rugRound') this.drawItem(ctx, it, def, px);
    }

    this.drawWalls(ctx, px);

    for (const it of items) {
      const def = ITEM_MAP.get(it.defId);
      if (!def) continue;
      const t = def.plan?.type;
      if (t !== 'rug' && t !== 'rugRound') this.drawItem(ctx, it, def, px);
    }

    this.drawOpenings(ctx, px);
    this.drawPreviews(ctx, px);

    ctx.restore();

    // screen-space overlays (labels, handles)
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
      if (o.type === 'window') {
        ctx.strokeRect(-hw, -th, o.width, th * 2);
        ctx.beginPath();
        ctx.moveTo(-hw, 0); ctx.lineTo(hw, 0);
        ctx.stroke();
      } else if (o.type === 'doorway') {
        ctx.save();
        ctx.setLineDash([6 * px, 5 * px]);
        ctx.beginPath();
        ctx.moveTo(-hw, -th); ctx.lineTo(-hw, th);
        ctx.moveTo(hw, -th); ctx.lineTo(hw, th);
        ctx.stroke();
        ctx.restore();
      } else if (o.type === 'slidingDoor') {
        ctx.strokeRect(-hw, -th, o.width, th * 2);
        ctx.beginPath();
        ctx.moveTo(-hw, -th * 0.4); ctx.lineTo(hw * 0.15, -th * 0.4);
        ctx.moveTo(-hw * 0.15, th * 0.4); ctx.lineTo(hw, th * 0.4);
        ctx.stroke();
      } else {
        // hinged door: jambs + panel leaf + swing arc
        const sideY = o.flip ? -1 : 1;      // which side of the wall it opens to
        const hingeX = o.swing ? hw : -hw;  // which jamb carries the hinge
        ctx.beginPath();
        ctx.moveTo(-hw, -th); ctx.lineTo(-hw, th);
        ctx.moveTo(hw, -th); ctx.lineTo(hw, th);
        ctx.stroke();
        // panel leaf, perpendicular to the wall
        ctx.beginPath();
        ctx.moveTo(hingeX, th * sideY);
        ctx.lineTo(hingeX, th * sideY + o.width * sideY);
        ctx.stroke();
        // quarter-circle swing arc between the leaf tip and the opposite jamb
        ctx.beginPath();
        ctx.setLineDash([4 * px, 4 * px]);
        let a0, a1;
        if (sideY > 0) { [a0, a1] = o.swing ? [Math.PI / 2, Math.PI] : [0, Math.PI / 2]; }
        else { [a0, a1] = o.swing ? [Math.PI, Math.PI * 1.5] : [Math.PI * 1.5, Math.PI * 2]; }
        ctx.arc(hingeX, th * sideY, o.width, a0, a1);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
  }

  drawItem(ctx, it, def, px) {
    const selected = this.store.selection?.kind === 'item' && this.store.selection.id === it.id;
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
      this.drawNode(ctx, start.x, start.y, px);
      this.drawNode(ctx, preview.x, preview.y, px);
    }
    if (m.name === 'roomRect' && m.cur) {
      const { start: s, cur: c } = m;
      ctx.strokeStyle = '#3884ff';
      ctx.lineWidth = DEFAULTS.wallThickness;
      ctx.globalAlpha = 0.5;
      ctx.strokeRect(Math.min(s.x, c.x), Math.min(s.y, c.y), Math.abs(c.x - s.x), Math.abs(c.y - s.y));
      ctx.globalAlpha = 1;
    }
    if ((store.tool === 'door' || store.tool === 'window') && this.hover) {
      const near = this.nearestWall(this.hover.x, this.hover.y, 40 / this.view.scale + 20);
      if (near) {
        const ang = wallAngle(near.wall);
        const width = store.tool === 'door' ? DEFAULTS.doorWidth : DEFAULTS.windowWidth;
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

  drawNode(ctx, x, y, px) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3884ff';
    ctx.lineWidth = 2 * px;
    ctx.beginPath();
    ctx.arc(x, y, 6 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  drawRoomLabels(ctx) {
    if (this.view.scale < 0.12) return;
    const store = this.store;
    for (const r of store.rooms) {
      const style = store.project.roomStyles[r.key];
      const name = style?.name || 'Room';
      const s = this.toScreen(r.centroid.x, r.centroid.y);
      const m2 = (r.area / 10000).toFixed(1);
      ctx.textAlign = 'center';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(40,44,52,0.82)';
      ctx.fillText(name, s.x, s.y - 3);
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(40,44,52,0.55)';
      ctx.fillText(`${m2} m²`, s.x, s.y + 12);
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
      ctx.fillText(`${(len / 100).toFixed(2)} m`, 0, 0);
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
        ctx.fillText(`${(len / 100).toFixed(2)} m`, s.x, s.y - 14);
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
        ctx.fillText(`${(w / 100).toFixed(2)} × ${(d / 100).toFixed(2)} m`, s.x, s.y);
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
        ctx.fillText(`${it.w} × ${it.d} cm`, s.x, s.y + yOff);
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
  }
}
