# Removed features (may be restored later)

Features that once existed in this repo and were **removed**, documented here so they can be
**restored** without rediscovering the design. Each entry records what it did, the code symbols it
used, its content format, and where it used to be documented, with the removal date. **Nothing here
describes current behaviour** — do not implement or author against it without first re-adding the
code.

## Segmented reveal repeat (`is_reveal`) — removed 2026-07-20

After a segmented word was answered with enough help, the spaced-repetition scheduler inserted an
extra **reveal repeat** ahead of the plain repeat: a repeat flagged `is_reveal:true` that showed the
*full* shuffled word bank (every segment tiled plainly) so the child could copy the answer. Removed
once the **always-on segmented word bank** plus the **HELP-key full-mode reveal** (see
[`question-cycle.md`](question-cycle.md)) made an automatic post-error reveal redundant — recovery is
now child-initiated via HELP, and `reschedule_question` re-inserts the problem **once** only.

### Code symbols removed (restore these to bring it back)

- The `add_reveal` parameter of `reschedule_question(problem, add_reveal)` and its
  `s.splice(1, 0, {…, is_repeat:true, is_reveal:true})` insert (reveal ~1 slot ahead, before the
  plain repeat ~3 slots later).
- The `ASK_ALL` branch calling `reschedule_question(bee.problem, true)` (vs `ASK_ONCE` → `false`);
  the two success outcomes were merged into one plain reschedule when the reveal went away.
- Every read of `problem.is_reveal`: in `render_addwords` (full-bank mode is now driven solely by
  `bee.help_full_bar`), the HELP-key handler guard, and the HELP-key visibility test in
  `start_question14`.
- (An earlier, separately-removed part: the grey answer-overlay inside the boxes/underscores —
  `reveal_totype` — that `is_reveal` showed before the shuffled word bank replaced it.)

## Long-format ("long") stories — removed 2026-07-19

A multi-prompt story told across many consecutive `spellbee.html` word entries. Removed when the app
moved toward segmented-only, level-20 entries. **Both the mechanism and the story word-list entries
were deleted**, so restoring the code alone brings back no content — the story fragments must be
re-authored too.

Note this is distinct from the still-present **"story" layout** (`is_story`: a single entry with
more than one `<word>` target renders a scrambled word bank). That code path remains; only the
*long-format* mechanism below was removed.

### What it did

- **Level was the story identity.** Any `word_repository` entry whose level was `≥ MIN_LONGSTORY_LEVEL`
  (a constant, `= 100`) belonged to a long-format story. **All consecutive entries sharing the same
  level number formed one story**, asked in order from start to finish. Two different level numbers
  (≥ 100) were two different stories.
- **Selection ("long story mode").** In `try_get_new_word10()`, when picking a first word, if any
  long-story levels were present the selector could switch into long-story mode: it picked a random
  story (`bee.longstory_beginnings`) and queued **every fragment of that story in order** via
  `store_question11`, instead of the normal ~7-word phonics-class group.
- **No phonics grouping, no rescheduling.** Long-story fragments were not grouped by phonics class,
  and a missed fragment was **not** rescheduled — the spaced-repetition `reschedule_question` was
  skipped for `level >= MIN_LONGSTORY_LEVEL` (the `ASK_ONCE` / `ASK_ALL` outcomes were guarded with
  `&& bee.processed_word.level < MIN_LONGSTORY_LEVEL`).

### Code symbols removed (restore these to bring it back)

- `const MIN_LONGSTORY_LEVEL = 100;`
- `bee.longstory_beginnings` / `out.longstory_beginnings` — a `level (>=MIN_LONGSTORY_LEVEL) -> first
  word_ix` map, built in `init_wordlist_impl()` and consumed in selection. Assigned in
  `init_wordlist()` (`bee.longstory_beginnings = r.longstory_beginnings`).
- `out.level_counts` — was populated in the same `init_wordlist_impl()` loop, split from long-story
  levels (`level (<MIN_LONGSTORY_LEVEL) -> count`), logged as "NUMBER OF WORDS PER LEVEL". (Removed
  alongside; re-add if the split is wanted.)
- The **long-story branch** in `try_get_new_word10()`: the `Object.keys(bee.longstory_beginnings)`
  random pick for the first word, and the `if(bee.words[word_ix].level >= MIN_LONGSTORY_LEVEL)` block
  that queued the consecutive same-level fragments.
- The success-outcome gating in the solve handler: `outcome == 'ASK_ONCE'` / `'ASK_ALL'` guarded by
  `&& bee.processed_word.level < MIN_LONGSTORY_LEVEL`, and the `NOTlongstory=` field in the success
  `console.log`.
- The `// [WORDS START]` header comment block: "`level >= MIN_LONGSTORY_LEVEL = 100 represent
  long-format stories / Each story is a series of "words" … asked consecutively.`"

### Entry format (as it was)

Long-story entries used the same pipe-delimited `"level|image_ref|text|class"` shape as any word:

- **level** — the story id: the next unused level `≥ MIN_LONGSTORY_LEVEL`, shared by every fragment
  of that story.
- **image_ref** — typically empty (per-scene images were optional / not added).
- **text** — the prompt sentence; `<word>` regions mark what the child types. A fragment could carry
  several `<word>` targets (the "story" multi-target layout).
- **class** — left **empty** (long stories were not grouped by phonics).

### Authoring mechanics (as they were)

- Pick the **next unused level `≥ MIN_LONGSTORY_LEVEL`** and place all its fragments as a single
  consecutive block inside the `// [WORDS START]`…`// [WORDS END]` region, after the previous story.
- **One fragment per line**, each a single JS string in the `"level|image_ref|text|class"` shape; the
  **class field stays empty**.
- **Escape in-dialogue double quotes as `\"`** so each fragment stays one valid JS string.
- A complete story was an arc of roughly **20–50 fragments**. Audience KS1/KS2 (5+), British English.
- **Validate after editing:** every fragment has exactly 4 pipe-separated fields and the whole word
  array still parses as JS.
- **Editorial conventions were maintainer-owned:** roughly **2–3 typing targets per fragment**,
  **reusing existing `<word>` bracket words** where possible, vocabulary reuse, and any custom image
  style — confirm with the maintainer before authoring.

### Where it used to be documented

- `agent/spellbee-content.md` — the "Long-format stories" section + "Authoring a new long story".
- `agent/question-cycle.md` — spellbee selection mode "(a) long-story".
- root `CLAUDE.md` — the "spellbee.html — word list format" note.
