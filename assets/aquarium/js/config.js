/* ===========================================================================
 * config.js  --  Aquarium game catalogue & tuning.
 *
 * To add a new fish or item:
 *   1. Drop an SVG (facing RIGHT for fish) into assets/.
 *   2. Add an entry below.
 *
 *   h       fraction of the tank height (*worldHeightFactor) the sprite occupies
 *   collideHeight (optional) Use this height when calculating settling
 *   aspect  sprite width / height (so width is derived from h)
 *   speed   (fish only) cruising speed as a fraction of world width / second
 *   draggable (items only) whether the player may drag it
 * ========================================================================= */
window.AQUARIUM_CONFIG = {
  worldHeightFactor: 0.8,
  worldWidthFactor: 2.6,          // aquarium is this many container-widths wide

  fish: {
    goldfish:      { src: 'assets/fish/goldfish.svg',      h: 0.26, aspect: 1.500, speed: 0.085 },
    clownfish:     { src: 'assets/fish/clownfish.svg',     h: 0.24, aspect: 1.500, speed: 0.110 },
    bluetang:      { src: 'assets/fish/bluetang.svg',      h: 0.26, aspect: 1.500, speed: 0.095 },
    pufferfish:    { src: 'assets/fish/pufferfish.svg',    h: 0.30, aspect: 1.500, speed: 0.055 },
    babyshark:     { src: 'assets/fish/babyshark.svg',     h: 0.30, aspect: 1.625, speed: 0.125 },
    starfish:      { src: 'assets/fish/starfish.svg',      h: 0.24, aspect: 1.058, speed: 0.045 },
    yellowfish:    { src: 'assets/fish/yellowfish.svg',    h: 0.24, aspect: 1.500, speed: 0.100 },
    anglerfish:    { src: 'assets/fish/anglerfish.svg',    h: 0.28, aspect: 1.326, speed: 0.060 },
    jellyfishpink: { src: 'assets/fish/jellyfishpink.svg', h: 0.34, aspect: 0.754, speed: 0.050 },
    jellyfishblue: { src: 'assets/fish/jellyfishblue.svg', h: 0.33, aspect: 0.800, speed: 0.055 },
    babydolphin:   { src: 'assets/fish/babydolphin.svg',   h: 0.28, aspect: 1.512, speed: 0.120 },
    babyoctopus:   { src: 'assets/fish/babyoctopus.svg',   h: 0.30, aspect: 0.930, speed: 0.060 },
    babysquid:     { src: 'assets/fish/babysquid.svg',     h: 0.30, aspect: 0.750, speed: 0.085 },
    dragonfish:    { src: 'assets/fish/dragonfish.svg',    h: 0.26, aspect: 1.558, speed: 0.100 },
    crab:          { src: 'assets/fish/crab.svg',          h: 0.22, aspect: 1.404, speed: 0.055 },
    seahorse:      { src: 'assets/fish/seahorse.png', h:0.24, aspect: 400/228, speed: 0.065 },
    axolotl:       { src: 'assets/fish/axolotl.png', h:0.28, aspect: 400/207, speed: 0.080 }
  },

  items: {
    rock:          { src: 'assets/items/rock.svg',          h: 0.22, aspect: 1.354, draggable: true  },
    chest:         { src: 'assets/items/chest.svg',         h: 0.22, aspect: 1.160, draggable: true  },
    castle:        { src: 'assets/items/castle.svg',        h: 0.36, aspect: 1.364, draggable: true  },
    coral:         { src: 'assets/items/coral.svg',         h: 0.30, aspect: 0.897, draggable: true  },
    seaweed:       { src: 'assets/items/seaweed.svg',       h: 0.46, aspect: 0.600, draggable: true },
    chestopen:     { src: 'assets/items/chestopen.svg',     h: 0.26, aspect: 1.089, draggable: true  },
    blockarch:     { src: 'assets/items/blockarch.svg',     h: 0.4, aspect: 1.146, draggable: true  },
    shipwreck:     { src: 'assets/items/shipwreck.svg',     h: 0.48, aspect: 1.357, draggable: true  },
    coralfan:      { src: 'assets/items/coralfan.svg',      h: 0.34, aspect: 0.918, draggable: true  },
    coralbrain:    { src: 'assets/items/coralbrain.svg',    h: 0.24, aspect: 1.304, draggable: true  },
    coralstaghorn: { src: 'assets/items/coralstaghorn.svg', h: 0.36, aspect: 0.889, draggable: true  },
    rockfeature:   { src: 'assets/items/rockfeature.svg',   h: 0.38, aspect: 1.246, draggable: true  },
    planttall:     { src: 'assets/items/planttall.svg',     h: 0.46, aspect: 0.563, draggable: true },
    plantbushy:    { src: 'assets/items/plantbushy.svg',    h: 0.30, aspect: 1.098, draggable: true },
    plantfern:     { src: 'assets/items/plantfern.svg',     h: 0.38, aspect: 0.762, draggable: true },
    submarine:     { src: 'assets/items/submarine.svg',     h: 0.40, aspect: 1.483, draggable: true  },
    spongecube:    { src: 'assets/items/spongecube.svg',    h: 0.24, aspect: 0.960, draggable: true  },
    houseshell:    { src: 'assets/items/houseshell.svg',    h: 0.42, aspect: 0.889, draggable: true  },
    houseporthole: { src: 'assets/items/houseporthole.svg', h: 0.42, aspect: 0.984, draggable: true  },
    fossilbones:   { src: 'assets/items/fossilbones.svg',   h: 0.28, aspect: 1.479, draggable: true, collideHeight: 0.13  }
  },

  food: { src: 'assets/misc/food.svg', h: 0.055, aspect: 1 },

  /* Behaviour tuning. Fractions are of world width (x) or height (y). */
  tuning: {
    fishSpeedBase: 500,
    fishCeil:    0.10,   // fish do not swim above this
    fishFloor:   0.90,   // ... nor below this
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

try {
  if(local_hook_has('aquarium_fish')) {
    Object.assign(window.AQUARIUM_CONFIG.fish, bee_local.aquarium_fish);
  }
  if(local_hook_has('aquarium_items')) {
    Object.assign(window.AQUARIUM_CONFIG.items, bee_local.aquarium_items);
  }
} catch(e) {
  console.error("Aquarium config", e);
}
