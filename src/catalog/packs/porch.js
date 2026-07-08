// Front-porch pack — columns, railings, steps, swings, lanterns and the
// small welcoming props that make an entry read as a real American porch.
// Built only from primitive helpers; all dimensions in cm, origin at
// footprint center on the floor, front faces +Z. Ceiling-mount items build
// downward from y=0; wall-mount items build at their own origin with the
// wall behind -Z, matching the decor/frames packs.
import {
  G, box, cyl, sphere, segment, strut, torus, blob,
  solid, wood, metal, glass, glow, tex, netMaterial, textMaterial,
  buildFlag, flagTexture
} from '../builders.js';

// classic painted-porch tones (satin exterior paint)
const PAINT = [
  { name: 'Porch White', chip: '#eeebe2', paint: '#eeebe2' },
  { name: 'Cream', chip: '#e7dcc0', paint: '#e7dcc0' },
  { name: 'Harbor Grey', chip: '#b7bcbe', paint: '#b7bcbe' }
];
const SEATING = [
  { name: 'White / Navy', chip: '#eceae2', frame: '#eceae2', fabric: '#3c4a66', kind: 'paint' },
  { name: 'Teak / Cream', chip: '#a8804f', frame: '#a8804f', fabric: '#e9e2d0', kind: 'wood' },
  { name: 'Black / Sage', chip: '#2f3133', frame: '#2f3133', fabric: '#9aa88c', kind: 'paint' }
];
const LANTERN = [
  { name: 'Black', chip: '#26282b', body: '#26282b' },
  { name: 'Oil Bronze', chip: '#4a3b2c', body: '#4a3b2c' },
  { name: 'Pewter', chip: '#8b8f94', body: '#8b8f94' }
];
// seating frame material for the SEATING palettes: painted vs stained wood
const seatMat = (p) => (p.kind === 'wood' ? wood(p.frame, 0.55) : solid(p.frame, 0.5));

/** Carriage-lantern body (shared by the wall + pendant lanterns). Builds a
 *  four-pane lantern with a pagoda cap, candle + flame, centered on x/z,
 *  glass box W wide, H tall, its BASE plate at y. Returns top-of-cap y. */
function lanternBody(g, p, W, H, y) {
  const fr = metal(p.body, 0.5);
  const half = W / 2;
  cyl(g, fr, half + 2.5, 2.2, 0, y, 0, { seg: 4 });                    // base plate
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    box(g, fr, 1.7, H, 1.7, sx * half, y + 2, sz * half);              // corner posts
  for (const s of [-1, 1]) {
    box(g, glass(), W - 2, H - 1, 0.5, 0, y + 2.5, s * half);          // front/back panes
    box(g, glass(), 0.5, H - 1, W - 2, s * half, y + 2.5, 0);          // side panes
  }
  const capY = y + H + 2;
  const cap = cyl(g, fr, half + 4, 6.5, 0, capY, 0, { rTop: 2.2, seg: 4 }); // pagoda cap
  cap.rotation.y = Math.PI / 4;
  cyl(g, fr, 1.1, 3, 0, capY + 6.5, 0);                                // finial stem
  sphere(g, fr, 1.7, 0, capY + 10.4, 0, { seg: 12 });                  // finial ball
  // candle + warm flame
  cyl(g, glow('#f3e9d4', 0.55, 0.6), W * 0.16, H * 0.5, 0, y + 2.4, 0, { seg: 12 });
  sphere(g, glow('#ffc46a', 2.3, 0.3), W * 0.11, y + 2.4 + H * 0.58, 0, { sy: 1.5, seg: 10 });
  return capY + 12;
}

