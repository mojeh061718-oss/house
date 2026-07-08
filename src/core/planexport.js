// Printable plan sheet: renders one level as a clean black-and-white
// architectural drawing on a landscape A4-proportioned canvas — filled walls,
// door swings, window glyphs, per-wall dimensions, saved dimension
// annotations, room names + areas, faint furniture footprints, a scale bar
// and a title block. The result is a canvas the UI can print or save.
import { detectRooms, wallLength, wallAngle, polygonArea } from './geometry.js';
import { isDoorType } from './openings.js';
import { fmtLen, fmtArea } from './units.js';

const SHEET_W = 2480, SHEET_H = 1754; // A4 landscape @150dpi
const MARGIN = 150;
const INK = '#14161a';
const FAINT = '#9aa0a8';

export function renderPlanSheet(project, levelIndex = 0) {
  const lvl = project.levels[Math.max(0, Math.min(levelIndex, project.levels.length - 1))];
  const walls = lvl.walls || [];
  const openings = lvl.openings || [];
  const items = lvl.items || [];
  const dims = lvl.dims || [];
  const rooms = detectRooms(walls);
  const styles = lvl.roomStyles || {};

  // ---- fit the plan to the sheet -----------------------------------------
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const grow = (x, y) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); };
  for (const w of walls) { grow(w.ax, w.ay); grow(w.bx, w.by); }
  for (const it of items) { grow(it.x - (it.w || 0) / 2, it.y - (it.d || 0) / 2); grow(it.x + (it.w || 0) / 2, it.y + (it.d || 0) / 2); }
  if (!walls.length && !items.length) { minX = -300; minY = -300; maxX = 300; maxY = 300; }
  const spanX = Math.max(maxX - minX, 100), spanY = Math.max(maxY - minY, 100);
  // reserve room for outside dimension text + the title strip
  const availW = SHEET_W - MARGIN * 2, availH = SHEET_H - MARGIN * 2 - 150;
  const scale = Math.min(availW / (spanX + 260), availH / (spanY + 260));
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const X = (x) => SHEET_W / 2 + (x - cx) * scale;
  const Y = (y) => (SHEET_H - 150) / 2 + (y - cy) * scale;

  const canvas = document.createElement('canvas');
  canvas.width = SHEET_W; canvas.height = SHEET_H;
  const g = canvas.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, SHEET_W, SHEET_H);

  // sheet border
  g.strokeStyle = INK; g.lineWidth = 3;
  g.strokeRect(60, 60, SHEET_W - 120, SHEET_H - 120);

  // ---- furniture footprints (faint, under the walls) ----------------------
  g.save();
  g.strokeStyle = FAINT; g.lineWidth = 1.5;
  for (const it of items) {
    if (it.path) {
      g.beginPath();
      it.path.forEach((p, i) => i ? g.lineTo(X(p.x), Y(p.y)) : g.moveTo(X(p.x), Y(p.y)));
      g.setLineDash([8, 6]); g.stroke(); g.setLineDash([]);
      continue;
    }
    const hw = (it.w || 40) / 2 * scale, hd = (it.d || 40) / 2 * scale;
    g.save();
    g.translate(X(it.x), Y(it.y));
    g.rotate(it.rotation || 0);
    g.strokeRect(-hw, -hd, hw * 2, hd * 2);
    g.restore();
  }
  g.restore();

  // ---- walls as filled bars, split at openings -----------------------------
  const wallPoly = (w) => {
    const ang = wallAngle(w);
    const nx = Math.sin(ang) * (w.thickness || 12) / 2, ny = -Math.cos(ang) * (w.thickness || 12) / 2;
    return [
      [w.ax + nx, w.ay + ny], [w.bx + nx, w.by + ny],
      [w.bx - nx, w.by - ny], [w.ax - nx, w.ay - ny]
    ];
  };
  g.fillStyle = INK;
  for (const w of walls) {
    const len = wallLength(w);
    if (len < 1) continue;
    const ops = openings.filter(o => o.wallId === w.id)
      .map(o => ({ o, a: o.t * len - o.width / 2, b: o.t * len + o.width / 2 }))
      .sort((p, q) => p.a - q.a);
    // solid spans between openings
    let t0 = 0;
    const ux = (w.bx - w.ax) / len, uy = (w.by - w.ay) / len;
    const drawSpan = (a, b) => {
      if (b - a < 0.5) return;
      const seg = { ...w, ax: w.ax + ux * a, ay: w.ay + uy * a, bx: w.ax + ux * b, by: w.ay + uy * b };
      const poly = wallPoly(seg);
      g.beginPath();
      poly.forEach(([px, py], i) => i ? g.lineTo(X(px), Y(py)) : g.moveTo(X(px), Y(py)));
      g.closePath(); g.fill();
    };
    for (const { a, b } of ops) { drawSpan(t0, Math.max(t0, a)); t0 = Math.max(t0, b); }
    drawSpan(t0, len);

    // opening glyphs
    for (const { o, a, b } of ops) {
      const midT = (a + b) / 2 / len;
      const mx = w.ax + (w.bx - w.ax) * midT, my = w.ay + (w.by - w.ay) * midT;
      const ang = wallAngle(w);
      g.save();
      g.translate(X(mx), Y(my));
      g.rotate(ang);
      const hw = (o.width / 2) * scale, th = ((w.thickness || 12) / 2) * scale;
      if (isDoorType(o.type) && o.type !== 'gap') {
        // jambs + quarter-circle swing
        g.strokeStyle = INK; g.lineWidth = 2.5;
        g.strokeRect(-hw - 2, -th, 2, th * 2);
        g.strokeRect(hw, -th, 2, th * 2);
        const sw = o.flip ? -1 : 1;
        g.beginPath();
        g.moveTo(-hw, 0);
        g.lineTo(-hw, -sw * hw * 2 * (o.swing === 0 ? 0 : 1));
        g.arc(-hw, 0, hw * 2, -sw * Math.PI / 2, 0, sw < 0);
        g.lineWidth = 1.5; g.stroke();
      } else if (o.type === 'gap') {
        g.strokeStyle = FAINT; g.lineWidth = 1.5;
        g.setLineDash([6, 5]);
        g.strokeRect(-hw, -th, hw * 2, th * 2);
        g.setLineDash([]);
      } else {
        // window: box + center glass line
        g.strokeStyle = INK; g.lineWidth = 2;
        g.strokeRect(-hw, -th, hw * 2, th * 2);
        g.beginPath(); g.moveTo(-hw, 0); g.lineTo(hw, 0); g.lineWidth = 1.4; g.stroke();
      }
      g.restore();
    }
  }

  // ---- per-wall dimensions (offset outside each wall) ----------------------
  const dimText = (px, py, ang, text, offPx) => {
    let rot = ang;
    if (rot > Math.PI / 2 || rot < -Math.PI / 2) rot += Math.PI;
    g.save();
    g.translate(px, py);
    g.rotate(rot);
    g.font = '600 22px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = INK;
    g.fillText(text, 0, offPx);
    g.restore();
  };
  for (const w of walls) {
    const len = wallLength(w);
    if (len < 40) continue;
    const ang = wallAngle(w);
    const off = ((w.thickness || 12) / 2 + 26) * scale + 12;
    const mx = (w.ax + w.bx) / 2 + Math.sin(ang) * ((w.thickness || 12) / 2 + 26);
    const my = (w.ay + w.by) / 2 - Math.cos(ang) * ((w.thickness || 12) / 2 + 26);
    dimText(X(mx), Y(my), ang, fmtLen(len), 0);
  }

  // ---- saved dimension annotations -----------------------------------------
  g.strokeStyle = INK;
  for (const d of dims) {
    const ax = X(d.ax), ay = Y(d.ay), bx = X(d.bx), by = Y(d.by);
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len, off = (d.off ?? 40) * scale;
    const A = [ax + nx * off, ay + ny * off], B = [bx + nx * off, by + ny * off];
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(ax, ay); g.lineTo(A[0], A[1]);
    g.moveTo(bx, by); g.lineTo(B[0], B[1]);
    g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]);
    g.stroke();
    // arrow ticks
    for (const [px, py] of [A, B]) {
      g.beginPath();
      g.moveTo(px - 7, py + 7); g.lineTo(px + 7, py - 7);
      g.stroke();
    }
    const worldLen = Math.hypot(d.bx - d.ax, d.by - d.ay);
    dimText((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, Math.atan2(dy, dx), fmtLen(worldLen), -16);
  }

  // ---- room names + areas ---------------------------------------------------
  for (const r of rooms) {
    const name = styles[r.key]?.name || 'Room';
    const area = Math.abs(polygonArea(r.polygon));
    g.font = '700 30px system-ui, sans-serif';
    g.fillStyle = INK;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(name.toUpperCase(), X(r.centroid.x), Y(r.centroid.y) - 18);
    g.font = '400 24px system-ui, sans-serif';
    g.fillStyle = '#3c4046';
    g.fillText(fmtArea(area), X(r.centroid.x), Y(r.centroid.y) + 18);
  }

  // ---- scale bar + title block ---------------------------------------------
  const barCm = 304.8; // 10 ft (reads fine in metric too via the label)
  const barPx = barCm * scale;
  const bx0 = 110, by0 = SHEET_H - 130;
  g.fillStyle = INK;
  g.fillRect(bx0, by0, barPx / 2, 10);
  g.strokeStyle = INK; g.lineWidth = 2;
  g.strokeRect(bx0 + barPx / 2, by0, barPx / 2, 10);
  g.font = '600 24px system-ui, sans-serif';
  g.textAlign = 'left'; g.textBaseline = 'bottom';
  g.fillText(`0 ————— ${fmtLen(barCm)}`, bx0, by0 - 8);

  const tbW = 720, tbH = 130;
  const tx = SHEET_W - 60 - tbW, ty = SHEET_H - 60 - tbH;
  g.strokeStyle = INK; g.lineWidth = 3;
  g.strokeRect(tx, ty, tbW, tbH);
  g.beginPath(); g.moveTo(tx, ty + 62); g.lineTo(tx + tbW, ty + 62); g.stroke();
  g.font = '800 34px system-ui, sans-serif';
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText((project.name || 'Untitled project').slice(0, 34), tx + 22, ty + 32);
  g.font = '500 24px system-ui, sans-serif';
  const lvlName = project.levels.length > 1 ? `Floor ${levelIndex === 0 ? 'G' : levelIndex}` : 'Floor plan';
  g.fillText(`${lvlName} · ${new Date().toLocaleDateString()} · Honeycutt Home Studio`, tx + 22, ty + 96);

  return canvas;
}
