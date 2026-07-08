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

Track progress in `ASSETS-TODO.md` (repo root). Work pack-by-pack, ship small
reviewed batches, bump the version per batch.

## The renderer & the DSL

Materials and geometry helpers live in `src/catalog/builders.js`. Everything is
in **centimeters**, **+Y up**, origin centered on the ground, and the item's
**front faces +Z**. A `build(p)` returns a `THREE.Group` from `G()`; `p` is the
selected palette.

Geometry primitives:
- `box(g, mat, w, h, d, x, y, z, {r, seg, rx, ry, rz})` — base sits at `y`. `r` rounds the corners (use it: sharp cubes read as cheap).
- `cyl(g, mat, r, h, x, y, z, {rTop, seg, rx, rz, open})` — base at `y` (auto-centers when laid horizontal via `rx`/`rz≈±π/2`). `rTop` tapers it; `open:true` makes an open-ended tube (net/ring enclosures).
- `sphere(g, mat, r, x, y, z, {sx, sy, sz, seg})` — **center** at `y`; `sx/sy/sz` scale it into an ellipsoid.
- **Point-to-point tapered cylinder** — the workhorse for anything that bends or tapers through space (jointed limbs, arched necks, tails, tree trunks/branches, A-frames, ladders, chains, angled rails). Two equivalent helpers exist:
  - `segment(g, mat, [ax,ay,az], [bx,by,bz], r0, r1, seg)` — array endpoints, taper `r0→r1`. Preferred for organic forms (used across the packs).
  - `strut(g, mat, ax,ay,az, bx,by,bz, r, {rTop, seg})` — scalar endpoints. Same result; used by the play-structure items.
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
- `netMaterial(tint, repX, repY)` — translucent grid mesh, **not cached** (owned): trampoline enclosures, sports nets, batting cages. Pair with `cyl(..., {open:true})`.

Material caching rule (**hard**): cached materials (`solid/wood/metal/tex`) are
SHARED. **Never** set `.userData.owned` or mutate a cached material's colour/maps
per-instance — you'll corrupt every other asset using it and leak on rebuild.
Per-instance unique materials (`blob`, `glow`, `netMaterial`, `photoMaterial`,
`shade`) are already tagged `owned` and are safe to dispose on rebuild.

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
   eyes, mane/tail, dewlap; on furniture: cushions with a seam gap, piping, feet,
   hardware, soft bedding (see `dressBed` below). This is what turns "an animal
   shape" into "a cow."
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
- **Soft bedding (beds):** the shared `dressBed(g, mw, md, topY, {pillows, duvet,
  throw, puff})` helper in `items.js` — plush mattress, a **rumpled duvet built
  from overlapping soft rounded "rolls"** (real fold relief, no extra geometry
  cost), a turned-down sheet cuff, and plump pillows. Reuse it for any bed rather
  than a flat slab + box pillows.
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
static 3D fine. Two ready-made harnesses are committed (prefer them to writing new
scratchpad scripts each session):

- **Isolated item shots** — `qa-item.html` + `src/qa-item.js` render ONE item with
  the real viewer lighting rig (RoomEnvironment IBL + hemi + sun + ACES). Drive it:
  ```bash
  npm run dev &     # vite on :5173
  APP_URL='http://localhost:5173/qa-item.html' \
    node tests/qa-shot.js <label> <id> [more ids...]   # 2 angles → tests/qa/<label>/
  ```
  The page `<title>` reports `QA-OK: <id> [w×h×d]` / `QA-THROW: <id> :: <err>` /
  `QA-ERROR`. **READ each PNG and actually look at it** — both angles, for gaps,
  clipping, buried geometry, floaters.
- **End-to-end smoke** — `tests/verify-app.js` loads the app, opens the mansion,
  switches to 3D, and asserts **zero page/console errors** (also screenshots the
  scene). Run against the dev server (or `vite preview`).

Judge against the method: silhouette right? proportions? limbs jointed & on the
ground? face/detail reading? markings visible? material not flat? z-fighting/gaps?
Then edit `build(p)`, rebuild, re-render. Iterate. A bug that hides head-on
(mis-rotated extrude, buried water, floating foot) pops from 3/4 or the side.
Finish with `npm run build` (ignore dynamic-import warnings) and, for items that
appear in the mansion demo, `npm run test:visual` (update baselines only for
intended changes).

## Grounding & scale verification (catch floaters and wrong heights)

"Looks good in a tight crop" is not enough — an asset can float, be the wrong
size, or seat its usable surface at the wrong height and still fill a framed
screenshot. Two checks catch this:

**A. Automated bounding-box audit** — build every item, compute
`THREE.Box3().setFromObject(group)`, flag outliers. Requires
`window.homestudio.THREE` + `.ITEMS`. The `qa-item.html` title also reports each
item's bbox. For every item assert:
- **Grounded:** `box.min.y ≈ 0` for a floor item (no `mount`, `elevation`,
  `path`, or roof `plan.type`). `min.y` well above 0 = it floats; well below 0 =
  it's sunk. The #1 cause is a body `box(g,mat,w,h,d,x,y,z)` passed `y = h/2`
  (or any offset) instead of `0` — `box` puts the BASE at `y`, so that lifts the
  whole piece. Wall/ceiling mounts and terrain are expected to float — exclude them.
