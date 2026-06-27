# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`learning-aid` is a set of static web-based tools for KS1/KS2 children (ages 5+) to practise spelling and arithmetic. The apps are:

- **`spellbee.html`** — spelling game with an on-screen keyboard, phonics-based word list, and TTS pronunciation
- **`count.html`** — arithmetic game with an on-screen numeric keypad
- **`videolearn.html`** — a minimal app that plays a single learning video for the URL-named player and then dismisses the host webview (no questions, score or keyboard); see the architecture note below

All apps are vanilla JS + jQuery, require no build step, and can be served from any static web server.

## Agent knowledge files

Deeper references live under `agent/` and are loaded on demand — read the relevant one before working in that area:

- [`agent/question-cycle.md`](agent/question-cycle.md) — the question→answer→reward→next play loop: the shared `success_common()` reward step, per-app `new_question()` selection, the anti-cheat / spaced-repetition queue, count problem generators, and puzzle-mode sessions.
- [`agent/spellbee-content.md`](agent/spellbee-content.md) — the `spellbee.html` word-list entry format, image-ref forms, phonics class tags, MP3 resolution, and long-format story authoring mechanics.

## Running Locally

No build step. Serve the root directory with any HTTP server, for example:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/
```

## Bumping the Version

All cache-busting query strings (`?411`) on JS/CSS includes and the `bee_app_version` constant in `assets/common.js` are managed together by:

```bash
perl tools/update_version.pl
```

Run this before deploying after any change to `common.js`, `common.css`, or the aquarium files.

## Generating TTS Audio

Word pronunciations are served as pre-generated MP3s from `assets/sounds/words/`. To generate any missing files using the Kokoro TTS model:

```bash
# First-time setup (from tools/tts/)
pyenv local 3.12.9
python -m venv ~/pythonenvs/tts
. ~/pythonenvs/tts/bin/activate
pip install kokoro soundfile

# Generate missing files
cd tools/tts
. ~/pythonenvs/tts/bin/activate
python make_speech.py
```

The script reads all word entries from `spellbee.html`, derives the expected filename (`assets/sounds/words/<phrase>.mp3`), and only generates files that are absent. If a word is in the `avoid_tts()` list the model handles it poorly — add entries there as needed.

## Architecture

### Shared infrastructure (`assets/common.js` + `assets/common.css`)

Both `spellbee.html` and `count.html` embed the common stylesheet and script inline via `<link>` / `<script src>` tags. `common.js` provides:

- **Score & reward system** — `add_score()`, `update_score_ui()`, `success_common(options)` (call this when any question is answered correctly; it handles scoring, gifts, periodic celebrations, video rewards, and advances to the next question). Full play-loop detail is in [`agent/question-cycle.md`](agent/question-cycle.md).
- **Gift system** — `decide_gift()` / `give_gift()` / `present_gift()` / `render_gift()`; gifts are indexed and players' awarded-gift arrays are stored by index, so index order must never change. A gift is normally an image, but an entry may be a **code-gift** object `{user, code}` — `gift_code_data()` detects it and `render_gift()` / `present_gift()` show the code (header "Farm game code" + the code in large text) instead of an image. Code gifts are user-specific and are only handed out through an optional gift-selection hook (the engine's random fallback skips them).
- **Audio** — `playme(key)` for named sounds, `play_rnd_sound(key)` for randomly picked sounds from a list, `play_success_sound()`, `toggle_play_music(ix)`
- **Video overlay** — `play_video(callback)` plays a reward video full-screen, returns `false` if a video was started
- **Confetti** — `show_animation(callback)` via the bundled `JSConfetti`
- **TTS** — `bee_tts` object; preference order: local English GB voice > other English voices > fail; call `bee_tts.speak(str, callback)`
- **In-page dialogs** — `bee_alert(msg, callback)` / `bee_prompt(msg, callback, default_value)` replace native `alert()` / `prompt()` (the natives are suppressed in some embedded webviews). They build all their DOM and styling inline (no markup in the HTML files, no rules in `common.css`), pin the box near the top-left over a full-viewport overlay so it works at any screen size, and remove themselves from the DOM on dismissal. **They are asynchronous** — a modal cannot block JS — so the result is delivered via callback rather than returned: `bee_prompt` calls `callback(value)` (the string on OK, `null` on Cancel, matching native `prompt()`); `bee_alert` calls the optional `callback()` once dismissed. Do not reintroduce native `alert()`/`prompt()`. Because they are async, any caller that consumed a return value had to be restructured into a callback (see **Startup & player selection**).
- **Aquarium bridge** — `bee_aquarium` object; active only when `bee.app_name == 'spellbee'`
- **Persistence, startup & hook plumbing** — `local_hook_has()` / `call_local_hook()` (the optional-hook mechanism), the data load (`load_local_data()`), `save_storage(msg, callback)`, and the `bootstrap()` entry point. See **Persistence** and **Startup & player selection** below.

### Persistence

All player state is in `bee.storage` (an object with a `players` sub-object). `save_storage(msg, callback)` (in `common.js`) serialises it to `localStorage[bee.app_name]`, then notifies an optional save hook if one is registered (via `call_local_hook`); `msg` is a debug label and `callback(success)` (optional) fires with a boolean when the save completes (`true` on success or when no hook is registered, `false` if the hooked save failed).

The aquarium widget keeps its **own** state under a separate `localStorage` key (`'Aquarium:'+app+':'+player`, returned by `bee_aquarium.get_storage_key(player)`), distinct from `bee.storage`. Any code that persists or restores it must use the same `get_storage_key()` helper — do not reintroduce a stored `bee_aquarium.storage_key` property.

### Startup & player selection (`bootstrap()`)

Both HTML files end with `<script> bootstrap(); </script>` (after every other script has loaded), so `bootstrap()` in `common.js` is the single entry point. The per-app inline script supplies two helpers `bootstrap()` calls: `init_player_data(callback)` (creates a fresh `bee.storage.players[bee.player]` in the app-specific shape) and `main()` (starts gameplay once a player is chosen). `init_player_data` is **asynchronous** — it prompts the user for the starting word/problem range via `bee_prompt` (through the per-app `choose_wordsets(cb)` / `choose_problemset(cb)` helpers, which are likewise callback-based) — so it takes an optional completion `callback` that fires once the player record exists; `bootstrap()` waits on it before continuing.

Two paths:

- **URL player / puzzle mode** — if the URL carries `?player=<name>` (`get_player_from_url()`) *and* an optional server-backed data-load hook is present, the menu is skipped: `bee.player` is set, `bee.is_puzzle = {needs: bee.puzzle_needs}` is marked, and the player record is loaded and refreshed before play. This is the embedding used by an external **puzzle alerter** host: each correct answer's `add_score` save-callback decrements `bee.is_puzzle.needs`, and at zero `dismiss_puzzle_alert()` calls `window.PuzzleAlerter.solved()`.
- **Regular menu** — otherwise it renders "Choose player" / "New user" buttons from `bee.storage.players`; selecting (or creating, via `init_player_data()`) a player then refreshes it through the optional data-load hook (when present) before calling `main()`.

> Startup blocks on the backend **by design**: when the data-load hook is present, `bootstrap()` waits for it and will not proceed unless the load is confirmed, so a backend failure strands the page on "Loading…" rather than risk running with stale/wrong data. This path is only reachable when the optional data-load hook is registered; without it, the app always uses the regular menu and browser-local data.

### `spellbee.html` — word list format

Words live between `// [WORDS START]` and `// [WORDS END]` comments as pipe-delimited `"level|image_ref|text|class"` strings; angle-bracket regions `<word>` in the text mark what the child must type, and entries whose level is `≥ MIN_LONGSTORY_LEVEL` form multi-prompt **long stories** keyed by the level number. The full entry format, image-ref forms, phonics class tags, MP3 resolution, and long-story authoring mechanics are in [`agent/spellbee-content.md`](agent/spellbee-content.md).

