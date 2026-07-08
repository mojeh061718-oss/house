// Farm & homestead pack — animals, structures and yard gear built entirely
// from primitive helpers (no external models). Animals face +Z (head forward),
// origin centered on the ground, all dimensions in centimeters.
import {
  G, box, cyl, sphere, prism, pyramid, blob, foliage, segment, torus,
  solid, wood, metal, glass, water, tex
} from '../builders.js';

// ---- local helpers --------------------------------------------------------
const HOOF = solid('#2b2622', 0.6);
// one straight leg with a dark hoof at the bottom (used for stools/props)
function leg(g, mat, x, z, h, r) {
  cyl(g, mat, r, h, x, 0, z, { rTop: r * 0.88, seg: 12 });
  cyl(g, HOOF, r * 1.02, h * 0.14, x, 0, z, { seg: 12 });
}
/** Jointed animal leg: an angled upper leg to a knee/hock, a cannon bone down
 *  to a hoof at ground level. `front` flips the joint so fore and hind legs
 *  bend naturally opposite ways. Reads far more like a real limb than a post. */
function leg2(g, mat, hoofMat, x, zTop, topY, r, front = true) {
  const dir = front ? 1 : -1;
  const kneeY = topY * 0.46;
  const kneeZ = zTop + dir * topY * 0.07;
  const footZ = zTop - dir * topY * 0.02;
  segment(g, mat, [x, topY, zTop], [x, kneeY, kneeZ], r, r * 0.72, 10);      // upper leg
  segment(g, mat, [x, kneeY, kneeZ], [x, r * 1.1, footZ], r * 0.66, r * 0.5, 10); // cannon
  sphere(g, mat, r * 0.78, x, kneeY, kneeZ, { sy: 1.15, seg: 10 });           // knee
  cyl(g, hoofMat, r * 0.62, r * 1.7, x, 0, footZ, { rTop: r * 0.5, seg: 10 }); // hoof
}
// a couple of galvanised carry-handles used on troughs / cans
function ring(g, mat, r, x, y, z) {
  cyl(g, mat, 0.9, r * 2, x, y, z, { rz: Math.PI / 2, seg: 10 });
}
// lighten/darken a #rrggbb hex toward white (f>0) or black (f<0)
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => {
    const t = f >= 0 ? v + (255 - v) * f : v * (1 + f);
    return Math.max(0, Math.min(255, Math.round(t)));
  };
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((v) => ch(v).toString(16).padStart(2, '0')).join('');
}

