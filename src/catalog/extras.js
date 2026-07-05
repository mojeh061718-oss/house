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

// Assign each pack to a finer catalog category so the "Outdoor" tab isn't one
// giant broad bucket. (Games & Decor keep the categories their authors set.)
const tag = (arr, cat) => arr.map(d => ({ ...d, cat }));

export const EXTRA_ITEMS = [
  ...GAMES_ITEMS,                        // 'games'
  ...DECOR_ITEMS,                        // 'decor' / 'living' (as authored)
  ...tag(POOLSIDE_ITEMS, 'pools'),       // poolside gear & floats
  ...tag(POOLS_ITEMS, 'pools'),          // pools & spas
  ...tag(WATER_ITEMS, 'water'),          // ponds & fountains
  ...tag(DOCKS_ITEMS, 'waterfront'),     // docks & boats
  ...tag(LOUNGE_ITEMS, 'patio'),         // outdoor lounge & entertainment
  ...tag(STRUCTURES_ITEMS, 'yard')       // structures & garden
];
