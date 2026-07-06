# Asset HD Rebuild — TODO & Progress

Tracking doc for the ongoing **asset realism pass** (HANDOFF.md §5). Every catalog
item is built procedurally from the `src/catalog/builders.js` DSL — no binary
models. The goal is to make the crude-looking assets read as premium/realistic
while staying lightweight, offline, and mobile-safe.

**Read the `realistic-assets` skill (`.claude/skills/realistic-assets/`) before
starting a batch** — it has the DSL cheatsheet, hard constraints, and the QA loop.

## QA harness (use for every rebuilt asset)

```bash
npm run dev &                              # vite on :5173
APP_URL='http://localhost:5173/qa-item.html' \
  node tests/qa-shot.js <label> <id> [ids...]   # 2 angles → tests/qa/<label>/
```
`qa-item.html` + `src/qa-item.js` render one item in isolation with the real
viewer lighting rig; the page title reports `QA-OK / QA-THROW` + the bbox dims.
Screenshots land in `tests/qa/` (gitignored). Read them back before/after.

---

## Done

### Batch 1 — beds + backyard play (v3.1.0)
- **`strut()`** helper added to `builders.js` — point-to-point cylinder for
  A-frames, ladders, angled rails, chains. Also `netMaterial()` (translucent
  mesh) and a `cyl(..., {open:true})` open-ended option.
- **`dressBed()`** shared helper in `items.js` — plush mattress, rumpled duvet
  built from overlapping soft "rolls" (real fold relief), turned-down sheet cuff,
  plump pillows, optional folded throw. Applied to `bed_double`, `bed_single`,
  `bed_canopy`, `bunk_bed`, `bed_bunk`. (Replaced flat-slab mattress + box pillows.)
- **`swing_set`** — full rebuild. Was a broken X of crossed legs; now clean twin
  A-frames, level top beam, cross-ties, two belt swings on chains with hanger eyes.
- **`slide`** — platform guard panels + hood grab bar, angled ladder, two-part
  chute (steep run + flatter run-out) with an up-curved kick-out lip, raised rails.
- **`sandbox`** — mounded sand, four triangular corner seats, toy pail with wire
  handle, sandcastle tower, shovel.
- **`trampoline`** — added full safety-net enclosure: 6 foam-padded poles, blue
  padded top ring, translucent net mesh, spring frame band, splayed legs.

---

## Plan for next changes (prioritized)

### Batch 2 — outdoor play & poolside (next up)
- `pool_slide` (poolside pack) — apply the same curved-chute treatment as `slide`.
- `patio_porch_swing`, `out_daybed_canopy` (lounge) — soften cushions/canopy with
  `dressBed`-style plush cushions.
- `playhouse` is already good; consider a small slide/ladder add-on variant.
- Review `pool_diving_board`, `pool_ladder` for the new `strut()` cleanup.

### Batch 3 — trees, plants & hedges (user's #1 call-out)
- `tree_oak`, `tree_birch`, `tree_pine`, `tree_palm` — add trunk bark texture,
  branch taper/branching, layered canopy blobs with better foliage color ramps;
  keep 2D plan symbol clean. Consider instanced leaf clusters for density.
- `bush_cloud`, `hedge`, `rose_bush`, `plant_large/small`, `plant_monstera`,
  `plant_fiddle_leaf`, `plant_snake` — richer foliage, real pot materials.

### Batch 4 — animals (farm pack)
- `farm_cow/horse/pig/sheep/goat/chicken/rooster/duck` — already have real
  silhouettes; refine proportions, add fur/feather color ramps, softer blends,
  eyes/faces. Cheapest win: replace hard sphere joins with blended `blob` bodies.

### Batch 5 — common indoor furniture polish
- Sofas/armchairs cushions (seams, piping), dining chairs, desks, rugs (pile),
  lamps (fabric shades), kitchen appliances (handles, glass).

### Constraints (never regress)
- Stay procedural + lightweight; reuse cached materials; instance repeated geometry.
- Watch GPU/texture budget (past mobile crash from texture leaks) — mark unique
  canvas-texture materials `userData.owned`/`ownedMap` so rebuild disposes them.
- Keep 2D plan symbols legible.
- Screenshot-QA every rebuilt asset from 2 angles; ship small reviewed batches;
  bump the version per batch.
