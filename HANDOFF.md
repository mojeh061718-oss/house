# HANDOFF — Honeycutt Home Studio

For the next agent continuing this project in a fresh session. Read this
whole file before touching code. The user is non-technical, iPhone-first,
and reviews everything on the **live site**, so every change must end with
a verified deploy.

## What this is

A professional 2D/3D home-design PWA (Planner-5D style) for **iPhone/iPad
only** (no Android), landscape-first, deployed to **GitHub Pages** on every
push to this branch. Vite + vanilla JS + three.js. No frameworks, no binary
assets except five CC0 JPGs in `public/tex/` (ambientCG, attributed in
README).

- Branch: `claude/mobile-home-design-app-l2mc9l` (deploys fire from here).
  Recent versions were developed on `claude/handoff-md-completion-8vnjdh`
  and merged across to deploy.
- Current version: **2.17.0** (dev branch only, not yet on live) — durable
  storage overhaul. Projects/drafts now live in **IndexedDB** (new src/core/
  idb.js) via an in-memory cache so the read API (listProjects/getProject) stays
  sync; writes persist async. projects.js: initStorage() opens the DB, migrates
  existing localStorage data once (keeps the LS copy as passive fallback), and
  loads the cache; falls back to localStorage entirely if IndexedDB is
  unavailable. Fixes: (a) the quota handler NO LONGER deletes the oldest project
  — it calls setStorageFullHandler → ui.toast warning instead; (b) crash drafts
  are now **per-project** (drafts store keyed by projectId), so switching
  projects can't clobber another's unsaved work; getDraft(id) or getDraft()
  (latest) for the home banner. main.js: awaits initStorage before the splash,
  requests persistent storage at startup + retries on first pointerdown
  (installed PWA = exempt from iOS 7-day eviction), and stashes a draft on
  visibilitychange + pagehide + freeze. storageEstimate() exposes usage/persisted.
- v2.16.0 (dev) — shape-picker
  for drawn paths/water. A floating `.shape-bar` (top-center of the viewport,
  shown by ui.syncShapeBar only while a path tool is armed) offers Line / Free /
  Rectangle / Circle. store.drawShape holds the mode; placement.js shapePolyline
  builds a closed rect/circle loop from the drag bbox, 'line' a straight
  angle-snapped segment, 'free' collects live points. Both editors resolve the
  mode via pathModePolyline / pathGesturePolyline (2D editor2d.js + 3D
  viewer3d.js, updatePathPreview now takes a full polyline). Closed shapes are
  loops of the path material (a circular/rectangular walkway or stream); filled
  round/square water is still the Pond/Pool items. Default stays 'line'.
- v2.15.5 (dev) — topbar &
  tool-rail redesign. Topbar no longer overflows/clips the menu on phones:
  Photo + Fullscreen moved into the ☰ menu (mShot/mFull), Sun/Walk/Roof grouped
  into a `.tb-seg` pill, project-name field + 3D-tool word labels hidden in
  compact, `.tb-menu { flex:none }` + shrinkable name guarantee the menu stays
  on-screen; day-pop re-anchored (right:52px). Tool rail: flat `.rail-btn`
  (accent fill when active) with a `.rail-div` separating Select from the
  drawing tools. Removed the old #btnShot/#btnFull topbar buttons.
- v2.15.4 (dev) — hardened
  work-safety: unsaved-work recovery now lives as a home-screen banner
  (home.js draftTip: Resume / Discard) so a brand-new project that was never
  saved is still recoverable — the old mid-open confirm() couldn't reach it
  because an unsaved project has no list entry to reopen. Resume loads the
  draft and marks it dirty (openFn opts.dirty → store._savedJson=null) so
  leaving always prompts Save. Draft is kept until an explicit Save (clears it)
  or Discard. NOTE: this also carries the v2.15.3 modal CSS, which is what makes
  the Back-to-projects Save dialog actually visible — on the stale v2.15.2 build
  the dialog had no CSS so tapping Home appeared to do nothing.