### `count.html` — problem generators

Arithmetic problems are produced by generator functions in the `PRBL` object, chosen via `PROBLEMSETS` (a difficulty index → weighted generator list); each returns a `{problem, solution, hint}` object. The generators, the `hint` object's fields, and the full play loop are in [`agent/question-cycle.md`](agent/question-cycle.md).

### `videolearn.html` — play one video and dismiss

A deliberately tiny app: it shows a single learning video to the URL-named player, then dismisses the host webview. There are no questions, scoring, gifts, keyboard or aquarium.

- **Autostart.** Its `bee` config sets `no_welcome: true`. `bootstrap()` honours that flag (when a `?player=` is present) by skipping the welcome screen, session sound and start button entirely — it loads the player's data (from the server when that hook is available, else browser-local), ensures a player record exists via the app's non-interactive `init_player_data()`, and goes straight into `main()`.
- **Video selection.** `main()` calls the shared `play_video(callback, video_list)` with its own catalogue, `learn_videos`. That catalogue starts empty and is extended by the local layer the same way the reward `videos` list is. `play_video` was generalised to take an optional `video_list` (defaulting to the reward `videos`): it picks a video the player hasn't seen, records it in the player's `videos_seen` (persisted by `save_storage`, so the server keeps the history too), and once all are seen re-enables the earliest-seen ones — the same rotation the reward videos use. The reward-video override hook is only consulted for the default reward catalogue.
- **Dismissal.** The `play_video` callback (and an immediate call when no video is available) is `dismiss_puzzle_alert()`, so the host webview is dismissed when the video ends or if there is nothing to play.

### Aquarium (`assets/aquarium/`)

A self-contained, dependency-free widget. Integrated into `spellbee.html` only. Fish and items are defined entirely in `assets/aquarium/js/config.js` — adding a new species requires only an SVG in `assets/aquarium/assets/` and a config entry; no engine changes needed. The `bee_aquarium` bridge in `common.js` exposes `grant_fish()`, `grant_item()`, `feed()`, `award_food()` and tracks bridge-side state inside `bee.storage.players[player].aquarium_data`. `bee_aquarium.init_game()` (called from `main()`, after the player's data has loaded) instantiates the widget with `storageKey = bee_aquarium.get_storage_key()`; the widget persists its own fish/items/food to that `localStorage` key, which is separate from `bee.storage`. Because `init_game()` is what creates `bee_aquarium.game`, `feed()`/`grant_fish()`/`grant_item()` throw if it was never called.