export const PORCH_ITEMS = [
  // ---- 1. Classic round column ---------------------------------------------
  {
    id: 'porch_column_round', name: 'Round Porch Column', cat: 'porch', w: 36, d: 36, h: 270,
    palettes: PAINT, plan: { type: 'stool' },
    build: (p) => {
      const g = G();
      const pt = solid(p.paint, 0.55);
      box(g, pt, 35, 9, 35, 0, 0, 0, { r: 1 });                       // square plinth
      torus(g, pt, 12.2, 2.6, 0, 11.4, 0, { seg: 34, tubeSeg: 12 });  // torus base molding
      torus(g, pt, 11.4, 1.5, 0, 14.8, 0, { seg: 34, tubeSeg: 10 });  // scotia bead
      // shaft with entasis: straight lower drum, tapering upper drum
      cyl(g, pt, 11.6, 128, 0, 15, 0, { rTop: 11.1, seg: 28 });
      cyl(g, pt, 11.1, 102, 0, 143, 0, { rTop: 9.5, seg: 28 });
      torus(g, pt, 9.9, 1.3, 0, 246, 0, { seg: 30, tubeSeg: 10 });    // astragal
      cyl(g, pt, 9.5, 6, 0, 247, 0, { seg: 24 });                     // necking
      cyl(g, pt, 10, 8, 0, 253, 0, { rTop: 13.4, seg: 28 });          // echinus flare
      box(g, pt, 29, 5, 29, 0, 261, 0, { r: 1 });                     // abacus
      box(g, pt, 34, 4, 34, 0, 266, 0, { r: 1 });                     // cap plate
      return g;
    }
  },
  // ---- 2. Craftsman column on stone pier -----------------------------------
  {
    id: 'porch_column_craftsman', name: 'Craftsman Column', cat: 'porch', w: 52, d: 52, h: 270,
    palettes: [
      { name: 'Stone / White', chip: '#e9e5da', paint: '#e9e5da' },
      { name: 'Stone / Sage', chip: '#93a086', paint: '#93a086' },
      { name: 'Stone / Iron', chip: '#3b3e42', paint: '#3b3e42' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const pt = solid(p.paint, 0.55);
      const stone = tex('stone_veneer', 1, 1);
      box(g, stone, 50, 80, 50, 0, 0, 0, { r: 1 });                   // stacked-stone pier
      box(g, solid('#c6c0b2', 0.85), 56, 6, 56, 0, 80, 0, { r: 1.5 }); // cast cap w/ drip edge
      box(g, pt, 37, 4, 37, 0, 86, 0, { r: 1 });                      // column base trim
      // tapered square shaft — 4-sided cyl, re-normalized flat for crisp facets
      const shaft = cyl(g, pt, 33 / Math.SQRT2, 166, 0, 90, 0, { rTop: 23 / Math.SQRT2, seg: 4 });
      shaft.rotation.y = Math.PI / 4;
      const g0 = shaft.geometry;
      shaft.geometry = g0.toNonIndexed();
      g0.dispose();
      shaft.geometry.computeVertexNormals();
      box(g, pt, 27, 4, 27, 0, 256, 0, { r: 1 });                     // neck trim
      box(g, pt, 33, 5, 33, 0, 260, 0, { r: 1 });                     // cap
      box(g, pt, 38, 5, 38, 0, 265, 0, { r: 1 });                     // wide cap plate
      return g;
    }
  },
  // ---- 3. Victorian turned post ---------------------------------------------
  {
    id: 'porch_post_turned', name: 'Turned Porch Post', cat: 'porch', w: 19, d: 19, h: 270,
    palettes: PAINT, plan: { type: 'stool' },
    build: (p) => {
      const g = G();
      const pt = solid(p.paint, 0.55);
      box(g, pt, 15, 30, 15, 0, 0, 0, { r: 0.8 });                    // square base block
      box(g, pt, 17, 3, 17, 0, 30, 0, { r: 0.8 });                    // base chamfer band
      cyl(g, pt, 8.4, 4, 0, 33, 0, { seg: 22 });                      // collar
      torus(g, pt, 6.6, 1.6, 0, 39, 0, { seg: 26, tubeSeg: 10 });     // bead
      sphere(g, pt, 8.2, 0, 49, 0, { sy: 1.2, seg: 22 });             // vase bulb
      cyl(g, pt, 5.2, 8, 0, 57, 0, { rTop: 5.8, seg: 20 });           // vase neck
      cyl(g, pt, 5.8, 138, 0, 65, 0, { rTop: 4.7, seg: 20 });         // long tapered shaft
      torus(g, pt, 5, 1.4, 0, 205, 0, { seg: 24, tubeSeg: 10 });      // upper bead
      cyl(g, pt, 6.2, 6, 0, 207, 0, { seg: 20 });                     // spool
      sphere(g, pt, 6.4, 0, 219, 0, { sy: 1.05, seg: 20 });           // upper bulb
      cyl(g, pt, 4.3, 11, 0, 226, 0, { seg: 18 });                    // neck
      box(g, pt, 13, 30, 13, 0, 237, 0, { r: 0.8 });                  // top block
      box(g, pt, 15, 3, 15, 0, 267, 0, { r: 0.8 });                   // top band
      return g;
    }
  },
  // ---- 4. Baluster railing section ------------------------------------------
  {
    id: 'porch_railing', name: 'Porch Railing', cat: 'porch', w: 240, d: 14, h: 96,
    palettes: PAINT, plan: { type: 'fence' },
    build: (p) => {
      const g = G();
      const pt = solid(p.paint, 0.55);
      for (const s of [-1, 1]) {
        box(g, pt, 10, 84, 10, s * 115, 0, 0, { r: 1 });              // end posts
        box(g, pt, 13.5, 3.5, 13.5, s * 115, 84, 0, { r: 1 });        // post caps
        sphere(g, pt, 4.2, s * 115, 91.5, 0, { seg: 16 });            // ball finials
      }
      box(g, pt, 220, 4, 12, 0, 76, 0, { r: 1.5 });                   // hand rail
      box(g, pt, 220, 2.5, 8, 0, 73.5, 0, { r: 1 });                  // rail sub-cap
      box(g, pt, 220, 4, 7, 0, 9, 0, { r: 1 });                       // bottom rail
      for (let i = 0; i < 13; i++) {                                  // turned balusters
        const x = -94.3 + i * 15.7;
        cyl(g, pt, 2, 60.5, x, 13, 0, { rTop: 1.6, seg: 12 });
        sphere(g, pt, 3, x, 36, 0, { sy: 1.7, seg: 14 });             // center swell
      }
      return g;
    }
  },
  // ---- 5. Broad entry steps --------------------------------------------------
  {
    id: 'porch_steps', name: 'Porch Steps', cat: 'porch', w: 240, d: 100, h: 54,
    palettes: [
      { name: 'Wood', chip: '#96714c', kind: 'wood' },
      { name: 'Concrete', chip: '#b6b2a8', kind: 'concrete' },
      { name: 'Brick', chip: '#9e5b45', kind: 'brick' }
    ],
    plan: { type: 'stairs' },
    build: (p) => {
      const g = G();
      let treadM, riserM, sideM;
      if (p.kind === 'brick') {
        treadM = tex('brick_red', 3, 0.5); riserM = tex('brick_red', 3, 0.5); sideM = tex('brick_red', 1, 0.5);
      } else if (p.kind === 'concrete') {
        treadM = solid('#b8b4aa', 0.9); riserM = solid('#a9a59b', 0.9); sideM = solid('#9d998f', 0.9);
      } else {
        treadM = wood('#96714c', 0.55); riserM = wood('#85623e', 0.6); sideM = wood('#6e5236', 0.65);
      }
      for (let i = 0; i < 3; i++) {
        const zf = 50 - i * 32;                                       // riser face z
        box(g, riserM, 222, 13.5, 3, 0, i * 18, zf - 1.5);            // riser
        // two tread boards with a seam + 3cm nosing over the riser
        box(g, treadM, 230, 4.5, 16.6, 0, i * 18 + 13.5, zf - 5.8, { r: 1 });
        box(g, treadM, 230, 4.5, 16.6, 0, i * 18 + 13.5, zf - 23.4, { r: 1 });
        // stepped side stringers
        for (const s of [-1, 1]) box(g, sideM, 9, (i + 1) * 18, 32, s * 115.5, 0, zf - 16, { r: 0.6 });
      }
      return g;
    }
  },
  // ---- 6. Hanging porch swing -----------------------------------------------
  {
    id: 'porch_swing', name: 'Porch Swing', cat: 'porch', w: 180, d: 130, h: 210,
    palettes: SEATING, plan: { type: 'sofa' },
    build: (p) => {
      const g = G();
      const fr = seatMat(p);
      const fab = solid(p.fabric, 0.95);
      const ch = metal('#7d8084', 0.4);
      // pergola frame: 4 posts, side beams, doubled header beams
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, fr, 9, 192, 9, sx * 80, 0, sz * 48, { r: 1 });
      for (const s of [-1, 1]) box(g, fr, 9, 9, 128, s * 80, 192, 0, { r: 1 });
      for (const s of [-1, 1]) box(g, fr, 178, 11, 5, 0, 195, s * 7, { r: 1 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1])             // knee braces
        strut(g, fr, sx * 80, 158, sz * 26, sx * 80, 188, sz * 45, 2.6);
      // chains — two per side, splaying front/back from the header
      for (const s of [-1, 1]) {
        strut(g, ch, s * 50, 198, 6, s * 50, 68, 25, 0.9);
        strut(g, ch, s * 50, 198, -6, s * 50, 74, -25, 0.9);
      }
      // slatted bench hung at seat height
      for (const z of [-24, 24]) box(g, fr, 118, 5, 5, 0, 43, z, { r: 1 });   // seat rails
      for (let i = 0; i < 5; i++) box(g, fr, 118, 2.6, 7.6, 0, 48, -18 + i * 9, { r: 0.8 });
      box(g, fr, 122, 4, 4, 0, 52, -27, { r: 1 });                    // back bottom rail
      for (let i = 0; i < 7; i++)                                     // back slats
        box(g, fr, 5.5, 34, 2.4, -39 + i * 13, 55, -29.5, { r: 0.8, rx: -0.16 });
      box(g, fr, 124, 6, 4.5, 0, 88, -34.5, { r: 1.2, rx: -0.16 });   // crest rail
      for (const s of [-1, 1]) {
        box(g, fr, 5, 24, 5, s * 54, 50, 20, { r: 1 });               // arm posts
        box(g, fr, 6, 3, 50, s * 54, 74, -3, { r: 1 });               // arms
      }
      box(g, fab, 112, 8, 44, 0, 50, 0, { r: 5 });                    // seat cushion
      box(g, fab, 108, 30, 8, 0, 58, -24, { r: 5, rx: -0.16 });       // back cushion
      return g;
    }
  },
  // ---- 7. Rocking chair -------------------------------------------------------
  {
    id: 'porch_rocking_chair', name: 'Rocking Chair', cat: 'porch', w: 64, d: 100, h: 110,
    palettes: [
      { name: 'White', chip: '#efece3', frame: '#efece3', kind: 'paint' },
      { name: 'Natural Oak', chip: '#a8804f', frame: '#a8804f', kind: 'wood' },
      { name: 'Black', chip: '#2c2e30', frame: '#2c2e30', kind: 'paint' }
    ],
    plan: { type: 'chair' },
    build: (p) => {
      const g = G();
      const fr = p.kind === 'wood' ? wood(p.frame, 0.5) : solid(p.frame, 0.5);
      // curved runners — arcs of a 140cm circle, ends curling up
      const R = 140, yc = R + 1.6;
      const ry = (z) => yc - Math.sqrt(R * R - z * z);
      const zs = [-46, -33, -18, 0, 16, 31, 44];
      for (const s of [-1, 1]) {
        for (let i = 0; i < zs.length - 1; i++) {
          segment(g, fr, [s * 27, ry(zs[i]), zs[i]], [s * 27, ry(zs[i + 1]), zs[i + 1]], 1.9, 1.9, 8);
        }
        sphere(g, fr, 1.9, s * 27, ry(44), 44, { seg: 10 });          // rounded runner tips
      }
      // cross stretchers between the runners
      cyl(g, fr, 1.6, 51, 0, ry(14) - 1, 14, { rz: Math.PI / 2, seg: 10 });
      cyl(g, fr, 1.6, 51, 0, ry(-24) - 1, -24, { rz: Math.PI / 2, seg: 10 });
      // legs: splayed front legs, back stiles run runner→crest in one sweep
      for (const s of [-1, 1]) {
        segment(g, fr, [s * 26.5, ry(23), 23], [s * 25, 42, 19], 2.5, 2, 10);
        segment(g, fr, [s * 26.5, ry(-27), -27], [s * 21.5, 101, -39], 2.7, 2, 10);
      }
      box(g, fr, 54, 4.5, 48, 0, 40.5, -3, { r: 2, rx: -0.07 });      // scooped seat
      // spindle back fanning up to the crest
      for (let i = 0; i < 6; i++) {
        const x = -15 + i * 6;
        segment(g, fr, [x, 43, -24.5], [x * 0.88, 92, -36.5], 1.15, 1, 8);
      }
      box(g, fr, 50, 12, 4, 0, 91, -38.5, { r: 2, rx: -0.24 });       // crest rail
      box(g, fr, 48, 4, 3.2, 0, 58, -28.5, { r: 1.4, rx: -0.24 });    // lower back rail
      for (const s of [-1, 1]) {
        box(g, fr, 5.5, 2.8, 46, s * 26, 64, -6, { r: 1.2 });         // flat arms
        segment(g, fr, [s * 25, 43, 15], [s * 25.7, 64, 13], 1.7, 1.5, 8); // arm posts
      }
      return g;
    }
  },
  // ---- 8. Glider bench --------------------------------------------------------
  {
    id: 'porch_bench_glider', name: 'Glider Bench', cat: 'porch', w: 150, d: 80, h: 92,
    palettes: SEATING, plan: { type: 'sofa' },
    build: (p) => {
      const g = G();
      const fr = seatMat(p);
      const fab = solid(p.fabric, 0.95);
      const link = metal('#54575b', 0.4);
      // floor sled base + cross members
      for (const s of [-1, 1]) box(g, fr, 13, 5.5, 70, s * 62, 0, 0, { r: 2 });
      for (const z of [-26, 26]) box(g, fr, 122, 4, 5, 0, 1, z, { r: 1 });
      // glider swing-arms (angled links the bench rocks on)
      for (const s of [-1, 1]) for (const z of [-1, 1])
        strut(g, link, s * 60, 5, z * 22, s * 60, 30, z * 13, 1.2);
      box(g, fr, 130, 4.5, 56, 0, 30, 1, { r: 2 });                   // seat platform
      for (let i = 0; i < 5; i++) box(g, fr, 126, 2.4, 8.4, 0, 34.5, -19 + i * 11, { r: 0.8 });
      box(g, fr, 128, 4, 3.5, 0, 37, -25, { r: 1 });                  // back bottom rail
      for (let i = 0; i < 8; i++)                                     // back slats
        box(g, fr, 5, 40, 2.4, -45.5 + i * 13, 40, -27.5, { r: 0.8, rx: -0.18 });
      box(g, fr, 134, 6, 4.5, 0, 80, -35, { r: 1.4, rx: -0.18 });     // crest rail
      for (const s of [-1, 1]) {
        box(g, fr, 4.5, 26, 4.5, s * 63, 32, 20, { r: 1 });           // arm posts
        box(g, fr, 7, 3.5, 54, s * 64, 58, -4, { r: 1.4 });           // arms
      }
      box(g, fab, 124, 9, 46, 0, 35, 2, { r: 5.5 });                  // seat cushion
      box(g, solid('#eee8da', 0.95), 36, 36, 12, -38, 42, -20, { r: 8, ry: 0.25, rx: -0.18 });
      box(g, solid('#c98a5a', 0.95), 36, 36, 12, 38, 42, -20, { r: 8, ry: -0.2, rx: -0.18 });
      return g;
    }
  },
  // ---- 9. Screen door (wall) --------------------------------------------------
  {
    id: 'porch_screen_door', name: 'Screen Door', cat: 'porch', w: 92, d: 6, h: 205,
    mount: 'wall', elevation: 0,
    palettes: [
      { name: 'White', chip: '#eef0ec', paint: '#eef0ec' },
      { name: 'Sage', chip: '#8f9a80', paint: '#8f9a80' },
      { name: 'Black', chip: '#2e3032', paint: '#2e3032' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const pt = solid(p.paint, 0.5);
      for (const s of [-1, 1]) box(g, pt, 9, 205, 3.6, s * 41.5, 0, 0, { r: 0.6 }); // stiles
      box(g, pt, 74, 13, 3.6, 0, 192, 0, { r: 0.6 });                 // top rail
      box(g, pt, 74, 10, 3.6, 0, 90, 0, { r: 0.6 });                  // mid rail
      box(g, pt, 74, 26, 3.6, 0, 0, 0, { r: 0.6 });                   // bottom rail
      // fine dark screen mesh in both openings
      box(g, netMaterial('#585d63', 26, 32), 74, 92, 0.4, 0, 100, 0);
      box(g, netMaterial('#585d63', 26, 22), 74, 64, 0.4, 0, 26, 0);
      // corner brackets in the upper opening
      for (const s of [-1, 1]) strut(g, pt, s * 37, 178, 1, s * 24, 191, 1, 1.4);
      strut(g, pt, -37, 103, 1, -24, 90.5, 1, 1.4);
      strut(g, pt, 37, 103, 1, 24, 90.5, 1, 1.4);
      // hardware: pull handle + spring hinges
      cyl(g, metal('#2b2d2f', 0.35), 1, 14, -34, 96, 3.4);
      box(g, metal('#2b2d2f', 0.35), 3, 18, 1, -34, 94, 2.2, { r: 0.5 });
      for (const y of [30, 170]) box(g, metal('#7e8286', 0.4), 2.5, 9, 1.2, 44.5, y, 1.4, { r: 0.4 });
      return g;
    }
  },
  // ---- 10. Porch ceiling fan ---------------------------------------------------
  {
    id: 'porch_ceiling_fan', name: 'Porch Ceiling Fan', cat: 'porch', w: 142, d: 142, h: 52,
    mount: 'ceiling', palettes: null, plan: { type: 'lampRound' },
    light: { y: -44, color: '#fff2dc', intensity: 1.25, distance: 640 },
    build: () => {
      const g = G();
      const bronze = metal('#4c3f33', 0.45);
      cyl(g, bronze, 8, 6, 0, -6, 0, { rTop: 5.5, seg: 20 });         // ceiling canopy
      cyl(g, bronze, 1.9, 14, 0, -20, 0);                             // downrod
      cyl(g, bronze, 13.5, 10, 0, -30, 0, { seg: 26 });               // motor housing
      cyl(g, bronze, 14.2, 2, 0, -31.5, 0, { seg: 26 });              // trim band
      for (let i = 0; i < 5; i++) {                                   // 5 walnut blades
        const a = (i / 5) * Math.PI * 2;
        strut(g, bronze, Math.cos(a) * 11, -26, Math.sin(a) * 11, Math.cos(a) * 28, -25, Math.sin(a) * 28, 1.1);
        const blade = box(g, wood('#5a4433', 0.5), 62, 1.8, 15, Math.cos(a) * 40, -26.2, Math.sin(a) * 40, { r: 3 });
        blade.rotation.y = -a;
        blade.rotation.z = 0.09;
      }
      cyl(g, bronze, 4.5, 4, 0, -35.5, 0, { seg: 18 });               // light-kit stem
      sphere(g, glow('#f4e8d2', 0.85, 0.55, '#f2debc'), 8.5, -0, -39.5, 0, { sy: 0.8, seg: 20 }); // frosted bowl
      sphere(g, bronze, 1.6, 0, -46, 0, { seg: 10 });                 // finial
      return g;
    }
  },
  // ---- 11. Pendant lantern (ceiling) --------------------------------------------
  {
    id: 'porch_pendant_lantern', name: 'Pendant Lantern', cat: 'porch', w: 32, d: 32, h: 84,
    mount: 'ceiling', palettes: LANTERN, plan: { type: 'lampRound' },
    light: { y: -58, color: '#ffd9a0', intensity: 1.15, distance: 520 },
    build: (p) => {
      const g = G();
      const fr = metal(p.body, 0.5);
      cyl(g, fr, 5.5, 2.5, 0, -2.5, 0, { seg: 20 });                  // ceiling plate
      for (let i = 0; i < 6; i++)                                     // hanging chain
        torus(g, fr, 2.1, 0.55, 0, -6.5 - i * 3.4, 0, { rx: 0, ry: i % 2 ? Math.PI / 2 : 0, seg: 24, tubeSeg: 8 });
      torus(g, fr, 2.4, 0.7, 0, -29.5, 0, { rx: 0, seg: 24, tubeSeg: 8 }); // hang loop
      lanternBody(g, p, 19, 28, -72);                                 // lantern under the chain
      cyl(g, fr, 1.2, 3.5, 0, -75.5, 0);                              // bottom drop finial
      sphere(g, fr, 1.8, 0, -77, 0, { seg: 12 });
      return g;
    }
  },
  // ---- 12. Carriage wall lantern -------------------------------------------------
  {
    id: 'porch_wall_lantern', name: 'Wall Lantern', cat: 'porch', w: 24, d: 30, h: 52,
    mount: 'wall', elevation: 165, palettes: LANTERN, plan: { type: 'wallDecor' },
    light: { y: 26, color: '#ffd9a0', intensity: 1.0, distance: 440 },
    build: (p) => {
      const g = G();
      const fr = metal(p.body, 0.5);
      box(g, fr, 11, 34, 2.4, 0, 4, 1.2, { r: 1 });                   // wall backplate
      for (const y of [7, 34.5]) sphere(g, fr, 1.2, 0, y, 2.2, { seg: 10 }); // screw caps
      strut(g, fr, 0, 8, 2.2, 0, 13.5, 15, 1.4);                      // lower scroll arm
      segment(g, fr, [0, 13.5, 15], [0, 10.5, 18.5], 1.2, 0.9, 8);    // scroll tail
      lanternBody(g, p, 16, 22, 12);                                  // lantern on the arm
      strut(g, fr, 0, 36, 2.2, 0, 42, 15, 1.1);                       // upper support arm
      return g;
    }
  },
  // ---- 13. Welcome mat ------------------------------------------------------------
  {
    id: 'porch_welcome_mat', name: 'Welcome Mat', cat: 'porch', w: 76, d: 46, h: 3,
    palettes: [
      { name: 'Coir', chip: '#c9a86a', bg: '#c0a066', fg: '#463a28' },
      { name: 'Charcoal', chip: '#3d3f41', bg: '#3d3f41', fg: '#ded6c2' },
      { name: 'Sage', chip: '#8e9a82', bg: '#8e9a82', fg: '#f0ece0' }
    ],
    plan: { type: 'rug' },
    build: (p) => {
      const g = G();
      box(g, solid(p.bg, 0.98), 76, 2.2, 46, 0, 0, 0, { r: 1 });      // bristle base
      const t = textMaterial('WELCOME', {
        w: 512, h: 256, bg: p.bg, fg: p.fg, size: 88, weight: 700, border: p.fg
      });
      box(g, t, 70, 0.5, 40, 0, 2.2, 0);                              // woven lettering face
      return g;
    }
  },
  // ---- 14. Urn planter pair ---------------------------------------------------------
  {
    id: 'porch_planter_pair', name: 'Urn Planter Pair', cat: 'porch', w: 130, d: 46, h: 80,
    palettes: [
      { name: 'Terracotta', chip: '#b06a44', pot: '#b06a44' },
      { name: 'Cast Stone', chip: '#b9b3a4', pot: '#b9b3a4' },
      { name: 'Graphite', chip: '#3c3e42', pot: '#3c3e42' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      const potM = solid(p.pot, 0.8);
      let i = 0;
      for (const s of [-1, 1]) {
        const x = s * 42;
        cyl(g, potM, 10.5, 3.5, x, 0, 0, { seg: 22 });                // plinth foot
        cyl(g, potM, 6.8, 7, x, 3.5, 0, { rTop: 7.6, seg: 20 });      // stem
        cyl(g, potM, 8, 17, x, 10.5, 0, { rTop: 16.2, seg: 24 });     // flared bowl
        torus(g, potM, 16.4, 2.1, x, 28, 0, { seg: 30, tubeSeg: 12 }); // rolled rim
        cyl(g, solid('#41372b', 0.98), 14.4, 2, x, 27, 0, { seg: 20 }); // soil
        // layered boxwood ball
        blob(g, '#33531f', '#6d9c40', 14.5, x, 43, 0, { seed: 11 + i });
        blob(g, '#3a5c24', '#7cab4c', 9, x - s * 6, 54, 4, { seed: 23 + i });
        blob(g, '#33531f', '#6d9c40', 8, x + s * 7, 52, -5, { seed: 37 + i });
        blob(g, '#3a5c24', '#7cab4c', 6.5, x, 60, -1, { seed: 51 + i });
        i += 100;
      }
      return g;
    }
  },
  // ---- 15. Address plaque (wall, editable text) ---------------------------------------
  {
    id: 'porch_address_plaque', name: 'Address Plaque', cat: 'porch', w: 42, d: 5, h: 33,
    mount: 'wall', elevation: 140, sign: true, signDefault: '816',
    palettes: [
      { name: 'Bronze', chip: '#4a3b2a', bg: '#4a3b2a', fg: '#e8dcc2' },
      { name: 'Slate', chip: '#2b2f34', bg: '#2b2f34', fg: '#eef0f2' },
      { name: 'White / Black', chip: '#e9e6dd', bg: '#e9e6dd', fg: '#25272a' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const body = metal(p.bg, 0.45);
      // cast oval dome + raised rim ring
      sphere(g, body, 20, 0, 16.5, 0, { sy: 0.8, sz: 0.11, seg: 32 });
      const ring = torus(g, metal(p.fg, 0.4), 17.5, 0.9, 0, 16.5, 1.6, { rx: 0, seg: 40, tubeSeg: 10 });
      ring.scale.y = 0.78;
      const t = textMaterial(p.sign ?? '816', {
        w: 512, h: 256, bg: p.bg, fg: p.fg, size: 150, weight: 800
      });
      box(g, t, 25, 13, 0.8, 0, 10, 1.9);                             // number face
      for (const s of [-1, 1]) sphere(g, metal(p.fg, 0.4), 1, s * 15.8, 16.5, 1.8, { seg: 10 });
      return g;
    }
  },
  // ---- 16. Flag bracket + waving flag ---------------------------------------------------
  {
    id: 'porch_flag_bracket', name: 'Porch Flag', cat: 'porch', w: 90, d: 70, h: 62,
    mount: 'wall', elevation: 150, palettes: null, plan: { type: 'flag' },
    build: () => {
      const g = G();
      const fr = metal('#2e3033', 0.45);
      box(g, fr, 8, 20, 2.4, 0, 0, 1.2, { r: 1 });                    // wall bracket plate
      for (const y of [2.5, 17.5]) sphere(g, fr, 1.1, 0, y, 2.2, { seg: 10 });
      cyl(g, fr, 2.6, 4, 0, 8, 3, { rx: Math.PI / 2 - 0.66, seg: 14 }); // angled pole socket
      const pole = wood('#e3ddd0', 0.5);
      strut(g, pole, 0, 3.5, 2.5, 0, 49, 61.5, 1.7, { rTop: 1.5 });   // white flag pole
      sphere(g, metal('#c8a44a', 0.35), 2.5, 0, 51.2, 64.4, { seg: 14 }); // gold ball finial
      // stars & stripes, hoist lashed along the upper pole, flying sideways
      const flag = buildFlag(g, flagTexture('us'), 76, 40, 0, 37.5, 46.5, { phase: 0.6 });
      flag.rotation.x = 0.91;                                          // hoist follows pole angle
      return g;
    }
  },
  // ---- 17. Hanging fern (ceiling) ---------------------------------------------------------
  {
    id: 'porch_hanging_fern', name: 'Hanging Fern', cat: 'porch', w: 60, d: 60, h: 74,
    mount: 'ceiling', palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      const ch = metal('#5c5f63', 0.4);
      cyl(g, ch, 1, 3, 0, -3, 0, { seg: 8 });                         // ceiling hook stem
      for (let i = 0; i < 3; i++) {                                   // three basket chains
        const a = (i / 3) * Math.PI * 2 + 0.4;
        strut(g, ch, 0, -4, 0, Math.cos(a) * 13, -36, Math.sin(a) * 13, 0.45);
      }
      torus(g, ch, 14.8, 0.7, 0, -36.5, 0, { seg: 28, tubeSeg: 8 });  // basket rim wire
      cyl(g, solid('#7a5a38', 0.95), 9.5, 12, 0, -49, 0, { rTop: 14.6, seg: 20 }); // coco liner
      // lush crown + drooping frond skirt
      blob(g, '#2f5423', '#67a03c', 13, 0, -33, 0, { seed: 7, sy: 0.8 });
      blob(g, '#376028', '#74ad46', 8.5, 6, -30, -6, { seed: 19, sy: 0.75 });
      blob(g, '#376028', '#74ad46', 8, -7, -31, 6, { seed: 31, sy: 0.75 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        blob(g, '#2a4c1e', '#5d9436', 6.2,
          Math.cos(a) * 16.5, -44 - (i % 3) * 5, Math.sin(a) * 16.5,
          { seed: 43 + i, sy: 1.9 });
      }
      return g;
    }
  },
  // ---- 18. Lemonade side table --------------------------------------------------------------
  {
    id: 'porch_side_table', name: 'Lemonade Side Table', cat: 'porch', w: 50, d: 50, h: 74,
    palettes: [
      { name: 'White', chip: '#eeebe2', frame: '#eeebe2', kind: 'paint' },
      { name: 'Teak', chip: '#a8804f', frame: '#a8804f', kind: 'wood' },
      { name: 'Sage', chip: '#8f9a80', frame: '#8f9a80', kind: 'paint' }
    ],
    plan: { type: 'tableRound' },
    build: (p) => {
      const g = G();
      const fr = p.kind === 'wood' ? wood(p.frame, 0.5) : solid(p.frame, 0.5);
      cyl(g, fr, 24, 3.2, 0, 49, 0, { seg: 30 });                     // round top
      torus(g, fr, 23.6, 1.2, 0, 49.2, 0, { seg: 34, tubeSeg: 8 });   // edge banding
      for (let i = 0; i < 3; i++) {                                   // splayed turned legs
        const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
        const fx = Math.cos(a) * 19, fz = Math.sin(a) * 19;
        segment(g, fr, [fx, 0, fz], [fx * 0.55, 49, fz * 0.55], 2.2, 1.7, 12);
        sphere(g, fr, 2.2, fx, 1.6, fz, { seg: 10 });                 // foot pads
      }
      cyl(g, fr, 12.5, 2, 0, 17, 0, { seg: 24 });                     // lower shelf
      // lemonade pitcher
      const lemonade = solid('#e9c33f', 0.35);
      cyl(g, glass(), 6, 15, -7, 52.2, -3, { rTop: 4.8, seg: 20 });
      cyl(g, lemonade, 5.2, 11.5, -7, 53, -3, { rTop: 4.2, seg: 18 });
      const handle = torus(g, glass(), 4, 0.9, -13.6, 59.5, -3, { rx: 0, ry: Math.PI / 2, seg: 22, tubeSeg: 8 });
      handle.scale.x = 0.75;
      cyl(g, solid('#f5e34e', 0.5), 2.6, 0.6, -4.6, 66.4, -3, { seg: 14, rz: 0.5 }); // lemon wheel on rim
      // two glasses
      for (const [gx, gz] of [[8, 6], [10, -7]]) {
        cyl(g, glass(), 3, 8.5, gx, 52.2, gz, { rTop: 2.7, seg: 16 });
        cyl(g, lemonade, 2.5, 5.5, gx, 52.8, gz, { rTop: 2.3, seg: 14 });
      }
      return g;
    }
  }
];
