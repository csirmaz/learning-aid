/* ===========================================================================
 * config.js  --  Aquarium game catalogue & tuning.
 *
 * To add a new fish or item:
 *   1. Drop an SVG (facing RIGHT for fish) into assets/.
 *   2. Add an entry below.
 *
 *   h       fraction of the tank HEIGHT the sprite occupies
 *   aspect  sprite width / height (so width is derived from h)
 *   speed   (fish only) cruising speed as a fraction of world width / second
 *   draggable (items only) whether the player may drag it
 * ========================================================================= */
window.AQ_CONFIG = {
  storagePrefix: 'aquariumGame.v1',
  worldWidthFactor: 2.6,          // aquarium is this many container-widths wide

  fish: {
    goldfish:   { src: 'assets/fish/goldfish.svg',   h: 0.26, aspect: 1.50, speed: 0.085 },
    clownfish:  { src: 'assets/fish/clownfish.svg',  h: 0.24, aspect: 1.50, speed: 0.110 },
    bluetang:   { src: 'assets/fish/bluetang.svg',   h: 0.26, aspect: 1.50, speed: 0.095 },
    pufferfish: { src: 'assets/fish/pufferfish.svg', h: 0.30, aspect: 1.50, speed: 0.055 }
  },

  items: {
    rock:    { src: 'assets/items/rock.svg',    h: 0.22, aspect: 1.354, draggable: true  },
    chest:   { src: 'assets/items/chest.svg',   h: 0.22, aspect: 1.160, draggable: true  },
    castle:  { src: 'assets/items/castle.svg',  h: 0.36, aspect: 1.364, draggable: true  },
    coral:   { src: 'assets/items/coral.svg',   h: 0.30, aspect: 0.897, draggable: true  },
    seaweed: { src: 'assets/items/seaweed.svg', h: 0.46, aspect: 0.600, draggable: true }
  },

  food: { src: 'assets/misc/food.svg', h: 0.055, aspect: 1 },

  /* Behaviour tuning. Fractions are of world width (x) or height (y). */
  tuning: {
    fishSpeedBase: 800,
    fishCeil:    0.10,   // fish do not swim above this
    fishFloor:   0.80,   // ... nor below this
    itemRest:    0.90,   // an item's base settles here on the sand
    dragFloor:   0.87,   // lowest an item's base may be dragged
    turnRate:    3.2,    // how briskly a fish swings towards its goal
    bob:         0.16,   // gentle vertical sine amplitude for fish
    sepGain:     0.95,   // how briskly fish nudge apart to avoid overlapping
    lureTtl:     3.6,    // seconds a tap "lure" attracts fish
    itemTtl:     4.2,    // seconds a new/moved item attracts fish
    attractRange:0.42,   // a fish notices an attractor within this range
    foodRange:   0.55,   // ... and notices food within this range
    seekBoost:   1.7,    // speed multiplier when chasing food/attractors
    eatDist:     0.075,  // distance at which a fish eats a pellet
    foodSink:    0.14,   // pellet sink speed
    foodRestLife:8,      // seconds a settled pellet lingers before fading
    itemFall:    1.3,    // item settle/fall speed
    saveEvery:   5.0     // throttle (s) for background fish-position saves
  }
};
