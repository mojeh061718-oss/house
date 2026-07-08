// Plan summary: turns the project into the numbers a homeowner or contractor
// asks for first — wall footage, door/window counts, floor area per room.
// Everything is derived live from the store's data; nothing is persisted.
import { detectRooms, wallLength, polygonArea } from './geometry.js';
import { isDoorType } from './openings.js';

/**
 * Summarize every level of a project.
 * Lengths in cm, areas in cm² (callers format with fmtLen/fmtArea).
 */
export function planSummary(project) {
  const exteriorMin = (project.settings?.exteriorThickness ?? 20) - 0.5;
  const levels = project.levels.map((lvl, i) => {
    const walls = lvl.walls || [];
    const openings = lvl.openings || [];
    const items = lvl.items || [];
    const rooms = detectRooms(walls);

    let wallRun = 0, extRun = 0;
    for (const w of walls) {
      const len = wallLength(w);
      wallRun += len;
      if ((w.thickness ?? 12) >= exteriorMin) extRun += len;
    }
    // wall face area (both sides of every wall) — what you'd paint
    const wallH = project.settings?.wallHeight ?? 260;
    const paintArea = wallRun * wallH * 2;

    const doors = openings.filter(o => isDoorType(o.type) && o.type !== 'gap').length;
    const windows = openings.filter(o => !isDoorType(o.type)).length;

    const roomRows = rooms.map(r => ({
      key: r.key,
      name: (lvl.roomStyles || {})[r.key]?.name || '',
      area: Math.abs(polygonArea(r.polygon))
    })).sort((a, b) => b.area - a.area);
    const floorArea = roomRows.reduce((s, r) => s + r.area, 0);

    return {
      index: i,
      wallRun, extRun, intRun: wallRun - extRun, paintArea,
      doors, windows,
      rooms: roomRows, floorArea,
      itemCount: items.length
    };
  });

  const sum = (k) => levels.reduce((s, l) => s + l[k], 0);
  return {
    levels,
    totals: {
      wallRun: sum('wallRun'),
      extRun: sum('extRun'),
      intRun: sum('intRun'),
      paintArea: sum('paintArea'),
      doors: sum('doors'),
      windows: sum('windows'),
      floorArea: sum('floorArea'),
      rooms: levels.reduce((s, l) => s + l.rooms.length, 0),
      items: sum('itemCount')
    }
  };
}
