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
