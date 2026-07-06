// Procedural texture engine. Every material in the app is generated at runtime
// on canvases (color + bump), so the app ships with zero binary assets while
// still looking like real wood, stone, tile, fabric and brick.

const SIZE = 512;
const canvasCache = new Map(); // matId -> {color, bump}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable value noise with octaves. Returns fn(x, y) in [0,1] for x,y in [0,1). */
function makeNoise(seed, cells = 8, octaves = 4) {
  const rand = mulberry32(seed);
  const layers = [];
  let c = cells;
  for (let o = 0; o < octaves; o++) {
    const grid = new Float32Array(c * c);
    for (let i = 0; i < grid.length; i++) grid[i] = rand();
    layers.push({ grid, c });
    c *= 2;
  }
  const smooth = t => t * t * (3 - 2 * t);
  return (x, y) => {
    let v = 0, amp = 0.5, tot = 0;
    for (const { grid, c } of layers) {
      const gx = ((x * c) % c + c) % c, gy = ((y * c) % c + c) % c;
      const x0 = Math.floor(gx), y0 = Math.floor(gy);
      const x1 = (x0 + 1) % c, y1 = (y0 + 1) % c;
      const fx = smooth(gx - x0), fy = smooth(gy - y0);
      const a = grid[y0 * c + x0], b = grid[y0 * c + x1];
      const d = grid[y1 * c + x0], e = grid[y1 * c + x1];
      v += ((a + (b - a) * fx) + ((d + (e - d) * fx) - (a + (b - a) * fx)) * fy) * amp;
      tot += amp;
      amp *= 0.5;
    }
    return v / tot;
  };
}

function canvasPair(size = SIZE) {
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    return c;
  };
  return { color: mk(), bump: mk() };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}

function rgb(c) {
  return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
}

// ---------------------------------------------------------------------------
// Generators. Each receives (colorCtx, bumpCtx, params) and paints SIZE x SIZE.
// ---------------------------------------------------------------------------