- **Right size:** bbox height ≈ `def.h`, footprint ≈ `def.w × def.d`. A ratio far
  from 1 means the geometry is mis-scaled or mis-oriented (e.g. a paddleboard
  built standing vertical reads h≈200 vs def 20 — lay it flat).
- Run it after any asset batch; it's cheap and catches a whole class of bugs the
  eye misses. (Legit exceptions: water features whose cattails/rocks rise above
  the water line, fire pits with flames, tall roofs — judge, don't blindly flatten.)

**B. Functional-height check** (bbox can't catch this — the swing floated its
seat at 100cm *inside* a correctly-sized 190cm frame). Render WITH the ground
visible and confirm the item's **usable surfaces land at real heights**:

| Surface | Height (cm) | Surface | Height (cm) |
|---|---|---|---|
| Chair / sofa / bench / swing seat | 42–46 | Dining table top | 74–76 |
| Bar / kitchen counter | 90 (bar stool seat 65–75) | Coffee table | 40–45 |
| Desk top | 74 | Bed mattress top | 55–60 |
| Toilet seat | 40 | Tub rim | 55 |
| Nightstand | 55–60 | Door handle | ~100 |
| Countertop appliance | on the 90 counter | Kitchen wall cabinet base | ~135 |

If a seat, top, or handle is materially off these, fix the internal Y values —
even when the overall bbox is correct. Always sanity-check the piece against a
mental image of a person using it.


## Shape-quality primitives (4.2) — use these FIRST

Four builders exist specifically to kill the "stacked boxes" look. Reach for
them before composing towers of cyl()/box():

| Helper | Use for | Never again |
|---|---|---|
| `lathe(g, mat, [[r,y],...], x, y, z, {seg})` | vases, urns, columns, bottles, bowls, lamp bases, finials, turned table legs — any rotational profile in ONE smooth call | stacking 5 cylinders of different radii |
| `cushion(g, mat, w, h, d, x, y, z, {puff, dimple})` | pillows, seat/back cushions, mattresses, poufs — inflated faces, pinched corners, a sit dimple | a rounded box pretending to be soft |
| `drape(g, mat, w, h, x, topY, z, {sag, wave, folds, seed})` | curtains, tablecloths, towels, bed skirts — top edge fixed, hem waves and sags | flat planes / accordion wavyPanels as cloth |
| `sweep(g, mat, [[x,y,z],...], r, {seg})` | handrails, hoses, vines, cables, faucet necks, curved chair arms — a smooth tube along a curve | chains of straight segments with visible elbows |

Also available: `torus()` for rings/tubes, `segment()` for tapered
point-to-point limbs, `blob()` (noise is radius-relative; small bushes are
properly lumpy) and `water(sizeCm)` (ripples scale with the surface).

The viewer merges same-material meshes per item (`mergeItemModel`), so a
detailed build with shared materials costs a handful of draw calls. Budget
≤ ~80 raw primitives; blobs/glow/net materials stay individual.

The viewer also drops a soft contact-shadow disc under every grounded item
automatically — do NOT bake your own floor-darkening geometry.

## Failure catalog — every one of these shipped once and got rejected

1. **Coplanar faces z-fight (white flashing).** A soil top at exactly the pot
   rim height, a cushion top at exactly the arm height. Recess or overlap by
   ≥1.5cm — never let two faces share a plane.
2. **Blob-through-wall.** A foliage/cloth blob wider than its container pokes
   through the side and shows raw facets. Keep organic masses INSIDE hard
   shells; bury their equators, expose only crowns.
3. **Protruding low-poly silhouette.** Any blob/sphere that BREAKS the outer
   silhouette shows its polygons against the sky. detail:3 minimum there, or
   keep it inside the outline.
4. **Bead chains.** Necks/tubes built from visible sphere runs. Use `sweep`
   or radius-blended `segment` chains with matching joint spheres.
5. **Core swallows massing.** A connective core (barrel, trunk) larger than
   the shaping masses around it reads as a tube with end rims. The core is
   30% SMALLER than the silhouette masses, always.
6. **Size lies.** Built bbox must be 0.35–1.45× of def w/d/h per axis —
   verify-allbuild FAILS the build otherwise. Fix the def or the geometry,
   whichever is dishonest.
7. **Mutating cached materials.** solid/wood/metal/tex results are SHARED.
   Emissive → `glow()`. Nets → `netMaterial()`. Per-instance color → a new
   solid() with the actual hex.
8. **Floating parts.** Every sub-part connects: ropes reach their hooks,
   struts meet their frames, handles touch their doors. Feet/base at y=0.
9. **Glass sorting artifacts.** Multi-pane glass boxes flicker; prefer single
   panes, avoid nested transparent shells.
10. **Texture scale lies.** A brick texture at the wrong repeat reads as
    painted stripes. Match `tex(mat, rx, ry)` repeats to real-world module
    size (a brick course is ~7cm, a plank ~14cm wide).

## Definition of done (per asset — all six or it does not ship)

- [ ] Silhouette reads as the real object from az=35 AND az=200 renders
- [ ] No z-fighting, no clipping, no floating parts, base grounded at y=0
- [ ] bbox within contract (run the in-page Box3 check)
- [ ] Materials: cached helpers only, palette hexes honored, no mutations
- [ ] ≤ ~80 raw primitives; organic masses at detail 3
- [ ] At least one "intrigue detail" — the thing that makes it specific:
      a lemon wheel in the pitcher, a worn brass spigot, stitching on a
      cushion, a propped-open lid. Generic objects are the enemy.

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
