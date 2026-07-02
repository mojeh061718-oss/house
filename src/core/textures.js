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
  const rand = mulberry32(p.seed);
  const noise = makeNoise(p.seed + 7, 4, 4);
  const base = hexToRgb(p.base), dark = hexToRgb(p.dark), light = hexToRgb(p.light);
  const plankW = SIZE / p.planks;
  const img = ctx.createImageData(SIZE, SIZE);
  const bimg = bctx.createImageData(SIZE, SIZE);
  // per-plank data: tone offset + row (grain phase) + end joint position
  const planks = [];
  for (let i = 0; i < p.planks; i++) {
    planks.push({ tone: (rand() - 0.5) * 0.5, phase: rand() * 10, joint: rand() });
  }
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const pi = Math.min(p.planks - 1, Math.floor(x / plankW));
      const pl = planks[pi];
      const lx = x - pi * plankW;
      // wood grain: stretched noise along Y
      const g = noise(x / SIZE * 2 + pl.phase, y / SIZE * 0.25 + pl.phase);
      const streak = Math.pow(Math.abs(Math.sin((g * 6 + y / SIZE * 3 + pl.phase) * Math.PI)), 0.35);
      let col = mix(mix(dark, base, streak), light, noise(x / SIZE * 8, y / SIZE * 8) * 0.35);
      col = mix(col, pl.tone > 0 ? light : dark, Math.abs(pl.tone));
      let h = 150 + streak * 60;
      // plank gaps + butt joints
      const gap = lx < 1.5 || lx > plankW - 1.5;
      const jointY = ((y / SIZE + pl.joint) % 0.5) * SIZE;
      const joint = jointY < 2;
      if (gap || joint) { col = mix(col, [10, 8, 6], 0.75); h = 30; }
      const idx = (y * SIZE + x) * 4;
      img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
      bimg.data[idx] = bimg.data[idx + 1] = bimg.data[idx + 2] = h; bimg.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  bctx.putImageData(bimg, 0, 0);
}

