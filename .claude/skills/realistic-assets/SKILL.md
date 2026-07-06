---
name: realistic-assets
description: Build beautiful, realistic, HD-looking 3D catalog assets for Honeycutt Home Studio — procedurally, in code, on a mobile GPU budget. Use whenever creating or refining an item's build(p) in src/catalog/items.js or src/catalog/packs/*.js (trees, plants, animals, furniture, structures, props), or improving a 2D plan symbol. Covers the builder DSL, a silhouette→massing→detail→material→verify method, PBR/HD material recipes, and a multi-angle real-viewer verification loop.
---

# Realistic HD procedural assets

Every asset in this app is built **procedurally in JavaScript** from Three.js
primitives — there are no downloaded models. The whole product identity is
*instant load, fully offline, never crashes a phone*. So "realistic" here means:
a convincing **silhouette**, believable **proportions**, layered **geometry**,
and tuned **PBR materials** — achieved with a few dozen cheap primitives, not a
million-triangle mesh. A great asset reads instantly from across the room AND
holds up when you orbit right up to it.

Golden rule: **the silhouette sells it.** Get the outline and proportions right
first; detail second. A crude blob with straight-cylinder legs reads as a toy no
matter how nice the material. A correct silhouette reads as real even untextured.

## The renderer & the DSL

Materials and geometry helpers live in `src/catalog/builders.js`. Everything is
in **centimeters**, **+Y up**, origin centered on the ground, and the item's
**front faces +Z**. A `build(p)` returns a `THREE.Group` from `G()`; `p` is the
selected palette.

Geometry primitives:
- `box(g, mat, w, h, d, x, y, z, {r, seg, rx, ry, rz})` — base sits at `y`. `r` rounds the corners (use it: sharp cubes read as cheap).
- `cyl(g, mat, r, h, x, y, z, {rTop, seg, rx, rz})` — base at `y` (auto-centers when laid horizontal via `rx`/`rz≈±π/2`). `rTop` tapers it.
- `sphere(g, mat, r, x, y, z, {sx, sy, sz, seg})` — **center** at `y`; `sx/sy/sz` scale it into an ellipsoid.
- `segment(g, mat, [ax,ay,az], [bx,by,bz], r0, r1, seg)` — **tapered cylinder between two 3D points.** The workhorse for anything organic: jointed limbs, arched necks, tails, tree trunks/branches, hoses, cables. Reach for this before a plain `cyl` whenever a form bends or tapers through space.
- `prism`/`pyramid` — roofs, gables, wedges, tent shapes.
- `blob(g, hexA, hexB, r, x, y, z, {seed, sy, detail})` — noise-displaced icosphere with dappled vertex-colour shading (hexA→hexB by height). The basis of foliage, wool, hay, dirt heaps, boulders. Vary `seed` per instance.
- `foliage(g, hexA, hexB, cx, cy, cz, radius, count, seed)` — a cluster of blobs; a quick bush/canopy clump.

Material helpers (return cached `MeshStandardMaterial` unless noted):
- `solid(hex, rough=0.8, metal=0)` — matte-to-satin. Carries a micro-bump so it isn't flat plastic; `envMapIntensity` 0.85 (matte) / 1.35 (metal>0.5).
- `wood(hex, rough=0.55)` — tinted grain map + satin sheen. Use for anything wooden.
- `metal(hex, rough=0.35)`, `chrome()` — reflective; catches the env map.
- `glass()`, `water()`, `mirror()` — physical/transmissive.
- `tex(matId, repeatX, repeatY)` — a photo/procedural texture from the registry (LRU-capped GPU textures — do NOT mint hundreds of distinct repeats).
- `glow(hex, intensity, rough)` — emissive, **not cached** (lamps/flames/screens).

Material caching rule (**hard**): cached materials (`solid/wood/metal/tex`) are
SHARED. **Never** set `.userData.owned` or mutate a cached material's colour/maps
per-instance — you'll corrupt every other asset using it and leak on rebuild.
Per-instance unique materials (`blob`, `glow`, `photoMaterial`, `shade`) are
already tagged `owned` and are safe to dispose on rebuild.

## The method (do these in order, every asset)

1. **Reference & proportions.** Know the real thing's proportions before coding:
   leg length vs. body, head size, where the mass sits. Rough real dimensions →
   the item's `w/d/h` (already set — respect them). Getting proportions wrong is
   the #1 reason an asset reads as "poorly drawn."