export const FARM_ITEMS = [
  // ============================ ANIMALS ============================
  {
    id: 'farm_cow', name: 'Cow', cat: 'farm', w: 84, d: 244, h: 152,
    plan: { type: 'animal' },
    palettes: [
      { name: 'Holstein', chip: '#f2efe9', body: '#f3f0ea', spot: '#26221e', horn: '#d8cfbf' },
      { name: 'Jersey Brown', chip: '#9c6b3f', body: '#9c6b3f', spot: null, horn: '#cdbfa6' },
      { name: 'Black Angus', chip: '#2a2622', body: '#2a2622', spot: null, horn: '#3a352f' }
    ],
    build: (p) => {
      const g = G();
      const hide = solid(p.body, 0.82);
      const legMat = solid(p.spot ? '#efece6' : p.body, 0.82);
      // jointed legs — fores forward, hinds back and hocked
      leg2(g, legMat, HOOF, -26, 62, 78, 10, true);
      leg2(g, legMat, HOOF, 26, 62, 78, 10, true);
      leg2(g, legMat, HOOF, -28, -70, 80, 11, false);
      leg2(g, legMat, HOOF, 28, -70, 80, 11, false);
      // slim connective core — the flattened masses SHAPE the silhouette
      segment(g, hide, [0, 102, -80], [0, 106, 68], 30, 27, 18);
      sphere(g, hide, 48, 0, 96, -8, { sx: 0.82, sy: 0.82, sz: 1.35 });   // deep sagging belly
      sphere(g, hide, 40, 0, 104, 50, { sx: 0.82, sy: 0.9, sz: 0.9 });    // shoulder mass
      sphere(g, hide, 41, 0, 104, -70, { sx: 0.88, sy: 0.92, sz: 0.85 }); // hindquarters
      sphere(g, hide, 12, 0, 90, 82, { sx: 0.55, sy: 1.1, sz: 0.55 });    // dewlap
      // arched neck → head
      segment(g, hide, [0, 112, 68], [0, 122, 108], 17, 11, 12);
      sphere(g, hide, 17, 0, 124, 112, { sx: 0.78, sy: 0.92, sz: 1.0 });
      // blocky muzzle with broad pale nose pad + nostrils
      box(g, hide, 22, 17, 20, 0, 106, 122, { r: 7 });
      sphere(g, solid('#d8c3bb', 0.7), 11.5, 0, 113, 130, { sx: 1.0, sy: 0.7, sz: 0.6 }); // nose pad
      sphere(g, solid('#2b2622', 0.4), 2.1, -5.5, 111, 135, { sy: 1.3 });
      sphere(g, solid('#2b2622', 0.4), 2.1, 5.5, 111, 135, { sy: 1.3 });
      for (const s of [-1, 1]) sphere(g, solid('#26201c', 0.35), 2.6, s * 11, 128, 116); // eyes
      // ears stick OUT from the poll; short curved horns above
      for (const s of [-1, 1]) {
        const ear = sphere(g, hide, 9, s * 21, 130, 108, { sx: 1.1, sy: 0.4, sz: 0.6 });
        ear.rotation.z = s * 0.25;
        segment(g, solid(p.horn, 0.5), [s * 8, 135, 108], [s * 16, 143, 105], 2.8, 0.8, 8);
      }
      // switch tail to a dark tuft
      segment(g, hide, [0, 130, -86], [3, 92, -98], 3.4, 2.2, 8);
      segment(g, hide, [3, 92, -98], [5, 46, -99], 2.2, 1.4, 8);
      sphere(g, solid('#2b2622', 0.9), 5.5, 5, 38, -99, { sy: 1.6 });
      // udder tucked ahead of the hind legs, with teats
      sphere(g, solid('#e7b9b4', 0.7), 16, 0, 56, -36, { sx: 0.9, sy: 0.72, sz: 1.05 });
      for (const [tx, tz] of [[-7, -28], [7, -28], [-7, -44], [7, -44]])
        cyl(g, solid('#e7b9b4', 0.7), 1.8, 8, tx, 41, tz, { rTop: 1.3, seg: 8 });
      // Holstein patches — sit on the barrel surface (flattened along the
      // outward axis so they read as markings, not lumps inside the body)
      if (p.spot) {
        const sp = solid(p.spot, 0.82);
        sphere(g, sp, 22, 34, 100, 8, { sx: 0.3, sy: 0.95, sz: 1.2 });    // right flank
        sphere(g, sp, 18, -35, 96, -42, { sx: 0.3, sy: 0.95, sz: 1.05 }); // left haunch
        sphere(g, sp, 24, 5, 126, -6, { sx: 0.95, sy: 0.28, sz: 1.25 });  // topline (seen from above)
        sphere(g, sp, 15, -18, 118, -66, { sx: 0.85, sy: 0.5, sz: 0.85 });// rump
        sphere(g, sp, 15, 26, 104, 52, { sx: 0.4, sy: 0.85, sz: 0.9 });   // shoulder
        sphere(g, sp, 7, 0, 131, 116, { sx: 0.85, sy: 0.6, sz: 0.6 });    // forehead
      }
      return g;
    }
  },
  {
    id: 'farm_horse', name: 'Horse', cat: 'farm', w: 68, d: 240, h: 172,
    plan: { type: 'animal' },
    palettes: [
      { name: 'Chestnut', chip: '#7c4a2a', body: '#7c4a2a', mane: '#3a241a' },
      { name: 'Black', chip: '#241f1c', body: '#241f1c', mane: '#141110' },
      { name: 'White Grey', chip: '#e4e1da', body: '#e4e1da', mane: '#cfcabf' },
      { name: 'Palomino', chip: '#c79a56', body: '#c79a56', mane: '#f0ead6' }
    ],
    build: (p) => {
      const g = G();
      const hide = solid(p.body, 0.72);
      const mane = solid(p.mane, 0.85);
      // jointed legs — long & slender (leg length ≈ body depth), hinds hocked
      leg2(g, hide, HOOF, -18, 60, 106, 7.5, true);
      leg2(g, hide, HOOF, 18, 60, 106, 7.5, true);
      leg2(g, hide, HOOF, -20, -64, 108, 8, false);
      leg2(g, hide, HOOF, 20, -64, 108, 8, false);
      // slim connective core; sleek masses shape the barrel
      segment(g, hide, [0, 126, -72], [0, 132, 60], 22, 19, 16);
      sphere(g, hide, 34, 0, 122, -8, { sx: 0.72, sy: 0.82, sz: 1.3 });    // barrel/belly
      sphere(g, hide, 32, 0, 130, 48, { sx: 0.74, sy: 0.92, sz: 0.95 });   // chest/shoulder
      sphere(g, hide, 32, 0, 130, -62, { sx: 0.8, sy: 0.94, sz: 0.95 });   // hindquarters
      sphere(g, hide, 18, 0, 148, 46, { sx: 0.56, sy: 0.72, sz: 0.9 });    // withers
      sphere(g, hide, 20, 0, 148, -66, { sx: 0.66, sy: 0.62, sz: 0.95 });  // croup
      // long arched neck — tapered segment chain up to the poll
      segment(g, hide, [0, 138, 52], [0, 158, 82], 16, 12, 14);
      segment(g, hide, [0, 158, 82], [0, 170, 100], 12, 8.5, 12);
      // head — skull + long face tapering to a fine muzzle
      sphere(g, hide, 12, 0, 172, 102, { sx: 0.76, sy: 1.0, sz: 1.1 });
      segment(g, hide, [0, 170, 105], [0, 152, 126], 9.5, 5.8, 12);
      sphere(g, solid('#3a2c24', 0.6), 6, 0, 150, 127, { sx: 0.85, sy: 0.8 }); // nose
      sphere(g, solid('#201a16', 0.4), 1.4, -3.6, 149, 129);
      sphere(g, solid('#201a16', 0.4), 1.4, 3.6, 149, 129);
      // jaw cheek
      sphere(g, hide, 8, 0, 163, 104, { sx: 0.95, sy: 0.9, sz: 1.1 });
      for (const s of [-1, 1]) sphere(g, solid('#1a1512', 0.35), 2.2, s * 9, 174, 102); // eyes
      // small upright ears
      for (const s of [-1, 1]) segment(g, hide, [s * 5, 178, 96], [s * 8, 189, 92], 3.4, 0.5, 8);
      // mane — tufts falling down the crest from poll to withers
      for (let i = 0; i <= 9; i++) {
        const t = i / 9;
        sphere(g, mane, 6.5 - t * 1.2, 0,
          176 - t * 22 - Math.sin(t * Math.PI) * 4, 98 - t * 50,
          { sx: 0.4, sy: 1.15, sz: 0.75 });
      }
      sphere(g, mane, 4.5, 0, 180, 100, { sx: 0.5, sy: 1.1, sz: 0.5 });    // forelock
      // full flowing tail from the croup
      segment(g, mane, [0, 152, -76], [0, 108, -96], 6, 5, 10);
      segment(g, mane, [0, 108, -96], [0, 54, -100], 5.5, 3, 10);
      sphere(g, mane, 8, 0, 120, -92, { sx: 0.75, sy: 1.9, sz: 0.85 });
      sphere(g, mane, 7, 0, 70, -99, { sx: 0.65, sy: 2.0, sz: 0.75 });
      return g;
    }
  },
  {
    id: 'farm_pig', name: 'Pig', cat: 'farm', w: 56, d: 120, h: 66,
    plan: { type: 'animal' },
    palettes: [
      { name: 'Pink', chip: '#e7a99e', body: '#e7a99e' },
      { name: 'Spotted', chip: '#d8b8a8', body: '#d8b8a8', spot: '#4a3f3a' },
      { name: 'Black Berkshire', chip: '#33302e', body: '#33302e' }
    ],
    build: (p) => {
      const g = G();
      const hide = solid(p.body, 0.7);
      const dark = p.body === '#33302e';
      const snoutC = solid(dark ? '#5a4f4a' : '#d98f84', 0.6);
      // stubby jointed legs — the belly nearly brushes the ground between them
      leg2(g, hide, HOOF, -15, 30, 26, 6.5, true);
      leg2(g, hide, HOOF, 15, 30, 26, 6.5, true);
      leg2(g, hide, HOOF, -16, -32, 27, 7, false);
      leg2(g, hide, HOOF, 16, -32, 27, 7, false);
      // slim connective core; big low round masses make the silhouette
      segment(g, hide, [0, 34, -40], [0, 36, 36], 18, 16, 14);
      sphere(g, hide, 28, 0, 32, -4, { sx: 0.86, sy: 0.8, sz: 1.3 });   // low round belly
      sphere(g, hide, 23, 0, 33, -32, { sx: 0.9, sy: 0.82, sz: 0.9 });  // hams
      sphere(g, hide, 22, 0, 33, 26, { sx: 0.9, sy: 0.82, sz: 0.95 });  // shoulders
      // head blends straight off the shoulders (no neck)
      sphere(g, hide, 17, 0, 38, 48, { sx: 0.92, sy: 0.88, sz: 0.95 });
      sphere(g, hide, 9, 0, 34, 58, { sx: 0.85, sy: 0.8, sz: 0.9 });    // snout bridge
      // flat disc snout with nostril dots
      cyl(g, snoutC, 8, 5, 0, 34, 62, { rx: Math.PI / 2, seg: 16 });
      sphere(g, solid('#2b2622', 0.4), 1.5, -3.2, 34, 64.6);
      sphere(g, solid('#2b2622', 0.4), 1.5, 3.2, 34, 64.6);
      sphere(g, solid('#1a1512', 0.35), 1.7, -8, 44, 55);               // eyes
      sphere(g, solid('#1a1512', 0.35), 1.7, 8, 44, 55);
      // floppy triangular ears drooping forward over the eyes
      for (const s of [-1, 1]) {
        const e = pyramid(g, hide, 9, 13, 3, s * 9, 43, 50);
        e.rotation.x = 2.6; e.rotation.z = s * -0.25;
      }
      // curly corkscrew tail — a loop of tiny tapered segments
      segment(g, hide, [0, 42, -46], [3, 46, -50], 2.2, 1.8, 8);
      segment(g, hide, [3, 46, -50], [6, 42, -53], 1.8, 1.5, 8);
      segment(g, hide, [6, 42, -53], [3, 38, -51], 1.5, 1.2, 8);
      segment(g, hide, [3, 38, -51], [1, 41, -48], 1.2, 0.8, 8);
      // spots sit on the barrel surface (flattened along the outward axis)
      if (p.spot) {
        const sp = solid(p.spot, 0.7);
        sphere(g, sp, 13, 22, 32, -4, { sx: 0.3, sy: 0.95, sz: 1.1 });  // right flank
        sphere(g, sp, 11, -19, 36, 22, { sx: 0.3, sy: 0.95, sz: 1.0 }); // left shoulder
        sphere(g, sp, 12, 4, 52, -22, { sx: 0.9, sy: 0.3, sz: 1.0 });   // saddle (from above)
        sphere(g, sp, 7, 5, 42, 50, { sx: 0.75, sy: 0.65, sz: 0.5 });   // over an eye
      }
      return g;
    }
  },
  {
    id: 'farm_sheep', name: 'Sheep', cat: 'farm', w: 60, d: 128, h: 96,
    plan: { type: 'animal' },
    palettes: [
      { name: 'Wool White', chip: '#efece4', wool: '#efece4', face: '#33302c' },
      { name: 'Suffolk', chip: '#e9e5dc', wool: '#e9e5dc', face: '#201d1a' },
      { name: 'Brown', chip: '#b9a789', wool: '#b9a789', face: '#4a3f34' }
    ],
    build: (p) => {
      const g = G();
      const wool = p.wool;
      const face = solid(p.face, 0.7);
      const legMat = solid(p.face, 0.75);
      // slender dark jointed legs — bare below the fleece line
      leg2(g, legMat, HOOF, -15, 32, 42, 5, true);
      leg2(g, legMat, HOOF, 15, 32, 42, 5, true);
      leg2(g, legMat, HOOF, -16, -34, 43, 5, false);
      leg2(g, legMat, HOOF, 16, -34, 43, 5, false);
      // fleece — layered overlapping wool blobs, brighter on top
      blob(g, wool, '#ffffff', 33, 0, 60, -4, { seed: 5, sy: 0.92, detail: 3 });
      blob(g, wool, '#ffffff', 28, 0, 62, 26, { seed: 8, sy: 0.94, detail: 3 });
      blob(g, wool, '#ffffff', 26, 0, 60, -36, { seed: 3, sy: 0.92, detail: 3 });
      blob(g, wool, '#ffffff', 17, 0, 64, 38, { seed: 11, sy: 0.9, detail: 3 }); // chest/neck wool
      // bare head + face held up clear of the fleece
      sphere(g, face, 12.5, 0, 76, 56, { sx: 0.76, sy: 1.0, sz: 1.05 });
      segment(g, face, [0, 74, 60], [0, 68, 70], 7.5, 4.5, 10);         // muzzle
      sphere(g, face, 5, 0, 67, 70, { sx: 0.8, sy: 0.75, sz: 0.85 });
      blob(g, wool, '#ffffff', 9, 0, 86, 53, { seed: 2, detail: 2, sy: 0.75 }); // lambs-wool crown
      for (const s of [-1, 1]) {
        const ear = sphere(g, face, 6.5, s * 12, 76, 52, { sx: 1.0, sy: 0.4, sz: 0.55 });
        ear.rotation.z = s * -0.3;
      }
      sphere(g, solid('#141210', 0.4), 1.8, -5.8, 79, 63);             // eyes
      sphere(g, solid('#141210', 0.4), 1.8, 5.8, 79, 63);
      blob(g, wool, '#ffffff', 8, 0, 56, -50, { seed: 6, detail: 2 });  // tail tuft
      return g;
    }
  },
  {
    id: 'farm_goat', name: 'Goat', cat: 'farm', w: 52, d: 118, h: 92,
    plan: { type: 'animal' },
    palettes: [
      { name: 'White', chip: '#eeece5', body: '#eeece5', horn: '#c7bca6' },
      { name: 'Brown', chip: '#8a6b48', body: '#8a6b48', horn: '#3f342a' },
      { name: 'Nubian', chip: '#5b4a3a', body: '#5b4a3a', horn: '#2c241d' }
    ],
    build: (p) => {
      const g = G();
      const hide = solid(p.body, 0.72);
      const hornMat = solid(p.horn, 0.5);
      // slender jointed legs with visible knees/hocks
      leg2(g, hide, HOOF, -13, 32, 46, 4.5, true);
      leg2(g, hide, HOOF, 13, 32, 46, 4.5, true);
      leg2(g, hide, HOOF, -14, -34, 47, 4.8, false);
      leg2(g, hide, HOOF, 14, -34, 47, 4.8, false);
      // slim connective core; compact masses make the silhouette
      segment(g, hide, [0, 58, -38], [0, 60, 34], 16, 14, 14);
      sphere(g, hide, 23, 0, 55, -2, { sx: 0.7, sy: 0.82, sz: 1.25 });   // belly
      sphere(g, hide, 19, 0, 58, 26, { sx: 0.74, sy: 0.9, sz: 0.95 });   // shoulders
      sphere(g, hide, 19, 0, 58, -30, { sx: 0.78, sy: 0.9, sz: 0.9 });   // hindquarters
      // neck up to a wedge head
      segment(g, hide, [0, 64, 32], [0, 80, 50], 10, 7.5, 12);
      sphere(g, hide, 10.5, 0, 82, 52, { sx: 0.74, sy: 0.92, sz: 1.0 });
      segment(g, hide, [0, 80, 55], [0, 73, 70], 7, 4, 10);              // muzzle wedge
      sphere(g, solid('#2b2622', 0.5), 3.2, 0, 72, 71, { sx: 0.9, sy: 0.7 });
      sphere(g, solid('#141210', 0.4), 1.8, -6.5, 85, 54);              // eyes
      sphere(g, solid('#141210', 0.4), 1.8, 6.5, 85, 54);
      // backward-curving horns (two-segment arc) + out-tilted ears
      for (const s of [-1, 1]) {
        segment(g, hornMat, [s * 4, 89, 50], [s * 6.5, 98, 42], 2.6, 1.7, 8);
        segment(g, hornMat, [s * 6.5, 98, 42], [s * 8.5, 100, 30], 1.7, 0.6, 8);
        const ear = sphere(g, hide, 6.5, s * 11, 83, 47, { sx: 1.0, sy: 0.4, sz: 0.55 });
        ear.rotation.z = s * -0.35;
      }
      // chin beard + small upright tail
      segment(g, hide, [0, 72, 63], [0, 60, 60], 2.8, 0.9, 8);
      segment(g, hide, [0, 64, -38], [0, 74, -44], 2.8, 1.0, 8);
      return g;
    }
  },
  {
    id: 'farm_chicken', name: 'Chicken', cat: 'farm', w: 24, d: 44, h: 40,
    plan: { type: 'animal' },
    palettes: [
      { name: 'White Leghorn', chip: '#f3f1ea', body: '#f3f1ea' },
      { name: 'Rhode Island Red', chip: '#8a3a26', body: '#8a3a26' },
      { name: 'Speckled', chip: '#5a4a3c', body: '#5a4a3c' }
    ],
    build: (p) => {
      const g = G();
      const feathers = solid(p.body, 0.8);
      const comb = solid('#c0392b', 0.5);
      const beakM = solid('#e0a63a', 0.5);
      const shank = solid('#d8a13a', 0.6);
      const eye = solid('#201d1a', 0.4);
      // thin shanks with little forward toes
      for (const s of [-1, 1]) {
        cyl(g, shank, 1.5, 12, s * 5, 0, -1, { seg: 8 });
        for (const t of [-1.5, 0, 1.5]) box(g, shank, 1, 1, 5, s * 5 + t, 0.4, 2);
      }
      // plump ovoid body — a feathery blob over a smooth breast
      const bodyBlob = blob(g, shade(p.body, -0.12), shade(p.body, 0.22), 13, 0, 20, -3,
        { seed: 4, detail: 3, amp: 0.05 });
      bodyBlob.scale.set(0.9, 1.05, 1.2);
      sphere(g, feathers, 10, 0, 17, 9, { sx: 0.9, sy: 1.05, sz: 0.9 });
      // head on a short neck
      sphere(g, feathers, 6.5, 0, 30, 11, { sx: 0.98, sy: 0.98 });
      sphere(g, feathers, 5, 0, 25, 9, { sx: 0.7 });
      // comb (row of 3) + wattle + beak
      for (let i = 0; i < 3; i++) sphere(g, comb, 2.4, 0, 35 - Math.abs(i - 1) * 1.4, 10 + (i - 1) * 2.4, { sy: 1.3, sx: 0.5 });
      sphere(g, comb, 1.8, 0, 26, 15, { sy: 1.5, sx: 0.6 });
      segment(g, beakM, [0, 30, 15], [0, 29, 21], 2.2, 0.3, 8);
      sphere(g, eye, 1.1, -4, 31, 14);
      sphere(g, eye, 1.1, 4, 31, 14);
      // modest upright tail fan
      for (let i = -1; i <= 1; i++) {
        const t = box(g, feathers, 3.2, 14, 2.2, i * 3, 22, -14, { r: 1 });
        t.rotation.x = -0.7; t.rotation.z = i * 0.14;
      }
      return g;
    }
  },
  {
    id: 'farm_rooster', name: 'Rooster', cat: 'farm', w: 30, d: 54, h: 58,
    plan: { type: 'animal' },
    palettes: [
      { name: 'Classic', chip: '#3a2a20', body: '#3a2a20', tail: '#1c3040' },
      { name: 'Red', chip: '#8a2e1e', body: '#8a2e1e', tail: '#2a1c14' }
    ],
    build: (p) => {
      const g = G();
      const feathers = solid(p.body, 0.75);
      const tailc = solid(p.tail, 0.7);
      const comb = solid('#c0392b', 0.5);
      const neckM = solid('#a5502c', 0.7);
      const beakM = solid('#e0a63a', 0.5);
      const shank = solid('#d8a13a', 0.6);
      const eye = solid('#201d1a', 0.4);
      // sturdy legs with spread toes
      for (const s of [-1, 1]) {
        cyl(g, shank, 2, 18, s * 6, 0, -3, { seg: 8 });
        for (const t of [-2, 0, 2]) box(g, shank, 1.2, 1.2, 7, s * 6 + t, 0.6, 2);
      }
      // upright plump body — feathery blob core, chest thrust forward
      const bodyBlob = blob(g, shade(p.body, -0.12), shade(p.body, 0.25), 14.5, 0, 30, -5,
        { seed: 7, detail: 3, amp: 0.05 });
      bodyBlob.scale.set(0.92, 1.28, 1.1);
      sphere(g, feathers, 12, 0, 26, 8, { sx: 0.9, sy: 1.15, sz: 0.9 });
      // proud arched neck + head
      segment(g, neckM, [0, 36, 3], [0, 50, 12], 8, 5.5, 12);
      sphere(g, feathers, 8, 0, 52, 14, { sx: 0.96, sy: 0.96 });
      // big comb + wattles + beak
      for (let i = 0; i < 4; i++) sphere(g, comb, 3, (i - 1.5) * 2.2, 60 - Math.abs(i - 1.5) * 1.3, 13, { sy: 1.5, sx: 0.5 });
      sphere(g, comb, 2.6, 0, 46, 18, { sy: 1.7, sx: 0.6 });
      sphere(g, comb, 2.2, 0, 43, 16, { sy: 1.5, sx: 0.6 });
      segment(g, beakM, [0, 52, 18], [0, 50, 25], 2.6, 0.3, 8);
      sphere(g, eye, 1.3, -5, 54, 16);
      sphere(g, eye, 1.3, 5, 54, 16);
      // grand arched sickle tail — each feather is a smooth 3-segment arc
      // rising from the tail base, cresting, then draping down and back
      for (let i = 0; i < 5; i++) {
        const s = i % 2 ? 1 : -1;
        const f = 1 - i * 0.13;                 // outer feathers shorter
        const dx = 1.6 + i * 0.7;
        const a = [s * 1.2, 39, -13];
        const b = [s * dx * 0.7, 39 + 17 * f, -13 - 8 * f];
        const c = [s * dx, 39 + 19 * f, -13 - 16 * f];
        const d = [s * (dx + 1), 39 + 5 * f, -13 - 22 * f];
        segment(g, tailc, a, b, 2.3, 1.7, 8);
        segment(g, tailc, b, c, 1.7, 1.1, 8);
        segment(g, tailc, c, d, 1.1, 0.25, 8);
      }
      // short covert tuft filling the tail base
      sphere(g, tailc, 6, 0, 38, -13, { sx: 0.75, sy: 1.1, sz: 1.2 });
      return g;
    }
  },
  {
    id: 'farm_duck', name: 'Duck', cat: 'farm', w: 26, d: 52, h: 42,
    plan: { type: 'animal' },
    palettes: [
      { name: 'Pekin White', chip: '#f4f2ec', body: '#f4f2ec', head: '#f4f2ec' },
      { name: 'Mallard', chip: '#7c6a4a', body: '#7c6a4a', head: '#1f5a3a' }
    ],
    build: (p) => {
      const g = G();
      const feathers = solid(p.body, 0.7);
      const headM = solid(p.head, 0.7);
      const billM = solid('#e8a83a', 0.5);
      const shank = solid('#e08a2a', 0.6);
      const eye = solid('#201d1a', 0.4);
      // stubby legs with webbed feet
      for (const s of [-1, 1]) {
        cyl(g, shank, 1.5, 9, s * 5, 0, -2, { seg: 8 });
        box(g, billM, 6, 1, 8, s * 5, 0.3, 0, { r: 0.6 });
      }
      // low boat-shaped body with an upturned tail
      sphere(g, feathers, 14, 0, 15, -4, { sx: 0.84, sy: 0.86, sz: 1.28 });
      sphere(g, feathers, 10, 0, 16, 8, { sx: 0.88, sy: 0.88, sz: 0.9 });  // breast
      segment(g, feathers, [0, 16, -18], [0, 25, -27], 7, 2.5, 10);        // tail
      // curved neck + rounded head
      segment(g, headM, [0, 22, 7], [0, 34, 16], 5.5, 4.5, 12);
      sphere(g, headM, 7, 0, 37, 18, { sx: 0.96, sy: 0.96 });
      // flat rounded bill
      sphere(g, billM, 4, 0, 36, 21, { sx: 1.6, sy: 0.7, sz: 0.7 });
      box(g, billM, 8, 3, 11, 0, 35, 26, { r: 1.6 });
      sphere(g, eye, 1.1, -4, 39, 18);
      sphere(g, eye, 1.1, 4, 39, 18);
      return g;
    }
  },

  // ============================ FEED & HAY ============================
  {
    id: 'farm_trough', name: 'Feeding Trough', cat: 'farm', w: 60, d: 160, h: 45,
    plan: { type: 'box' },
    palettes: [
      { name: 'Weathered Wood', chip: '#8a7458', wood: '#8a7458' },
      { name: 'Galvanised', chip: '#b9bdc2', wood: null }
    ],
    build: (p) => {
      const g = G();
      const mat = p.wood ? wood(p.wood, 0.7) : metal('#b9bdc2', 0.4);
      // V-trough: two sloped sides + ends resting on cross legs
      for (const s of [-1, 1]) box(g, mat, 6, 34, 156, s * 24, 8, 0, { rz: s * 0.45 });
      box(g, mat, 54, 5, 156, 0, 6, 0);
      for (const z of [-72, 72]) box(g, mat, 58, 34, 6, 0, 8, z);
      // splayed leg pairs
      for (const z of [-60, 60]) for (const s of [-1, 1]) box(g, mat, 6, 30, 6, s * 24, 0, z, { rz: s * 0.2 });
      // a little feed inside
      box(g, solid('#c8a94e', 0.9), 46, 8, 148, 0, 8, 0);
      return g;
    }
  },
  {
    id: 'farm_hay_rack', name: 'Hay Feeder Rack', cat: 'farm', w: 90, d: 90, h: 120,
    plan: { type: 'box' },
    palettes: [{ name: 'Steel', chip: '#7c828a', steel: '#7c828a' }],
    build: (p) => {
      const g = G();
      const bar = metal(p.steel, 0.4);
      // square hoop frame with slanted rail sides
      for (const x of [-40, 40]) for (const z of [-40, 40]) cyl(g, bar, 3, 118, x, 0, z, { seg: 10 });
      for (const y of [30, 110]) for (const [a, b, c, d] of [[-40, -40, 40, -40], [40, -40, 40, 40], [40, 40, -40, 40], [-40, 40, -40, -40]]) {
        const mx = (a + c) / 2, mz = (b + d) / 2, len = Math.hypot(c - a, d - b);
        box(g, bar, len, 3, 3, mx, y, mz, { ry: Math.atan2(d - b, c - a) });
      }
      // vertical feed slats on all faces
      for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) {
        cyl(g, bar, 1.4, 78, i * 22, 30, s * 40, { seg: 6 });
        cyl(g, bar, 1.4, 78, s * 40, 30, i * 22, { seg: 6 });
      }
      // hay stuffed inside + poking through
      blob(g, '#c8a94e', '#e4cf86', 42, 0, 74, 0, { seed: 3, sy: 0.9 });
      return g;
    }
  },
  {
    id: 'farm_round_bale', name: 'Round Hay Bale', cat: 'farm', w: 150, d: 130, h: 130,
    plan: { type: 'rock' },
    palettes: [
      { name: 'Straw', chip: '#c8a94e', hay: '#c8a94e', tip: '#e4cf86' },
      { name: 'Wrapped White', chip: '#e8e6df', hay: '#e2ddcf', tip: '#f2efe7' }
    ],
    build: (p) => {
      const g = G();
      // big cylinder lying on its side (axis along x so it can roll)
      cyl(g, solid(p.hay, 0.95), 64, 148, 0, 64, 0, { rz: Math.PI / 2, seg: 26 });
      // spiral-wrap hint on the flat ends — concentric raised rings of rolled
      // straw (tori proud of the face) instead of painted discs
      const wrap = solid(shade(p.tip, -0.12), 0.95);
      for (const s of [-1, 1]) {
        for (const r of [52, 36, 20]) torus(g, wrap, r, 1.8, s * 74, 64, 0, { rx: 0, ry: Math.PI / 2, seg: 30 });
        sphere(g, wrap, 6, s * 74.5, 64, 0, { sx: 0.35 }); // rolled core nub
      }
      // frizzy top
      blob(g, p.hay, p.tip, 60, 0, 96, 0, { seed: 6, sy: 0.4, detail: 2 });
      return g;
    }
  },
  {
    id: 'farm_square_bale', name: 'Square Hay Bale', cat: 'farm', w: 45, d: 90, h: 40,
    plan: { type: 'rock' },
    palettes: [{ name: 'Straw', chip: '#cbab4e', hay: '#cbab4e' }],
    build: (p) => {
      const g = G();
      // straw-textured block (wood grain reads as packed straw at this hue)
      box(g, wood('#c9a86a', 0.85), 45, 40, 90, 0, 0, 0, { r: 3 });
      // frayed straw ends — blobs flattened onto the cut faces (kept within
      // the declared 90cm depth, no more phantom 139cm bale)
      for (const z of [-44, 44]) {
        const b = blob(g, p.hay, '#e4cf86', 19, 0, 20, z, { seed: z + 60, sy: 0.9, detail: 2 });
        b.scale.z = 0.35;
      }
      // baling twine wrapped right around the bale
      const twine = solid('#c86a2a', 0.7);
      for (const x of [-13, 13]) {
        box(g, twine, 1.6, 1.6, 90.4, x, 40, 0);        // top run
        box(g, twine, 1.6, 1.6, 90.4, x, -0.2, 0);      // bottom run
        for (const z of [-45.2, 45.2]) box(g, twine, 1.6, 40, 1.6, x, 0, z); // end drops
      }
      return g;
    }
  },
  {
    id: 'farm_feed_bin', name: 'Feed Bin', cat: 'farm', w: 70, d: 70, h: 95,
    plan: { type: 'box' },
    palettes: [
      { name: 'Galvanised', chip: '#b4b8bd', metal: '#b4b8bd' },
      { name: 'Green', chip: '#3c6b3e', metal: '#3c6b3e' }
    ],
    build: (p) => {
      const g = G();
      const m = metal(p.metal, 0.4);
      cyl(g, m, 34, 82, 0, 0, 0, { seg: 26 });
      // ribbed bands
      for (const y of [24, 48]) cyl(g, m, 35, 3, 0, y, 0, { seg: 26 });
      // sloped lid + handle
      cyl(g, m, 36, 10, 0, 82, 0, { rTop: 22, seg: 26 });
      cyl(g, metal('#8a8f96', 0.4), 3, 4, 0, 92, 0, { seg: 10 });
      ring(g, metal('#8a8f96', 0.4), 8, 0, 96, 0);
      return g;
    }
  },

  // ============================ STRUCTURES ============================
  {
    id: 'farm_barn', name: 'Small Red Barn', cat: 'farm', w: 400, d: 500, h: 400,
    plan: { type: 'box' },
    palettes: [
      { name: 'Classic Red', chip: '#a3312a', wall: '#a3312a', trim: '#efeae0' },
      { name: 'Barnwood', chip: '#6f5a44', wall: null, trim: '#d8cdbb' },
      { name: 'Grey', chip: '#6f747a', wall: '#6f747a', trim: '#e4e0d6' }
    ],
    build: (p) => {
      const g = G();
      const wall = p.wall ? solid(p.wall, 0.8) : tex('real_barnwood_siding', 3, 2);
      const trim = solid(p.trim, 0.7);
      const roof = solid('#5a5f66', 0.6);
      // main walls
      box(g, wall, 360, 230, 460, 0, 0, 0);
      // gambrel roof from four slanted panels (ridge runs along x)
      const A = Math.atan2(70, 60), B = Math.atan2(45, 120);
      for (const s of [-1, 1]) {
        box(g, roof, 380, 12, 96, 0, 259, s * 150, { rx: s * A });     // steep lower
        box(g, roof, 380, 12, 132, 0, 316, s * 60, { rx: s * B });     // shallow upper
      }
      box(g, trim, 388, 8, 20, 0, 344, 0);                             // ridge cap
      // gable-end infill triangles
      for (const s of [-1, 1]) prism(g, wall, 8, 115, 360, s * 180, 230, 0, wall);
      // big sliding door with white X-brace
      box(g, solid('#7a2620', 0.7), 130, 175, 6, 0, 0, 232);
      box(g, trim, 138, 8, 8, 0, 172, 234);
      for (const r of [0.72, -0.72]) box(g, trim, 190, 8, 4, 0, 88, 236, { rz: r });
      for (const s of [-1, 1]) box(g, trim, 8, 175, 4, s * 62, 0, 236);
      // hay-loft window + cupola with weathervane
      box(g, solid('#2a2622', 0.4), 40, 40, 6, 0, 150, 232);
      box(g, trim, 60, 60, 60, 0, 350, 0);
      pyramid(g, roof, 78, 46, 78, 0, 410, 0);
      cyl(g, metal('#2a2622', 0.4), 1.6, 40, 0, 456, 0, { seg: 8 });
      sphere(g, metal('#caa63a', 0.4), 5, 0, 500, 0);
      return g;
    }
  },
  {
    id: 'farm_coop', name: 'Chicken Coop', cat: 'farm', w: 150, d: 120, h: 140,
    plan: { type: 'box' },
    palettes: [
      { name: 'Red & White', chip: '#a3402e', wall: '#a3402e', trim: '#efe9dd' },
      { name: 'Natural Wood', chip: '#9a7a52', wall: '#9a7a52', trim: '#c9b596' }
    ],
    build: (p) => {
      const g = G();
      const wall = wood(p.wall, 0.75);
      const trim = wood(p.trim, 0.7);
      // raised house on stubby legs
      for (const [x, z] of [[-60, 45], [60, 45], [-60, -45], [60, -45]]) cyl(g, trim, 4, 34, x, 0, z, { seg: 8 });
      box(g, wall, 130, 62, 100, 0, 34, 0);
      // gable roof
      prism(g, solid('#4a4f55', 0.6), 140, 42, 108, 0, 96, 0, trim);
      // nesting-box bump-out on the side
      box(g, wall, 24, 34, 70, -66, 40, 0);
      prism(g, solid('#4a4f55', 0.6), 24, 14, 74, -66, 74, 0);
      // pop-hole door + ramp
      box(g, solid('#3a2a20', 0.7), 30, 34, 5, 40, 34, 51);
      box(g, trim, 26, 4, 46, 40, 12, 74, { rx: 0.55 });
      // ventilation window with cross bars
      box(g, solid('#2a2622', 0.4), 34, 26, 5, -30, 50, 51);
      for (const x of [-30]) { box(g, trim, 34, 3, 3, x, 62, 53); box(g, trim, 3, 26, 3, x, 50, 53); }
      // little perch bar
      cyl(g, trim, 2, 60, 30, 34, 40, { rz: Math.PI / 2, seg: 8 });
      return g;
    }
  },
  {
    id: 'farm_silo', name: 'Grain Silo', cat: 'farm', w: 240, d: 240, h: 620,
    plan: { type: 'box' },
    palettes: [
      { name: 'Galvanised', chip: '#c9ced4', metal: '#c9ced4' },
      { name: 'Blue Harvestore', chip: '#2f5f86', metal: '#2f5f86' }
    ],
    build: (p) => {
      const g = G();
      const m = metal(p.metal, 0.4);
      cyl(g, m, 112, 540, 0, 0, 0, { seg: 40 });
      // corrugation bands
      for (let y = 40; y < 540; y += 60) cyl(g, m, 114, 5, 0, y, 0, { seg: 40 });
      // domed cap + vent
      sphere(g, m, 112, 0, 540, 0, { sy: 0.5, seg: 40 });
      cyl(g, m, 20, 26, 0, 588, 0, { rTop: 12, seg: 20 });
      cyl(g, m, 14, 8, 0, 612, 0, { seg: 16 });
      // exterior ladder
      for (let y = 20; y < 540; y += 26) box(g, metal('#8a8f96', 0.4), 20, 2.4, 2.4, 0, y, 114);
      for (const x of [-8, 8]) cyl(g, metal('#8a8f96', 0.4), 1.2, 520, x, 10, 114, { seg: 6 });
      // discharge chute
      box(g, m, 40, 120, 20, 0, 0, 108, { rx: 0.15 });
      return g;
    }
  },
  {
    id: 'farm_windmill', name: 'Windmill', cat: 'farm', w: 180, d: 180, h: 520,
    plan: { type: 'box' },
    palettes: [{ name: 'Galvanised', chip: '#9aa0a6', steel: '#9aa0a6' }],
    build: (p) => {
      const g = G();
      const steel = metal(p.steel, 0.4);
      // tapered 4-post lattice tower
      const base = 70, top = 14, H = 400;
      const foot = (sx, sz) => [sx * base, sz * base];
      const head = (sx, sz) => [sx * top, sz * top];
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (const [sx, sz] of corners) {
        const [bx, bz] = foot(sx, sz), [tx, tz] = head(sx, sz);
        const mx = (bx + tx) / 2, mz = (bz + tz) / 2;
        const len = Math.hypot(tx - bx, H, tz - bz);
        const post = cyl(g, steel, 2.4, len, mx, 0, mz, { seg: 6 });
        post.rotation.z = Math.atan2(bx - tx, H);
        post.rotation.x = Math.atan2(tz - bz, H);
        post.position.y = H / 2;
      }
      // cross bracing rings
      for (const y of [90, 200, 310]) {
        const r = base - (base - top) * (y / H);
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2, b = a + Math.PI / 2;
          box(g, steel, Math.hypot(Math.cos(a) - Math.cos(b), Math.sin(a) - Math.sin(b)) * r, 1.6, 1.6,
            (Math.cos(a) + Math.cos(b)) / 2 * r, y, (Math.sin(a) + Math.sin(b)) / 2 * r,
            { ry: -a - Math.PI / 4 });
        }
      }
      // platform + hub
      box(g, steel, 34, 4, 34, 0, H, 0);
      const hub = cyl(g, steel, 8, 14, 0, H + 26, 8, { rx: Math.PI / 2, seg: 12 });
      // multi-blade fan wheel
      const blades = 18, R = 78;
      for (let i = 0; i < blades; i++) {
        const a = (i / blades) * Math.PI * 2;
        const bl = box(g, metal('#c2c6cc', 0.4), 9, 62, 1, 0, H + 26, 12);
        bl.position.set(Math.cos(a) * R * 0.5, H + 26 + Math.sin(a) * R * 0.5, 12);
        bl.rotation.z = a + 0.35;
      }
      cyl(g, metal('#c2c6cc', 0.4), R, 3, 0, H + 26, 11.5, { rx: Math.PI / 2, seg: 40 });
      cyl(g, metal('#8a2e1e', 0.5), 6, 6, 0, H + 26, 14, { rx: Math.PI / 2, seg: 14 });
      // tail vane
      box(g, metal('#8a2e1e', 0.5), 2, 40, 70, 0, H + 26, -34);
      box(g, steel, 60, 5, 5, -20, H + 26, -8, { ry: 0.5 });
      return g;
    }
  },

  // ============================ YARD GEAR ============================
  {
    id: 'farm_water_trough', name: 'Water Trough', cat: 'farm', w: 90, d: 180, h: 55,
    plan: { type: 'box' },
    palettes: [
      { name: 'Galvanised', chip: '#b4b8bd', metal: '#b4b8bd' },
      { name: 'Green Poly', chip: '#3f6b45', metal: '#3f6b45' }
    ],
    build: (p) => {
      const g = G();
      const m = metal(p.metal, 0.4);
      // oval tank walls
      cyl(g, m, 45, 52, 0, 0, 60, { seg: 24 });
      cyl(g, m, 45, 52, 0, 0, -60, { seg: 24 });
      box(g, m, 90, 52, 120, 0, 0, 0);
      // water surface — real rippled water material, not glass
      const wat = water(180);
      cyl(g, wat, 40, 2, 0, 46, 60, { seg: 24 });
      cyl(g, wat, 40, 2, 0, 46, -60, { seg: 24 });
      box(g, wat, 80, 2, 120, 0, 46, 0);
      // rolled rim
      for (const z of [60, -60]) cyl(g, m, 46, 4, 0, 50, z, { seg: 24 });
      return g;
    }
  },
  {
    id: 'farm_wheelbarrow', name: 'Wheelbarrow', cat: 'farm', w: 70, d: 150, h: 70,
    plan: { type: 'box' },
    palettes: [
      { name: 'Green', chip: '#3c6b3e', tub: '#3c6b3e' },
      { name: 'Red', chip: '#a3312a', tub: '#a3312a' }
    ],
    build: (p) => {
      const g = G();
      const tub = metal(p.tub, 0.45);
      const steel = metal('#8a8f96', 0.4);
      // sloped tray
      box(g, tub, 62, 34, 90, 0, 26, -6, { r: 6 });
      box(g, tub, 62, 8, 30, 0, 16, 42, { rx: -0.4 });
      // handles
      for (const s of [-1, 1]) cyl(g, wood('#8a6b44', 0.6), 3, 130, s * 26, 22, -18, { rx: Math.PI / 2, seg: 10 });
      // front leg stand
      for (const s of [-1, 1]) cyl(g, steel, 2.4, 26, s * 24, 0, -40, { seg: 8 });
      // single front wheel
      cyl(g, solid('#2a2622', 0.9), 20, 12, 0, 20, 60, { rz: Math.PI / 2, seg: 20 });
      cyl(g, steel, 8, 13, 0, 20, 60, { rz: Math.PI / 2, seg: 12 });
      // dirt load
      blob(g, '#5a4436', '#6f5644', 30, 0, 44, -6, { seed: 4, sy: 0.5, detail: 2 });
      return g;
    }
  },
  {
    id: 'farm_scarecrow', name: 'Scarecrow', cat: 'farm', w: 120, d: 30, h: 210,
    plan: { type: 'box' },
    palettes: [
      { name: 'Plaid', chip: '#8a3b2e', shirt: '#8a3b2e', pants: '#3a4f6b' },
      { name: 'Overalls', chip: '#3a4f6b', shirt: '#7a2e24', pants: '#3a4f6b' }
    ],
    build: (p) => {
      const g = G();
      const post = wood('#7a5f40', 0.7);
      const shirt = solid(p.shirt, 0.85);
      const pants = solid(p.pants, 0.85);
      const straw = solid('#d9b654', 0.9);
      const strawLite = solid('#e8d07c', 0.9);
      // cross frame — pole visible below the trousers
      cyl(g, post, 4, 196, 0, 0, 0, { seg: 8 });
      box(g, post, 114, 5, 5, 0, 148, 0);
      // patched trousers — two stuffed legs, cuffs above the pole
      for (const s of [-1, 1]) {
        const lg = box(g, pants, 17, 56, 17, s * 10, 42, 0, { r: 5 });
        lg.rotation.z = s * -0.06;
      }
      box(g, pants, 40, 26, 20, 0, 92, 0, { r: 6 });                 // seat/waist
      box(g, solid(shade(p.pants, 0.35), 0.85), 8, 10, 1.6, -12, 58, 8.6);  // knee patch
      box(g, solid(shade(p.pants, -0.3), 0.85), 7, 8, 1.6, 11, 70, 8.6);    // second patch
      // shirt torso + belt line
      box(g, shirt, 44, 54, 22, 0, 112, 0, { r: 7 });
      box(g, solid('#4a3527', 0.7), 40, 6, 20, 0, 106, 0.6, { r: 2 });      // belt
      box(g, solid(shade(p.shirt, -0.35), 0.85), 9, 9, 1.6, 8, 128, 10.4);  // shirt patch
      // sleeves hang along the cross pole, cuffs tied off
      for (const s of [-1, 1]) {
        cyl(g, shirt, 8.5, 38, s * 20, 148, 0, { rz: Math.PI / 2, seg: 12 });
        const fore = cyl(g, shirt, 7.5, 22, s * 48, 144, 0, { rz: Math.PI / 2, seg: 12 });
        fore.rotation.z = s * (Math.PI / 2 - 0.35);
        cyl(g, solid('#4a3527', 0.7), 7.9, 3, s * 57, 141, 0, { rz: Math.PI / 2 - 0.35, seg: 12 }); // cuff tie
      }
      // straw poking out — thin tapered wisps at cuffs, collar and ankles
      for (const s of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const a = (i - 1.5) * 0.3;
          segment(g, i % 2 ? straw : strawLite,
            [s * 58, 138, 0], [s * (68 + i), 128 + Math.sin(a) * 6, (i - 1.5) * 5], 1.1, 0.2, 6);
        }
        for (let i = 0; i < 3; i++)
          segment(g, i % 2 ? straw : strawLite,
            [s * 10, 16, 0], [s * (13 + i * 3), 2, (i - 1) * 6], 1.2, 0.25, 6);   // ankle wisps
      }
      for (let i = 0; i < 5; i++)
        segment(g, i % 2 ? straw : strawLite,
          [(i - 2) * 4, 160, 2], [(i - 2) * 7, 152, 9 + (i % 2) * 3], 1.1, 0.2, 6); // collar wisps
      // burlap head with stitched face
      sphere(g, solid('#cbb487', 0.85), 15, 0, 176, 0, { sy: 1.08 });
      cyl(g, solid('#4a3527', 0.7), 6.5, 2.5, 0, 160, 0, { seg: 10 });     // neck tie
      sphere(g, solid('#2a2622', 0.4), 1.7, -5.5, 179, 13.4);
      sphere(g, solid('#2a2622', 0.4), 1.7, 5.5, 179, 13.4);
      box(g, solid('#8a5a3a', 0.6), 2.2, 3.5, 1.4, 0, 173.5, 14.2);        // stitched nose
      for (let i = 0; i < 4; i++)                                          // stitched grin
        box(g, solid('#2a2622', 0.5), 2.6, 1.1, 1.2, (i - 1.5) * 3.2, 168.5 + Math.abs(i - 1.5) * 0.9, 13.6);
      // floppy hat — wide tilted brim + tapered crown, straw fringe beneath
      for (let i = 0; i < 6; i++)
        segment(g, i % 2 ? straw : strawLite,
          [(i - 2.5) * 3, 186, 3], [(i - 2.5) * 5.5, 180, 12], 1.0, 0.2, 6);
      const brim = cyl(g, wood('#9a7a44', 0.7), 20, 3, 0, 188, 0, { seg: 20 });
      brim.rotation.x = 0.1; brim.rotation.z = 0.12;
      cyl(g, wood('#9a7a44', 0.7), 12.5, 15, 0, 189, 0, { rTop: 9, seg: 18 });
      torus(g, solid('#7a2e24', 0.7), 12.2, 2, 0, 192, 0, { seg: 24 });    // hat band
      return g;
    }
  },
  {
    id: 'farm_weathervane', name: 'Rooster Weathervane', cat: 'farm', w: 60, d: 60, h: 150,
    plan: { type: 'box' },
    palettes: [
      { name: 'Aged Copper', chip: '#5a8f78', metal: '#5a8f78' },
      { name: 'Black Iron', chip: '#2c2e32', metal: '#2c2e32' }
    ],
    build: (p) => {
      const g = G();
      const m = metal(p.metal, 0.45);
      cyl(g, m, 4, 110, 0, 0, 0, { seg: 10 });
      sphere(g, m, 6, 0, 112, 0);
      // N-S-E-W direction arms + letters as little bars
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        const arm = box(g, m, 3, 3, 44, 0, 122, 0, { ry: a });
        box(g, m, 6, 6, 6, Math.sin(a) * 24, 132, Math.cos(a) * 24);
      }
      // rooster silhouette on top (body, tail, head, comb, legs)
      const y = 138;
      sphere(g, m, 12, 0, y, 2, { sx: 0.5, sy: 1, sz: 1.2 });
      for (let i = 0; i < 4; i++) box(g, m, 1.5, 20 - i * 3, 3, 0, y, -8 - i, { rx: -0.5 - i * 0.12 }); // tail
      sphere(g, m, 6, 0, y + 12, 10, { sx: 0.5 });                                                       // head
      for (let i = 0; i < 3; i++) sphere(g, m, 2.4, 0, y + 18 + i, 8 + i, { sx: 0.4, sy: 1.3 });        // comb
      cyl(g, m, 1, 12, 0, y - 12, 4, { rx: 0.2, seg: 6 });                                               // leg
      return g;
    }
  },
  {
    id: 'farm_milk_can', name: 'Milk Can', cat: 'farm', w: 42, d: 42, h: 74,
    plan: { type: 'box' },
    palettes: [
      { name: 'Galvanised', chip: '#aeb2b7', metal: '#aeb2b7' },
      { name: 'Vintage Red', chip: '#9a352a', metal: '#9a352a' }
    ],
    build: (p) => {
      const g = G();
      const m = metal(p.metal, 0.4);
      cyl(g, m, 19, 48, 0, 0, 0, { seg: 24 });                 // body
      cyl(g, m, 19, 8, 0, 48, 0, { rTop: 11, seg: 24 });       // shoulder
      cyl(g, m, 11, 12, 0, 56, 0, { seg: 20 });                // neck
      cyl(g, m, 12, 5, 0, 68, 0, { rTop: 12, seg: 20 });       // lid
      cyl(g, metal('#8a8f96', 0.4), 4, 5, 0, 73, 0, { seg: 12 });
      // side handles
      for (const s of [-1, 1]) ring(g, m, 6, s * 19, 58, 0);
      // rim bands
      for (const y of [10, 34]) cyl(g, m, 19.5, 2.4, 0, y, 0, { seg: 24 });
      return g;
    }
  },
  {
    id: 'farm_pallet', name: 'Wooden Pallet', cat: 'farm', w: 120, d: 100, h: 15,
    plan: { type: 'slab' },
    palettes: [{ name: 'Pine', chip: '#c4a678', wood: '#c4a678' }],
    build: (p) => {
      const g = G();
      const w = wood(p.wood, 0.7);
      // three bottom stringers
      for (const z of [-44, 0, 44]) box(g, w, 118, 6, 8, 0, 0, z);
      // blocks / feet
      for (const x of [-52, 0, 52]) for (const z of [-44, 0, 44]) box(g, w, 10, 5, 10, x, 6, z);
      // top deck boards with gaps
      for (let i = 0; i < 7; i++) box(g, w, 118, 4, 11, 0, 11, -45 + i * 15);
      return g;
    }
  },
  {
    id: 'farm_tractor', name: 'Tractor', cat: 'farm', w: 160, d: 300, h: 200,
    plan: { type: 'car' },
    palettes: [
      { name: 'Green', chip: '#357a3a', body: '#357a3a', trim: '#f0c81e' },
      { name: 'Red', chip: '#a3312a', body: '#a3312a', trim: '#e4e0d6' },
      { name: 'Blue', chip: '#2f5f86', body: '#2f5f86', trim: '#efe9dd' }
    ],
    build: (p) => {
      const g = G();
      const paint = solid(p.body, 0.4);
      const trim = solid(p.trim, 0.4);
      const tire = solid('#1c1c1e', 0.9);
      const rim = metal('#c2c6cc', 0.3);
      // big rear wheels + small front wheels (axles along x)
      for (const s of [-1, 1]) {
        cyl(g, tire, 52, 34, s * 70, 52, -70, { rz: Math.PI / 2, seg: 24 });
        cyl(g, trim, 22, 35, s * 70, 52, -70, { rz: Math.PI / 2, seg: 20 });
        cyl(g, tire, 30, 26, s * 62, 30, 100, { rz: Math.PI / 2, seg: 22 });
        cyl(g, rim, 12, 27, s * 62, 30, 100, { rz: Math.PI / 2, seg: 16 });
      }
      // chassis + hood + grille
      box(g, paint, 72, 44, 150, 0, 44, 10, { r: 8 });
      box(g, paint, 66, 54, 96, 0, 60, 74, { r: 10 });         // hood
      box(g, trim, 60, 40, 6, 0, 62, 122);                     // grille
      box(g, solid('#f4f0d8', 0.3), 12, 12, 5, -22, 88, 121);  // headlights
      box(g, solid('#f4f0d8', 0.3), 12, 12, 5, 22, 88, 121);
      // exhaust stack
      cyl(g, metal('#5a5f66', 0.5), 4, 60, 24, 88, 96, { seg: 12 });
      cyl(g, metal('#5a5f66', 0.5), 5, 6, 24, 148, 96, { seg: 12 });
      // fenders over rear wheels
      for (const s of [-1, 1]) cyl(g, paint, 58, 40, s * 62, 52, -70, { rz: Math.PI / 2, rTop: 58, seg: 16 });
      // ROPS cab frame + seat + wheel
      for (const s of [-1, 1]) for (const z of [-30, 6]) cyl(g, metal('#3a3f45', 0.4), 3, 96, s * 34, 88, z, { seg: 8 });
      box(g, metal('#3a3f45', 0.4), 74, 4, 44, 0, 184, -12);
      box(g, glass(), 70, 60, 4, 0, 120, -30);
      box(g, solid('#26221e', 0.7), 26, 10, 26, 0, 96, -10, { r: 4 });   // seat
      box(g, solid('#26221e', 0.7), 26, 22, 8, 0, 106, -22, { r: 4 });
      cyl(g, solid('#26221e', 0.7), 11, 2, 0, 108, 34, { rx: 0.5, seg: 16 });  // steering wheel
      return g;
    }
  },
  {
    id: 'farm_produce_stand', name: 'Farm Produce Stand', cat: 'farm', w: 200, d: 120, h: 210,
    plan: { type: 'box' },
    palettes: [
      { name: 'Rustic', chip: '#9a7a4e', wood: '#9a7a4e', sign: '#7a2e24' },
      { name: 'Whitewash', chip: '#d8cdba', wood: '#d8cdba', sign: '#3c6b3e' }
    ],
    build: (p) => {
      const g = G();
      const w = wood(p.wood, 0.7);
      // posts
      for (const [x, z] of [[-90, -50], [90, -50], [-90, 50], [90, 50]]) cyl(g, w, 5, 150, x, 0, z, { seg: 8 });
      // slanted display counter
      box(g, w, 190, 8, 100, 0, 78, 0, { rx: -0.18 });
      box(g, w, 190, 40, 8, 0, 40, 48);
      // slatted lean-to roof
      box(g, tex('real_barnwood_siding', 2, 1), 210, 8, 116, 0, 150, -6, { rx: -0.2 });
      // sign board
      box(g, solid(p.sign, 0.7), 150, 34, 4, 0, 176, -52);
      box(g, w, 158, 6, 6, 0, 196, -52);
      // crates on the counter
      for (const x of [-58, 0, 58]) {
        box(g, wood('#b08a52', 0.7), 42, 26, 42, x, 86, 6, { r: 2 });
        for (const [ex, ez] of [[-12, -12], [12, -12], [-12, 12], [12, 12], [0, 0]]) box(g, wood('#b08a52', 0.75), 4, 26, 42, x + ex, 86, 6);
      }
      // heaped produce (apples / squash / greens)
      const veg = [
        ['#b8321f', '#d85a3a', -58], ['#e0932a', '#f0b451', 0], ['#4f7a2e', '#6ea044', 58]
      ];
      for (const [a, b, x] of veg) foliage(g, a, b, x, 106, 6, 24, 12, x + 9);
      return g;
    }
  }
];
