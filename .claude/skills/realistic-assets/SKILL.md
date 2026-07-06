---
name: realistic-assets
description: >-
  Rebuild Honeycutt Home Studio catalog assets to look premium/realistic while
  staying procedural, lightweight, offline, and mobile-safe. Use when improving,
  adding, or fixing any 3D catalog item (furniture, trees/plants, animals,
  outdoor/play, pools, decor) in src/catalog/. Covers the builder DSL, hard
  constraints, and the screenshot-QA loop.
---

# Realistic Assets

Every catalog item is built **procedurally in code** from a small DSL — there
are no binary models. Your job is to make crude assets read as realistic without
regressing load time, offline behavior, or mobile GPU budget.

Track progress in `ASSETS-TODO.md` (repo root). Work pack-by-pack, ship small
reviewed batches, bump the version per batch.

## Where things live

| What | File |
|------|------|
| Builder DSL (primitives, materials) | `src/catalog/builders.js` |
| Core furniture + outdoor items | `src/catalog/items.js` |
| Themed packs | `src/catalog/packs/*.js` (bathroom, kitchen, livingroom, lounge, decks, docks, pools, poolside, water, farm, fencing, games, structures, decor, cabinets, frames, utility) |
| 2D plan symbols | `src/editor/plansymbols.js` |
| Procedural + CC0 textures | `src/core/textures.js`, `public/tex/*.jpg` |

An item def is `{ id, name, cat, w, d, h, palettes, plan, build(p) }`. `build(p)`
returns a `THREE.Group`; `p` is the selected palette (or `{}`). Origin sits at
floor level, centered on the footprint; **+Z faces "front"**; all units are cm.

## Builder DSL cheatsheet (`builders.js`)

- **Solids/geometry:** `box(g,mat,w,h,d,x,y,z,{r,seg,rx,ry,rz})` (r = rounded),
  `cyl(g,mat,r,h,x,y,z,{rTop,seg,rx,rz,open})`, `sphere(g,mat,r,x,y,z,{sx,sy,sz,seg})`,
  `prism`, `pyramid`, `legs4`, `strut(g,mat,ax,ay,az,bx,by,bz,r,{rTop,seg})`
  (point-to-point cylinder — A-frames, ladders, chains, angled rails).
- **Organic:** `blob(g,hexA,hexB,r,x,y,z,{seed,sy,detail})` (dappled lumpy mass —
  canopies/bushes), `foliage(g,hexA,hexB,cx,cy,cz,radius,count,seed)` (cluster of blobs).
- **Materials (mostly cached — do NOT mutate a cached material's color/glow):**
  `solid(hex,rough,metal)`, `wood(hex,rough)`, `metal()`, `chrome()`, `glass()`,
  `mirror()`, `water()`, `tex(matId,repeatX,repeatY)`, `glow(hex,intensity)` (owned),
  `netMaterial(tint,repX,repY)` (owned — translucent mesh net).
- Box `y` is the **base**; the helper adds `h/2` then applies rotation.

## Hard constraints — never regress

1. **Stay procedural + lightweight.** No bulk glTF imports. Instant load, offline.
2. **GPU/memory budget.** A past release crashed phones by leaking textures.
   - Reuse cached materials. Never set `userData.owned` on a cached material.
   - Any material carrying a **unique canvas texture** must be tagged
     `userData.owned = true` and `userData.ownedMap = true` so `rebuildItems`
     disposes it. (`glow`, `blob`, `netMaterial`, `photoMaterial` already do this.)
   - Prefer instancing for repeated foliage/blades. Keep per-item geometry sane.
3. **Never let `build()` throw** — `rebuildItems` catches per-item, but a throw
   means the item silently vanishes. QA every change.
4. **Keep the 2D plan symbol legible** (`plan: {type}` → `plansymbols.js`).

## Realism techniques that work here

- **Fold/rumple relief cheaply:** overlap several soft rounded "rolls" (see
  `dressBed` in `items.js`) instead of one flat slab — reads as a quilted duvet.
- **Dappled organic mass:** `blob`/`foliage` with varied `seed`/`sy` beat plain spheres.
- **Structure from struts:** build A-frames, ladders, rails, chains with `strut()`
  between explicit 3D endpoints — clean and easy to get right.
- **Plush upholstery:** rounded boxes with large `r` relative to height read soft.
- **Let PBR work:** metals/polished finishes catch the `RoomEnvironment` IBL via
  `envMapIntensity` already tuned in `solid()`/`metal()`.

## QA loop — required for every rebuilt asset

```bash
npm run dev &     # vite dev server on :5173
APP_URL='http://localhost:5173/qa-item.html' \
  node tests/qa-shot.js <label> <id> [more ids...]
```
- Renders each id from two angles (35°, 135°) with the **real viewer lighting**
  (RoomEnvironment IBL + hemi + sun + ACES) into `tests/qa/<label>/<id>_<az>.png`.
- The page `<title>` reports `QA-OK: <id> [w x h x d]`, `QA-THROW: <id> :: <err>`,
  or `QA-ERROR: no item`. Watch for throws and unexpected bbox sizes.
- **Read the PNGs back** and compare before/after. Check both angles for gaps,
  clipping, geometry poking through, or parts floating.
- Then `npm run build` to confirm no bundler/syntax errors, and (if the item can
  appear in the mansion demo) `npm run test:visual` — update baselines only for
  intended changes.

## Ship checklist

- [ ] QA screenshots from 2 angles look right, no throws.
- [ ] `npm run build` clean.
- [ ] Version bumped (`npm version X.Y.Z --no-git-tag-version`).
- [ ] `ASSETS-TODO.md` updated (move item to Done, note next batch).
- [ ] Commit to the working branch with a clear message.
