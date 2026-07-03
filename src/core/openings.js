// Opening (door & window) type registry: display names, default sizes and
// which family each belongs to. Openings live on walls as
// {id, wallId, type, t, width, height, sill, flip, swing}.

export const OPENING_TYPES = [
  // doors — sill is always 0
  { id: 'door', name: 'Hinged', kind: 'door', width: 90, height: 205 },
  { id: 'double', name: 'Double', kind: 'door', width: 152, height: 205 },
  { id: 'french', name: 'French Glass', kind: 'door', width: 152, height: 205 },
  { id: 'slidingDoor', name: 'Sliding Glass', kind: 'door', width: 180, height: 205 },
  { id: 'pocket', name: 'Pocket', kind: 'door', width: 90, height: 205 },
  { id: 'garage', name: 'Garage', kind: 'door', width: 245, height: 215 },
  { id: 'doorway', name: 'Open Doorway', kind: 'door', width: 100, height: 205 },
  // windows
  { id: 'window', name: 'Standard', kind: 'window', width: 120, height: 130, sill: 90 },
  { id: 'casement', name: 'Casement', kind: 'window', width: 65, height: 135, sill: 85 },
  { id: 'slidingWindow', name: 'Slider', kind: 'window', width: 150, height: 110, sill: 95 },
  { id: 'picture', name: 'Picture', kind: 'window', width: 200, height: 150, sill: 60 }
];

export const OPENING_MAP = new Map(OPENING_TYPES.map(t => [t.id, t]));

export const isWindowType = (type) => OPENING_MAP.get(type)?.kind === 'window';

export function openingDefaults(type) {
  return OPENING_MAP.get(type) || OPENING_MAP.get('door');
}
