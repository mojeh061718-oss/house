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

- Branch: work continues on `claude/md-handoff-tasks-mf6tye` (added to the
  deploy workflow's trigger branches; `claude/mobile-home-design-app-l2mc9l`
  holds the pre-2.11 history)
- Current version: **2.11.0**
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

All eight numbered tasks are **DONE as of v2.11.0**:

1. ~~Continue the last three items~~ — done in v2.10.0 (room duplication,
   Home Shells presets, shipping-container & grass-hill items).
2. ~~Resizable doors & windows~~ — jamb-end drag handles in the 2D editor
   (`editor2d openingHandles`/`resizeOpening`), clamped 40–300 cm and kept
   inside the wall; props fields live-update during the drag.
3. ~~Door/window type pickers~~ — `core/openings.js` registry; rail Door/
   Window buttons open a popover (`ui showOpeningPop`), last-used type
   stays armed (`store.doorType/windowType`). New types: double, french,
   pocket, garage; casement, slidingWindow, picture — rendered in
   `arch3d buildOpeningModel` (3D) and `editor2d drawOpenings` (2D plan
   symbols). Props panel offers the full type chip row.
4. ~~Selectable exterior~~ — `viewer3d castArchSelection` picks opening >
   room > exterior wall face on tap; wall props panel has an "Outside
   face" grid writing `wall.extMat` (consumed in `arch3d buildWalls` +
   top cap), a reset button, and the whole-home exterior grid.
5. ~~Paths flow rework~~ — 3D finger-down-on-ground draws a stroke
   (`viewer3d` gesture kind 'path' + line preview, shared
   `placement.createPathItem`); textures follow the stroke in 3D
   (`arch3d pathSegmentUV`, rotated elbow caps) and in 2D
   (`editor2d strokePath` fills per-segment in a rotated frame with
   run-length continuity).
6. ~~Multi-select~~ — new "Group" rail tool: marquee drag or tap-to-toggle
   builds `{kind:'multi', ids:[]}`; FAB Copy/Delete act on the group;
   `store.deleteSelection` handles multi; 3D selection box unions the
   group. Single-select unchanged.
7. ~~Grid scale labels~~ — `editor2d drawRulers`: ft/in labels along
   top/left edges (spacing adapts to zoom) + a "1 square = X" chip.
8. ~~Auto-fit roofs~~ — `core/autoroof.js autoRoof`: tapping a roof
   catalog card removes old primary roofs and fits the new one over the
   topmost built level's footprint (+40 cm eaves, ridge on the long axis,
   h = 0.28·short side clamped 140–330, elevation −6 cm hides the wall
   seam, level-offset aware). Falls back to free placement with no walls.

Still on the longer wishlist (approved earlier, not started): interior
second-floor connections for stairs (cut ceiling openings); bay windows.

## User preferences worth remembering

- Wants "premium/professional/HD"; hates "cartoony", emoji assets, and
  bland gray boxes. Rich textures and real-looking assets win.
- Loves being shown screenshots of results in chat.
- Expects fast visible progress; batch features into shippable rounds and
  deploy each round (version bump every time — the version shows in the
  app menu and they check it).
- Phrases arrive via voice-to-text with typos ("bardementiams" =
  barndominiums). Interpret generously.
