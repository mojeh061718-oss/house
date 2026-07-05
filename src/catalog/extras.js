// Aggregated "extra" content packs (v2.22.0): 150+ modern / fun / outdoor
// assets authored in src/catalog/packs/*. items.js spreads EXTRA_ITEMS into
// ITEMS so they register like any built-in item (catalog, thumbnails, 3D).
import { GAMES_ITEMS } from './packs/games.js';
import { DECOR_ITEMS } from './packs/decor.js';
import { POOLSIDE_ITEMS } from './packs/poolside.js';
import { POOLS_ITEMS } from './packs/pools.js';
import { WATER_ITEMS } from './packs/water.js';
import { DOCKS_ITEMS } from './packs/docks.js';
import { LOUNGE_ITEMS } from './packs/lounge.js';
import { STRUCTURES_ITEMS } from './packs/structures.js';

export const EXTRA_ITEMS = [
  ...GAMES_ITEMS,
  ...DECOR_ITEMS,
  ...POOLSIDE_ITEMS,
  ...POOLS_ITEMS,
  ...WATER_ITEMS,
  ...DOCKS_ITEMS,
  ...LOUNGE_ITEMS,
  ...STRUCTURES_ITEMS
];