function genHerringbone(ctx, bctx, p) {
  const base = hexToRgb(p.base), dark = hexToRgb(p.dark), light = hexToRgb(p.light);
  const noise = makeNoise(p.seed, 6, 4);
  ctx.fillStyle = rgb(dark);
  ctx.fillRect(0, 0, SIZE, SIZE);
  bctx.fillStyle = 'rgb(30,30,30)';
  bctx.fillRect(0, 0, SIZE, SIZE);
  const bw = SIZE / 8, bl = bw * 4; // block width / length
  const rand = mulberry32(p.seed + 3);
  const drawBlock = (cx, cy, ang) => {
    for (const c of [ctx, bctx]) {
      c.save();
      c.translate(cx, cy);
      c.rotate(ang);
      if (c === ctx) {
        const t = rand();
        const col = mix(mix(dark, base, 0.4 + t * 0.6), light, rand() * 0.3);
        const gradient = c.createLinearGradient(-bl / 2, 0, bl / 2, 0);
        gradient.addColorStop(0, rgb(col));
        gradient.addColorStop(0.5, rgb(mix(col, light, 0.18)));
        gradient.addColorStop(1, rgb(mix(col, dark, 0.15)));
        c.fillStyle = gradient;
      } else {
        c.fillStyle = 'rgb(175,175,175)';
      }
      c.fillRect(-bl / 2 + 1, -bw / 2 + 1, bl - 2, bw - 2);
      if (c === ctx) {
        // grain streaks
        c.strokeStyle = 'rgba(60,40,20,0.25)';
        c.lineWidth = 1;
        for (let s = 0; s < 5; s++) {
          const yy = -bw / 2 + 2 + rand() * (bw - 4);
          c.beginPath();
          c.moveTo(-bl / 2 + 2, yy);
          c.bezierCurveTo(-bl / 4, yy + (rand() - 0.5) * 4, bl / 4, yy + (rand() - 0.5) * 4, bl / 2 - 2, yy);
          c.stroke();
        }
      }
      c.restore();
    }
  };
  const step = bw * Math.SQRT2;
  for (let row = -2; row < SIZE / step + 4; row++) {
    for (let col = -2; col < SIZE / step + 4; col++) {
      const x = col * step * 2, y = row * step;
      drawBlock(x + step, y, Math.PI / 4);
      drawBlock(x + step * 2, y + step * 0, -Math.PI / 4);
      drawBlock(x + step * 2 + step, y + step, Math.PI / 4);
      drawBlock(x + step, y + step, -Math.PI / 4);
    }
  }
  // subtle overall variation
  const img = ctx.getImageData(0, 0, SIZE, SIZE);
  for (let y = 0; y < SIZE; y += 2) {
    for (let x = 0; x < SIZE; x += 2) {
      const n = (noise(x / SIZE, y / SIZE) - 0.5) * 20;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const idx = ((y + dy) * SIZE + x + dx) * 4;
        img.data[idx] += n; img.data[idx + 1] += n; img.data[idx + 2] += n;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

function genTiles(ctx, bctx, p) {
  const n = p.count;
  const tile = SIZE / n;
  const rand = mulberry32(p.seed);
  const noise = makeNoise(p.seed + 11, 8, 3);
  const grout = hexToRgb(p.grout);
  ctx.fillStyle = rgb(grout);
  ctx.fillRect(0, 0, SIZE, SIZE);
  bctx.fillStyle = 'rgb(40,40,40)';
  bctx.fillRect(0, 0, SIZE, SIZE);
  const colors = p.colors.map(hexToRgb);
  for (let ty = 0; ty < n; ty++) {
    for (let tx = 0; tx < n; tx++) {
      const alt = p.checker ? (tx + ty) % 2 : Math.floor(rand() * colors.length) % colors.length;
      const base = colors[alt % colors.length];
      const v = (rand() - 0.5) * (p.variation ?? 14);
      const col = [base[0] + v, base[1] + v, base[2] + v];
      const x = tx * tile + p.gap, y = ty * tile + p.gap, s = tile - p.gap * 2;
      const grd = ctx.createLinearGradient(x, y, x + s, y + s);
      grd.addColorStop(0, rgb(mix(col, [255, 255, 255], 0.10)));
      grd.addColorStop(0.5, rgb(col));
      grd.addColorStop(1, rgb(mix(col, [0, 0, 0], 0.07)));
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
      bctx.fillStyle = 'rgb(190,190,190)';
      bctx.fillRect(x, y, s, s);
    }
  }
  // speckle
  const img = ctx.getImageData(0, 0, SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const px = (i / 4) % SIZE, py = Math.floor(i / 4 / SIZE);
    const d = (noise(px / SIZE, py / SIZE) - 0.5) * (p.speckle ?? 8);
    img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d;
  }
  ctx.putImageData(img, 0, 0);
}

function genMarble(ctx, bctx, p) {
  const noise = makeNoise(p.seed, 4, 5);
  const noise2 = makeNoise(p.seed + 99, 6, 4);
  const base = hexToRgb(p.base), vein = hexToRgb(p.vein), tint = hexToRgb(p.tint);
  const img = ctx.createImageData(SIZE, SIZE);
  const bimg = bctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE, v = y / SIZE;
      const warp = noise(u, v) * 3.5;
      let s = Math.abs(Math.sin((u * 2.2 + v * 1.1 + warp) * Math.PI * 2));
      s = Math.pow(1 - s, p.sharp ?? 9); // sharp veins
      const cloud = noise2(u * 2, v * 2) * 0.4;
      let col = mix(base, tint, cloud);
      col = mix(col, vein, Math.min(1, s * (p.veinStrength ?? 0.9)));
      const idx = (y * SIZE + x) * 4;
      img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
      const h = 200 - s * 40;
      bimg.data[idx] = bimg.data[idx + 1] = bimg.data[idx + 2] = h; bimg.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  bctx.putImageData(bimg, 0, 0);
}

function genBrick(ctx, bctx, p) {
  const rand = mulberry32(p.seed);
  const rows = p.rows, bw = SIZE / p.cols, bh = SIZE / rows;
  const mortar = hexToRgb(p.mortar);
  ctx.fillStyle = rgb(mortar);
  ctx.fillRect(0, 0, SIZE, SIZE);
  bctx.fillStyle = 'rgb(50,50,50)';
  bctx.fillRect(0, 0, SIZE, SIZE);
  const colors = p.colors.map(hexToRgb);
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * bw / 2;
    for (let c = -1; c < p.cols + 1; c++) {
      const base = colors[Math.floor(rand() * colors.length)];
      const v = (rand() - 0.5) * 24;
      const col = [base[0] + v, base[1] + v, base[2] + v];
      const x = c * bw + off + p.gap, y = r * bh + p.gap;
      const w = bw - p.gap * 2, h = bh - p.gap * 2;
      const grd = ctx.createLinearGradient(x, y, x, y + h);
      grd.addColorStop(0, rgb(mix(col, [255, 255, 255], 0.08)));
      grd.addColorStop(1, rgb(mix(col, [0, 0, 0], 0.12)));
      ctx.fillStyle = grd;
      ctx.fillRect(x, y, w, h);
      // pitting
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      for (let s = 0; s < 14; s++) {
        ctx.fillRect(x + rand() * w, y + rand() * h, 1 + rand() * 2, 1 + rand() * 2);
      }
      bctx.fillStyle = 'rgb(185,185,185)';
      bctx.fillRect(x, y, w, h);
    }
  }
}

function genCarpet(ctx, bctx, p) {
  const noise = makeNoise(p.seed, 32, 3);
  const noise2 = makeNoise(p.seed + 5, 8, 3);
  const base = hexToRgb(p.base), dark = hexToRgb(p.dark);
  const img = ctx.createImageData(SIZE, SIZE);
  const bimg = bctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const fiber = noise(x / SIZE, y / SIZE);
      const patch = noise2(x / SIZE, y / SIZE);
      let col = mix(dark, base, 0.35 + fiber * 0.65);
      col = mix(col, base, patch * 0.3);
      const idx = (y * SIZE + x) * 4;
      img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
      const h = 120 + fiber * 70;
      bimg.data[idx] = bimg.data[idx + 1] = bimg.data[idx + 2] = h; bimg.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  bctx.putImageData(bimg, 0, 0);
}

function genConcrete(ctx, bctx, p) {
  const noise = makeNoise(p.seed, 6, 5);
  const noise2 = makeNoise(p.seed + 21, 24, 2);
  const base = hexToRgb(p.base);
  const img = ctx.createImageData(SIZE, SIZE);
  const bimg = bctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const large = (noise(x / SIZE, y / SIZE) - 0.5) * 34;
      const fine = (noise2(x / SIZE, y / SIZE) - 0.5) * 16;
      const col = [base[0] + large + fine, base[1] + large + fine, base[2] + large + fine];
      const idx = (y * SIZE + x) * 4;
      img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
      const h = 170 + large * 1.5;
      bimg.data[idx] = bimg.data[idx + 1] = bimg.data[idx + 2] = h; bimg.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  bctx.putImageData(bimg, 0, 0);
  if (p.trowel) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#ffffff';
    const rand = mulberry32(p.seed + 2);
    for (let i = 0; i < 24; i++) {
      ctx.lineWidth = 8 + rand() * 30;
      ctx.beginPath();
      ctx.arc(rand() * SIZE, rand() * SIZE, 60 + rand() * 200, rand() * 7, rand() * 7 + 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function genPaint(ctx, bctx, p) {
  const noise = makeNoise(p.seed ?? 40, 16, 3);
  const base = hexToRgb(p.base);
  const img = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const d = (noise(x / SIZE, y / SIZE) - 0.5) * 9;
      const idx = (y * SIZE + x) * 4;
      img.data[idx] = base[0] + d; img.data[idx + 1] = base[1] + d; img.data[idx + 2] = base[2] + d;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  bctx.fillStyle = 'rgb(128,128,128)';
  bctx.fillRect(0, 0, SIZE, SIZE);
}

function genStripes(ctx, bctx, p) {
  genPaint(ctx, bctx, { base: p.base, seed: p.seed });
  const stripe = hexToRgb(p.stripe);
  ctx.fillStyle = `rgba(${stripe[0]},${stripe[1]},${stripe[2]},0.85)`;
  const n = p.count ?? 8;
  const w = SIZE / n;
  for (let i = 0; i < n; i += 2) {
    ctx.fillRect(i * w, 0, w, SIZE);
  }
}

function genFabric(ctx, bctx, p) {
  const noise = makeNoise(p.seed, 20, 2);
  const base = hexToRgb(p.base);
  const img = ctx.createImageData(SIZE, SIZE);
  const bimg = bctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const weave = (Math.sin(x * Math.PI / 2.5) * Math.sin(y * Math.PI / 2.5)) * 10;
      const n = (noise(x / SIZE, y / SIZE) - 0.5) * 22;
      const idx = (y * SIZE + x) * 4;
      img.data[idx] = base[0] + weave + n;
      img.data[idx + 1] = base[1] + weave + n;
      img.data[idx + 2] = base[2] + weave + n;
      img.data[idx + 3] = 255;
      const h = 128 + weave * 3;
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
  const soil = hexToRgb(p.soil || '#2e3d1f');
  const lush = hexToRgb(p.lush || '#3f6d2b');
  const mid = hexToRgb(p.mid || '#4e7f33');
  const dry = hexToRgb(p.dry || '#7a8a45');
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

const GENERATORS = {
  wood: genWoodPlanks,
  herringbone: genHerringbone,
  tiles: genTiles,
  marble: genMarble,
  brick: genBrick,
  carpet: genCarpet,
  concrete: genConcrete,
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

  // Environment / internal
  { id: 'grass', name: 'Lush Lawn', use: 'ground', gen: 'grass', scale: 420, rough: 1.0, res: 1024, params: { seed: 80 } },
  { id: 'grass_dry', name: 'Dry Lawn', use: 'ground', gen: 'grass', scale: 420, rough: 1.0, res: 1024, params: { seed: 83, soil: '#4a3f24', lush: '#6f7a38', mid: '#8a8a4a', dry: '#a89858', bladeWarm: 0.8 } },
  { id: 'pavement', name: 'Pavement', use: 'ground', gen: 'tiles', scale: 200, rough: 0.8, params: { seed: 81, count: 2, gap: 4, grout: '#6f6d68', colors: ['#a5a29b', '#98958e'], variation: 10 } },
  { id: 'gravel', name: 'Gravel', use: 'ground', gen: 'concrete', scale: 160, rough: 0.95, params: { seed: 84, base: '#9a938a' } },
  { id: 'fabric_gray', name: 'Fabric Grey', use: 'internal', gen: 'fabric', scale: 60, rough: 0.95, params: { seed: 90, base: '#8e8e92' } },
  { id: 'fabric_beige', name: 'Fabric Beige', use: 'internal', gen: 'fabric', scale: 60, rough: 0.95, params: { seed: 91, base: '#c4b49a' } },
  { id: 'fabric_blue', name: 'Fabric Blue', use: 'internal', gen: 'fabric', scale: 60, rough: 0.95, params: { seed: 92, base: '#5a6e8c' } },
  { id: 'fabric_green', name: 'Fabric Green', use: 'internal', gen: 'fabric', scale: 60, rough: 0.95, params: { seed: 93, base: '#6d7d64' } },
  { id: 'countertop', name: 'Stone Counter', use: 'internal', gen: 'marble', scale: 180, rough: 0.2, params: { seed: 94, base: '#dad7d0', tint: '#c9c5bc', vein: '#8d919a', sharp: 10, veinStrength: 0.6 } },
  { id: 'counter_dark', name: 'Granite', use: 'internal', gen: 'concrete', scale: 120, rough: 0.25, params: { seed: 95, base: '#3d3f42' } }
];

export const MATERIAL_MAP = new Map(MATERIALS.map(m => [m.id, m]));

/** Get (and cache) generated canvases for a material id. */
export function getTextureCanvases(matId) {
  let entry = canvasCache.get(matId);
  if (entry) return entry;
  const def = MATERIAL_MAP.get(matId) || MATERIAL_MAP.get('paint_warmwhite');
  const { color, bump } = canvasPair(def.res || SIZE);
  const gen = GENERATORS[def.gen];
  gen(color.getContext('2d'), bump.getContext('2d'), def.params);
  entry = { color, bump, def };
  canvasCache.set(matId, entry);
  return entry;
}

/** Small preview data-URL for material swatches in the UI. */
const previewCache = new Map();
export function getMaterialPreview(matId, size = 72) {
  const key = `${matId}_${size}`;
  if (previewCache.has(key)) return previewCache.get(key);
  const { color } = getTextureCanvases(matId);
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  c.getContext('2d').drawImage(color, 0, 0, size, size);
  const url = c.toDataURL();
  previewCache.set(key, url);
  return url;
}
