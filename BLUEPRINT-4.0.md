# Honeycutt Home Studio — Blueprint to 4.0

**Audit date:** July 2026 · **Audited build:** v3.2.7 (branch `claude/app-debug-4-0-blueprint-ga9lgf`)

**How this audit was done.** Three independent passes over the whole app:

1. **Live app debugging with Playwright** — booted the real build in a phone-landscape viewport (844×390), drove the splash, home screen, sample apartment, Luxury Estate, wall drawing, Measure, Dimension, catalog, selection, and 3D views, with console/page-error capture and screenshots at every step.
2. **Agent A — Assets & Graphics audit** — full code sweep of the builder DSL, all 17 catalog packs, textures, viewer lighting, and plan symbols, plus isolated 3D renders of suspect items through the QA rig (screenshots confirmed every prediction).
3. **Agent B — UX / Ergonomics / CAD-precision audit** — line-by-line review of the 2D editor snapping/measure/dimension engines, units, state/undo, storage, and the boot/splash sequence.

Every finding below is confirmed with a file/line citation or a screenshot. Severity: **P0** = breaks trust/data, fix immediately · **P1** = users hit it in minutes · **P2** = real friction/bug · **P3** = polish.

**The good news first:** zero console errors across boot, drawing, measuring, catalog, and 3D on both templates. Storage is genuinely solid (IndexedDB + fallback + drafts + backups). The pools, kitchen, living room, and bathroom packs hold up. The CAD feature set is real — the problems below are fixable defects, not architectural dead ends.

---

## Part 1 — Complete bug list

### 1. Splash & boot

| # | Sev | Bug | Where |
|---|-----|-----|-------|
| S1 | **P1** | **"Tap to reload" failsafe never retracts.** The 9-second failsafe adds the reload button but nothing removes it once boot succeeds. On any slow load (cold cellular fetch, old device — observed in testing) the user sees a **reload button floating over a working app**, and tapping it needlessly restarts. The button must be removed the moment `#home` appears. | `index.html:54-64` |
| S2 | P2 | **Partial boot failure is invisible.** If three.js or the catalog fails to load but storage succeeds, `window.__bootFailed` is set but the home screen looks normal — opening a project then breaks with no message. Needs a visible "some parts didn't load" banner. | `src/main.js:61-81` |
| S3 | P2 | **The offline-library modal interrupts the very first project open.** "Work anywhere, even offline" pops the instant a new user opens their first project — before they've drawn a single wall (observed). Defer it to the second session or after the first save. | `src/core/offline.js` prompt flow |
| S4 | P3 | 9 s is a long time to stare at a dead splash before the failsafe appears; add a "Still loading…" stage at ~4 s. `location.reload(true)` uses a deprecated argument. | `index.html:54,62` |
| S5 | P3 | The splash is safe now but visually bare — a static logo, spinner, and wordmark. It no longer matches a "premium studio" brand. Full 4.0 splash spec in Part 2. | `index.html:19-45`, `src/ui/home.js:112-134` |
| S6 | P3 | Stale doc comment: `beginSplash` references a `.play` class mechanism that no longer exists in styles.css. | `src/ui/home.js:112-118` |

### 2. CAD measurements & precision

