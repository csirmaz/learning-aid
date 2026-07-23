# spellbee.html — phonics classes

A **class** groups word entries that share an orthographic pattern, so a session can drill one
pattern at a time. A class is named `spelling/phoneme` — the **same `grapheme/phoneme` notation
used inside segmented words** (`<p/p=e/e=n/n>`), e.g. `ee/i:`, `igh/aI`, `al/sl`.

## How classes are assigned (`init_wordlist_impl()`)

Classes are **derived automatically**, so word entries normally carry no class field. For each
**segmented** entry the engine forms a `grapheme/phoneme` pair from every segment (the grapheme as
written, lower-cased, plus its resolved phoneme id) and checks it against two registries defined at
the top of the word section in `spellbee.html`:

- **`gp_grouping_pairs`** — pairs that name a pattern worth drilling. A match is added to the
  entry's class list, and these are the classes that build **groups** (`class_to_ix`): after
  picking a first word, `new_question()` queues up to ~7 words sharing **one** of the word's
  classes, chosen at random (see [`question-cycle.md`](question-cycle.md)).
- **`gp_other_pairs`** — valid pairs deliberately *not* grouped (plain consonants such as `m/m`,
  `t/t`, `s/s` that occur everywhere and give no useful grouping signal). A match is accepted but
  adds no class.

A pair in **neither** registry is a likely typo — or a new pattern that needs classifying: it is
reported once via `console.error("Unknown grapheme/phoneme pair", …)` and then added to
`gp_other_pairs` so the message isn't repeated. **Those two objects are the authoritative list of
every pair the engine knows** — read them in `spellbee.html` rather than keeping a copy here.

An entry left with no class (a non-segmented word, or one whose pairs are all `gp_other_pairs`)
falls into the catch-all **`noclass`** bucket.

### `predictable_pairs` — word-bank scaffolding (not a class)

A **third** pair registry in `spellbee.html`, **orthogonal to classes/grouping**: it marks pairs
whose grapheme is the obvious default spelling of the sound, so the learner produces them unaided.
It takes no part in class derivation — a pair may be in `predictable_pairs` *and* in
`gp_grouping_pairs` (drilled in its own group, yet given for free whenever it is *not* the in-focus
pair). Its only use is the **segmented word bank**: a predictable, non-in-focus segment gets no chip
(see the word-bank description in [`question-cycle.md`](question-cycle.md)). Conservative by design —
only unambiguous single consonants + short vowels; anything omitted defaults to "not predictable"
(shown as a tile), the safe direction.

## Explicit `class` field (optional, now rare)

An entry may still give an explicit comma-separated `class` field (the optional last pipe-delimited
field, see [`spellbee-content.md`](spellbee-content.md)). It is added to the class list verbatim —
**not** validated against the registries — and merged with any derived classes. Use it only where
auto-derivation doesn't group as wanted; currently just a couple of entries do (`calendar`, the
days-of-the-week themed set; and `end:ly`). When writing one for a multi-target entry, tag the
**union of the classes applicable to each `<word>` target**, and prefer rare patterns — common
short-vowel pairs are already well covered by ordinary words.

## Naming convention

```
spelling/phoneme
```

- **spelling** — the grapheme as written, lower-cased (`ee`, `igh`, `ck`, `a`, …).
- **phoneme** — an ascii phoneme id from the `phoneme_sounds` inventory (`i:`, `eI`, `f`, `3:`,
  `dZ`, …). The `/` and the id set are exactly the per-segment notation of segmented words.

Pairing *both* halves keeps each spelling its own group and distinguishes the two ways spellings and
sounds overlap:

- **One sound, several spellings → several pairs.** /iː/ = `ee/i:` (tree), `ea/i:` (eat),
  `e/i:` (he); /eɪ/ = `a/eI` (snake), `ai/eI` (rain), `ay/eI` (play).
- **One spelling, several sounds → several pairs.** `a/ae` (cat) vs `a/eI` (snake) vs `a/a:`
  (bath) vs `a/E` (banana); `o/o` (hot) vs `o/EU` (rose) vs `o/E` (lemon).

A syllabic `-al`/`-el`/`-le`/`-ol` /əl/ ending uses the dedicated `sl` phoneme, giving the pairs
`al/sl`, `el/sl`, `le/sl`, `ol/sl` (capital, tunnel, table, symbol) — see the syllabic-l note in
[`segmented-review.md`](segmented-review.md).

## Class selection & `class_level`

*Which* class is drilled next is **mastery-driven**; the mechanism (per-pair coverage stats, the
smoothed success rate, the acceptance probabilities) lives in
[`question-cycle.md`](question-cycle.md). Two load-time products feed it, both built in
`init_wordlist_impl`:

- **`bee.class_to_ix`** (above) — class → member word indices.
- **`bee.class_level[class]`** — the mean `level` of the class's **4 lowest-level members**, used to
  weight the class pick towards easier groups (`choose_class_by_level`, the same `1.5^(-level)` shape
  as the per-word `choose_using_levels20`).

Every non-empty class is a candidate, including `noclass` and the explicit thematic classes: those
have no `grapheme/phoneme` in-focus pair, so they accrue no per-pair stats and are **always taught
when picked** (collecting common irregular / themed words), and their group intro no-ops
(`show_group_intro` needs a real phoneme). `init_wordlist_impl` also `console.warn`s a **singleton
pair-class** (a class whose name contains `/` with a single member): one word can't contrast the
pattern, and its intro would reveal the answer.