2. **Block the silhouette.** Lay in the primary masses only (body core + head +
   limbs) and render. Judge the OUTLINE. Fix proportions here, cheaply, before
   adding any detail.
3. **Massing, not a blob.** Build volumes from a **tapered `segment` core** plus
   2–4 overlapping `sphere` masses (belly, shoulders, hindquarters / seat, back,
   arms). Overlap them so the union reads as one smooth continuous form. One lone
   squashed sphere always looks like a toy.
4. **Jointed limbs.** Animal legs use a jointed helper (`leg2` in farm.js: upper
   leg → knee/hock → cannon → hoof) or hand-built `segment` chains. Chair/table
   legs can taper (`cyl` with `rTop`) and get a subtle splay. **Never** leave a
   limb as a single straight full-length cylinder — that's the tell of a crude
   asset. Feet/hooves must land at y≈0.
5. **Secondary forms & face.** Ears, muzzle/snout/beak with nostrils, two dark
   eyes, mane/tail, dewlap, t...; on furniture: cushions with a seam gap, piping,
   feet, hardware. This is what turns "an animal shape" into "a cow."
6. **Surface markings sit ON the surface.** A patch/spot/label must be centered
   near the body's **outer radius** and flattened along the outward axis (small
   `sx` for a side patch, small `sy` for a topline patch). Centered too far in,
   it hides INSIDE the mesh and never shows — always confirm markings in a render.
7. **HD materials pass** (see recipes below). Right roughness per surface, colour
   variation, subtle secondary tones. Kill any "flat grey plastic" reading.
8. **Verify in the real viewer from 2+ angles** (see loop below). Actually look.
   Iterate 3–6 or 7 until it genuinely reads well. Then check the **2D plan
   symbol** still reads (a photoreal 3D tree still needs a clean top-down glyph).

## HD material & colour recipes

- **Fur / hide (cows, horses, pets):** `solid(bodyHex, 0.8)`. Add tonal variation
  with markings as flattened `sphere`s in a darker/related hue. A slightly lighter
  belly and darker back sells volume.
- **Wool / fluff (sheep, poufs):** `blob(wool, '#ffffff', r, …, {detail:3})` —
  the noise + top-lightening reads as fleece. Layer 2–3 blobs.
- **Feathers (birds):** plump `sphere` body + `blob` for texture; comb/wattle in
  `#c0392b`, beak/shank in warm orange; upright/arched tail as thin `box`/`segment`
  fans. Give roosters a grand curved tail.
- **Foliage (trees/plants):** never one green ball. Build a **layered canopy** of
  3–6 `blob`s at different heights/seeds, with 2 tones (deeper green low/inner,
  lighter/warmer green high/outer — pass as hexA/hexB). Add a **tapered trunk**
  (`segment`, brown, `wood` or `solid` ~0.9 rough) that **branches** into 2–4
  `segment` limbs feeding the canopy clumps. Vary leaf tone by species (blue-green
  spruce, yellow-green birch, red maple). Real trees have a see-through, irregular
  crown — don't make a perfect sphere.
- **Bark / trunk:** `wood(barkHex, 0.85)` or `solid` with high roughness; taper it.
- **Metal:** `metal(hex, 0.35–0.5)`; lower roughness = shinier. Let it catch the
  env map (already tuned). Galvanised ≈ `#b8bcc0`, aged copper ≈ `#5a8f78`.
- **Painted wood/steel furniture:** `solid(hex, 0.4)` for a satin finish.
- **Rounded everything:** prefer `box{ r }` and tapered cyls; hard right-angle
  cubes read as cheap.

## Surfaces & textures — the high-value realism lever

Most of what reads as "cheap" or "high-value" in this app is the **procedural
texture on big flat surfaces** — ground, water, driveways, sidewalks, patios,
walls — far more than furniture geometry. This is where realism budget pays off
most. The engine lives in `src/core/textures.js`.

How it works:
- Each material is a registry entry `{ id, gen, scale, rough, res?, params }` in
  the `MATERIALS` list. `gen` names a generator in `GENERATORS`; `scale` is the
  world-cm the texture tiles over (bigger = coarser); `rough` feeds the PBR
  roughness; `res` sets the canvas pixel size (default `SIZE`=512).
- A generator `gen(ctx, bctx, params)` paints a **colour** canvas and a **bump**
  canvas. **Read `ctx.canvas.width` (not the `SIZE` constant)** so the generator
  honours `res` — set `res: 1024` on hero hardscape/ground so it holds up close.
