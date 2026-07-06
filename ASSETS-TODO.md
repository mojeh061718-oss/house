# Asset realism — work plan (HD rebuild of the catalog)

Continue the asset-realism pass using the **`realistic-assets` skill**
(`.claude/skills/realistic-assets/SKILL.md`) — it has the builder DSL, the
silhouette→massing→detail→material method, surface/texture + water recipes, and
the **grounding/scale verification** (bbox audit + functional-height table).

## How to verify (recreate these harnesses in the scratchpad each session)

The skill describes them; they're ~40-line Playwright scripts driving the local
preview (`vite preview`). Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
with `--use-gl=angle --use-angle=swiftshader --no-sandbox`. The app exposes
`window.homestudio = {store, editor, viewer, ui, home, ITEMS, ITEM_MAP,
MATERIALS, getTextureCanvases, THREE}` for driving.

- **asset-shot** — place one item (`store.addItem` + `viewer.rebuildItems` +
  `viewer.flyToItem`), screenshot on grass. Read the PNG and judge silhouette /
  proportions / grounding / material.
- **bbox-audit** — build every item, `THREE.Box3().setFromObject(g)`; flag
  `min.y` far from 0 (floats/sinks, unless wall/ceiling mount) and bbox size vs
  declared `w/d/h`. Run after every batch.
- **swatch** — draw each material's `getTextureCanvases(id).color` into a grid.
- **smoke** — build every item, assert 0 throws / 0 empty / 0 console errors.

NOTE: a busy container (multiple previews / parallel sub-agents) makes headless
boots slow (30–60s). Use ONE preview at a time, bump `waitForFunction` timeouts
to ~75s, and give each parallel sub-agent its OWN `--outDir dist-xxx` + port so
builds don't race.

## Priority order — MAIN / COMMON items first

These are the pieces people place in almost every design — do them before the
long tail. Ship in small reviewed batches (one group at a time), bbox-audit +
render each, bump the patch version, push to the dev branch, show before/after.

### Batch A — Living room (most-used)
sofa3 (3-seat), sofa2 (loveseat), sofa_l / sofa_sectional (sectionals),
sofa_chester (chesterfield), armchair, coffee_table, tv_stand, tv_wall,
bookcase / bookshelf, rug_rect, floor_lamp, side_table, ceiling_light.

### Batch B — Bedroom
bed_double, bed_single, bed_canopy, bunk_bed, nightstand, dresser, wardrobe,
bench_bed, makeup vanity, bedside lamp.

### Batch C — Kitchen
island / island_stools, base + wall cabinets, fridge, range/stove, oven,
dishwasher, kitchen sink, range hood, microwave, bar stools, pendant lights.

### Batch D — Dining & office
dining_table, dining_table_round, dining chairs, buffet/sideboard, desk,
office chair, desk lamp, filing cabinet.

### Batch E — Bathroom
toilet, vanity / vanity_double, bathtub / tub_free, walk-in shower, sink,
mirror, towel rack. (Re-check heights: toilet seat 40, tub rim 55, vanity 85–90.)

### Then: the rest of Outdoor, Games (18), décor, and the long tail.

## Where assets live
- Base furniture + many commons: `src/catalog/items.js`
- Packs: `src/catalog/packs/*.js` (bathroom, kitchen, livingroom, lounge, decor,
  cabinets, frames, farm, games, structures, docks, pools, poolside, water,
  fencing, utility).
- Builders/DSL: `src/catalog/builders.js` · Materials/textures: `src/core/textures.js`
- 2D plan symbols: `src/editor/plansymbols.js` (keep them clean/legible).

## Done so far (shipped to dev, v3.1.x)
HD water + asphalt driveway + broom-concrete sidewalk + real gravel; HD upgrade
of all 97 procedural material generators; farm animals rebuilt; ~15 floating
utility/mudroom items grounded + paddleboard laid flat + porch swing seat fixed;
the skill + the bbox/scale verification method.
