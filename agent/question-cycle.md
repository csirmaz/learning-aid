# Question cycle — play loop across `spellbee.html` and `count.html`

How the play loop works across files. The **reward** half is shared (`assets/common.js`); the **selection** half is per-app (`new_question()` defined inside each HTML file). On a correct answer the app calls the shared `success_common(options)`, which does scoring / gifts / celebration / video and then re-triggers the app's own `new_question(reason)` via callbacks — so the cycle bounces `common.js` ↔ HTML. `reason` is just a debug label threaded through. (Note the numeric-suffix naming convention for internal helpers: `try_get_new_word10`, `store_question11`, `start_question14`, `choose_using_levels20`, `known_score_to_choice20`.)

## Shared reward step — `success_common(options)` (`common.js` ~831)

Returns one of `'level_complete' | 'gift' | 'period_negative' | 'period' | 'default'`. Calls `add_score()` (returns the new score or the sentinel `'_SKIPPED_'`), `decide_gift()`, `update_score_ui()`, then picks ONE outcome and schedules the next question inside that branch. `options.skip_this_score:true` and `options.fast_to_next_question:true` are the two knobs. `bee.score_goal` correct answers make one "level"; `celebrate_period` is 4 when `score_goal` is small, otherwise 5. Periodic "bigger" celebrations (video) land at fixed period indices (see the ASCII chart in the function). Level-complete = `score % score_goal == 0`.

## Anti-cheat / spaced-repetition queue (both apps)

Each app persists the pending question(s) so a page refresh can't skip a hard one. `new_question()` always drains the queue/store first before generating anything new.

- **spellbee:** `scheduled_questions` array via `get_question_queue` / `store_question11` / `get_first_on_queue` / `queue_success` / `reschedule_question` / `purge_question_queue`.
- **count:** `bee.queued_problems` (a real multi-element array, NOT just one problem), persisted whole as the `current_question` blob via `store_question` / `get_question_from_store`.

## spellbee selection (`new_question` ~2000)

If the queue is empty, pick a first word with `try_get_new_word10(undefined)`. Two modes:

- **(a) long-story** — if the chosen word's level ≥ `MIN_LONGSTORY_LEVEL`, queue every consecutive fragment of that same level in order (see `agent/spellbee-content.md`).
- **(b) normal** — pick one of the word's phonics classes at random and queue up to ~7 words from that class (`bee.class_to_ix`).

Word weighting: `choose_using_levels20` weights by `1.5^(-level)` (easier/lower levels favoured). `known_score_to_choice20` probabilistically *rejects* already-known words (typed without help; tracked in `pstore.known_words`). On success, `outcome` is derived from `help_asked` + `backspace_used` → `ADD_KNOWN` (mark known, advance), `OK` (advance), or `ASK_ONCE`/`ASK_ALL` (`reschedule_question` re-inserts the word ~3 slots later, optionally with a reveal — spaced repetition; skipped for long-story levels). Repeats pass `skip_this_score:true`.

## count selection (`new_question` ~1169)

Arithmetic problems come from generator functions in the **`PRBL`** object, each named for the problem it produces (e.g. `PRBL.add_teen_plus_single_digit`, `PRBL.multiply_three_consecutive`, `PRBL.times_table_set`). **`PROBLEMSETS`** maps a difficulty index (0/1/2) to a weighted list of `[generator, weight]`.

If the queue is empty: when `problemset >= 100` use multiplication tables (`PRBL.times_table_set`), else pick a generator from `PROBLEMSETS[problemset]`. A generator returns either a single `{problem, solution, hint}` OR `{type:'problem_list', problems:[…]}` — in the latter case `new_question` loads `new_prob.problems` straight into `bee.queued_problems` and they are asked in order (`bee.queued_problems[0]` each round, `end_question` shifts the front off). So count multi-problem sessions (e.g. a multi-step problem) are driven entirely through this queue.

Correct → `end_question('success')` then `success_common`. Wrong → if `use_timeout`, `end_question('failed')` (shows solution, `add_negative_score(2)`, re-queues the same problem now + again ~2 slots later, auto-advances after a delay); else `penalty_delay` and retry in place. `negative_score` makes `add_score` return `'_SKIPPED_'` (no score gained) for that many future correct answers — it *lengthens* the current level as a penalty.

The `hint` object passed to `show_help()` can contain: `speak_prompt`, `speak_solution`, `speak_failed`, `help_speech`, `range` (renders a number grid), `groups` (renders a multiplication dot-matrix), `longform`, `help_txt`.

## Puzzle mode — a short, self-dismissing session (`bee.is_puzzle`)

This is the puzzle-alerter embedding (a host webview opens the app at `?player=<name>` to make the child solve a few problems, then closes itself). Entered in `bootstrap()` (`common.js`) only when the URL has `?player=<name>` **and** a server-backed data-load hook is present: it sets `bee.is_puzzle = {needs: bee.puzzle_needs}` (a small per-app constant defined in each HTML file), skips the Choose-player menu, loads the player record (refreshing from the backend when available), and shows a single "Let's earn some coins!" start button. The session has a fixed target of correct answers and ends automatically once met.

- **Countdown:** `add_score()` does `bee.is_puzzle.needs--` on every correct answer while `is_puzzle` is set — `add_score` only runs on a correct answer, so this includes repeats and answers skipped by the negative-score penalty. This is deliberate: it keeps the session a fixed length so wrong or repeat answers can't lengthen the puzzle (a wrong answer only costs re-answering the missed question, since wrong answers don't call `add_score`).
- **Dismissal:** `check_dismiss_puzzle()` runs at the top of each app's `new_question()`; when `needs <= 0` it calls `dismiss_puzzle_alert()` → `window.PuzzleAlerter.solved()`, closing the host. There's also a manual "Dismiss puzzle" link in each app's menu (calls `dismiss_puzzle_alert()` directly). If no `PuzzleAlerter` host is present, dismiss shows a `bee_alert('Cannot dismiss puzzle')`.
- **Completion send-off:** when the answer that completes the puzzle is a *plain* success (no gift, end-of-level or video reward of its own), `success_common()` does not advance to another question — it calls `finish_puzzle_with_confetti()`, which plays a random `puzzle_end` sound + confetti via `show_animation()` and dismisses the host once the confetti ends. A completing answer that *does* trigger a gift / end-of-level / video keeps its own celebration and then dismisses through the normal `check_dismiss_puzzle()` path on the next `new_question()` (no extra send-off).
- **Other behaviour changes while `is_puzzle` is set:** `page_update()` skips the periodic auto-reload and the version check (don't reload mid-session); external `http` links don't navigate the webview: clicking one shows a "copy this URL" prompt instead of the normal leave-confirm.
- **TTS bridge (related embedding):** keyed on `window.PuzzleAlerter.speak` existing (not on `is_puzzle` directly) — `bee_tts.status` becomes `'bridge'` and speech routes through the host's native TTS instead of browser `speechSynthesis`.

The host decides *when* to open a puzzle session; that timing lives outside this repo, in the embedding host.
