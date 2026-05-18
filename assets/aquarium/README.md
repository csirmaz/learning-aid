# Aquarium Game

A lightweight, **dependency-free** 2D cartoon aquarium widget that drops into any
web page. Fish swim, react to taps and gather around food and freshly placed
decor. The player can be granted fish, items and food through a small JavaScript
API. Items can be dragged and stacked into little structures, the tank scrolls
horizontally for extra room, and the whole scene survives a page refresh.

## Tech

Pure static files — host it on any static server.

## Integration

Add a container, the stylesheet and the two scripts, then call `init()`:

```html
<link rel="stylesheet" href="aquarium-game/css/aquarium.css">

<div id="tank" style="width:100%; height:26vh;"></div>

<script src="aquarium-game/js/config.js"></script>
<script src="aquarium-game/js/aquarium.js"></script>
<script>
  var game = AquariumGame.init('tank');
</script>
```

If the game folder is not served relative to the page, pass `basePath` so the
sprite files resolve correctly (see options below).

## API

`AquariumGame.init(container, options)` returns a game **instance**. The grant
functions exist both on `AquariumGame` (acting on the most recently initialised
game) and on the returned instance (useful when several aquariums share a page).

| Function | Description |
|---|---|
| `init(container, options)` | Start a game in a DIV (element or id). Returns the instance. |
| `grantFish(type?)` | Add a fish. `type` optional; omit for a random species. Returns the type. |
| `grantItem(type?)` | Add a decor item; it drops in and settles. Returns the type. |
| `feed(count?)` | Drop food pellets (`count` 1–30, default 6) |
| `reset()` | Clear saved state and re-seed the default scene. |

```js
AquariumGame.grantFish();            // random fish
AquariumGame.grantFish('clownfish'); // specific fish
AquariumGame.grantItem('castle');    // specific item
AquariumGame.feed(10);               // ten food pellets

var a = AquariumGame.init('tank-a'); // multiple instances
a.grantFish('bluetang');
```

### Options

| Option | Default | Purpose |
|---|---|---|
| `basePath` | `''` | Path prefix for the `assets/` folder if not relative to the page. |
| `storageKey` | container id | Key used for saved state; set it to run several games independently. |
| `startEmpty` | `false` | Skip the default seeded scene and start with an empty tank. |

## Gameplay notes

- **Drag & drop** — draggable items (everything except `seaweed`) can be moved.
  Seaweed is planted and fixed. There is no inventory and items cannot be
  deleted, matching the brief.
- **Stacking** — drop one item onto another and it snaps on top; build small
  towers. Items settle with light gravity, so moving a base lets the upper
  pieces fall.
- **Fish behaviour** — fish wander, then steer towards taps, towards new or
  moved items, and towards food, which they eat. Tapping a fish makes it wiggle.
- **Scrolling** — the tank is `worldWidthFactor` (2.6) times wider than the
  container; swipe horizontally for more space. Dragging an item to an edge
  auto-scrolls.
- **Persistence** — items, their placements, the fish (with positions) and any
  food are saved to `localStorage`. State is written on every grant, on every
  drop, on a 1-second timer for fish drift, and immediately when the page is
  hidden or unloaded, so a refresh at any moment loses nothing.

## Extending

To add a new fish or item:

1. Place an SVG in `assets/` (draw fish **facing right** — the engine mirrors
   them automatically).
2. Add an entry to `js/config.js` under `fish` or `items`.

No engine changes are required. Tuning values (swim band, speeds, attraction
ranges, etc.) also live in `js/config.js`.