- `tex(matId, repeatX, repeatY)` builds the GPU material (LRU-capped — don't mint
  hundreds of distinct repeats).

Authoring a believable surface texture:
1. **Base + broad mottling.** Fill the base colour, then add low-frequency noise
   (large tonal patches — sun-fade, wear, dampness). Never a flat fill.
2. **Aggregate / grain.** Add the material's characteristic fine detail: concrete
   & asphalt have speckled aggregate (hundreds of tiny light/dark grains); gravel
   is *made of* stones (scatter many varied ellipses with a highlight + a dark
   contact shadow); sand is fine dither; pavers/brick have units + joints.
3. **Structure / joints.** Hardscape has seams: sidewalks have **control joints**
   (scored panel lines) + a **broom finish** (fine directional striations);
   driveways (asphalt) are seamless but mottled with faint roller seams;
   pavers/brick lay in a bond pattern with recessed grout.
4. **Bump map = the same structure in grayscale.** Grout/joints darker (recessed),
   aggregate high-frequency, so raking light catches it. bumpScale is set by `tex`.
5. **Tune `rough` + `scale`.** Wet/polished = low rough; asphalt/concrete ≈ 0.9;
   gravel ≈ 0.95. `scale` so the repeat reads at real size (a 4-ft sidewalk panel,
   golf-ball gravel, not wallpaper-sized).

Water (`water()` in builders.js, used by ponds/pools/streams/fountains): a
`MeshPhysicalMaterial` with a **ripple normal/bump**, `clearcoat` for a wet
sheen, low `roughness`, and partial transparency over a darker basin for depth.
Richer water = a **multi-octave ripple** normal map (several sine bands at
different scales/angles, not one), a believable blue-green with depth falloff,
strong clearcoat, and letting it catch the environment. Keep one shared cached
material (never per-instance) — it's on every water surface at once.

## The verification loop (never skip)

Headless SwiftShader renders ~1 fps and **fast-forwards CSS/anim**, but it renders
static 3D fine. Recipe:
1. `cd /home/user/house && npm run build` (ignore dynamic-import warnings).
2. `node_modules/.bin/vite preview --port <PORT> --strictPort &` (use a port that
   won't clash with another running preview), wait for `curl localhost:<PORT>/`.
3. Render each item isolated with the scratchpad harness `asset-shot.mjs`
   (places one item on grass, `viewer.flyToItem`, screenshots). Point it at your
   port. It writes PNGs; **READ each PNG and actually look at it.**
4. Judge against the method: silhouette right? proportions? limbs jointed & on the
   ground? face/detail reading? markings visible? material not flat? Any
   z-fighting/gaps? Then edit `build(p)`, rebuild, re-render. Iterate.
5. **Two+ angles.** Add a second camera (orbit the viewer, or a second flyTo) —
   a bug (mis-rotated extrusion, buried water, floating foot) that hides head-on
   pops from 3/4 or the side.
6. Confirm **zero console errors** in the harness output.
7. Ship in **small reviewed batches** (a pack or a category), bump the version,
   commit, deploy to dev, and show before/after screenshots.

## Hard constraints (do not regress)

- **Procedural + lightweight.** No heavy glTF imports. A few dozen primitives per
  item, max. If a form needs many repeats (fence pickets, foliage, a flock),
  **instance** it (see `buildTallGrass`) — hundreds of separate meshes tank mobile
  FPS.
- **GPU/memory budget.** Reuse cached materials. Don't mint a distinct `tex()`
  repeat per instance (LRU-capped, but churn hurts). A past release crashed phones
  by leaking textures — respect it.
- **2D plan symbol stays legible.** `src/editor/plansymbols.js` — a realistic 3D
  asset still needs a clean, simple top-down symbol keyed by `plan.type`.
- **Never let `build()` throw.** `rebuildItems` catches per-item but the all-items
  smoke test fails on a missing model.
- **Don't change** item `id`, `name`, `cat`, `w/d/h`, `plan`, or `palettes` when
  refining geometry — only the body of `build(p)` — unless the task is explicitly
  to add/retune those.

## Per-asset effort checklist

Silhouette blocked & judged · proportions match reference · body massed (core +
overlaps, no lone blob) · limbs jointed/tapered, feet grounded · face/secondary
forms present · markings on the surface & visible · materials tuned (roughness,
tone variation, no flat plastic) · rendered & eyeballed from 2+ angles · zero
console errors · 2D symbol still legible · before/after captured.