| # | Sev | Bug | Where |
|---|-----|-----|-------|
| C1 | **P1** | **Imperial mode runs on a metric grid — everything reads 9'10" / 3'11".** Grid is hard-coded 10 cm; snapping rounds to it; display rounds to whole inches. A user can never hand-draw a 10'0" wall (300 cm → 9'10"). Defaults compound it: door 90 cm shows 2'11", window 120 cm 3'11" — confirmed live (drawn walls read 16'9" and 9'6"; catalog cards read 2'11" × 2'11" × 2'8"). The scale chip even says "1 square = 8 in" when a square is 7.87". 4.0 needs a unit-aware grid (6"/12" imperial, 10 cm metric) + imperial-native default sizes. | `src/editor/editor2d.js:16,200,206,218,373-378,2304-2307`; `src/core/state.js:6-15` |
| C2 | **P1** | **Endpoint drag self-snaps to its own wall.** The axis-alignment search iterates all walls unfiltered, so a dragged endpoint keeps finding its own previous position — a ~24 px dead zone, then a jump. | `src/editor/editor2d.js:197,203` (should use the filtered list from `:137`) |
| C3 | **P1** | **Pinch-zoom corrupts Measure/Dimension state.** The first finger of a pinch runs the tool switch before the second lands: every pinch adds a phantom tape vertex or advances the dimension state machine, and `cancelMode(true)` on pinch silently wipes an in-progress measure/dimension. On a touch-first app this makes the CAD tools feel haunted. | `src/editor/editor2d.js:380-443,1348-1354` |
| C4 | **P1** | **Locked walls/openings can still be deleted.** `deleteSelection` checks `locked` only for items; "Lock everything in place" locks walls/openings but the delete badge / key / props delete cuts them anyway. | `src/core/state.js:350-360,383-384` |
| C5 | P2 | **A dimension started on one floor lands on another.** `dimDraft`/measure state survive a level switch; the third tap writes Floor-G coordinates into Floor 1's `dims`. Clear both on the `level` event. | `src/editor/editor2d.js:1241-1252`; `src/core/state.js:480-488` |
| C6 | P2 | **`pointercancel` commits half-drawn geometry.** iOS edge-swipe / notification pull mid-draw drops a wall/patio where the preview happened to be, instead of cancelling. | `src/editor/editor2d.js:47 → 1212-1270` |
| C7 | P2 | **No-op undo checkpoints.** Tapping (without moving) an endpoint/resize/rotate handle pushes an empty undo entry and wipes the redo stack — "Undo does nothing." | `src/editor/editor2d.js:536-542,492-512,1319-1323` |
| C8 | P2 | **Dimension vs wall pill can disagree.** Observed live: the same edge read 17'9" on the dimension and 16'9" on the wall pill (dim endpoints snap to different targets than the wall). Dims should prefer wall-endpoint/edge snaps and agree with the pill. | `src/editor/editor2d.js` `_snapPoint` vs pill math `:2366+` |
| C9 | P2 | **Dimension tap target is 12 px** vs ~30 px for other handles — selecting a dim to delete it on a phone is a precision exercise. | `src/editor/editor2d.js:267` |
| C10 | P3 | **Dimensions are frozen coordinates** — move/resize/delete the measured wall and the annotation keeps lying. Anchor dims to wall id + t where created via wall snap. | `src/core/state.js:216-220` |
| C11 | P3 | Per-segment wall pills miss X-crossings (wall crossing straight through splits rooms but not measurements). | `src/editor/editor2d.js:246-262` |
| C12 | P3 | `parseFtIn` rejects standard notation: `5'-6"`, `5 6`, fractions (`5'6 1/2"`), `.5`, `5 ft 6`. | `src/core/units.js:75-90` |
| C13 | P3 | `weldWalls` merges walls of different thickness/height, silently changing the envelope. | `src/core/state.js:239-268` |
| C14 | P3 | Angles read screen-down (up = 270°); wall-pill side flips with draw direction; room "Area" measures to wall centerlines (overstates floor area); unit toggle isn't persisted until the next edit. | `editor2d.js:1596,2400,2366-2375`; `ui.js:238-245,1781` |
| C15 | P3 | Vertical wall pills render rotated 90° — legible but awkward; consider keeping all measurement text upright. | `editor2d.js` pill drawing (observed) |

### 3. UI / UX / ergonomics

| # | Sev | Bug | Where |
|---|-----|-----|-------|
| U1 | **P1** | **The lock story is broken end-to-end.** Locked walls can never be unlocked: the Lock FAB is item-only, the wall panel has no padlock, yet Lock All locks walls and its toast promises "tap a piece's padlock to free it." Combined with C4, Lock All is one-way and leaky. | `src/ui/ui.js:1016-1037,1144-1150,1655-1710`; `src/core/state.js:319-337` |
| U2 | P2 | **Empty toast renders as a permanent dark blob.** The `#toast` element stays visible with no text — an empty dark oval sits on the canvas (observed in every 2D session, position varies). Hide it when empty. | `#toast` show/hide logic in `src/ui/ui.js` + `styles.css` |
| U3 | P2 | **Selecting a Dimension shows dead/stale actions.** Copy silently no-ops (no dim branch in `duplicateSelection`); Edit opens the props drawer showing the previous selection's panel — automatic on wide screens. | `src/ui/ui.js:1040-1100,1102-1159,1505+` |
| U4 | P2 | **One-shot tools force a round trip per placement.** Every door/window/item placement disarms to Select; placing five windows = five rail trips, each reopening the style picker. Tools should stay armed (Esc/tap-tool to disarm). | `editor2d.js:713,1328`; `placement.js:122`; `ui.js:407-417` |
| U5 | P2 | **"Bare number = feet" + no upper clamp = 30-foot sofas.** Typing `30` (meaning inches) into a width field gives a 30 ft item; typed entry has no ceiling (drag-resize clamps at 800 cm). | `src/ui/ui.js:1602-1604`; `src/core/units.js:84-85` |
| U6 | P2 | **Two-finger gestures leak.** Pinch during a pan resumes pan from stale anchors afterwards (view jumps); a quick two-finger tap on empty space deselects your selection. | `editor2d.js:397,945-949,1208-1211` |
| U7 | P2 | **Browsing floors marks the project dirty** → spurious "Save changes?" after just peeking at Floor 1. Exclude `activeLevel` from the dirty comparison. | `src/core/state.js:85-93,487` |
| U8 | P2 | **Unescaped names break markup.** A project or room named `My "A" plan` mangles the top bar / props panel (`value="…"` truncates). `escapeHtml` exists — use it everywhere. | `src/ui/ui.js:121,1772-1776` |
| U9 | P2 | **The hint pill sits exactly where dimensions land.** Observed: the "Dimension — tap two points…" banner overlapped the freshly placed dimension line at top-center. Move hints to the bottom or auto-dodge annotations. | hint pill positioning, `styles.css` (observed) |
| U10 | P3 | Native `alert`/`confirm` still used for project delete, restore, backup — jarring system sheets on an installed PWA next to the styled modals. | `src/ui/home.js:281,297,301,345`; `src/ui/ui.js:340` |
| U11 | P3 | Undo drops selection and gives no feedback on what was undone. | `src/core/state.js:172,182` |
| U12 | P3 | Silent no-ops: door/window on a too-short wall, sub-20 cm wall discarded, missing def — no toast, nothing. | `editor2d.js:666,690,1213` |
| U13 | P3 | Rotation field shows −15 while the Adjust dial shows 345. | `src/ui/ui.js:28,805` |
| U14 | P3 | Walk mode persists invisibly across 2D↔3D switches — returning to 3D unexpectedly drops into walk controls. | `src/ui/ui.js:168-173,353-376` |
| U15 | P3 | Catalog search is exact-substring on names — "couch" won't find Sofa. Add tags/synonyms. | `src/ui/ui.js:1306` |
| U16 | P3 | Adjust "Size" slider re-baselines to 100% each open, so repeated opens compound (25% of 25%). | `src/ui/ui.js:804-808` |
| U17 | P3 | Day/time popover stays open when tapping elsewhere (observed); popovers should dismiss on outside taps. | day-pop handling in `ui.js` |
| U18 | P3 | First-frame canvas can render before `resize()` seeds `dpr`; orientation timers re-layout without a guaranteed resize → possible stretched canvas until next resize. | `editor2d.js:55,69-70`; `orientation.js:109-114` |

### 4. Assets & the generation pipeline

**Pipeline correctness bugs (fix before any art pass):**

| # | Sev | Bug | Where |
|---|-----|-----|-------|
| G1 | **P0** | **Cached-material corruption.** Basketball hoop and volleyball nets set `wireframe/transparent/opacity` on a *shared cached* `solid()` material — any item sharing that cache key inherits a transparent wireframe. `netMaterial()` exists for exactly this and is unused there. | `items.js:1551-1553`; `poolside.js:412-414`; cf. `builders.js:681` |
| G2 | P1 | **Emissive mutation of cached solids** in 9 more places (tv_wall, fireplace, lamp_post, elevator, …) — works only because keys don't collide *today*; latent cross-item corruption. Use `glow()`. | `items.js:251,331,770,786,1037,1375,1464,2027,2154` |
| G3 | P1 | **Invalid color `'#00000022'`** (8-digit hex — THREE.Color can't parse it) → mudroom cubbies render **white** (screenshot-confirmed) and mint junk cache keys. | `utility.js:279,335` |
| G4 | **P1** | **Catalog thumbnails have no environment map** → every chrome/metal/mirror item renders near-black in its card. This single bug makes dozens of good assets look broken in the catalog. | `src/ui/thumbs.js:10-26` |
| G5 | P2 | **Thumbnail cache never invalidates** — items whose first palette is a photo texture snapshot the flat placeholder forever. | `thumbs.js:28,62` vs `builders.js:10-17` |
| G6 | P2 | **Model size ≠ declared size, and nothing checks.** Kayak builds 213 cm wide vs declared 60 (3.5× footprint overflow); palm 375 cm vs 420; flamingo off on every axis. Add a bbox-vs-def assertion to `tests/verify-allbuild.js`. | `docks.js:260`; `items.js:3399`; `poolside.js:52` |
| G7 | P2 | **tex() LRU evicts textures still on live meshes** and is count-based, not byte-based (a 2048² entry weighs ~16× a 512² one). | `builders.js:116-157` |
| G8 | P2 | **Un-owned materials leak on every structural rebuild** (`FRAME()`, fence paths, etc. return fresh `MeshStandardMaterial`s that `disposeGroup` never frees). | `arch3d.js:186-187,347,410,631-632` |
| G9 | P2 | **`blob()` noise frequency is absolute, not radius-relative** — anything under ~30 cm radius comes out a smooth ball. This one function is why hedges, bushes and small rocks look like green slugs. | `builders.js:578-582` |
| G10 | P2 | **Draw-call explosion.** Every box/cyl/sphere is its own mesh: bookwall ≈140 meshes, donut float ≈112, tulip bed ≈60. Measured live: **Luxury Estate = 1,453 draw calls / 207k tris for just 90 items.** Phones bottleneck on calls, not tris. Needs geometry merging or instancing in builders. | `builders.js` + heavy builders (`items.js:3080`, `poolside.js:29`) |
| G11 | P3 | `glass()` used as water in troughs/fountains/cold plunge — pale film instead of the shared rippled `water()`. | `farm.js:642`; `structures.js:361,477` |
| G12 | P3 | Fake water: pool-surround and hot-tub decks use a flat solid-cyan slab instead of `water()`. | `decks.js:146,318` |

**Worst-looking assets (screenshot-confirmed, ranked; this is the 4.0 realism hit-list):**

1. `patio_hammock` — broken silhouette; bed is a squashed solid sphere; ropes float (`lounge.js:84`)
2. `float_flamingo` / `float_swan` — necks are chains of 5 visible sphere "beads" (`poolside.js:52,75`)
3. `boat_kayak` — cockpit/seat buried inside the hull; paddle floats; 3.5× footprint bug (`docks.js:260`)
4. `hedge` — smooth green caterpillar (blob-frequency bug G9) (`items.js:906`)
5. `tree_palm` — flat almond clip-art fronds, boxy segmented trunk (`items.js:3399`)
6. Farm animals (`farm_cow/horse/pig/goat`) — the tapered barrel core is *bigger* than the massing spheres, so bodies read as **cylinders on sticks** with visible end rims (`farm.js:37,90`)
7. `mud_locker_bench` / `mud_bench` — white cubbies (G3), baskets clip the shelf (`utility.js:279,335`)
8. `bball_hoop` / `pool_volley_net` — scribble nets + cache poisoning (G1)
9. `pool_above` — ladder renders as a floating artifact at the rim (`items.js:1098`)
10. `float_ring`/`float_donut`/`pool_lifering` — lumpy bead-tori from 20-26 spheres; donut adds 60 sprinkle meshes (`poolside.js:12-48,95,419`)
11. `toilet` (base pack) — sphere-lump bowl; the bathroom pack's skirted toilet is far better; retire the old one (`items.js:575`)
12. `plant_monstera` — pancake leaves, no split lobes (`items.js:3173`)
13. `rose_bush`, `tulip_bed`, `flower_bed` — lollipop flowers, 60-90 meshes each (`items.js:2311,2520,2548`)
14. `office_chair` — slab boxes next to the far better `chair_exec` (`items.js:715`)
15. `hammock` (indoor) — corrugated-board cloth (`items.js:3291`)
16. `hill_mound` — giant squashed sphere with pole-warped grass texture (`items.js:2471`)
17. `scarecrow` — box torso/limbs (`farm.js:677`)
18. `car`/`truck` — toy-like single-box cabins; they're hero yard items (`items.js:995,2164`)
19. `gazebo` — visibly faceted 6-segment cone roof (`items.js:2243`); `spa_stock` — octagonal "round" tank (`pools.js:313`)
20. `patio_egg_swing` — opening reads as a black blotch (`lounge.js:65`); `liv_swivel` — chunky 4-box "curved" shell (`livingroom.js:153`)
21. `fence_chainlink` — renders as horizontal slats, not chain-link at all (`fencing.js:56`)
22. `rowboat`/`dinghy` — double-pointed squashed-sphere hulls; dinghy transom pokes out of a pointed stern (`docks.js:339,464`)
23. Estate yard scale check (observed live): pines read as stacked cones, sunflowers as lollipops — the yard is the first thing the Luxury Estate shows.

**Pack grades:** living room / kitchen / bathroom / cabinets / frames / decor / pools / water — **good**. decks / games / utility — good with bugs above. structures — mediocre-good. docks / farm / lounge / poolside — **mediocre** (boats, animals, hammocks, floats). Base `items.js` outdoor/garden section — **poor-to-mediocre, the oldest code, where most "crude" complaints live.**

### 5. Graphics & rendering

| # | Sev | Issue | Where |
|---|-----|-------|-------|
| R1 | P2 | **Shadow map spans the whole property** (one 2048px map stretched over up to 60 m) → mushy ~2-3 cm/texel shadows up close. Track the orbit target with a ~15 m shadow box (or 2 cascades). | `viewer3d.js:64,211-213,334-337` |
| R2 | P2 | **`glass()` isn't glass** — 0.28-opacity film, no transmission/IOR; DoubleSide transparency causes sorting artifacts on greenhouses/showers. Upgrade to `transmission: 0.92, ior: 1.5` with a low-end fallback. | `builders.js:192-200` |
| R3 | P3 | `environmentIntensity` 0.55 at init vs 0.34 in the day keyframe — first frames brighter than steady state. | `viewer3d.js:45,763` |
| R4 | P3 | Water ripple tiling is fixed 5×5 in UV space — huge ripples on birdbaths, stretched on big ponds. Parameterize by surface size. | `builders.js:251` |
| R5 | P3 | Night interiors go near-black once the 26-light cap hits; add a soft ambient floor. | `viewer3d.js:349,750-754` |
| R6 | P3 | Sky dome is a 1024×512 canvas over a 12 km sphere — visible banding/cloud blur. | `viewer3d.js:96-104` |
| R7 | P3 | Default exterior walls are bare white; observed on both templates the building reads unfinished from outside (and a dark interior room color shows on one estate exterior face — verify exterior-face material selection). | `arch3d.js` buildWalls defaults |
| R8 | P3 | Bundle is a single 1.25 MB chunk; the `items.js`/`autoroof.js` dynamic imports are defeated by static imports elsewhere (Vite warns at build). Code-split the catalog packs for faster first paint. | `vite build` output, `src/main.js` |

### 6. 2D plan symbols

| # | Sev | Issue | Where |
|---|-----|-------|-------|
| P1s | P3 | **Dead code hides the good pond symbol** — duplicate `case 'pond'`: the nicer organic-shoreline version is unreachable; ponds draw as plain ellipses. One-line fix. | `plansymbols.js:382,494` |
| P2s | P3 | All 8 farm animals are identical rectangles on the plan (`plan:{type:'box'}`). Needs an "animal" glyph. | `farm.js` |
| P3s | P3 | All game machines are identical boxes — a game room plan is six same rectangles; reuse the `'appliance'` letter-label mechanism ("ARC", "PIN"…). | `games.js`; `plansymbols.js:119-130` |
| P4s | P3 | Other box fall-throughs deserving glyphs: greenhouse, sheds, saunas, water heater, treadmill, shipping container, diving board, bath accessories. | various packs |
| P5s | P3 | `'hoop'` symbol is stroke-only — invisible on busy plans; floats all map to circles. | `plansymbols.js:456` |

### 7. Storage / PWA / data safety

| # | Sev | Issue | Where |
|---|-----|-------|-------|
| D1 | P2 | **Offline library reports "installed ✓" even when fetches failed** — SW counts failures as done; flaky cellular yields missing textures and the prompt is suppressed forever. Only mark installed at 0 failures; offer retry. | `public/sw.js:44-67`; `src/core/offline.js:55-64` |
| D2 | P3 | Installed flag lives in localStorage but Safari can purge CacheStorage independently — app claims offline readiness with an empty cache. Validate on boot. | `src/core/offline.js:7-16` |
| D3 | P3 | Draft write on `pagehide` races IndexedDB commit on iOS kill; also write synchronously to localStorage on pagehide. | `src/main.js:103-108`; `projects.js:140-146` |
| D4 | P3 | Only the newest crash draft is offered for recovery; older ones invisible. Show per-project "unsaved edits" badges. | `projects.js:149-154`; `home.js:157-169` |

### 8. Misc code health

- `onKey 'r'` uses `store.item(sel.id)` without a null check — throws on stale selection (`editor2d.js:1377-1385`).
- `addLevel` hand-rolls a level literal instead of `emptyLevel()` — schema drift already bit once with `dims` (`state.js:471-478`).
- `fitToContent` uses item centers only — big decks sit half out of frame after "fit" (`editor2d.js:77-98`).
- Duplicate `history` listeners doing redundant work (`ui.js:79,94`); keydown listener never removed (`editor2d.js:52`); dead `inValue()` (`units.js:33-35`); stale comment in `beginSplash`.
- `qa-item.html` only works under `vite dev` (preview swallows it via SPA fallback) — document or fix, it's the asset QA rig.

---

## Part 2 — The 4.0 plan

### Phase 0 — Correctness triage (days, do first)

The cheap, high-trust fixes: **S1** (retractable failsafe), **G1/G2/G3** (material cache corruption + white cubbies), **G4/G5** (thumbnail env map + cache invalidation — instantly upgrades the whole catalog), **C2** (self-snap), **C4/U1** (honest locking), **U2** (empty toast blob), **U8** (escape user strings), **P1s** (unreachable pond symbol), **C6** (pointercancel), **C7** (junk undo entries), **U7** (dirty on floor browse), **D1** (honest offline install).

*Gate:* all existing tests green, zero console errors, `verify-allbuild` extended with the **bbox-vs-def assertion** (G6) so size lies can never ship again.

### Phase 1 — CAD precision you can trust

1. **Unit-aware grid + defaults (C1)** — 6"/12" grid in imperial, 10 cm metric; rulers and scale chip to match; imperial-native defaults (door 3'0", window 4'0", wall heights). This kills the perpetual 9'10" and is the single biggest credibility fix for measurements.
2. **Gesture-safe tools (C3, U6)** — pinch never mutates tool state; two-finger tap never selects/deselects.
3. **Dimensions 2.0 (C5, C8, C9, C10, U3)** — anchored to walls (id + t) so they follow edits and die with their wall; agree with wall pills; 26 px hit target; a real props card (length/offset/delete); cleared on level switch.
4. **Input forgiveness (C12, U5)** — parse `5'-6"`, `5 6`, fractions; clamp typed dims; live "= 2'6"" echo under fields.
5. **Typed exact entry while drawing (new)** — tap the live length pill mid-draw to type the exact wall length. This is the feature that makes it feel like CAD.

*Acceptance:* draw a 10'0" × 12'0" room by hand in under 30 s with every readout exact; pinch mid-measure never corrupts; dims survive wall edits.

### Phase 2 — Asset realism pass (the "assets need to look better" phase)

Order of operations chosen for maximum visible improvement per hour:

1. **One-function wins first:** fix `blob()` radius-relative noise (G9) — hedges/bushes/rocks/canopies improve everywhere at once. Parameterize `water()` ripple scale (R4) and replace all fake/glass water (G11/G12).
2. **Trees & plants** (most-seen offenders): palm fronds as arched rachis + leaflets, ringed tapered trunk; layered two-tone canopies for oak/birch/pine; monstera split lobes; real flower heads. The estate's yard is the storefront — it must look good.
3. **Animals:** shrink the barrel cores ~25-30% so the massing spheres shape the silhouette (farm pack); re-verify each from 2 angles in the QA rig.
4. **Floats & fun:** add a real `torus()` helper; rebuild ring/donut/lifering; tapered-segment necks + proper heads for flamingo/swan.
5. **Boats:** small hull-lathe helper with a real transom; fix the kayak.
6. **Item rebuilds from the hit-list:** hammocks, egg swing, above-ground pool ladder, old toilet (retire for the bathroom-pack one), office chair, gazebo roof (real cone segments), chain-link fence (crossed thin slats or alpha texture), vehicles.
7. **2D symbols alongside** (P2s-P5s): animal glyph, game-machine labels, greenhouse/shed/sauna glyphs — the plan view is half the product.

Hard constraints stand: procedural only, cached materials only (`glow()`/`netMaterial()` for specials), verify each rebuilt item in the QA rig from 2 angles, ship pack-by-pack.

*Acceptance:* every hit-list item re-rendered and eyeballed; no `verify-allbuild` bbox failures; catalog thumbnails show correct materials (chrome shines).

### Phase 3 — Graphics: the premium look

1. **Shadows that follow you (R1)** — ~15 m shadow box tracking the orbit target; crisp close-ups on 2048px.
2. **Real glass (R2)** — transmission + IOR with a cheap fallback flag for low-end GPUs.
3. **Exterior default finish (R7)** — buildings should read finished from outside out of the box; audit exterior-face material selection (dark interior paint was observed on an estate exterior face).
4. Consistent env intensity (R3), night ambient floor (R5), higher-res sky gradient (R6).

### Phase 4 — Performance for phones

1. **Draw-call diet (G10)** — merge same-material static geometry at build time (BufferGeometryUtils) and instance repeats (books, balusters, pickets, sprinkles, blades). Target: Luxury Estate under ~400 calls (measured 1,453 today).
2. **Texture memory hardening (G7)** — byte-budget LRU; never evict materials on live meshes.
3. **Material leak fixes (G8)** in arch rebuilds.
4. **Code-split (R8)** — untangle the static imports so the catalog packs load behind the first paint.

*Acceptance:* estate scene ≥ 30 fps on a mid-range iPhone; memory stable across ten 2D↔3D rebuilds.

### Phase 5 — Ergonomic flow (the "functionality should be ergonomic" phase)

1. **Sticky placement tools (U4)** — place five windows in five taps.
2. **Selection & feedback:** preserve selection through undo + "Undo: moved Sofa" toasts (U11); toasts for every silent no-op (U12); normalized rotation display (U13).
3. **Gesture & mode hygiene:** exit walk mode on view switch (U14); popovers dismiss on outside tap (U17); hint pill moves to the bottom / dodges annotations (U9).
4. **Catalog:** tag-based search synonyms (U15); absolute dims in the Adjust panel (U16).
5. **Dialog consistency (U10)** — styled modals everywhere, no native alerts.
6. First-run flow: defer the offline prompt (S3); surface partial-boot failures (S2); per-project draft badges (D4).

### Phase 6 — The 4.0 splash & brand moment

Keep the v3.2.7 architecture (it finally works on the phone) and layer polish on top — never underneath:

- **Frame zero is the static logo** painted from inline SVG attributes (as today) — visibility never depends on CSS or JS.
- **Motion is additive:** a CSS-only enhancement pass (stroke draw-in of the house, warm window glow blooming, honey-gold wordmark sheen) triggered by adding one class from the inline script, fully wrapped in `@media (prefers-reduced-motion: no-preference)`. Reduced-motion users get today's static screen.
- Stays **outside `#app`** (immune to the forced-landscape rotation); counter-rotate `.splash-inner` in portrait via the inline script if desired.
- **Failsafe ladder:** ~4 s "Still loading…", 6-7 s reload button, and the button **removes itself the moment the home screen appears** (fixes S1).
- **Faster exit:** fade as soon as storage resolves — textures and three.js can finish loading behind the home screen.

### Suggested release train

| Release | Contents |
|---|---|
| 3.3.x | Phase 0 triage + test hardening |
| 3.4 | Phase 1 CAD precision |
| 3.5–3.7 | Phase 2 asset packs (ship pack-by-pack) |
| 3.8 | Phase 3 graphics |
| 3.9 | Phase 4 performance |
| **4.0** | Phase 5 ergonomics + Phase 6 splash, full regression + visual-diff pass, README/HANDOFF refresh |

---

## Appendix — What was verified working during this audit

- Boot → splash → home → both templates: **zero console errors, zero page errors** across all passes.
- Wall drawing, per-wall length pills, Measure tape (length + angle), Dimension place/persist/undo, ruler + scale chip.
- Catalog opens with 19 tabs; thumbnails render with correct proportions and dimension labels.
- Selection FABs are generously sized (52-54 px) and well labeled.
- 3D day scene, day-time popover, item selection in 3D.
- Estate template loads and renders in 2D and 3D (slow but stable under software rendering).
- Storage architecture (IDB + drafts + backups + quota honesty) — no data-loss path found beyond the P3 races listed in §7.