- v2.15.3 (dev) — finished the
  save/clear feature: (a) edits no longer autosave into the project; they go to
  a single crash-recovery draft (projects.js saveDraft/getDraft/clearDraft,
  store.saveDraftNow). Leaving via Back to projects when dirty pops a styled
  Save / Don't save / Keep editing modal (ui.askSave + .modal CSS); explicit
  Save writes the project and clears the draft (store.saveNow). On reopen, an
  unsaved draft offers recovery (main.js). (b) "Clear plan" menu item wipes
  every floor to one empty level (store.clearPlan, undoable). (c) Project home
  screen has a Select mode (home.js selectMode/selected) to multi-delete
  projects — check badges, "Delete (N)", blue-outlined cards.
- v2.15.2 (dev) — (1) movable
  rooms: in 2D, tap a room to select it, then press-and-drag inside it to move
  the whole room — its walls (openings ride along) plus the furniture standing
  in it. `dragRoom` mode in editor2d.js; selection re-glues to the room after
  each move since room keys are centroid-based. Shared walls move too (fine for
  standalone rooms; deforms a neighbor if they share a wall). (2) Straight-line
  paths: drawing any path (gravel/sidewalk/driveway/stream/fence) is now a
  clean rubber-band segment from press to release (angle-snapped to 45°, length
  to grid) instead of a freehand trail — in both 2D (snapPathEnd) and 3D
  (straightPathEnd + updatePathPreview). pathDraw mode changed from {pts:[]} to
  {start,cur} in both editor2d.js and viewer3d.js.
- v2.15.1 — grass pass: 4 new photo ground materials
  (Deep Green Lawn / Farm Field / Spring Lawn / Patchy Yard, grass001/003/
  005/007.jpg) and a draw-an-area "Tall Grass" outdoor item (buildTallGrass
  in builders.js: instanced cone blades, Meadow / Wheat Field / Prairie
  palettes; catalog now 176 items). window.homestudio also exposes MATERIALS.
- v2.15.0 — premium pack: 58 new catalog items across
  every category (search "PREMIUM PACK" in items.js; sectional/chesterfield,
  canopy & bunk beds, crib, island+stools, appliances, freestanding tub,
  walk-in shower, double vanity, farm table, buffet, L-desk, exec chair,
  bookcase wall, crystal chandelier, arc lamp, sconces, monstera, gallery
  wall, aquarium, BBQ, fire pit, outdoor lounge, hammock, trampoline,
  playhouse, greenhouse, palm/red maple, boulders, porch column, glass rail,
  carport...; catalog now 175 items). Hero textures render at 2K: file mats
  honor `res:` in textures.js (12 ids re-encoded at 2048px in public/tex).
- Previous: **2.14.2** — item locking: `it.locked` flag; padlock FAB
  (`#selLock`, amber when locked; multi locks/unlocks the whole group);
  locked = selectable but no drag/rotate/resize/delete in 2D & 3D (guards in
  editor2d downSelect/itemHandles/dragMulti/'r', viewer3d onDown, store
  deleteSelection incl. room-delete sparing); gold padlock badge drawn on
  locked items in the plan; amber 3D selection box.
- Previous: **2.14.1** — drawable fences (`path_fence`: path item w/
  `surface:'fence'` → `buildFenceModel` in arch3d — posts/rails/instanced
  pickets per FENCE_STYLES palette; 2D = line+post dots in strokePath; old
  'fence' item hidden) and organic ponds (`buildPond` in builders: wobbled
  ShapeGeometry shoreline + rock ring; plan.type 'pond' symbol).
