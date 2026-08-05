# spellbee.html — phonics classes

A **CLASS** is a set of problem entries that share an orthographic pattern, so a session can drill
one pattern at a time. A class is named `spelling/phoneme` — the **same GP-pair notation used
inside segmented problems** (`<p/p=e/e=n/n>`), e.g. `ee/i:`, `igh/aI`, `al/sl`.

## How classes are assigned (`init_problem_list_impl()`)

Classes are **derived automatically**, so problem entries normally carry no class field. For each
**segmented** entry the engine forms a **GP pair** from every segment (the grapheme as written,
lower-cased, plus its resolved phoneme id) and checks it against two registries defined at the top
of the problem section in `spellbee.html`:

- **`class_gp_pairs`** — GP pairs that name a pattern worth drilling. A match is added to the
  entry's class list, and these are the classes that build the drill runs (`class_to_ix`): after
  picking a first problem, `new_question()` queues up to ~7 problems sharing **one** of that
  problem's classes, chosen at random (see [`question-cycle.md`](question-cycle.md)).
- **`other_gp_pairs`** — valid GP pairs deliberately given *no* class (plain consonants such as
  `m/m`, `t/t`, `s/s` that occur everywhere and give no useful signal). A match is accepted but
  adds no class.

A GP pair in **neither** registry is a likely typo — or a new pattern that needs classifying: it is
reported once via `console.error("Unknown GP pair", …)` and then added to `other_gp_pairs` so the
message isn't repeated. **Those two objects are the authoritative list of every GP pair the engine
knows** — read them in `spellbee.html` rather than keeping a copy here.

An entry left with no class (a non-segmented problem, or one whose GP pairs are all in
`other_gp_pairs`) falls into the catch-all **`noclass`** bucket.

### `predictable_gp_pairs` — segment-bank scaffolding (not a class)

A **third** GP-pair registry in `spellbee.html`, **orthogonal to classes**: it marks pairs whose
grapheme is the obvious default spelling of the sound, so the learner produces them unaided.
It takes no part in class derivation — a pair may be in `predictable_gp_pairs` *and* in
`class_gp_pairs` (drilled as its own class, yet given for free whenever it is *not* the in-focus
pair). Its only use is the **segment bank**: a predictable, non-in-focus segment gets no chip
(see the segment-bank description in [`question-cycle.md`](question-cycle.md)). Conservative by
design — only unambiguous single consonants + short vowels; anything omitted defaults to "not
predictable" (shown as a tile), the safe direction.

## Explicit `class` field (optional, now rare)

An entry may still give an explicit comma-separated `class` field (the optional last pipe-delimited
field, see [`spellbee-content.md`](spellbee-content.md)). It is added to the class list verbatim —
**not** validated against the registries — and merged with any derived classes. Use it only where
auto-derivation doesn't classify as wanted; currently just a couple of entries do (`calendar`, the
days-of-the-week themed set; and `end:ly`). When writing one for a multi-target entry, tag the
**union of the classes applicable to each `<…>` target**, and prefer rare patterns — common
short-vowel pairs are already well covered by ordinary entries.

## Naming convention

```
spelling/phoneme
```

- **spelling** — the grapheme as written, lower-cased (`ee`, `igh`, `ck`, `a`, …).
- **phoneme** — an ascii phoneme id from the `phoneme_sounds` inventory (`i:`, `eI`, `f`, `3:`,
  `dZ`, …). The `/` and the id set are exactly the per-segment notation of segmented problems.

Pairing *both* halves keeps each spelling its own class and distinguishes the two ways spellings and
sounds overlap:

- **One sound, several spellings → several GP pairs.** /iː/ = `ee/i:` (tree), `ea/i:` (eat),
  `e/i:` (he); /eɪ/ = `a/eI` (snake), `ai/eI` (rain), `ay/eI` (play).
- **One spelling, several sounds → several GP pairs.** `a/ae` (cat) vs `a/eI` (snake) vs `a/a:`
  (bath) vs `a/E` (banana); `o/o` (hot) vs `o/EU` (rose) vs `o/E` (lemon).

A syllabic `-al`/`-el`/`-le`/`-ol` /əl/ ending uses the dedicated `sl` phoneme, giving the pairs
`al/sl`, `el/sl`, `le/sl`, `ol/sl` (capital, tunnel, table, symbol) — see the syllabic-l note in
[`segmented-review.md`](segmented-review.md).

## Class selection

*Which* class is drilled next is **mastery-driven**; the mechanism (per-GP-pair coverage stats, the
smoothed success rate, the acceptance probabilities) lives in
[`question-cycle.md`](question-cycle.md). It draws on one load-time product built in
`init_problem_list_impl`: **`bee.class_to_ix`** (above), class → member problem indices.

**A class carries no difficulty of its own** — the pick among candidate classes is uniformly random
(`choose_from`). Difficulty is a property of individual problems only, applied when choosing
*within* the class (`choose_using_levels20`); do not reintroduce a per-class level, as the classes
are not meaningfully ordered by difficulty.

Every non-empty class is a candidate, including `noclass` and the explicit thematic classes: those
are not GP pairs, so they have no in-focus pair, accrue no per-pair stats and are **always taught
when picked** (collecting common irregular / themed words), and their class intro no-ops
(`show_class_intro` needs a real phoneme). `init_problem_list_impl` also `console.warn`s a
**singleton GP-pair class** (a class whose name contains `/` with a single member): one problem
can't contrast the pattern, and its intro would reveal the answer.
