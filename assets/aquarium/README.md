# Aquarium Game

A lightweight, **dependency-free** 2D cartoon aquarium widget that drops into any
web page. Fish swim, react to taps and gather around food and freshly placed
decor. The player can be granted fish, items and food through a small JavaScript
API. Items can be dragged and stacked into little structures, the tank scrolls
horizontally for extra room, and the whole scene survives a page refresh.

## File tree

```
aquarium-game/
  index.html            Demo page (the widget embedded in a sample app)
  css/aquarium.css      Game styles, scoped under .aq-root
  js/config.js          Asset catalogue + tuning constants  -> window.AQ_CONFIG
  js/aquarium.js         Engine                              -> window.AquariumGame
  assets/fish/*.svg      Fish sprites      (one file each)
  assets/items/*.svg     Decor item sprites (one file each)
  assets/misc/food.svg   Food pellet sprite
  README.md
```

Every sprite is a separate static file, so adding content is a two-step,
code-free change (see *Extending* below).

## Tech

Pure static files — no Node.js, no build step, no server-side logic. The engine
is plain JavaScript with **no external libraries** (jQuery is permitted by the
brief but not needed). Host it on any static server.

### Running it (important for mobile / Android)

Desktop browsers will open `index.html` directly from disk (a `file://` URL),
but **mobile Chrome and Vivaldi on Android refuse to render local `file://`
pages**, so the demo looks blank there. This is an Android browser restriction,
not a fault in the game. Serve the folder over HTTP and it works on every
device. Any static server will do, for example from the project folder:

```
python3 -m http.server 8000      # then open http://<computer-ip>:8000/
```

When the widget is embedded in a real web page (its intended use), that page is
already served over HTTP, so this concern does not arise.

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

The widget fills its container, so size the container however you like — the
brief targets mobile portrait, full width, roughly a quarter of the screen
height (`height: 26vh`).

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
| `feed(count?)` | Drop food pellets (`count` 1–30, default 6). Alias: `grantFood`. |
| `reset()` | Clear saved state and re-seed the default scene. |

```js
AquariumGame.grantFish();            // random fish
AquariumGame.grantFish('clownfish'); // specific fish
AquariumGame.grantItem('castle');    // specific item
AquariumGame.feed(10);               // ten food pellets

var a = AquariumGame.init('tank-a'); // multiple instances
a.grantFish('bluetang');
```

Built-in types — fish: `goldfish`, `clownfish`, `bluetang`, `pufferfish`;
items: `rock`, `chest`, `castle`, `coral`, `seaweed`.

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

## Assets & licensing

The bundled SVG sprites were created originally for this project and are placed
in the **public domain (CC0)** — use, modify and redistribute them freely.

Because each sprite is an independent file, they can be swapped for any other
art without touching the engine. A recommended open-source, **CC0-licensed**
drop-in source of cartoon fish art is Kenney's *Fish Pack*
(<https://kenney.nl/assets/fish-pack>) — 120 assets, free, and CC0 means no
attribution is required. To use it, export the sprites you want, drop them into
`assets/`, and point the `src` fields in `config.js` at the new files.