- Previous: **2.14.0** — 19 more CC0 photo textures (round 3 in
  textures.js/README); vegetation overhaul (`blob()` in builders.js:
  noise-displaced icosphere w/ dappled vertex colors; foliage() uses it;
  new tree_birch/bush_cloud); realistic water (MeshPhysical + ripple bump,
  builders.water + arch3d stream mat); pool_above & pool_above_deck items;
  size-true builders: `def.buildSized(p,w,d,h)` skips model scaling
  (patio w/ 6 DECK_FINISHES palettes, pool, new pad_drive & water_area —
  all areaDraw); 3 container-home shells (L/stack+deck/courtyard; shells
  support `build2(api)` for an upper storey — stampShell handles levels);
  viewer.setViewAll + "All" chip (level bar now lives in the TOPBAR next to
  the view toggle); duplicate works for openings & walls too; ghost-pointer
  fix (e.isPrimary clears stale pointers — was the "camera stuck on zoom"
  bug); fit-view floats top-right of the viewport (.view-fit), off the rail;
  catalog tabs wrap (no hidden scroll). NOTE deploy verification: check the
  LIVE site serves the new asset hash — the gh-pages branch alone is not
  enough (GitHub's internal pages build can fail; re-trigger via
  workflow_dispatch on deploy.yml).
- Previous: **2.13.1** — patios/pools drag-to-size (`areaDraw: true`
  on item defs → 'areaDraw' mode in editor2d + gesture in viewer3d with a
  flat preview box); old fixed-rect sidewalk/driveway slabs are
  `hidden: true` (kept for old saves, filtered from the catalog) and the
  drawable path items took their plain names; paths & area items never
  auto-drop via placeInRoom in 3D; the floor switcher moved to a small
  top-left chip (no longer covers the hint pill)
- Previous: **2.13.0** — improvement round:
  stairs/elevators cut real floor & ceiling openings (`viewer3d.stairHoles`
  → `buildFloors/buildCeilings(project, rooms, holes)`; earcut handles hole
  winding); walk mode follows walkable surfaces (`walkSurfaceY` raycast vs
  meshes tagged `userData.walkable` — floors, ground, stairs) so you can
  climb to the next floor; autoRoof decomposes L/T/U footprints into ≤3
  rect sections (occupancy grid over room-vertex lines, greedy largest-rect;
  shared ridge height, 0.5cm elevation stagger kills fascia z-fighting; flat
  roofs & non-rectilinear plans fall back to bbox); photo textures now load
  LAZILY (no startup preload — `getMaterialPreview` returns placeholder
  without fetching; `ensureTexture` fires when a drawer with swatches opens
  via `ui.loadSwatchTextures`); backup/restore in `core/projects.js`
  (`exportBackup/importBackup/backupToFile` — iOS share sheet, merge-by-id
  with newer-local-wins; Back up/Restore on home screen + studio menu +
  14-day reminder banner; `navigator.storage.persist()` at boot); 2D drag
  shows green center-alignment guides (snaps) + blue wall-gap dimension
  lines (`updateDragGuides/wallGaps`); catalog is a full-screen bottom sheet
  on compact phones with one-row scrollable tabs
- Previous: **2.12.1** (room delete: unique walls + inside items go,
  shared partitions & roof-level items stay — see `deleteSelection`; rulers
  label whole feet from the plan's min corner, no negatives; ALL length
  fields display/parse ft-in via `fmtFtIn`/`parseFtIn` in units.js — bare
  numbers mean feet, `"`/`in` means inches)
