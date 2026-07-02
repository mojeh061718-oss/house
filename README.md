# Honeycutt Home Studio

A professional 2D/3D home design app in the spirit of Planner 5D, built for
the browser and designed **landscape-first for iPhone and iPad**. It ships
with **zero binary assets** — every floor, wall finish, fabric and piece of
furniture is generated procedurally at runtime.

![Honeycutt Home Studio](docs/screenshot-3d.png)

## Use it

**Live app:** https://mojeh061718-oss.github.io/house/

Installable PWA with full offline support:
- **iPhone / iPad:** open in Safari → Share → **Add to Home Screen**
- **Desktop:** click the install icon in the address bar

The app opens with a splash screen and a **project home**: start a new
project, open the furnished sample apartment, or continue any saved design
(each shows a live plan thumbnail). Designs autosave on the device.

The studio is landscape-first: hold the device in portrait and the UI
renders in landscape, so you naturally rotate — no nag screens. Installed
PWAs also request a landscape orientation lock where supported.

## Features

**Floor planning (2D)**
- Draw walls point-to-point with grid, endpoint and 45° angle snapping
- One-drag rectangular room tool; automatic room detection with live area
  labels and per-wall dimensions
- Hinged / sliding doors and doorways, windows with adjustable sill/size
- Furniture drag with **wall snapping** — items seat and align against
  nearby walls, like the big design apps
- Big touch-friendly rotate/resize handles; smart hit-testing so small
  ceiling lamps don't steal taps meant for the sofa under them
- Pinch zoom, two-finger pan, undo/redo

**Real-time 3D**
- Textured walls painted per room, cut open for doors and windows with full
  3D frames, panels, handles and glass
- Furniture is editable in 3D too: tap to select, drag to move with the
  same wall snapping, floating rotate/edit/delete buttons
- Custom touch orbit (drag) + pinch zoom/pan, first-person walk mode
- Sun + sky lighting with soft shadows; one-tap PNG snapshots

**Catalog — 45+ parametric models** across living room, bedroom, kitchen,
bathroom, dining, office and decor/lighting, with finish palettes and 3D-
rendered thumbnails. **40+ procedural materials**: woods, parquet, tiles,
marble, brick, carpets, paints, fabrics, stone counters.

## Run it locally

```bash
npm install
npm run dev        # development server (add --host for LAN/device testing)
npm run build      # production build in dist/
npm run preview    # serve the production build
```

Deployment is automated: every push to `main` (and the active feature
branch) builds the app and publishes it to the `gh-pages` branch via
GitHub Actions (`.github/workflows/deploy.yml`).

## Architecture

```
src/
├── core/
│   ├── state.js        # project model, undo/redo, events
│   ├── projects.js     # multi-project repository (localStorage)
│   ├── geometry.js     # vector math, planar-graph room detection
│   ├── placement.js    # shared wall-snapping placement logic (2D & 3D)
│   ├── orientation.js  # landscape-first rotation + pointer mapping
│   └── textures.js     # procedural texture engine + material registry
├── catalog/
│   ├── builders.js     # primitive helpers for parametric furniture
│   └── items.js        # item definitions (3D + plan symbol + palettes)
├── editor/
│   ├── editor2d.js     # canvas floor-plan editor (touch-first)
│   └── plansymbols.js  # architectural top-view symbols
├── viewer/
│   ├── arch3d.js       # walls/floors/ceilings/openings construction
│   └── viewer3d.js     # scene, lighting, custom orbit, walk mode, 3D editing
└── ui/                 # splash/home screens, studio shell, icons, thumbnails
```

Units are centimeters throughout. The only runtime dependency is
[three.js](https://threejs.org).

## Texture attribution

The photo-scanned materials in `public/tex/` (`Blond Strip`, `Reclaimed
Pine`, `Vintage Checker`, `Carrara`, `Old Brick`) are CC0 assets from
[ambientCG](https://ambientcg.com) (WoodFloor051, WoodFloor043, Tiles074,
Marble012, Bricks090 · 1K JPG color maps). All other textures are generated
procedurally at runtime.
