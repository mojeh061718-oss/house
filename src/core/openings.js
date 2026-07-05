// Registry of door and window types. Openings are stored as
// {id, wallId, type, t, width, height, sill, flip, swing}; `type` picks a
// renderer in editor2d (plan symbol) and arch3d (3D model).

export const OPENING_TYPES = [
  // doors
  { id: 'door',         kind: 'door', name: 'Hinged',      width: 90,  height: 205, sill: 0 },
  { id: 'double_door',  kind: 'door', name: 'Double',      width: 160, height: 205, sill: 0 },
  { id: 'french_door',  kind: 'door', name: 'French Glass', width: 150, height: 205, sill: 0 },
  { id: 'slidingDoor',  kind: 'door', name: 'Sliding Glass', width: 180, height: 205, sill: 0 },
  { id: 'pocket_door',  kind: 'door', name: 'Pocket',      width: 90,  height: 205, sill: 0 },
  { id: 'doorway',      kind: 'door', name: 'Open Doorway', width: 100, height: 205, sill: 0 },
  { id: 'entry_sidelights', kind: 'door', name: 'Entry + Sidelights', width: 190, height: 215, sill: 0 },
  { id: 'craftsman_door',   kind: 'door', name: 'Craftsman Entry',    width: 100, height: 210, sill: 0 },
  { id: 'garage_door',  kind: 'door', name: 'Garage',      width: 250, height: 215, sill: 0 },
  // a plain cut in the wall — a full-height opening with no frame or leaf,
  // placed by the Cut tool. Hidden from the door/window style pickers.
  { id: 'gap',          kind: 'door', name: 'Cut Opening',  width: 120, height: 210, sill: 0, hidden: true },
  // windows
  { id: 'window',           kind: 'window', name: 'Standard', width: 120, height: 130, sill: 90 },
  { id: 'window_picture',   kind: 'window', name: 'Picture',  width: 210, height: 160, sill: 60 },
  { id: 'window_sliding',   kind: 'window', name: 'Sliding',  width: 150, height: 120, sill: 90 },
  { id: 'window_casement',  kind: 'window', name: 'Casement', width: 80,  height: 130, sill: 90 },
  { id: 'window_double_hung', kind: 'window', name: 'Double-Hung', width: 100, height: 150, sill: 80 },
  { id: 'window_arched',    kind: 'window', name: 'Arched',    width: 110, height: 170, sill: 80 },
  { id: 'window_bay',       kind: 'window', name: 'Bay',      width: 220, height: 150, sill: 55 }
];

export const OPENING_MAP = new Map(OPENING_TYPES.map(t => [t.id, t]));

export function isDoorType(type) {
  const def = OPENING_MAP.get(type);
  return def ? def.kind === 'door' : type !== 'window';
}

/** Default width/height/sill for an opening type. */
export function openingDefaults(type) {
  return OPENING_MAP.get(type) || OPENING_MAP.get(isDoorType(type) ? 'door' : 'window');
}
