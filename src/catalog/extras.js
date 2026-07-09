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
import { BATHROOM_ITEMS } from './packs/bathroom.js';
import { KITCHEN_ITEMS } from './packs/kitchen.js';
import { LIVINGROOM_ITEMS } from './packs/livingroom.js';
import { DECKS_ITEMS } from './packs/decks.js';
import { FARM_ITEMS } from './packs/farm.js';
import { FENCING_ITEMS } from './packs/fencing.js';
import { UTILITY_ITEMS } from './packs/utility.js';
import { FRAMES_ITEMS } from './packs/frames.js';
import { CABINET_ITEMS } from './packs/cabinets.js';
import { PATHSPADS_ITEMS } from './packs/pathspads.js';
import { PORCH_ITEMS } from './packs/porch.js';
import { OUTDOORPLUS_ITEMS } from './packs/outdoorplus.js';
import { GARDEN_ITEMS } from './packs/garden.js';
import { SIGNS2_ITEMS } from './packs/signs2.js';
import { BEDROOM2_ITEMS } from './packs/bedroom2.js';
import { WORKDINE_ITEMS } from './packs/workdine.js';
import { STRUCTURE2_ITEMS } from './packs/structure2.js';

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
  ...tag(DECKS_ITEMS, 'patio'),          // backyard decks & railings
  ...tag(STRUCTURES_ITEMS, 'yard'),      // structures & garden
  ...tag(FENCING_ITEMS, 'yard'),          // fences & gates
  ...BATHROOM_ITEMS,                      // 'bathroom' (luxury bath, as authored)
  ...KITCHEN_ITEMS,                       // 'kitchen' (luxury kitchen, as authored)
  ...LIVINGROOM_ITEMS,                    // 'living' (luxury living room, as authored)
  ...FARM_ITEMS,                          // 'farm' — animals & homestead
  ...UTILITY_ITEMS,                       // 'utility' — laundry, mudroom & wash
  ...FRAMES_ITEMS,                        // 'decor' — photo frames & signs
  ...CABINET_ITEMS,                       // 'kitchen'/'dining'/'bathroom' — cabinetry
  ...PATHSPADS_ITEMS,                     // 'paths' — drawable paths & drag-to-size pads
  ...PORCH_ITEMS,                         // 'porch' — columns, railings, swings, lanterns
  ...OUTDOORPLUS_ITEMS,                   // 'yard' — play, garden & backyard living extras
  ...tag(GARDEN_ITEMS, 'garden'),         // flowers, garden beds & showpiece trees
  ...SIGNS2_ITEMS,                        // 'decor' — customizable text signs
  ...tag(BEDROOM2_ITEMS, 'bedroom'),      // bedroom furniture
  ...WORKDINE_ITEMS,                      // 'office' / 'dining' (as authored)
  ...tag(STRUCTURE2_ITEMS, 'structure')   // garages, sheds & outbuildings
];