- Previous: **2.12.0** (tasks 2-8 shipped in 2.11.0; 2.12.0 added a
  24-texture CC0 photo pack from ambientCG — floors/walls/siding/ground +
  2 photo roof palette entries (`real_roof_slate/clay` in ROOFS), all
  attributed in README — plus compact phone chrome: `ui.syncCompact()`
  toggles `#app.compact` when app height < 500px (CSS media queries see the
  wrong axis in rotated-portrait mode), the type-pop popover clamps inside
  #workspace, and picker glyph canvases render at 2x for retina)
- Deploy: `.github/workflows/deploy.yml` builds and force-pushes `dist/`
  to `gh-pages` on push. Verify by polling
  `git fetch origin gh-pages && git log -1 --format=%s origin/gh-pages`
  until the message contains your commit sha (takes ~1–2 min).

## Non-negotiable working rules (learned over 20+ user rounds)

1. **Verify everything end-to-end before shipping.** The full gate is:
   - `npm run build` from `/home/user/house` (NEVER run npm from elsewhere)
   - `npm run preview -- --port 4180` then run the Playwright suites in the
     scratchpad (see Testing below) — all must pass with **zero console
     errors**
   - `npm run test:visual` (pixel-diff; `-- --update` only when a visual
     change is intentional)
   - bump version with `npm version X.Y.Z --no-git-tag-version`, rebuild,
     commit, push, watch gh-pages for the sha
2. **Screenshot-QA every new 3D asset.** Render it isolated from 2 angles
   and actually look at the image. This has caught real geometry bugs
   (mis-rotated extrusions, z-fighting, buried water) every single time.
3. All lengths shown to the user are **feet/inches** (`src/core/units.js`);
   internal units are **centimeters** everywhere.
4. The user rejected AR. Do not re-add `exportUSDZ` or an AR button.
5. Headless SwiftShader renders ~1 fps: use long waits (2.5–5 s) after any
   view change in Playwright; animations cannot be timed realistically.
6. Write UI copy in plain human words; the user notices tone.

## Architecture map (all under `src/`)

| File | Role |
|---|---|
| `core/state.js` | Store: project model **v2 with `levels[]`**, undo/redo, autosave. `bindLevel()` aliases the active level's arrays onto `project.walls/openings/items/roomStyles` — these are POINTERS; mutate in place, never replace them (templates use `Object.assign` for roomStyles for this reason). |
| `core/geometry.js` | Vector math + planar-graph room detection (`detectRooms` splits at T-junctions, dedupes collinear duplicate edges). Room keys derive from centroids; `refreshRooms` in state.js remaps styles to nearest successor centroid on edits. |
| `core/placement.js` | `snapPose()` shared 2D/3D wall snapping. `NO_WALL_SNAP` is a Set of `plan.type` strings that never stick to walls. |
| `core/textures.js` | Procedural canvas texture engine. `MATERIALS` registry (`use: floor/wall/ground/internal`, `group` labels the picker sections). Generators: wood/herringbone/tiles/marble/brick/carpet/concrete/paint/stripes/fabric/grass/siding/boardbatten/shingles/stone. Photo (file-based) materials load async into the same canvases; `watchTextures(fn)` notifies so GPU textures/2D patterns refresh (`arch3d.js`, `builders.js`, `editor2d.js` all subscribe). `preloadFileTextures()` runs at startup. |
| `core/themes.js` | Whole-home restyle themes. |
| `core/autofurnish.js` | Room auto-furnish templates. |
| `core/shells.js` | **Home Shell presets** (barndominiums ×3, container homes ×2, hillside home). `stampShell(store, shell, ox, oy)` lays walls/openings/items/named rooms; `drawShellPreview` draws the catalog card. Add new shells to the `SHELLS` array only. |
| `core/orientation.js` | Forced-landscape CSS rotation on portrait iPhones; `clientToApp` pointer remap; safe-area probe. Don't touch without re-testing rotated-iPhone taps (shot4.js covers it). |
| `core/projects.js` | localStorage multi-project repo. |
| `catalog/builders.js` | Primitives: `box` (base-at-y), `cyl` (horizontal detection when rotated ~90°), `sphere`, `prism` (gable, extruded; **UVs normalized by uvScale**; 2-material: caps vs slopes), `pyramid` (hip), `legs4`, `foliage`, materials `solid/wood/tex/metal/chrome/glass/mirror/water`. `tex()`/`archMat()` каches per (matId, repeat) — cloned materials share canvases. |
| `catalog/items.js` | ~110 item defs `{id, name, cat, w, d, h, palettes, plan:{type}, light?, mount?, elevation?, path?, build(p)}`. Roofs have `elevation: 260/300` so they drop at wall top. Path items have `path: {mat, width, surface?}`. `buildSunflower` shared helper at the bottom. |
| `editor/editor2d.js` | Canvas plan editor. Drag-to-draw walls, room rect, path drawing (`pathDraw` mode — see Paths), ghost underlay of level below, level-aware. Pattern cache invalidated via `watchTextures`. |
| `editor/plansymbols.js` | Top-view symbols by `plan.type` (incl. `roof`, `path`, `stairs`, `elevator`, `rings`…). |
| `viewer/arch3d.js` | Walls/floors/ceilings/openings/ground/`buildPathModel` (3D path runs with round joints; water gets a bed). `archMat` world-unit UVs via `boxWorldUV`. |
| `viewer/viewer3d.js` | Scene, PMREM lighting, **time-of-day** keyframes (night/golden/day) + repainted sky dome (blue gradient + puffy cumulus + moon/stars), custom touch orbit, walk mode with joystick, flyTo camera, multi-level stacking (`levelY(i) = i*(wallHeight+30)`), per-level raycast filters, tap-to-place, item drag (paths translate their pts), `seedDefaultPath`. `syncItems` is the cheap path — it compares `userData.{w,d,h,palette,pw}` snapshots taken in `rebuildItems`. |
| `ui/ui.js` | Top bar, tool rail, catalog (incl. **Home Shells tab** + `addShell`), FAB cluster (Copy works for items AND rooms → `duplicateRoom`), props panels, material grids, floor switcher pills (`syncLevels`), hints. |
| `ui/home.js`, `demo.js` | Splash/home, sample apartment + Luxury Estate templates (estate has gardens/sunflowers). |

## Key invariants / gotchas

- `project.walls` etc. are aliases into `project.levels[activeLevel]` —
  serialization via `serializeProject`, load via `hydrateProject` (accepts
  v1 flat too). File-open validation accepts `walls` OR `levels`.
- Items with `it.path` (polyline paths): move by translating **both**
  `it.x/y` and every `path` point; no rotate/resize handles; hit-test along
  the stroke; 3D model built by `buildPathModel`, not `def.build`.
- `prism()` after `rotateY(-π/2)` needs `translate(+w/2,…)` — geometry
  centered; don't "fix" the sign back.
- Never let a catalog `build()` throw — `rebuildItems` catches per-item but
  logs a warning; the all-items smoke test fails on missing models.
- CSS: hand-typed hex colors have been corrupted before (e.g. `#3b4welcome6`).
  Double-check any color you type.
- `npm version` must run in `/home/user/house`.
- Playwright chromium: `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`,
  args `['--use-gl=angle','--use-angle=swiftshader','--no-sandbox']`.
- Debug handle in the app: `window.homestudio = {store, editor, viewer, ui,
  home, ITEMS, ITEM_MAP}`.

## Testing (scratchpad scripts)

Scratchpad: `/tmp/claude-0/-home-user-house/<session>/scratchpad/` — these
scripts die with the container, so recreate from this description if gone
(each is ~100 lines; patterns are in the repo history of this HANDOFF):

- `floors-test.js` — 21 checks: level add/switch/bind, 3D stacking at
  wallH+30, per-level items, serialize round-trip, undo, zero errors.
- `paths-test.js` — 11 checks: drag-lays sidewalk via real mouse drag,
  water stream, move translates pts, 3D meshes, save/reload.
- `shells-test.js` — shells tab, barndo stamp (rooms named, settings),
  all six shells, room duplicate + undo.
- `all-items.js` — places every catalog item, asserts `itemGroups.size ===
  ITEMS.length` and no "item build failed" warnings.
- `shot4.js` — desktop + iPhone-rotation interaction regression (orbit,
  save/reopen, rotated tap/drag). Needs `APP_URL=http://localhost:4180/`.
- `tests/visual.js` (in repo) — pixel-diff vs `tests/baselines/`.
- `items-shot.js` / `one-item.js` — screenshot batches for eyeball QA.

## CURRENT TASK LIST (user's words, my notes)

The user's latest request, verbatim numbering:

1. ~~Continue the last three items~~ — **DONE in v2.10.0** (room
   duplication, Home Shells presets incl. 3 barndominiums + 2 container
   homes + hillside home, shipping-container & grass-hill items).

**Tasks 2-8 below are all DONE in v2.11.0.** Implementation notes:
- `src/core/openings.js` — NEW: `OPENING_TYPES` registry (7 doors, 5
  windows), `OPENING_MAP`, `isDoorType`, `openingDefaults`. Store keeps
  `doorType`/`windowType` armed (last-used). Rail Door/Window buttons open
  a `.type-pop` picker (glyphs drawn by `ui.drawOpeningGlyph`); the opening
  props panel has a style row that also re-arms the type.
- Opening resize: `editor2d.openingHandles/openingHandleAt` + mode
  `resizeOpening` (grabbed jamb follows pointer, other jamb fixed, width
  clamped 40..wall−12). 3D taps on a door/window model select the opening.
- Exterior: exterior wall slabs get `userData.exterior`; `viewer.castArch`
  returns `{openingId}|{roomKey}|{exteriorWallId}`; selecting an exterior
  wall opens the wall panel with a siding grid → `wall.extMat` override
  (consumed in `buildWalls` + top cap), plus "use on whole exterior".
- Paths: 3D `pathDraw` gesture (pointer-down on ground draws until lift,
  cylinder-dot preview, tap falls back to `seedDefaultPath`); shared
  `createPathItem` in `core/placement.js`. Texture follows the stroke: 3D
  `pathBoxUV`/`cylinderRunUV` carry cumulative run length u0; 2D
  `strokePath` fills each segment with a rotated pattern + oriented joint
  circles (water keeps the flat stroke).
- Multi-select: `{kind:'multi', ids:[]}` selection; rail "Multi" tool =
  marquee drag + tap-to-toggle; dragging any member moves the group
  (`dragMulti`); FAB/props Copy & Delete loop the ids;
  `store.cloneItem` is the shared duplicator; 3D selBox unions the group.
- Rulers: `editor2d.drawRulers` — top/left strips, ft-in labels at clean
  cm steps (>=56px apart), scale chip above the floor pills.
- Auto-roof: `src/core/autoroof.js` `autoRoof(store, defId)` — footprint
  bbox (+40cm overhang, +wall half-thickness), deletes all autoFit roofs
  on every level, places on the ACTIVE level with elevation = top of the
  highest level minus levelY(active), ridge along the long axis,
  h = clamp(0.28·short, 140, 330). The four `roof_*` defs have
  `autoFit: true` (dormer excluded) and skirts dropped 6cm below base so
  no wall seam shows. Catalog roof cards auto-fit when walls exist.
- Debug handle additions: `homestudio.OPENING_TYPES`, `homestudio.autoRoof`.
- Scratchpad suites from this round: `features-test.js` (27 checks),
  `all-items.js`, `floors-shells-test.js` — recreate from repo history of
  this file if the container died.

2. **Resizable doors & windows.** When a door/window is selected, let the
   user resize it. The opening props panel (`ui.js`, `sel.kind ===
   'opening'`) already edits width/height/sill numerically — add drag
   handles in the 2D editor (like item resize handles: grab the jamb ends
   to change `o.width`, clamp to wall length minus margins, checkpoint on
   grab, commit(true)). Consider a min of ~40 cm and keep `t` clamped so
   the opening stays inside the wall.

3. **Door/window type pickers on the tool rail.** Treat the Door and
   Window rail buttons as drawers: tapping them opens a small popover to
   choose a type first, then place with the normal snap flow (2D and 3D
   tap-to-place both already work via `placeOpeningAt`). Existing opening
   types: `door`, `doorway`, `slidingDoor`, `window`. Add more variants:
   double door, French/glass door, garage door, pocket door; picture,
   sliding, casement, bay(?) windows. Opening rendering lives in
   `arch3d.js` (3D) and `editor2d.js drawOpenings` + `plansymbols` (2D).
   Store shape: openings have `{type, width, height, sill, flip, swing}` —
   extend `type` values and render accordingly. Keep the one-tap flow fast:
   last-used type should stay armed.

4. **Selectable exterior.** You currently cannot tap the outside face of a
   wall in 3D to restyle it. `castWall` (viewer3d) already finds the wall —
   add: when the tapped wall face is exterior (no room on that side — use
   room polygons + face normal), select the wall and open a props panel
   that offers the **Exterior Siding** material group (per-wall override,
   e.g. `wall.extMat`, consumed in `arch3d buildWalls` where it currently
   uses `settings.exteriorWall` for outward faces). Also give the project
   settings exterior grid a shortcut from that panel.

5. **Paths flow rework (sidewalks/driveways/water).** Wanted flow: tap the
   asset card → finger down on the plan **immediately starts drawing**,
   never stops until finger lift, and **the texture follows the stroke
   direction**. Today: `pathDraw` mode already does touch-down→draw→lift in
   2D (`editor2d downPlace`). Missing: (a) same gesture in **3D** (start a
   pathDraw on ground raycast instead of tap-to-place a straight seed);
   (b) **oriented texture**: `buildPathModel` boxes are axis-rotated but
   UVs come from `boxWorldUV` (world-planar), so patterns don't follow the
   run — rewrite segment UVs so U runs along the segment direction
   (compute per-segment UVs manually instead of boxWorldUV; scale by
   material `scale`); do the same for the 2D pattern by rotating
   `pat.setTransform` per segment (draw each segment separately with a
   rotated pattern matrix instead of one big stroke).

6. **Multi-select & group operations.** Highlight/select multiple items to
   copy or delete as a group. Suggested: long-press (or a new "Select
   multiple" mode via the rail) → `store.selection` today is a single
   `{kind, id}` — extend to support `{kind:'multi', ids:[...]}`; a
   marquee/lasso drag in `editor2d` collecting items whose centers fall in
   the rect; FAB shows Copy/Delete for the group; `deleteSelection` and
   duplication loop over ids. Keep single-select behavior unchanged.

7. **Grid scale labels in 2D.** The grid has no numeric reference. Add
   ruler labels along the top/left edge (screen-space, in `render()` after
   world drawing): feet at major lines (grid majors are every 100 cm), a
   scale chip (e.g. "1 square = 8 in / 3.3 ft") adapting to `view.scale`
   like the step logic in `drawGrid` (20/100/500 cm steps).

8. **Auto-fit roofs (high priority).** Placing a roof leaves gaps and the
   user must hand-size it — they want: pick roof type/material → the app
   automatically covers the house. Implement `autoRoof(store, roofDefId,
   palette)`: compute the bounding rect of the ACTIVE level's exterior
   footprint (bbox of `detectRooms` union or of all walls), add eave
   overhang (~40 cm each side), delete existing roof items (plan.type
   'roof'), place `roof_gable/hip/shed/flat` with `w/d` = footprint + 2·overhang,
   `h` proportional (~0.28·min(w,d) clamped 140–330), `elevation` = top of
   the highest level (levels.length·wallHeight + (levels.length−1)·30 — see
   `levelY`), rotation along the long axis. Trigger: tapping a roof card in
   the catalog should auto-fit instead of free-placing (fall back to free
   placement when there are no walls). Also fix the visible seam: extend the
   fascia/prism base ~6 cm below `elevation` so it overlaps the wall top.
   Note roofs are items on the ACTIVE level but poseItem adds `levelY(active)`
   to elevation — account for which level the user is on (probably always
   roof relative to ground: use absolute elevation minus levelY, or place
   while top level active).

Also on the longer wishlist (approved earlier, not started): interior
second-floor connections for stairs (cut ceiling openings). (Garage door
shipped as an opening type in v2.11.0.)

## User preferences worth remembering

- Wants "premium/professional/HD"; hates "cartoony", emoji assets, and
  bland gray boxes. Rich textures and real-looking assets win.
- Loves being shown screenshots of results in chat.
- Expects fast visible progress; batch features into shippable rounds and
  deploy each round (version bump every time — the version shows in the
  app menu and they check it).
- Phrases arrive via voice-to-text with typos ("bardementiams" =
  barndominiums). Interpret generously.
