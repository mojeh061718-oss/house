# Asset realism — TODO & progress (HD rebuild of the catalog)

Continue the asset-realism pass using the **`realistic-assets` skill**
(`.claude/skills/realistic-assets/SKILL.md`) — it has the builder DSL, the
silhouette→massing→detail→material method, surface/texture + water recipes, the
grounding/scale verification, and the committed QA harnesses.

Every catalog item is built procedurally from the `src/catalog/builders.js` DSL —
no binary models. Make crude assets read as premium/realistic while staying
lightweight, offline, and mobile-safe. Ship in small reviewed batches, screenshot
each from 2 angles, bump the version per batch.

## How to verify (committed harnesses — no need to recreate each session)

```bash
npm run dev &                                   # vite on :5173
APP_URL='http://localhost:5173/qa-item.html' \
  node tests/qa-shot.js <label> <id> [ids...]   # 2 angles → tests/qa/<label>/ (gitignored)
node tests/verify-app.js                        # end-to-end smoke: 0 page/console errors
```
`qa-item.html` + `src/qa-item.js` render one item in isolation with the real
viewer lighting; the page title carries `QA-OK / QA-THROW` + the bbox dims. Read
the PNGs back. Then `npm run build` (ignore dynamic-import warnings). For a
bbox/grounding audit use `window.homestudio.{THREE, ITEMS}`.

---

## Done so far

### v3.5.0–v4.0.0 — the 4.0 realism pass (this branch)

**The size contract is now ENFORCED at zero violations** across all 1,310
item×palette builds (`tests/verify-allbuild.js` fails on any bbox outside
0.35–1.45× of the declared w/d/h; `LENIENT_SIZE=1` to bypass while iterating).

- **Root causes fixed:** `blob()` noise is radius-relative (small bushes/rocks
  are properly lumpy); `water(sizeCm)` scales ripples to the surface; real
  `torus()` primitive; reflective clearcoat `glass()`; the viewer merges
  same-material meshes per item (estate 1453 → ~750 draw calls) so detailed
  builds are cheap to render.
- **items.js:** palm (true pinnate fronds), hedge (half-buried tufts), oak/
  birch/pine crowns, monstera split leaves, flower beds, hill, hammock, pool
  ladder, office chair, gazebo, car/truck massing, torus hoop rim, sunflower
  mesh diets, old toilet retired; 14 size fixes.
- **farm.js:** every animal rebuilt (massed bodies over shrunken cores, jointed
  legs, faces, wool/feathers), scarecrow, honest bales, rippled trough; all on
  the new `animal` plan glyph.
- **poolside/docks/lounge/decks/pools/water/decor:** torus floats, smooth
  S-neck flamingo/swan, honest kayak, planked transom skiffs, dinghy with
  outboard, sailboat re-massed, hammock + egg swing rebuilt, real water in
  deck spas, round stock tank, honest pond heights.
- **2D symbols:** animal glyph, game-machine labels, greenhouse/shed/sauna/
  container glyphs, filled hoop; chain-link fences (panel + drawn runs).

Remaining polish candidates (nice-to-have, not blockers): boulder/rock family
variation, more tree species, bird/pet pack, seasonal palettes.

### v3.1.x — surfaces, water, animals, grounding (parallel line)

### v3.1.x — surfaces, water, animals, grounding (parallel line)
HD water + asphalt driveway + broom-concrete sidewalk + real gravel; HD upgrade
of all ~97 procedural material generators; farm animals rebuilt; ~15 floating
utility/mudroom items grounded + paddleboard laid flat + porch-swing seat fixed;
the `segment()` helper; the bbox/functional-height verification method.

### v3.1.0 (this line) — beds + backyard play
- **`strut()`** (point-to-point cylinder — A-frames, ladders, chains, rails),
  **`netMaterial()`** (translucent mesh enclosure), `cyl {open:true}` in `builders.js`.
- **`dressBed()`** shared helper — plush mattress, rumpled duvet (overlapping
  soft rolls = real fold relief), turned-down sheet cuff, plump pillows, optional
  throw. Applied to `bed_double`, `bed_single`, `bed_canopy`, `bunk_bed`, `bed_bunk`.
- **`swing_set`** — clean twin A-frames, level beam, cross-ties, two belt swings.
- **`slide`** — guard panels + hood bar, angled ladder, two-part chute with an
  up-curved run-out lip, raised rails.
- **`sandbox`** — mounded sand, four corner seats, pail/tower/shovel toys.
- **`trampoline`** — full safety-net enclosure (foam-padded poles, top ring,
  translucent net, spring band, splayed legs).

### v3.2.0 — merge
Unified the two lines above into one release; deduped docs/skill; version reconciled.

---

## Priority order — MAIN / COMMON items first

The pieces people place in almost every design — do these before the long tail.
`segment()`/`strut()` for jointed/tapered forms; bbox-audit + render each.

### Batch A — Living room (most-used)
sofa3, sofa2, sofa_l / sofa_sectional, sofa_chester, armchair, coffee_table,
tv_stand, tv_wall, bookcase/bookshelf, rug_rect, floor_lamp, side_table, ceiling_light.

### Batch B — Bedroom  *(beds themselves done in v3.1.0 via `dressBed`)*
nightstand, dresser, wardrobe, bench_bed, makeup vanity, bedside lamp. Consider a
`dressBed`-style plush pass on `crib`.

### Batch C — Kitchen
island / island_stools, base + wall cabinets, fridge, range/stove, oven,
dishwasher, kitchen sink, range hood, microwave, bar stools, pendant lights.

### Batch D — Dining & office
dining_table, dining_table_round, dining chairs, buffet/sideboard, desk,
office chair, desk lamp, filing cabinet.

### Batch E — Bathroom
toilet, vanity / vanity_double, bathtub / tub_free, walk-in shower, sink, mirror,
towel rack. (Heights: toilet seat 40, tub rim 55, vanity 85–90.)

### Batch F — Trees, plants & hedges  *(user's top call-out)*
tree_oak/birch/pine/palm — bark, branch taper/branching, layered canopy blobs,
species leaf tones; bush_cloud, hedge, rose_bush, plant_large/small, plant_monstera,
plant_fiddle_leaf, plant_snake. Keep 2D symbols clean.

### Then: remaining Outdoor / poolside play (pool_slide curved chute, daybeds,
porch swing cushions), Games (18), décor, and the long tail.

## Where assets live
- Base furniture + many commons: `src/catalog/items.js`
- Packs: `src/catalog/packs/*.js` (bathroom, kitchen, livingroom, lounge, decor,
  cabinets, frames, farm, games, structures, docks, pools, poolside, water,
  fencing, utility).
- Builders/DSL: `src/catalog/builders.js` · Materials/textures: `src/core/textures.js`
- 2D plan symbols: `src/editor/plansymbols.js` (keep them clean/legible).

## Constraints (never regress)
Stay procedural + lightweight; reuse cached materials; instance repeats; watch the
GPU/texture budget (past mobile crash from texture leaks — mark unique
canvas-texture materials `owned`/`ownedMap`); keep 2D plan symbols legible;
never let `build()` throw; don't change item id/name/cat/w/d/h/plan/palettes when
only refining geometry.
