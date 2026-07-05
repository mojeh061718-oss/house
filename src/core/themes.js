// One-tap style themes: re-material the whole home coherently.
import { ITEM_MAP } from '../catalog/items.js';
import { pointInPolygon } from './geometry.js';

export const THEMES = [
  {
    id: 'warm', name: 'Warm Wood', chips: ['#b58a5c', '#ece7dd'],
    floor: 'oak', wall: 'paint_warmwhite', bathFloor: 'tile_beige', bathWall: 'tile_bath',
    fabric: 1, wood: 0
  },
  {
    id: 'scandi', name: 'Scandinavian', chips: ['#cfc2b0', '#f2f2ef'],
    floor: 'ash_gray', wall: 'paint_offwhite', bathFloor: 'tile_white', bathWall: 'tile_bath',
    fabric: 0, wood: 2
  },
  {
    id: 'modern', name: 'Modern Dark', chips: ['#6e4a30', '#4a4c50'],
    floor: 'walnut', wall: 'paint_charcoal', bathFloor: 'tile_gray', bathWall: 'tile_bath',
    fabric: 0, wood: 3
  },
  {
    id: 'coastal', name: 'Coastal', chips: ['#c99a5f', '#b8cad6'],
    floor: 'honey_pine', wall: 'paint_sky', bathFloor: 'tile_white', bathWall: 'tile_bath',
    fabric: 2, wood: 2
  },
  {
    id: 'classic', name: 'Classic Luxe', chips: ['#a97e4f', '#d3ccbf'],
    floor: 'parquet', wall: 'paint_greige', bathFloor: 'tile_checker', bathWall: 'tile_bath',
    fabric: 1, wood: 1
  },
  {
    id: 'sage', name: 'Garden Sage', chips: ['#b6c2ab', '#b58a5c'],
    floor: 'oak', wall: 'paint_sage', bathFloor: 'tile_white', bathWall: 'tile_bath',
    fabric: 3, wood: 0
  }
];

/** Apply a theme to every room and every recolorable item. */
export function applyTheme(project, theme) {
  project.settings.defaultFloor = theme.floor;
  project.settings.defaultWall = theme.wall;
  for (const style of Object.values(project.roomStyles)) {
    const isBath = /bath|shower|wc/i.test(style.name || '');
    style.floor = isBath ? theme.bathFloor : theme.floor;
    style.wall = isBath ? theme.bathWall : theme.wall;
  }
  for (const it of project.items) {
    const def = ITEM_MAP.get(it.defId);
    const first = def?.palettes?.[0];
    if (!first) continue;
    if (first.fabric) it.palette = Math.min(theme.fabric, def.palettes.length - 1);
    else if (first.wood) it.palette = Math.min(theme.wood, def.palettes.length - 1);
  }
}

/** Apply a coordinated style to a SINGLE room: its floor + wall finish and the
 *  finish of every piece of furniture standing inside it. The premium
 *  "design this room" flow — restyle one space without touching the rest. */
export function applyThemeToRoom(store, roomKey, theme) {
  const style = store.roomStyle(roomKey);
  const isBath = /bath|shower|wc|powder/i.test(style.name || '');
  style.floor = isBath ? theme.bathFloor : theme.floor;
  style.wall = isBath ? theme.bathWall : theme.wall;
  const room = store.room(roomKey);
  if (!room) return;
  for (const it of store.project.items) {
    if ((it.elevation || 0) >= 200) continue;              // roofs etc. aren't the room's
    if (!pointInPolygon(it.x, it.y, room.polygon)) continue;
    const def = ITEM_MAP.get(it.defId);
    const first = def?.palettes?.[0];
    if (!first) continue;
    if (first.fabric) it.palette = Math.min(theme.fabric, def.palettes.length - 1);
    else if (first.wood) it.palette = Math.min(theme.wood, def.palettes.length - 1);
  }
}