function genWoodPlanks(ctx, bctx, p) {
  const S = ctx.canvas.width;
  const rand = mulberry32(p.seed);
  const noise = makeNoise(p.seed + 7, 4, 4);
  const grainN = makeNoise(p.seed + 31, 3, 3);
  const poreN = makeNoise(p.seed + 53, 48, 2);
  const base = hexToRgb(p.base), dark = hexToRgb(p.dark), light = hexToRgb(p.light);
  const plankW = S / p.planks;
  const img = ctx.createImageData(S, S);
  const bimg = bctx.createImageData(S, S);
  // per-plank data: tone offset, grain phase, streak frequency, butt-joint pos
  const planks = [];
  for (let i = 0; i < p.planks; i++) {
    planks.push({ tone: (rand() - 0.5) * 0.5, phase: rand() * 10, freq: 4 + rand() * 7, joint: rand() });
  }
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const pi = Math.min(p.planks - 1, Math.floor(x / plankW));
      const pl = planks[pi];
      const u = x / S, v = y / S;
      const lx = (x - pi * plankW) / plankW; // 0..1 across the board
      // domain-warped cathedral grain, streak frequency varies per plank
      const warp = noise(u * 2 + pl.phase, v * 0.28 + pl.phase);
      const cath = grainN(lx * 1.4 + pl.phase, v * 0.45);
      let streak = Math.abs(Math.sin((cath * 3 + warp * 1.6 + v * pl.freq + pl.phase) * Math.PI));
      streak = Math.pow(streak, 0.4);
      const pore = poreN(u * 3, v * 0.8) - 0.5; // fine open-grain pores
      let col = mix(mix(dark, base, streak), light, noise(u * 8, v * 8) * 0.3);
      col = mix(col, pl.tone > 0 ? light : dark, Math.abs(pl.tone));
      // subtle rounded-board sheen: centre of each plank a touch brighter
      const centre = 1 - Math.abs(lx - 0.5) * 2;
      col = mix(col, light, centre * 0.06);
      col = [col[0] - pore * 11, col[1] - pore * 9, col[2] - pore * 6];
      const h = 138 + streak * 55 - Math.abs(pore) * 34 + centre * 8;
      const idx = (y * S + x) * 4;
      img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
      bimg.data[idx] = bimg.data[idx + 1] = bimg.data[idx + 2] = h; bimg.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  bctx.putImageData(bimg, 0, 0);

  // recessed plank seams with a lit chamfer on one side (bevel/gap shadow)
  const seamW = Math.max(1.5, S / 320);
  for (let i = 0; i <= p.planks; i++) {
    const x = i * plankW;
    ctx.fillStyle = 'rgba(18,12,7,0.6)';
    ctx.fillRect(x - seamW / 2, 0, seamW, S);
    ctx.fillStyle = 'rgba(255,240,208,0.09)';
    ctx.fillRect(x + seamW / 2, 0, seamW * 0.8, S);
    bctx.fillStyle = 'rgb(22,22,22)';
    bctx.fillRect(x - seamW / 2, 0, seamW, S);
  }
  // butt (end) joints, one per plank, recessed
  for (let i = 0; i < p.planks; i++) {
    const jy = (planks[i].joint) * S;
    ctx.fillStyle = 'rgba(18,12,7,0.55)';
    ctx.fillRect(i * plankW, jy - seamW / 2, plankW, seamW);
    bctx.fillStyle = 'rgb(26,26,26)';
    bctx.fillRect(i * plankW, jy - seamW / 2, plankW, seamW);
  }

  // knots: darker cores with concentric growth rings, sunk into the bump map
  for (let i = 0; i < p.planks; i++) {
    if (rand() < 0.5) continue;
    const knots = 1 + (rand() < 0.25 ? 1 : 0);
    for (let k = 0; k < knots; k++) {
      const kx = i * plankW + plankW * (0.22 + rand() * 0.56);
      const ky = rand() * S;
      const kr = 3 + rand() * 5;
      const grd = ctx.createRadialGradient(kx, ky, 0.5, kx, ky, kr * 1.6);
      grd.addColorStop(0, 'rgba(38,22,10,0.88)');
      grd.addColorStop(0.45, 'rgba(62,38,20,0.5)');
      grd.addColorStop(0.75, 'rgba(96,64,36,0.22)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(kx, ky, kr, kr * 1.7, 0, 0, Math.PI * 2);
      ctx.fill();
      // growth rings swirling around the knot
      ctx.strokeStyle = 'rgba(48,30,16,0.3)';
      for (let ring = 1; ring <= 3; ring++) {
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(kx, ky, kr * (0.5 + ring * 0.55), kr * (0.9 + ring * 1.0), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      bctx.fillStyle = 'rgba(0,0,0,0.4)';
      bctx.beginPath();
      bctx.ellipse(kx, ky, kr, kr * 1.7, 0, 0, Math.PI * 2);
      bctx.fill();
    }
  }
}

function genHerringbone(ctx, bctx, p) {
  const S = ctx.canvas.width;
  const base = hexToRgb(p.base), dark = hexToRgb(p.dark), light = hexToRgb(p.light);
  const noise = makeNoise(p.seed, 6, 4);
  ctx.fillStyle = rgb(mix(dark, [0, 0, 0], 0.35)); // deep recessed gaps
  ctx.fillRect(0, 0, S, S);
  bctx.fillStyle = 'rgb(22,22,22)';
  bctx.fillRect(0, 0, S, S);
  const bw = S / 8, bl = bw * 4; // block width / length
  const rand = mulberry32(p.seed + 3);
  const drawBlock = (cx, cy, ang) => {
    for (const c of [ctx, bctx]) {
      c.save();
      c.translate(cx, cy);
      c.rotate(ang);
      if (c === ctx) {
        const t = rand();
        const col = mix(mix(dark, base, 0.35 + t * 0.65), light, rand() * 0.35);
        // grain runs along the board length with a satin cross-sheen
        const gradient = c.createLinearGradient(0, -bw / 2, 0, bw / 2);
        gradient.addColorStop(0, rgb(mix(col, light, 0.16)));
        gradient.addColorStop(0.45, rgb(col));
        gradient.addColorStop(1, rgb(mix(col, dark, 0.22)));
        c.fillStyle = gradient;
      } else {
        c.fillStyle = 'rgb(180,180,180)';
      }
      c.fillRect(-bl / 2 + 1.2, -bw / 2 + 1.2, bl - 2.4, bw - 2.4);
      if (c === ctx) {
        // lengthwise grain streaks
        c.strokeStyle = 'rgba(58,38,20,0.22)';
        c.lineWidth = 0.9;
        for (let s = 0; s < 6; s++) {
          const yy = -bw / 2 + 2 + rand() * (bw - 4);
          c.beginPath();
          c.moveTo(-bl / 2 + 2, yy);
          c.bezierCurveTo(-bl / 4, yy + (rand() - 0.5) * 4, bl / 4, yy + (rand() - 0.5) * 4, bl / 2 - 2, yy);
          c.stroke();
        }
        // lit top-left chamfer + shadowed bottom-right (bevel)
        c.fillStyle = 'rgba(255,244,214,0.10)';
        c.fillRect(-bl / 2 + 1.2, -bw / 2 + 1.2, bl - 2.4, 1.4);
        c.fillStyle = 'rgba(0,0,0,0.16)';
        c.fillRect(-bl / 2 + 1.2, bw / 2 - 2.6, bl - 2.4, 1.4);
      } else {
        c.fillStyle = 'rgb(120,120,120)';
        c.fillRect(-bl / 2 + 1.2, bw / 2 - 2.6, bl - 2.4, 1.4);
      }
      c.restore();
    }
  };
  const step = bw * Math.SQRT2;
  for (let row = -2; row < S / step + 4; row++) {
    for (let col = -2; col < S / step + 4; col++) {
      const x = col * step * 2, y = row * step;
      drawBlock(x + step, y, Math.PI / 4);
      drawBlock(x + step * 2, y + step * 0, -Math.PI / 4);
      drawBlock(x + step * 2 + step, y + step, Math.PI / 4);
      drawBlock(x + step, y + step, -Math.PI / 4);
    }
  }
  // subtle overall tonal drift
  const img = ctx.getImageData(0, 0, S, S);
  for (let y = 0; y < S; y += 2) {
    for (let x = 0; x < S; x += 2) {
      const n = (noise(x / S, y / S) - 0.5) * 20;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const idx = ((y + dy) * S + x + dx) * 4;
        img.data[idx] += n; img.data[idx + 1] += n; img.data[idx + 2] += n;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

function genTiles(ctx, bctx, p) {
  const S = ctx.canvas.width;
  const n = p.count;
  const tile = S / n;
  const rand = mulberry32(p.seed);
  const noise = makeNoise(p.seed + 11, 8, 3);
  const grout = hexToRgb(p.grout);
  ctx.fillStyle = rgb(mix(grout, [0, 0, 0], 0.16));
  ctx.fillRect(0, 0, S, S);
  bctx.fillStyle = 'rgb(22,22,22)'; // deep recessed grout
  bctx.fillRect(0, 0, S, S);
  const colors = p.colors.map(hexToRgb);
  for (let ty = 0; ty < n; ty++) {
    for (let tx = 0; tx < n; tx++) {
      const alt = p.checker ? (tx + ty) % 2 : Math.floor(rand() * colors.length) % colors.length;
      const base = colors[alt % colors.length];
      const v = (rand() - 0.5) * (p.variation ?? 14);
      const col = [base[0] + v, base[1] + v, base[2] + v];
      // tiny per-tile size jitter (never eats into the grout line)
      const jx = (rand() - 0.5) * tile * 0.025, jy = (rand() - 0.5) * tile * 0.025;
      const x = tx * tile + p.gap + Math.max(0, jx), y = ty * tile + p.gap + Math.max(0, jy);
      const s = tile - p.gap * 2 - Math.abs(jx) - Math.abs(jy);
      const grd = ctx.createLinearGradient(x, y, x + s, y + s);
      grd.addColorStop(0, rgb(mix(col, [255, 255, 255], 0.12)));
      grd.addColorStop(0.5, rgb(col));
      grd.addColorStop(1, rgb(mix(col, [0, 0, 0], 0.09)));
      ctx.fillStyle = grd;
      ctx.fillRect(x, y, s, s);
      if (p.marbled) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, s, s);
        ctx.clip();
        ctx.strokeStyle = 'rgba(120,120,130,0.35)';
        for (let vI = 0; vI < 3; vI++) {
          ctx.lineWidth = 0.6 + rand();
          ctx.beginPath();
          let vx = x + rand() * s, vy = y;
          ctx.moveTo(vx, vy);
          while (vy < y + s) {
            vy += 6 + rand() * 10;
            vx += (rand() - 0.5) * 18;
            ctx.lineTo(vx, vy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      // soft glaze highlight in the upper-left (ceramic sheen)
      const gl = ctx.createRadialGradient(x + s * 0.3, y + s * 0.26, 1, x + s * 0.32, y + s * 0.3, s * 0.75);
      gl.addColorStop(0, 'rgba(255,255,255,0.20)');
      gl.addColorStop(0.5, 'rgba(255,255,255,0.03)');
      gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(x, y, s, s);
      // bump: tile face raised, with a chamfered (darker) edge
      bctx.fillStyle = 'rgb(210,210,210)';
      bctx.fillRect(x, y, s, s);
      const bev = Math.max(1, s * 0.04);
      bctx.strokeStyle = 'rgba(96,96,96,0.7)';
      bctx.lineWidth = bev;
      bctx.strokeRect(x + bev / 2, y + bev / 2, s - bev, s - bev);
    }
  }
  // fine glaze speckle
  const img = ctx.getImageData(0, 0, S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const px = (i / 4) % S, py = Math.floor(i / 4 / S);
    const d = (noise(px / S, py / S) - 0.5) * (p.speckle ?? 8);
    img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d;
  }
  ctx.putImageData(img, 0, 0);
}

function genMarble(ctx, bctx, p) {
  // Layered turbulent veining: a couple of bold major veins, a spray of fine
  // capillaries, a soft colour-bleed halo, over a cloudy translucent base.
  // All sine terms use integer frequencies so the tile stays seamless-ish.
  const S = ctx.canvas.width;
  const nWarp = makeNoise(p.seed, 3, 5);
  const nWarp2 = makeNoise(p.seed + 41, 5, 4);
  const nCloud = makeNoise(p.seed + 99, 4, 4);
  const nCloud2 = makeNoise(p.seed + 71, 3, 4);
  const nCap = makeNoise(p.seed + 137, 8, 3);
  const base = hexToRgb(p.base), vein = hexToRgb(p.vein), tint = hexToRgb(p.tint);
  const drift = mix(base, [0, 0, 0], 0.10);
  const bleed = mix(vein, tint, 0.5);
  const sharp = p.sharp ?? 9;
  const vs = p.veinStrength ?? 0.9;
  const img = ctx.createImageData(S, S);
  const bimg = bctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S;
      const w1 = (nWarp(u, v) - 0.5) * 4.2;          // big organic wander
      const w2 = (nWarp2(u * 1.0, v * 1.0) - 0.5) * 2.2;
      // cloudy translucent base
      const cloud = nCloud(u * 2, v * 2);
      let col = mix(base, tint, cloud * 0.6);
      col = mix(col, drift, Math.pow(nCloud2(u * 1, v * 1), 2) * 0.28);
      // major veins (two directions): a sharp core riding a wider soft body
      const d1 = 1 - Math.abs(Math.sin((u * 2 + v * 1 + w1) * Math.PI));
      const d2 = 1 - Math.abs(Math.sin((u * 1 - v * 2 + w1 * 0.8 + 0.35) * Math.PI));
      const core = Math.min(1, Math.pow(d1, sharp) + Math.pow(d2, sharp + 3) * 0.7);
      const body = Math.min(1, Math.pow(d1, sharp * 0.4) * 0.6 + Math.pow(d2, sharp * 0.4) * 0.4);
      // capillaries: fine hairlines, tightly gated so they only cluster near veins
      const gate = Math.max(0, nCap(u * 3, v * 3) - 0.5) * 2;
      let c1 = Math.pow(1 - Math.abs(Math.sin((u * 5 - v * 3 + w1 * 1.4 + w2) * Math.PI)), 26);
      let c2 = Math.pow(1 - Math.abs(Math.sin((u * 3 + v * 6 + w2 * 2) * Math.PI)), 30);
      const cap = Math.min(1, (c1 + c2) * gate);
      // compose: soft body bleed, hairline capillaries, then the bold vein core
      col = mix(col, bleed, body * 0.32 * vs);
      col = mix(col, vein, Math.min(1, cap * 0.5) * vs);
      col = mix(col, vein, core * vs);
      const major = core;
      const idx = (y * S + x) * 4;
      img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
      const h = 192 - major * 26 - cap * 14 + (cloud - 0.5) * 18;
      bimg.data[idx] = bimg.data[idx + 1] = bimg.data[idx + 2] = h; bimg.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  bctx.putImageData(bimg, 0, 0);
}

function genBrick(ctx, bctx, p) {
  const S = ctx.canvas.width;
  const rand = mulberry32(p.seed);
  const rows = p.rows, bw = S / p.cols, bh = S / rows;
  const mortar = hexToRgb(p.mortar);
  ctx.fillStyle = rgb(mortar);
  ctx.fillRect(0, 0, S, S);
  bctx.fillStyle = 'rgb(30,30,30)'; // deeply recessed mortar joint
  bctx.fillRect(0, 0, S, S);
  const colors = p.colors.map(hexToRgb);
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * bw / 2;
    for (let c = -1; c < p.cols + 1; c++) {
      const base = colors[Math.floor(rand() * colors.length)];
      const v = (rand() - 0.5) * 28; // stronger per-brick tone spread
      const col = [base[0] + v, base[1] + v, base[2] + v];
      const x = c * bw + off + p.gap, y = r * bh + p.gap;
      const w = bw - p.gap * 2, h = bh - p.gap * 2;
      const grd = ctx.createLinearGradient(x, y, x, y + h);
      grd.addColorStop(0, rgb(mix(col, [255, 255, 255], 0.10)));
      grd.addColorStop(0.5, rgb(col));
      grd.addColorStop(1, rgb(mix(col, [0, 0, 0], 0.16)));
      ctx.fillStyle = grd;
      ctx.fillRect(x, y, w, h);
      // weathering blotches — soft light efflorescence + dark damp patches
      const wr = mulberry32((r * 97 + c * 131 + p.seed) >>> 0);
      for (let s = 0; s < 3; s++) {
        const bx = x + wr() * w, by = y + wr() * h, br = 4 + wr() * 14;
        const st = ctx.createRadialGradient(bx, by, 1, bx, by, br);
        st.addColorStop(0, wr() < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,250,240,0.07)');
        st.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = st;
        ctx.fillRect(bx - br, by - br, br * 2, br * 2);
      }
      // pitting
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      for (let s = 0; s < 16; s++) {
        ctx.fillRect(x + rand() * w, y + rand() * h, 1 + rand() * 2, 1 + rand() * 2);
      }
      // lit top bevel
      ctx.fillStyle = 'rgba(255,250,240,0.10)';
      ctx.fillRect(x, y, w, Math.max(1, h * 0.07));
      // bump: face proud, bottom edge stepped down toward the joint
      bctx.fillStyle = 'rgb(180,180,180)';
      bctx.fillRect(x, y, w, h);
      bctx.fillStyle = 'rgba(90,90,90,0.7)';
      bctx.fillRect(x, y + h - Math.max(1, h * 0.14), w, Math.max(1, h * 0.14));
    }
  }
}

function genCarpet(ctx, bctx, p) {
  const S = ctx.canvas.width;
  const rand = mulberry32(p.seed);
  const fiber = makeNoise(p.seed, 48, 3);      // fine pile fibres
  const micro = makeNoise(p.seed + 17, 128, 2); // lit fibre tips
  const patch = makeNoise(p.seed + 5, 6, 3);   // broad tonal patchiness
  const base = hexToRgb(p.base), dark = hexToRgb(p.dark);
  const light = mix(base, [255, 255, 255], 0.28);
  const img = ctx.createImageData(S, S);
  const bimg = bctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S;
      const f = fiber(u, v), m = micro(u, v), pt = patch(u, v);
      let col = mix(dark, base, 0.4 + f * 0.6);
      col = mix(col, light, Math.pow(m, 2) * 0.4);        // catching-light tips
      col = mix(col, dark, Math.pow(1 - pt, 2) * 0.22);   // shaded low patches
      const sheen = Math.sin(v * S * 0.5) * 2;            // faint directional nap
      const idx = (y * S + x) * 4;
      img.data[idx] = col[0] + sheen; img.data[idx + 1] = col[1] + sheen; img.data[idx + 2] = col[2] + sheen; img.data[idx + 3] = 255;
      const h = 105 + f * 85 + m * 40;                    // pile height => real bump
      bimg.data[idx] = bimg.data[idx + 1] = bimg.data[idx + 2] = h; bimg.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  bctx.putImageData(bimg, 0, 0);
  // cut-pile fleck pass: thousands of tiny upright nap strokes
  ctx.lineCap = 'round';
  const flecks = Math.round(S * S / 90);
  for (let i = 0; i < flecks; i++) {
    const x = rand() * S, y = rand() * S;
    const c = rand() < 0.5 ? light : dark;
    ctx.strokeStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${0.14 + rand() * 0.2})`;
    ctx.lineWidth = 0.6 + rand() * 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 2, y - 1 - rand() * 2);
    ctx.stroke();
  }
}

function genConcrete(ctx, bctx, p) {
  const S = ctx.canvas.width;
  const noise = makeNoise(p.seed, 6, 5);
  const noise2 = makeNoise(p.seed + 21, 24, 2);
  const rand = mulberry32(p.seed + 3);
  const base = hexToRgb(p.base);
  const img = ctx.createImageData(S, S);
  const bimg = bctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S;
      const large = (noise(u, v) - 0.5) * 30;
      const fine = (noise2(u, v) - 0.5) * 14;
      const col = [base[0] + large + fine, base[1] + large + fine, base[2] + large + fine];
      const idx = (y * S + x) * 4;
      img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
      const h = 165 + large * 1.3 + fine * 0.8;
      bimg.data[idx] = bimg.data[idx + 1] = bimg.data[idx + 2] = h; bimg.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  bctx.putImageData(bimg, 0, 0);
  // broad soft stains — damp / cure marks that break the flat mottle
  for (let i = 0; i < 10; i++) {
    const x = rand() * S, y = rand() * S, r = S * (0.1 + rand() * 0.25);
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, rand() < 0.6 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // fine aggregate pin-speckle (sand grains — light quartz + dark flecks)
  const spk = Math.round(S * S / 40);
  for (let i = 0; i < spk; i++) {
    const x = rand() * S, y = rand() * S;
    const lit = rand() < 0.5;
    const t = lit ? 22 + rand() * 22 : -(16 + rand() * 20);
    ctx.fillStyle = `rgba(${base[0] + t | 0},${base[1] + t | 0},${base[2] + t | 0},0.5)`;
    ctx.fillRect(x, y, 1, 1);
    const bv = lit ? 195 : 130;
    bctx.fillStyle = `rgba(${bv},${bv},${bv},0.4)`;
    bctx.fillRect(x, y, 1, 1);
  }
  if (p.trowel) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#ffffff';
    for (let i = 0; i < 24; i++) {
      ctx.lineWidth = 8 + rand() * 30;
      ctx.beginPath();
      ctx.arc(rand() * S, rand() * S, 60 + rand() * 200, rand() * 7, rand() * 7 + 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function genPaint(ctx, bctx, p) {
  const S = ctx.canvas.width;
  const noise = makeNoise(p.seed ?? 40, 16, 3);
  const fine = makeNoise((p.seed ?? 40) + 5, 96, 2); // roller orange-peel stipple
  const base = hexToRgb(p.base);
  const img = ctx.createImageData(S, S);
  const bimg = bctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S;
      const d = (noise(u, v) - 0.5) * 8;
      const stipple = (fine(u, v) - 0.5) * 5;
      const idx = (y * S + x) * 4;
      img.data[idx] = base[0] + d + stipple; img.data[idx + 1] = base[1] + d + stipple; img.data[idx + 2] = base[2] + d + stipple;
      img.data[idx + 3] = 255;
      const h = 128 + stipple * 3 + (noise(u, v) - 0.5) * 8;
      bimg.data[idx] = bimg.data[idx + 1] = bimg.data[idx + 2] = h; bimg.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  bctx.putImageData(bimg, 0, 0);
}

function genStripes(ctx, bctx, p) {
  const S = ctx.canvas.width;
  genPaint(ctx, bctx, { base: p.base, seed: p.seed });
  const stripe = hexToRgb(p.stripe);
  const n = p.count ?? 8;
  const w = S / n;
  for (let i = 0; i < n; i += 2) {
    // soft-shaded stripe (slightly darker at the edges) reads as printed paper
    const g = ctx.createLinearGradient(i * w, 0, (i + 1) * w, 0);
    g.addColorStop(0, `rgba(${stripe[0]},${stripe[1]},${stripe[2]},0.78)`);
    g.addColorStop(0.5, `rgba(${stripe[0]},${stripe[1]},${stripe[2]},0.92)`);
    g.addColorStop(1, `rgba(${stripe[0]},${stripe[1]},${stripe[2]},0.78)`);
    ctx.fillStyle = g;
    ctx.fillRect(i * w, 0, w, S);
  }
}

function genFabric(ctx, bctx, p) {
  // believable woven cloth: interlacing warp/weft threads with thread
  // highlights and a matching weave bump so raking light catches the nubs
  const S = ctx.canvas.width;
  const noise = makeNoise(p.seed, 20, 2);
  const slub = makeNoise(p.seed + 13, 8, 2); // slub / broad tonal variation
  const base = hexToRgb(p.base);
  const hi = mix(base, [255, 255, 255], 0.22);
  const lo = mix(base, [0, 0, 0], 0.30);
  const thread = Math.max(2.2, S / 170); // thread pitch in px
  const img = ctx.createImageData(S, S);
  const bimg = bctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S;
      // rounded thread cross-sections along each axis
      const wx = Math.sin((x / thread) * Math.PI); // warp bump across x
      const wy = Math.sin((y / thread) * Math.PI); // weft bump across y
      // plain-weave interlace: alternate which thread rides on top
      const cellX = Math.floor(x / thread), cellY = Math.floor(y / thread);
      const warpUp = (cellX + cellY) % 2 === 0;
      const over = warpUp ? Math.abs(wx) : Math.abs(wy);
      const under = warpUp ? Math.abs(wy) : Math.abs(wx);
      const lit = over * over;          // top thread catches light
      const shade = (1 - under) * 0.5;  // gap between threads sits in shadow
      let col = mix(lo, base, 0.55 + slub(u * 2, v * 2) * 0.25);
      col = mix(col, hi, lit * 0.5);
      col = mix(col, lo, shade * 0.4);
      const n = (noise(u, v) - 0.5) * 10;
      const idx = (y * S + x) * 4;
      img.data[idx] = col[0] + n; img.data[idx + 1] = col[1] + n; img.data[idx + 2] = col[2] + n; img.data[idx + 3] = 255;
      const h = 96 + over * 110 - under * 20;
      bimg.data[idx] = bimg.data[idx + 1] = bimg.data[idx + 2] = h; bimg.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  bctx.putImageData(bimg, 0, 0);
}

function genGrass(ctx, bctx, p) {
  // lifelike lawn: layered ground tones + thousands of individual blade
  // strokes with natural hue drift, clumping and soft shadowing
  const S = ctx.canvas.width; // grass renders at higher resolution
  const rand = mulberry32(p.seed);
  const patchNoise = makeNoise(p.seed + 4, 4, 4);    // broad dry/lush patches
  const clumpNoise = makeNoise(p.seed + 9, 16, 3);   // clumps
  const fineNoise = makeNoise(p.seed + 13, 64, 2);   // soil / thatch detail
  // earthy, desaturated tones — vivid greens read as cartoon grass
  const soil = hexToRgb(p.soil || '#3a3f28');
  const lush = hexToRgb(p.lush || '#4d633a');
  const mid = hexToRgb(p.mid || '#5d7347');
  const dry = hexToRgb(p.dry || '#7f814f');
  const warm = p.bladeWarm ?? 0.52; // higher = yellower blades
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S;
      const patch = patchNoise(u, v);
      const clump = clumpNoise(u, v);
      const fine = fineNoise(u, v);
      let col = mix(lush, dry, Math.pow(patch, 2.2) * 0.85);
      col = mix(col, mid, clump * 0.5);
      col = mix(col, soil, Math.pow(1 - clump, 3) * 0.45);
      const d = (fine - 0.5) * 26;
      const idx = (y * S + x) * 4;
      img.data[idx] = col[0] + d;
      img.data[idx + 1] = col[1] + d;
      img.data[idx + 2] = col[2] + d * 0.8;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // blade pass: short curved strokes, dark under-blades first then lit tips
  const blade = (shadow) => {
    const bx = rand() * S, by = rand() * S;
    const len = 5 + rand() * 11;
    const lean = (rand() - 0.5) * 8;
    const g = 78 + rand() * 90;
    const r = g * (warm + rand() * 0.2);
    const b = g * (0.30 + rand() * 0.14);
    ctx.strokeStyle = shadow
      ? `rgba(${r * 0.35 | 0},${g * 0.38 | 0},${b * 0.35 | 0},0.5)`
      : `rgba(${r | 0},${g | 0},${b | 0},${0.5 + rand() * 0.4})`;
    ctx.lineWidth = shadow ? 1.6 : 0.7 + rand() * 0.9;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + lean * 0.4, by - len * 0.6, bx + lean, by - len);
    ctx.stroke();
  };
  ctx.lineCap = 'round';
  for (let i = 0; i < S * 6; i++) blade(true);
  for (let i = 0; i < S * 14; i++) blade(false);

  // bump: clumps read as height so the sun catches the lawn unevenly
  const bimg = bctx.createImageData(bctx.canvas.width, bctx.canvas.height);
  const BS = bctx.canvas.width;
  for (let y = 0; y < BS; y++) {
    for (let x = 0; x < BS; x++) {
      const h = 90 + clumpNoise(x / BS, y / BS) * 90 + (fineNoise(x / BS, y / BS) - 0.5) * 60;
      const idx = (y * BS + x) * 4;
      bimg.data[idx] = bimg.data[idx + 1] = bimg.data[idx + 2] = h;
      bimg.data[idx + 3] = 255;
    }
  }
  bctx.putImageData(bimg, 0, 0);
}

function genSiding(ctx, bctx, p) {
  // horizontal lap siding: each course shades darker toward its bottom edge,
  // with a hard drop-shadow line where the next board laps beneath it
  const S = ctx.canvas.width;
  genPaint(ctx, bctx, { base: p.base, seed: p.seed });
  const rand = mulberry32(p.seed + 3);
  const courses = p.courses ?? 8;
  const ch = S / courses;
  const base = hexToRgb(p.base);
  for (let i = 0; i < courses; i++) {
    const y = i * ch;
    const tone = (rand() - 0.5) * 0.06; // faint course-to-course tone variation
    const bcol = mix(base, tone > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(tone));
    const grd = ctx.createLinearGradient(0, y, 0, y + ch);
    grd.addColorStop(0, rgb(mix(bcol, [255, 255, 255], 0.11)));
    grd.addColorStop(0.82, rgb(mix(bcol, [0, 0, 0], 0.04)));
    grd.addColorStop(1, rgb(mix(bcol, [0, 0, 0], 0.34)));
    ctx.fillStyle = grd;
    ctx.fillRect(0, y, S, ch);
    // faint wood streaks along each board
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#000';
    for (let s = 0; s < 5; s++) {
      ctx.fillRect(0, y + rand() * ch, S, 1);
    }
    ctx.globalAlpha = 1;
    // crisp shadow line at the lap
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, y + ch - Math.max(1, ch * 0.04), S, Math.max(1, ch * 0.04));
    const bg = bctx.createLinearGradient(0, y, 0, y + ch);
    bg.addColorStop(0, 'rgb(190,190,190)');
    bg.addColorStop(0.85, 'rgb(150,150,150)');
    bg.addColorStop(1, 'rgb(28,28,28)');
    bctx.fillStyle = bg;
    bctx.fillRect(0, y, S, ch);
  }
}

function genBoardBatten(ctx, bctx, p) {
  // vertical board-and-batten: wide boards with raised battens over the seams
  const S = ctx.canvas.width;
  genPaint(ctx, bctx, { base: p.base, seed: p.seed });
  const boards = p.boards ?? 5;
  const bw = S / boards;
  const base = hexToRgb(p.base);
  const rand = mulberry32(p.seed + 4);
  bctx.fillStyle = 'rgb(150,150,150)';
  bctx.fillRect(0, 0, S, S);
  // faint per-board tone variation across the field
  for (let i = 0; i < boards; i++) {
    const tone = (rand() - 0.5) * 0.05;
    ctx.fillStyle = `rgba(${tone > 0 ? 255 : 0},${tone > 0 ? 255 : 0},${tone > 0 ? 255 : 0},${Math.abs(tone)})`;
    ctx.fillRect(i * bw, 0, bw, S);
  }
  for (let i = 0; i < boards; i++) {
    const x = i * bw;
    // recessed seam shadow between boards
    ctx.fillStyle = rgb(mix(base, [0, 0, 0], 0.24));
    ctx.fillRect(x - 2, 0, 4, S);
    // raised batten strip with lit face + shaded sides
    const batW = bw * 0.16;
    ctx.fillStyle = rgb(mix(base, [255, 255, 255], 0.09));
    ctx.fillRect(x - batW / 2, 0, batW, S);
    ctx.fillStyle = rgb(mix(base, [0, 0, 0], 0.26));
    ctx.fillRect(x - batW / 2, 0, 1.5, S);
    ctx.fillRect(x + batW / 2 - 1.5, 0, 1.5, S);
    bctx.fillStyle = 'rgb(30,30,30)';
    bctx.fillRect(x - 2, 0, 4, S);
    bctx.fillStyle = 'rgb(222,222,222)';
    bctx.fillRect(x - batW / 2, 0, batW, S);
  }
}

function genShingles(ctx, bctx, p) {
  // staggered asphalt shingle courses with per-tab tone variation, a strong
  // butt-shadow where each course overhangs the one below, and granule speckle
  const S = ctx.canvas.width;
  const rand = mulberry32(p.seed);
  const rows = p.rows ?? 10, tabs = p.tabs ?? 7;
  const rh = S / rows, tw = S / tabs;
  const base = hexToRgb(p.base);
  ctx.fillStyle = rgb(mix(base, [0, 0, 0], 0.45));
  ctx.fillRect(0, 0, S, S);
  bctx.fillStyle = 'rgb(50,50,50)';
  bctx.fillRect(0, 0, S, S);
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * tw / 2;
    for (let t = -1; t < tabs + 1; t++) {
      const v = (rand() - 0.5) * 32; // stronger per-tab colour spread
      const col = [base[0] + v, base[1] + v, base[2] + v];
      const x = t * tw + off + 1.5, y = r * rh;
      const grd = ctx.createLinearGradient(0, y, 0, y + rh);
      grd.addColorStop(0, rgb(mix(col, [255, 255, 255], 0.06)));
      grd.addColorStop(0.82, rgb(col));
      grd.addColorStop(1, rgb(mix(col, [0, 0, 0], 0.45)));
      ctx.fillStyle = grd;
      ctx.fillRect(x, y, tw - 3, rh - 1.5);
      // keyway gap between tabs (dark slot)
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x - 1.5, y, 1.6, rh - 1.5);
      // granule speckle (light + dark grains)
      for (let s = 0; s < 30; s++) {
        const lit = rand() < 0.5;
        ctx.fillStyle = lit ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)';
        ctx.fillRect(x + rand() * (tw - 3), y + rand() * rh, 1, 1);
      }
      bctx.fillStyle = 'rgb(175,175,175)';
      bctx.fillRect(x, y, tw - 3, rh - 1.5);
    }
    // drop-shadow cast by this course's butt edge onto the course below
    const sy = (r + 1) * rh;
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.fillRect(0, sy - Math.max(1.5, rh * 0.09), S, Math.max(1.5, rh * 0.09));
    bctx.fillStyle = 'rgb(30,30,30)';
    bctx.fillRect(0, sy - Math.max(1.5, rh * 0.07), S, Math.max(1.5, rh * 0.07));
  }
}

function genStone(ctx, bctx, p) {
  // irregular stacked stone veneer on a deeply-recessed mortar bed
  const S = ctx.canvas.width;
  const rand = mulberry32(p.seed);
  const mortar = hexToRgb(p.mortar || '#8f887c');
  ctx.fillStyle = rgb(mix(mortar, [0, 0, 0], 0.12));
  ctx.fillRect(0, 0, S, S);
  bctx.fillStyle = 'rgb(34,34,34)';
  bctx.fillRect(0, 0, S, S);
  const colors = (p.colors || ['#a89c88', '#918776', '#b5a996', '#7e7669']).map(hexToRgb);
  const rows = p.rows ?? 6;
  const rh = S / rows;
  const sc = S / 512; // keep stone sizes proportional at any res
  for (let r = 0; r < rows; r++) {
    let x = -rand() * 40 * sc;
    while (x < S) {
      const w = (50 + rand() * 90) * sc;
      const h = rh * (0.82 + rand() * 0.14);
      const y = r * rh + rh * 0.06;
      const base = colors[Math.floor(rand() * colors.length)];
      const v = (rand() - 0.5) * 26; // stronger per-stone tone spread
      const weather = rand() < 0.25 ? -10 : 0; // occasional darker weathered stone
      const col = [base[0] + v + weather, base[1] + v + weather, base[2] + v + weather];
      const grd = ctx.createLinearGradient(x, y, x, y + h);
      grd.addColorStop(0, rgb(mix(col, [255, 255, 255], 0.14)));
      grd.addColorStop(1, rgb(mix(col, [0, 0, 0], 0.20)));
      ctx.fillStyle = grd;
      const rr = (6 + rand() * 6) * sc;
      ctx.beginPath();
      ctx.roundRect(x, y, w - 5 * sc, h, rr);
      ctx.fill();
      // contact shadow under each stone (drops into the mortar)
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(x, y + h - 2 * sc, w - 5 * sc, 2.5 * sc);
      // lit top edge
      ctx.fillStyle = 'rgba(255,250,240,0.12)';
      ctx.fillRect(x + 2 * sc, y + 1 * sc, w - 9 * sc, 1.6 * sc);
      // speckle / mineral flecks
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let s = 0; s < 10; s++) {
        ctx.fillRect(x + rand() * w, y + rand() * h, 1.5, 1.5);
      }
      bctx.beginPath();
      bctx.roundRect(x, y, w - 5 * sc, h, rr);
      bctx.fillStyle = 'rgb(195,195,195)';
      bctx.fill();
      bctx.fillStyle = 'rgba(80,80,80,0.7)';
      bctx.fillRect(x, y + h - 2 * sc, w - 5 * sc, 2.5 * sc);
      x += w;
    }
  }
}

// ---- Hardscape: asphalt drives, gravel beds, broom-finished sidewalks -------
// All read ctx.canvas.width so they honour a material's `res` (set 1024 for
// crisp close-ups). Each paints a colour canvas + a matching grayscale bump.

function genAsphalt(ctx, bctx, p) {
  const S = ctx.canvas.width;
  const base = hexToRgb(p.base || '#34353b');
  const rand = mulberry32(p.seed ?? 200);
  const mott = makeNoise((p.seed ?? 200) + 5, 4, 3);   // broad tonal patches / wear
  const img = ctx.createImageData(S, S);
  const bimg = bctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const m = (mott(x / S, y / S) - 0.5) * 20;
      const idx = (y * S + x) * 4;
      img.data[idx] = base[0] + m; img.data[idx + 1] = base[1] + m; img.data[idx + 2] = base[2] + m; img.data[idx + 3] = 255;
      const b = 120 + m * 2;
      bimg.data[idx] = bimg.data[idx + 1] = bimg.data[idx + 2] = b; bimg.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0); bctx.putImageData(bimg, 0, 0);
  // dense aggregate grains — light quartz + dark stone flecks
  const grains = Math.round(S * S / 34);
  for (let i = 0; i < grains; i++) {
    const x = rand() * S, y = rand() * S, r = 0.5 + rand() * 1.5;
    const light = rand() < 0.5;
    const t = light ? 55 + rand() * 55 : -(28 + rand() * 42);
    ctx.fillStyle = `rgba(${base[0] + t | 0},${base[1] + t | 0},${base[2] + t | 0},0.55)`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    const bv = light ? 168 : 92;
    bctx.fillStyle = `rgba(${bv},${bv},${bv},0.5)`;
    bctx.beginPath(); bctx.arc(x, y, r, 0, 7); bctx.fill();
  }
}

function genGravel(ctx, bctx, p) {
  const S = ctx.canvas.width;
  const rand = mulberry32(p.seed ?? 300);
  // dark substrate = the shadow between stones
  ctx.fillStyle = p.gap || '#4a453d'; ctx.fillRect(0, 0, S, S);
  bctx.fillStyle = 'rgb(66,66,66)'; bctx.fillRect(0, 0, S, S);
  const tones = (p.tones || ['#9a938a', '#877f73', '#b3ac9e', '#7c746a', '#a99b87', '#8f8478']).map(hexToRgb);
  const count = Math.round(S * S / 60);
  for (let i = 0; i < count; i++) {
    const x = rand() * S, y = rand() * S;
    const rr = 3 + rand() * 7, ry = rr * (0.6 + rand() * 0.35), ang = rand() * Math.PI;
    const col = tones[(rand() * tones.length) | 0];
    const shade = -14 + rand() * 28;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(28,24,20,0.5)';                              // contact shadow
    ctx.beginPath(); ctx.ellipse(0, ry * 0.4, rr, ry, 0, 0, 7); ctx.fill();
    ctx.fillStyle = `rgb(${col[0] + shade | 0},${col[1] + shade | 0},${col[2] + shade | 0})`;
    ctx.beginPath(); ctx.ellipse(0, 0, rr, ry, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,250,0.16)';                         // top glint
    ctx.beginPath(); ctx.ellipse(-rr * 0.25, -ry * 0.3, rr * 0.5, ry * 0.4, 0, 0, 7); ctx.fill();
    ctx.restore();
    const bv = 150 + shade * 2;
    bctx.save(); bctx.translate(x, y); bctx.rotate(ang);
    bctx.fillStyle = `rgb(${bv | 0},${bv | 0},${bv | 0})`;
    bctx.beginPath(); bctx.ellipse(0, 0, rr, ry, 0, 0, 7); bctx.fill();
    bctx.restore();
  }
}

function genSidewalk(ctx, bctx, p) {
  const S = ctx.canvas.width;
  const base = hexToRgb(p.base || '#bdb9b1');
  const rand = mulberry32(p.seed ?? 400);
  const mott = makeNoise((p.seed ?? 400) + 3, 5, 3);
  const img = ctx.createImageData(S, S);
  const bimg = bctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const m = (mott(x / S, y / S) - 0.5) * 18;
      const broom = Math.sin(y * 0.85 + Math.sin(x * 0.045) * 2) * 4;   // broom finish
      const v = m + broom;
      const idx = (y * S + x) * 4;
      img.data[idx] = base[0] + v; img.data[idx + 1] = base[1] + v; img.data[idx + 2] = base[2] + v; img.data[idx + 3] = 255;
      const b = 142 + broom * 3 + m;
      bimg.data[idx] = bimg.data[idx + 1] = bimg.data[idx + 2] = b; bimg.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0); bctx.putImageData(bimg, 0, 0);
  for (let i = 0; i < S * S / 110; i++) {                              // fine aggregate
    const x = rand() * S, y = rand() * S, t = rand() < 0.5 ? 38 : -28;
    ctx.fillStyle = `rgba(${base[0] + t | 0},${base[1] + t | 0},${base[2] + t | 0},0.4)`;
    ctx.fillRect(x, y, 1, 1);
  }
  // scored control joint framing each poured panel (recessed)
  const lw = Math.max(2, S / 150);
  ctx.strokeStyle = 'rgba(72,68,62,0.55)'; ctx.lineWidth = lw;
  bctx.strokeStyle = 'rgb(46,46,46)'; bctx.lineWidth = lw;
  ctx.strokeRect(lw / 2, lw / 2, S - lw, S - lw);
  bctx.strokeRect(lw / 2, lw / 2, S - lw, S - lw);
}

const GENERATORS = {
  wood: genWoodPlanks,
  siding: genSiding,
  boardbatten: genBoardBatten,
  shingles: genShingles,
  stone: genStone,
  herringbone: genHerringbone,
  tiles: genTiles,
  marble: genMarble,
  brick: genBrick,
  carpet: genCarpet,
  concrete: genConcrete,
  asphalt: genAsphalt,
  gravel: genGravel,
  sidewalk: genSidewalk,
  paint: genPaint,
  stripes: genStripes,
  fabric: genFabric,
  grass: genGrass
};

// ---------------------------------------------------------------------------
// Material registry
// use: 'floor' | 'wall' | 'ground' | 'internal' (furniture fabrics etc.)
// scale: physical size in cm covered by one texture repeat
// ---------------------------------------------------------------------------

export const MATERIALS = [
  // Wood floors
  { id: 'oak', group: 'Wood', name: 'Oak', use: 'floor', gen: 'wood', scale: 240, rough: 0.62, params: { seed: 11, base: '#b58a5c', dark: '#8a6238', light: '#d9b384', planks: 6 } },
  { id: 'walnut', group: 'Wood', name: 'Walnut', use: 'floor', gen: 'wood', scale: 240, rough: 0.55, params: { seed: 23, base: '#6e4a30', dark: '#452b18', light: '#96693f', planks: 6 } },
  { id: 'ash_gray', group: 'Wood', name: 'Ash Grey', use: 'floor', gen: 'wood', scale: 240, rough: 0.66, params: { seed: 31, base: '#a89a8a', dark: '#7d7264', light: '#cfc2b0', planks: 6 } },
  { id: 'honey_pine', group: 'Wood', name: 'Honey Pine', use: 'floor', gen: 'wood', scale: 240, rough: 0.6, params: { seed: 47, base: '#c99a5f', dark: '#9c7038', light: '#e8c288', planks: 8 } },
  { id: 'parquet', group: 'Wood', name: 'Herringbone', use: 'floor', gen: 'herringbone', scale: 180, rough: 0.5, params: { seed: 13, base: '#a97e4f', dark: '#7c5a33', light: '#cfa76f' } },
  { id: 'chevron_blond', group: 'Wood', name: 'Chevron Blond', use: 'floor', gen: 'herringbone', scale: 180, rough: 0.45, params: { seed: 17, base: '#c8a878', dark: '#a08252', light: '#e8cba0' } },
  { id: 'maple', group: 'Wood', name: 'Natural Maple', use: 'floor', gen: 'wood', scale: 240, rough: 0.5, params: { seed: 101, base: '#d9bc94', dark: '#b6976e', light: '#efd9b8', planks: 6 } },
  { id: 'cherry', group: 'Wood', name: 'Cherry', use: 'floor', gen: 'wood', scale: 240, rough: 0.5, params: { seed: 103, base: '#9c5a3c', dark: '#6e3a24', light: '#c07c56', planks: 6 } },
  { id: 'hickory', group: 'Wood', name: 'Rustic Hickory', use: 'floor', gen: 'wood', scale: 260, rough: 0.62, params: { seed: 105, base: '#a5825a', dark: '#6b4c2e', light: '#d3b284', planks: 5 } },
  { id: 'espresso', group: 'Wood', name: 'Espresso', use: 'floor', gen: 'wood', scale: 240, rough: 0.45, params: { seed: 107, base: '#4a352a', dark: '#2e1f16', light: '#6a4f3e', planks: 6 } },
  { id: 'teak', group: 'Wood', name: 'Golden Teak', use: 'floor', gen: 'wood', scale: 240, rough: 0.5, params: { seed: 109, base: '#b08347', dark: '#825c2c', light: '#d8a968', planks: 7 } },
  { id: 'whitewash', group: 'Wood', name: 'Whitewashed', use: 'floor', gen: 'wood', scale: 240, rough: 0.6, params: { seed: 111, base: '#ddd2c2', dark: '#b3a894', light: '#f2ebdf', planks: 5 } },
  { id: 'wide_oak', group: 'Wood', name: 'Wide Plank Oak', use: 'floor', gen: 'wood', scale: 300, rough: 0.55, params: { seed: 113, base: '#b08a5e', dark: '#84643e', light: '#d6b184', planks: 4 } },
  { id: 'barnwood', group: 'Wood', name: 'Barnwood', use: 'floor', gen: 'wood', scale: 300, rough: 0.8, params: { seed: 115, base: '#8a7a68', dark: '#5c5040', light: '#b0a28c', planks: 4 } },
  // Stone / tile floors
  { id: 'tile_white', group: 'Stone & Tile', name: 'Porcelain White', use: 'floor', gen: 'tiles', scale: 120, rough: 0.25, params: { seed: 5, count: 2, gap: 3, grout: '#b9b6ae', colors: ['#e8e6e0'], variation: 8 } },
  { id: 'tile_gray', group: 'Stone & Tile', name: 'Slate Grey', use: 'floor', gen: 'tiles', scale: 120, rough: 0.4, params: { seed: 9, count: 2, gap: 3, grout: '#77746e', colors: ['#9a978f', '#8b8880'], variation: 12 } },
  { id: 'tile_beige', group: 'Stone & Tile', name: 'Travertine', use: 'floor', gen: 'tiles', scale: 120, rough: 0.45, params: { seed: 15, count: 2, gap: 3, grout: '#a99e8c', colors: ['#d6c9b2', '#cbbda4'], variation: 10 } },
  { id: 'tile_checker', group: 'Stone & Tile', name: 'Marble Checker', use: 'floor', gen: 'tiles', scale: 120, rough: 0.2, params: { seed: 19, count: 4, gap: 2, grout: '#888888', colors: ['#e9e7e3', '#3a3c40'], checker: true, marbled: true } },
  { id: 'marble_white', group: 'Stone & Tile', name: 'Calacatta Marble', use: 'floor', gen: 'marble', scale: 260, rough: 0.15, params: { seed: 3, base: '#eceae6', tint: '#dcd8d2', vein: '#9aa0a8', sharp: 10, veinStrength: 0.8 } },
  { id: 'marble_dark', group: 'Stone & Tile', name: 'Nero Marble', use: 'floor', gen: 'marble', scale: 260, rough: 0.18, params: { seed: 8, base: '#2b2d31', tint: '#3a3d43', vein: '#c9c4ba', sharp: 12, veinStrength: 0.85 } },
  { id: 'concrete_floor', group: 'Stone & Tile', name: 'Polished Concrete', use: 'floor', gen: 'concrete', scale: 300, rough: 0.35, params: { seed: 27, base: '#a3a19c', trowel: true } },
  // Carpets
  { id: 'carpet_beige', group: 'Carpet', name: 'Wool Beige', use: 'floor', gen: 'carpet', scale: 100, rough: 0.95, params: { seed: 33, base: '#cdbfa5', dark: '#a3947a' } },
  { id: 'carpet_gray', group: 'Carpet', name: 'Loop Grey', use: 'floor', gen: 'carpet', scale: 100, rough: 0.95, params: { seed: 37, base: '#9c9ca0', dark: '#71716f' } },
  { id: 'carpet_navy', group: 'Carpet', name: 'Plush Navy', use: 'floor', gen: 'carpet', scale: 100, rough: 0.95, params: { seed: 41, base: '#3c4a66', dark: '#252f45' } },
  { id: 'deck_wood', group: 'Wood', name: 'Deck Boards', use: 'floor', gen: 'wood', scale: 260, rough: 0.75, params: { seed: 55, base: '#8a6a4a', dark: '#5c4530', light: '#ab8a64', planks: 8 } },

  // Wall paints
  { id: 'paint_warmwhite', group: 'Paint', name: 'Warm White', use: 'wall', gen: 'paint', scale: 200, rough: 0.9, params: { base: '#ece7dd', seed: 61 } },
  { id: 'paint_offwhite', group: 'Paint', name: 'Snow', use: 'wall', gen: 'paint', scale: 200, rough: 0.9, params: { base: '#f2f2ef', seed: 62 } },
  { id: 'paint_greige', group: 'Paint', name: 'Greige', use: 'wall', gen: 'paint', scale: 200, rough: 0.9, params: { base: '#d3ccbf', seed: 63 } },
  { id: 'paint_sage', group: 'Paint', name: 'Sage', use: 'wall', gen: 'paint', scale: 200, rough: 0.9, params: { base: '#b6c2ab', seed: 64 } },
  { id: 'paint_sky', group: 'Paint', name: 'Powder Blue', use: 'wall', gen: 'paint', scale: 200, rough: 0.9, params: { base: '#b8cad6', seed: 65 } },
  { id: 'paint_terracotta', group: 'Paint', name: 'Terracotta', use: 'wall', gen: 'paint', scale: 200, rough: 0.9, params: { base: '#c07f5e', seed: 66 } },
  { id: 'paint_navy', group: 'Paint', name: 'Deep Navy', use: 'wall', gen: 'paint', scale: 200, rough: 0.9, params: { base: '#33415c', seed: 67 } },
  { id: 'paint_charcoal', group: 'Paint', name: 'Charcoal', use: 'wall', gen: 'paint', scale: 200, rough: 0.9, params: { base: '#4a4c50', seed: 68 } },
  { id: 'paint_blush', group: 'Paint', name: 'Blush', use: 'wall', gen: 'paint', scale: 200, rough: 0.9, params: { base: '#dcc3b8', seed: 69 } },
  { id: 'paint_olive', group: 'Paint', name: 'Olive', use: 'wall', gen: 'paint', scale: 200, rough: 0.9, params: { base: '#8a8a64', seed: 70 } },
  { id: 'wallpaper_stripe', group: 'Wallpaper', name: 'Striped Paper', use: 'wall', gen: 'stripes', scale: 120, rough: 0.85, params: { base: '#e8e2d4', stripe: '#b9ccc4', count: 8, seed: 71 } },
  { id: 'wallpaper_pin', group: 'Wallpaper', name: 'Pinstripe', use: 'wall', gen: 'stripes', scale: 80, rough: 0.85, params: { base: '#ddd6c8', stripe: '#8e9aa8', count: 16, seed: 72 } },
  { id: 'brick_red', group: 'Brick & Tile', name: 'Exposed Brick', use: 'wall', gen: 'brick', scale: 160, rough: 0.9, params: { seed: 73, rows: 8, cols: 4, gap: 3, mortar: '#b0a89a', colors: ['#9e5b45', '#8a4a38', '#a8654c', '#7c4434'] } },
  { id: 'brick_white', group: 'Brick & Tile', name: 'Painted Brick', use: 'wall', gen: 'brick', scale: 160, rough: 0.9, params: { seed: 74, rows: 8, cols: 4, gap: 3, mortar: '#c9c5bc', colors: ['#e3ded4', '#dcd6ca', '#eae5db'] } },
  { id: 'tile_subway', group: 'Brick & Tile', name: 'Subway Tile', use: 'wall', gen: 'brick', scale: 90, rough: 0.2, params: { seed: 75, rows: 8, cols: 4, gap: 2, mortar: '#9aa0a2', colors: ['#eef1f0', '#e6eae9'] } },
  { id: 'tile_bath', group: 'Brick & Tile', name: 'Bath Ceramic', use: 'wall', gen: 'tiles', scale: 100, rough: 0.2, params: { seed: 76, count: 4, gap: 2, grout: '#98a2a6', colors: ['#dfe8ea', '#d3dfe2'], variation: 6 } },
  { id: 'concrete_wall', group: 'Plaster & Concrete', name: 'Concrete', use: 'wall', gen: 'concrete', scale: 240, rough: 0.8, params: { seed: 77, base: '#9d9b96' } },
  { id: 'plaster_light', group: 'Plaster & Concrete', name: 'Plaster', use: 'wall', gen: 'concrete', scale: 260, rough: 0.85, params: { seed: 78, base: '#d8d3c8' } },

  // Exterior siding & finishes
  { id: 'siding_white', group: 'Exterior Siding', name: 'Lap · Classic White', use: 'wall', gen: 'siding', scale: 180, rough: 0.75, params: { seed: 120, base: '#e7e3d8', courses: 8 } },
  { id: 'siding_gray', group: 'Exterior Siding', name: 'Lap · Harbor Grey', use: 'wall', gen: 'siding', scale: 180, rough: 0.75, params: { seed: 121, base: '#a9adad', courses: 8 } },
  { id: 'siding_navy', group: 'Exterior Siding', name: 'Lap · Navy', use: 'wall', gen: 'siding', scale: 180, rough: 0.75, params: { seed: 122, base: '#3c4a5e', courses: 8 } },
  { id: 'siding_sage', group: 'Exterior Siding', name: 'Lap · Sage', use: 'wall', gen: 'siding', scale: 180, rough: 0.75, params: { seed: 123, base: '#9aa88f', courses: 8 } },
  { id: 'siding_butter', group: 'Exterior Siding', name: 'Lap · Buttercream', use: 'wall', gen: 'siding', scale: 180, rough: 0.75, params: { seed: 124, base: '#e4d3a4', courses: 8 } },
  { id: 'siding_clay', group: 'Exterior Siding', name: 'Lap · Terracotta', use: 'wall', gen: 'siding', scale: 180, rough: 0.75, params: { seed: 125, base: '#bd7f60', courses: 8 } },
  { id: 'bb_white', group: 'Exterior Siding', name: 'Board & Batten White', use: 'wall', gen: 'boardbatten', scale: 200, rough: 0.8, params: { seed: 126, base: '#e9e5da', boards: 5 } },
  { id: 'bb_black', group: 'Exterior Siding', name: 'Board & Batten Iron', use: 'wall', gen: 'boardbatten', scale: 200, rough: 0.8, params: { seed: 127, base: '#3a3c3e', boards: 5 } },
  { id: 'stucco_warm', group: 'Exterior Siding', name: 'Stucco', use: 'wall', gen: 'concrete', scale: 240, rough: 0.9, params: { seed: 128, base: '#ded2ba' } },
  { id: 'stone_veneer', group: 'Exterior Siding', name: 'Stacked Stone', use: 'wall', gen: 'stone', scale: 220, rough: 0.9, params: { seed: 129 } },
  { id: 'cedar_shake', group: 'Exterior Siding', name: 'Cedar Shake', use: 'wall', gen: 'shingles', scale: 160, rough: 0.85, params: { seed: 130, base: '#9c7a56', rows: 6, tabs: 8 } },
  { id: 'corrugated_gray', group: 'Exterior Siding', name: 'Corrugated Steel', use: 'wall', gen: 'boardbatten', scale: 70, rough: 0.5, params: { seed: 136, base: '#8e9399', boards: 4 } },
  { id: 'corrugated_white', group: 'Exterior Siding', name: 'Corrugated White', use: 'wall', gen: 'boardbatten', scale: 70, rough: 0.55, params: { seed: 137, base: '#dcd9d2', boards: 4 } },

  // Exterior paint — extra lap-siding colors (popular house palettes)
  { id: 'siding_charcoal', group: 'Exterior Paint', name: 'Lap · Charcoal', use: 'wall', gen: 'siding', scale: 180, rough: 0.75, params: { seed: 140, base: '#44484d', courses: 8 } },
  { id: 'siding_ironore', group: 'Exterior Paint', name: 'Lap · Iron Ore', use: 'wall', gen: 'siding', scale: 180, rough: 0.72, params: { seed: 141, base: '#35373a', courses: 8 } },
  { id: 'siding_forest', group: 'Exterior Paint', name: 'Lap · Forest Green', use: 'wall', gen: 'siding', scale: 180, rough: 0.75, params: { seed: 142, base: '#3a5140', courses: 8 } },
  { id: 'siding_hunter', group: 'Exterior Paint', name: 'Lap · Hunter Green', use: 'wall', gen: 'siding', scale: 180, rough: 0.75, params: { seed: 143, base: '#2e463a', courses: 8 } },
  { id: 'siding_seasalt', group: 'Exterior Paint', name: 'Lap · Sea Salt', use: 'wall', gen: 'siding', scale: 180, rough: 0.78, params: { seed: 144, base: '#ccd2c6', courses: 8 } },
  { id: 'siding_dustyblue', group: 'Exterior Paint', name: 'Lap · Dusty Blue', use: 'wall', gen: 'siding', scale: 180, rough: 0.76, params: { seed: 145, base: '#8fa6b2', courses: 8 } },
  { id: 'siding_slateblue', group: 'Exterior Paint', name: 'Lap · Slate Blue', use: 'wall', gen: 'siding', scale: 180, rough: 0.75, params: { seed: 146, base: '#5f7488', courses: 8 } },
  { id: 'siding_barnred', group: 'Exterior Paint', name: 'Lap · Barn Red', use: 'wall', gen: 'siding', scale: 180, rough: 0.75, params: { seed: 147, base: '#7c3b34', courses: 8 } },
  { id: 'siding_colonialred', group: 'Exterior Paint', name: 'Lap · Colonial Red', use: 'wall', gen: 'siding', scale: 180, rough: 0.75, params: { seed: 148, base: '#95413a', courses: 8 } },
  { id: 'siding_mocha', group: 'Exterior Paint', name: 'Lap · Mocha Brown', use: 'wall', gen: 'siding', scale: 180, rough: 0.76, params: { seed: 149, base: '#6b5544', courses: 8 } },
  { id: 'siding_greige', group: 'Exterior Paint', name: 'Lap · Greige', use: 'wall', gen: 'siding', scale: 180, rough: 0.77, params: { seed: 150, base: '#b4ab99', courses: 8 } },
  { id: 'siding_taupe', group: 'Exterior Paint', name: 'Lap · Taupe', use: 'wall', gen: 'siding', scale: 180, rough: 0.77, params: { seed: 151, base: '#a8987f', courses: 8 } },
  { id: 'siding_cream', group: 'Exterior Paint', name: 'Lap · Cream', use: 'wall', gen: 'siding', scale: 180, rough: 0.77, params: { seed: 152, base: '#efe7d2', courses: 8 } },
  { id: 'siding_softyellow', group: 'Exterior Paint', name: 'Lap · Soft Yellow', use: 'wall', gen: 'siding', scale: 180, rough: 0.77, params: { seed: 153, base: '#ecdca0', courses: 8 } },
  { id: 'siding_deepteal', group: 'Exterior Paint', name: 'Lap · Deep Teal', use: 'wall', gen: 'siding', scale: 180, rough: 0.75, params: { seed: 154, base: '#2f5560', courses: 8 } },
  { id: 'siding_olive', group: 'Exterior Paint', name: 'Lap · Olive', use: 'wall', gen: 'siding', scale: 180, rough: 0.76, params: { seed: 155, base: '#7d7a4e', courses: 8 } },
  { id: 'siding_sand', group: 'Exterior Paint', name: 'Lap · Sand', use: 'wall', gen: 'siding', scale: 180, rough: 0.77, params: { seed: 156, base: '#d8c8a8', courses: 8 } },
  { id: 'siding_black', group: 'Exterior Paint', name: 'Lap · Tuxedo Black', use: 'wall', gen: 'siding', scale: 180, rough: 0.72, params: { seed: 157, base: '#2c2d2f', courses: 8 } },
  { id: 'bb_sage', group: 'Exterior Paint', name: 'Board & Batten Sage', use: 'wall', gen: 'boardbatten', scale: 200, rough: 0.8, params: { seed: 158, base: '#8f9a80', boards: 5 } },
  { id: 'bb_navy', group: 'Exterior Paint', name: 'Board & Batten Navy', use: 'wall', gen: 'boardbatten', scale: 200, rough: 0.8, params: { seed: 159, base: '#38465a', boards: 5 } },
  { id: 'bb_charcoal', group: 'Exterior Paint', name: 'Board & Batten Charcoal', use: 'wall', gen: 'boardbatten', scale: 200, rough: 0.8, params: { seed: 160, base: '#45484c', boards: 5 } },
  { id: 'stucco_white', group: 'Exterior Paint', name: 'Stucco · White', use: 'wall', gen: 'concrete', scale: 240, rough: 0.9, params: { seed: 161, base: '#ece7dc' } },
  { id: 'stucco_adobe', group: 'Exterior Paint', name: 'Stucco · Adobe', use: 'wall', gen: 'concrete', scale: 240, rough: 0.9, params: { seed: 162, base: '#c58f68' } },
  { id: 'stucco_sand', group: 'Exterior Paint', name: 'Stucco · Sand', use: 'wall', gen: 'concrete', scale: 240, rough: 0.9, params: { seed: 163, base: '#d6c3a0' } },

  // Roofing (consumed by roof items, not the wall pickers)
  { id: 'shingle_charcoal', name: 'Charcoal Shingle', use: 'internal', gen: 'shingles', scale: 180, rough: 0.9, params: { seed: 131, base: '#4b4d51' } },
  { id: 'shingle_brown', name: 'Timber Shingle', use: 'internal', gen: 'shingles', scale: 180, rough: 0.9, params: { seed: 132, base: '#6a5442' } },
  { id: 'shingle_red', name: 'Clay Shingle', use: 'internal', gen: 'shingles', scale: 180, rough: 0.85, params: { seed: 133, base: '#8d4a34' } },
  { id: 'shingle_slate', name: 'Slate Shingle', use: 'internal', gen: 'shingles', scale: 180, rough: 0.8, params: { seed: 134, base: '#4e5a5e' } },
  { id: 'roof_metal', name: 'Standing Seam', use: 'internal', gen: 'boardbatten', scale: 160, rough: 0.45, params: { seed: 135, base: '#5b6166', boards: 4 } },

  // Environment / internal
  { id: 'grass', name: 'Lush Lawn', use: 'ground', gen: 'grass', scale: 420, rough: 1.0, res: 1024, params: { seed: 80 } },
  { id: 'grass_dry', name: 'Dry Lawn', use: 'ground', gen: 'grass', scale: 420, rough: 1.0, res: 1024, params: { seed: 83, soil: '#4a3f24', lush: '#6f7a38', mid: '#8a8a4a', dry: '#a89858', bladeWarm: 0.8 } },
  { id: 'pavement', name: 'Pavement', use: 'ground', gen: 'tiles', scale: 200, rough: 0.8, params: { seed: 81, count: 2, gap: 4, grout: '#6f6d68', colors: ['#a5a29b', '#98958e'], variation: 10 } },
  { id: 'gravel', name: 'Gravel', use: 'ground', gen: 'gravel', scale: 120, rough: 0.95, res: 1024, params: { seed: 84 } },
  { id: 'asphalt', name: 'Asphalt', use: 'ground', gen: 'asphalt', scale: 320, rough: 0.92, res: 1024, params: { seed: 200, base: '#34353b' } },
  { id: 'concrete_broom', name: 'Concrete Sidewalk', use: 'ground', gen: 'sidewalk', scale: 150, rough: 0.9, res: 1024, params: { seed: 400, base: '#bdb9b1' } },
  { id: 'fabric_gray', name: 'Fabric Grey', use: 'internal', gen: 'fabric', scale: 60, rough: 0.95, params: { seed: 90, base: '#8e8e92' } },
  { id: 'fabric_beige', name: 'Fabric Beige', use: 'internal', gen: 'fabric', scale: 60, rough: 0.95, params: { seed: 91, base: '#c4b49a' } },
  { id: 'fabric_blue', name: 'Fabric Blue', use: 'internal', gen: 'fabric', scale: 60, rough: 0.95, params: { seed: 92, base: '#5a6e8c' } },
  { id: 'fabric_green', name: 'Fabric Green', use: 'internal', gen: 'fabric', scale: 60, rough: 0.95, params: { seed: 93, base: '#6d7d64' } },
  { id: 'countertop', name: 'Stone Counter', use: 'internal', gen: 'marble', scale: 180, rough: 0.2, params: { seed: 94, base: '#dad7d0', tint: '#c9c5bc', vein: '#8d919a', sharp: 10, veinStrength: 0.6 } },
  { id: 'counter_dark', name: 'Granite', use: 'internal', gen: 'concrete', scale: 120, rough: 0.25, params: { seed: 95, base: '#3d3f42' } }
];

// Photo-scanned CC0 materials from ambientCG.com (see README attribution).
// Loaded as image files into the same canvas pipeline as the generators.
MATERIALS.push(
  { id: 'real_strip_oak', group: 'Wood', name: 'Blond Strip · Photo', use: 'floor', res: 2048, file: 'tex/woodfloor051.jpg', scale: 260, rough: 0.5, placeholder: '#c39a63' },
  { id: 'real_pine', group: 'Wood', name: 'Reclaimed Pine · Photo', use: 'floor', file: 'tex/woodfloor043.jpg', scale: 280, rough: 0.7, placeholder: '#8a6238' },
  { id: 'real_checker', group: 'Stone & Tile', name: 'Vintage Checker · Photo', use: 'floor', file: 'tex/tiles074.jpg', scale: 240, rough: 0.2, placeholder: '#b9b0a4' },
  { id: 'real_marble', group: 'Stone & Tile', name: 'Carrara · Photo', use: 'floor', res: 2048, file: 'tex/marble012.jpg', scale: 300, rough: 0.14, placeholder: '#dcdee2' },
  { id: 'real_brick', group: 'Brick & Tile', name: 'Old Brick · Photo', use: 'wall', file: 'tex/bricks090.jpg', scale: 220, rough: 0.9, placeholder: '#b0714f' },

  // photo pack round 2 — all CC0 from ambientCG (see README attribution)
  { id: 'real_honey_strip', group: 'Wood', name: 'Honey Strip · Photo', use: 'floor', res: 2048, file: 'tex/woodfloor040.jpg', scale: 250, rough: 0.5, placeholder: '#b98a52' },
  { id: 'real_blond_wide', group: 'Wood', name: 'Blond Wide Plank · Photo', use: 'floor', res: 2048, file: 'tex/woodfloor039.jpg', scale: 300, rough: 0.55, placeholder: '#d3b285' },
  { id: 'real_amber_bamboo', group: 'Wood', name: 'Amber Bamboo · Photo', use: 'floor', file: 'tex/woodfloor062.jpg', scale: 260, rough: 0.5, placeholder: '#c08a4a' },
  { id: 'real_walnut_strip', group: 'Wood', name: 'Walnut Strip · Photo', use: 'floor', file: 'tex/woodfloor007.jpg', scale: 250, rough: 0.5, placeholder: '#7a5433' },
  { id: 'real_nero', group: 'Stone & Tile', name: 'Nero Marquina · Photo', use: 'floor', res: 2048, file: 'tex/marble006.jpg', scale: 280, rough: 0.15, placeholder: '#26282b' },
  { id: 'real_travertine', group: 'Stone & Tile', name: 'Roman Travertine · Photo', use: 'floor', res: 2048, file: 'tex/travertine009.jpg', scale: 260, rough: 0.35, placeholder: '#d8c8a8' },
  { id: 'real_terrazzo', group: 'Stone & Tile', name: 'Terrazzo · Photo', use: 'floor', res: 2048, file: 'tex/terrazzo013.jpg', scale: 220, rough: 0.25, placeholder: '#e8e2da' },
  { id: 'real_white_tile', group: 'Stone & Tile', name: 'White Ceramic · Photo', use: 'floor', res: 2048, file: 'tex/tiles107.jpg', scale: 180, rough: 0.2, placeholder: '#e9eaea' },
  { id: 'real_carpet_oat', group: 'Carpet', name: 'Oat Weave · Photo', use: 'floor', file: 'tex/carpet016.jpg', scale: 120, rough: 0.95, placeholder: '#cfc2a8' },
  { id: 'real_carpet_berry', group: 'Carpet', name: 'Berry Plush · Photo', use: 'floor', file: 'tex/carpet013.jpg', scale: 120, rough: 0.95, placeholder: '#a84a52' },
  { id: 'real_plaster_soft', group: 'Plaster & Concrete', name: 'Soft Plaster · Photo', use: 'wall', file: 'tex/plaster001.jpg', scale: 260, rough: 0.85, placeholder: '#d9d6cf' },
  { id: 'real_plaster_ivory', group: 'Plaster & Concrete', name: 'Ivory Plaster · Photo', use: 'wall', file: 'tex/paintedplaster017.jpg', scale: 260, rough: 0.9, placeholder: '#ddd6c6' },
  { id: 'real_mosaic_blue', group: 'Brick & Tile', name: 'Blue Glass Mosaic · Photo', use: 'wall', file: 'tex/tiles133a.jpg', scale: 120, rough: 0.15, placeholder: '#cfe2e8' },
  { id: 'real_brick_red', group: 'Brick & Tile', name: 'Classic Red Brick · Photo', use: 'wall', res: 2048, file: 'tex/bricks059.jpg', scale: 200, rough: 0.9, placeholder: '#96513c' },
  { id: 'real_brick_gray', group: 'Brick & Tile', name: 'Urban Grey Brick · Photo', use: 'wall', file: 'tex/bricks066.jpg', scale: 200, rough: 0.9, placeholder: '#8d9195' },
  { id: 'real_siding_stained', group: 'Exterior Siding', name: 'Stained Cedar · Photo', use: 'wall', file: 'tex/woodsiding008.jpg', scale: 200, rough: 0.7, placeholder: '#5a4632' },
  { id: 'real_barnwood_siding', group: 'Exterior Siding', name: 'Rustic Barnwood · Photo', use: 'wall', file: 'tex/planks037a.jpg', scale: 240, rough: 0.8, placeholder: '#5f4a38' },
  { id: 'real_lawn', name: 'Real Lawn · Photo', use: 'ground', res: 2048, file: 'tex/grass004.jpg', scale: 380, rough: 1.0, placeholder: '#5c7a3a' },
  { id: 'real_meadow', name: 'Wild Yard · Photo', use: 'ground', file: 'tex/ground037.jpg', scale: 420, rough: 1.0, placeholder: '#7a7a4a' },
  { id: 'real_gravel_white', name: 'White Gravel · Photo', use: 'ground', file: 'tex/gravel023.jpg', scale: 240, rough: 0.95, placeholder: '#cfccc4' },
  { id: 'real_cobblestone', name: 'Cobblestone · Photo', use: 'ground', res: 2048, file: 'tex/pavingstones070.jpg', scale: 320, rough: 0.9, placeholder: '#8d8d88' },
  { id: 'real_plank_pavers', name: 'Plank Pavers · Photo', use: 'ground', file: 'tex/pavingstones128.jpg', scale: 300, rough: 0.8, placeholder: '#a89880' },
  { id: 'real_roof_slate', name: 'Scale Slate · Photo', use: 'internal', file: 'tex/roofingtiles001.jpg', scale: 200, rough: 0.85, placeholder: '#3f4448' },
  { id: 'real_roof_clay', name: 'Aged Clay · Photo', use: 'internal', file: 'tex/roofingtiles007.jpg', scale: 200, rough: 0.8, placeholder: '#9a5a40' },

  // photo pack round 3 — all CC0 from ambientCG (see README attribution)
  { id: 'real_espresso_rustic', group: 'Wood', name: 'Rustic Espresso · Photo', use: 'floor', file: 'tex/woodfloor041.jpg', scale: 280, rough: 0.6, placeholder: '#4f3b2c' },
  { id: 'real_knotty_pine', group: 'Wood', name: 'Knotty Pine · Photo', use: 'floor', file: 'tex/woodfloor044.jpg', scale: 280, rough: 0.6, placeholder: '#d8b98c' },
  { id: 'real_caramel_plank', group: 'Wood', name: 'Caramel Plank · Photo', use: 'floor', file: 'tex/woodfloor064.jpg', scale: 280, rough: 0.5, placeholder: '#a9702f' },
  { id: 'real_basket_parquet', group: 'Wood', name: 'Basket Parquet · Photo', use: 'floor', file: 'tex/woodfloor070.jpg', scale: 220, rough: 0.5, placeholder: '#8a5a28' },
  { id: 'real_wenge', group: 'Wood', name: 'Wenge Plank · Photo', use: 'floor', file: 'tex/planks023a.jpg', scale: 280, rough: 0.55, placeholder: '#4a3a30' },
  { id: 'real_emerald_marble', group: 'Stone & Tile', name: 'Emerald Marble · Photo', use: 'floor', file: 'tex/marble016.jpg', scale: 280, rough: 0.14, placeholder: '#22302a' },
  { id: 'real_bianco', group: 'Stone & Tile', name: 'Bianco Marble · Photo', use: 'floor', file: 'tex/marble021.jpg', scale: 280, rough: 0.14, placeholder: '#eceae4' },
  { id: 'real_onyx_wave', group: 'Stone & Tile', name: 'Onyx Wave · Photo', use: 'floor', file: 'tex/onyx013.jpg', scale: 300, rough: 0.12, placeholder: '#2d2b28' },
  { id: 'real_blue_onyx', group: 'Stone & Tile', name: 'Blue Onyx · Photo', use: 'floor', file: 'tex/travertine013.jpg', scale: 300, rough: 0.15, placeholder: '#9db8c8' },
  { id: 'real_terrazzo_bold', group: 'Stone & Tile', name: 'Bold Terrazzo · Photo', use: 'floor', file: 'tex/terrazzo018.jpg', scale: 260, rough: 0.25, placeholder: '#e5ded2' },
  { id: 'real_marble_tile', group: 'Stone & Tile', name: 'Marble Tile · Photo', use: 'floor', file: 'tex/tiles040.jpg', scale: 200, rough: 0.18, placeholder: '#e8e6e0' },
  { id: 'real_blush_stone', group: 'Stone & Tile', name: 'Blush Limestone · Photo', use: 'floor', file: 'tex/tiles078.jpg', scale: 240, rough: 0.35, placeholder: '#c4a294' },
  { id: 'real_tumbled_cream', group: 'Stone & Tile', name: 'Tumbled Cream · Photo', use: 'floor', file: 'tex/tiles142.jpg', scale: 200, rough: 0.4, placeholder: '#e0c9a2' },
  { id: 'real_carpet_navy', group: 'Carpet', name: 'Navy Speck · Photo', use: 'floor', file: 'tex/carpet012.jpg', scale: 120, rough: 0.95, placeholder: '#33405a' },
  { id: 'real_corrugated', group: 'Exterior Siding', name: 'Container Steel · Photo', use: 'wall', res: 2048, file: 'tex/corrugatedsteel009.jpg', scale: 240, rough: 0.5, placeholder: '#9aa2a8' },
  { id: 'real_brick_aged', group: 'Brick & Tile', name: 'Aged Red Brick · Photo', use: 'wall', file: 'tex/bricks085.jpg', scale: 220, rough: 0.9, placeholder: '#9c5540' },
  { id: 'real_brick_rustic', group: 'Brick & Tile', name: 'Rustic Brick · Photo', use: 'wall', file: 'tex/bricks097.jpg', scale: 220, rough: 0.9, placeholder: '#8d5038' },
  { id: 'real_basket_pavers', name: 'Basket Pavers · Photo', use: 'ground', file: 'tex/pavingstones146.jpg', scale: 300, rough: 0.85, placeholder: '#c8a878' },
  { id: 'real_sand', name: 'Sand · Photo', use: 'ground', file: 'tex/ground080.jpg', scale: 360, rough: 0.95, placeholder: '#cdb37c' },
  { id: 'real_grass_dark', name: 'Deep Green Lawn · Photo', use: 'ground', file: 'tex/grass001.jpg', scale: 380, rough: 1.0, placeholder: '#3f5c33' },
  { id: 'real_grass_farm', name: 'Farm Field · Photo', use: 'ground', file: 'tex/grass003.jpg', scale: 440, rough: 1.0, placeholder: '#6a7040' },
  { id: 'real_grass_bright', name: 'Spring Lawn · Photo', use: 'ground', file: 'tex/grass005.jpg', scale: 380, rough: 1.0, placeholder: '#69954a' },
  { id: 'real_grass_patchy', name: 'Patchy Yard · Photo', use: 'ground', file: 'tex/grass007.jpg', scale: 400, rough: 1.0, placeholder: '#5f7342' }
);

export const MATERIAL_MAP = new Map(MATERIALS.map(m => [m.id, m]));

// Every photo-scanned texture ships as a local JPG under BASE_URL. This is the
// full manifest the offline installer precaches so the design library works
// with no network at all.
export const PHOTO_TEXTURE_FILES = MATERIALS.filter(m => m.file).map(m => m.file);
export function photoTextureUrls() {
  const base = (import.meta.env?.BASE_URL || '/');
  return PHOTO_TEXTURE_FILES.map(f => base + f);
}
/** Force every photo texture through the loader (warms the SW/HTTP cache and
 *  the in-memory canvas cache). Used as the offline fallback when no SW. */
export function warmAllTextures(onEach) {
  const ids = MATERIALS.filter(m => m.file).map(m => m.id);
  ids.forEach((id, i) => { ensureTexture(id); onEach?.(i + 1, ids.length); });
  return ids.length;
}

// Listeners re-flag GPU textures / 2D patterns when a photo texture arrives.
const texWatchers = [];
export function watchTextures(fn) { texWatchers.push(fn); }

function loadFileTexture(def, entry) {
  const img = new Image();
  img.onload = () => {
    const S = entry.color.width;
    const cc = entry.color.getContext('2d');
    cc.filter = 'none';
    cc.drawImage(img, 0, 0, S, S);
    // bump approximated from photo luminance
    const bc = entry.bump.getContext('2d');
    bc.filter = 'grayscale(1) contrast(0.55) brightness(1.1)';
    bc.drawImage(img, 0, 0, S, S);
    bc.filter = 'none';
    entry.loaded = true;
    for (const key of [...previewCache.keys()]) {
      if (key.startsWith(def.id + '_')) previewCache.delete(key);
    }
    for (const fn of texWatchers) fn(def.id);
  };
  img.src = (import.meta.env?.BASE_URL || '/') + def.file;
}

/** Get (and cache) generated canvases for a material id. */
export function getTextureCanvases(matId) {
  let entry = canvasCache.get(matId);
  if (entry) return entry;
  const def = MATERIAL_MAP.get(matId) || MATERIAL_MAP.get('paint_warmwhite');
  const { color, bump } = canvasPair(def.file ? (def.res || 1024) : (def.res || SIZE));
  entry = { color, bump, def };
  if (def.file) {
    const cc = color.getContext('2d');
    cc.fillStyle = def.placeholder || '#b0a894';
    cc.fillRect(0, 0, color.width, color.height);
    bump.getContext('2d').fillStyle = '#808080';
    bump.getContext('2d').fillRect(0, 0, bump.width, bump.height);
    loadFileTexture(def, entry);
  } else {
    const gen = GENERATORS[def.gen];
    gen(color.getContext('2d'), bump.getContext('2d'), def.params);
  }
  canvasCache.set(matId, entry);
  return entry;
}

/** Kick off the download of a photo material (no-op for procedural ones).
 *  Call when its swatch actually becomes visible. */
export function ensureTexture(matId) {
  getTextureCanvases(matId);
}

/** Small preview data-URL for material swatches in the UI. Photo materials
 *  that haven't been downloaded yet get a flat placeholder WITHOUT starting
 *  the download — panels are built eagerly but often never shown, and the
 *  fetch would pull every texture over cellular at startup. */
const previewCache = new Map();
export function getMaterialPreview(matId, size = 72) {
  const key = `${matId}_${size}`;
  if (previewCache.has(key)) return previewCache.get(key);
  const def = MATERIAL_MAP.get(matId);
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  if (def?.file && !canvasCache.has(matId)) {
    const g = c.getContext('2d');
    g.fillStyle = def.placeholder || '#b0a894';
    g.fillRect(0, 0, size, size);
    return c.toDataURL(); // not cached: the real preview replaces it on load
  }
  const { color } = getTextureCanvases(matId);
  c.getContext('2d').drawImage(color, 0, 0, size, size);
  const url = c.toDataURL();
  previewCache.set(key, url);
  return url;
}
