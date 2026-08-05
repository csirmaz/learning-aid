# Adding a problem to spellbee.html

The complete guide to adding a spellbee PROBLEM. This is meant to be self-sufficient; deeper
internals live in [`spellbee-content.md`](spellbee-content.md) (format), [`spellbee-classes.md`](spellbee-classes.md)
(class derivation & GP-pair registries) and [`segmented-review.md`](segmented-review.md) (review tooling).

## 1. Entry format

Entries are pipe-delimited strings in the `problem_repository` array, between `// [PROBLEMS START]`
and `// [PROBLEMS END]`. **Append new entries to the end** (ignore any section structure):

```
"image_ref|text|class"
```

- **image_ref** — the prompt image:
  - `@emoji` — the literal emoji is the image.
  - `word@emoji` — a named image key, with the emoji as fallback.
  - `word` — resolved to an image at runtime by the app's image resolver (a named key).
  - `~word` — loads `assets/images/words/<word>` directly, bypassing the resolver.
  - *empty* — no image (correct for non-picturable problems).
- **text** — the prompt sentence. A `<…>` region marks the **word-to-type** (`wordtt`). **Multiple**
  `<…>` regions trigger "story" layout; a single `<…>` split into `=`-separated segments is a
  **segmented** entry. A plain `<…>` (no `=`) is a whole-wordtt show → hide → reproduce problem.
- **class** *(optional, trailing)* — **normally omit it.** CLASSES are auto-derived from the segments'
  GP pairs; give an explicit comma-list only where extra classes are desired or for non-segmented problems.

## 2. Procedure (checklist)

1. **Already exists? Skip it.** Search the list first; add a duplicate only when explicitly told to
   (e.g. a fresh context sentence for an existing word).
2. **Worth a place in the corpus?** The list is **curated, not exhaustive.** A word earns its place if
   it is **high-frequency** (worth making automatic) **or** it drills a **pattern the corpus needs** —
   a new / under-covered GP pair or segment, a **generative morpheme** (a recurring
   prefix / suffix / root), or an **ambiguity gap** the pattern-drill cannot teach (silent letters,
   doubled letters, which-grapheme choices, morpheme spellings). **Warn the maintainer** if the
   candidate is **low-frequency AND brings none of these** (its pairs and morphemes are already well
   covered) — it is likely not worth adding. (A word the learner is accountable for at school can
   still qualify — but via one of these tests, chiefly high frequency or an ambiguity gap, not merely
   because it is on a list.)
3. **Append only**, to the end of the list.
4. **Input shape** — a single word (the target) or a phrase with the target in `<…>`.
5. **Pronunciation** — UK **Received Pronunciation (RP)**.
6. **Picture OR context** — §3.
7. **Segment** multi-phoneme words-to-type (§4–6); **single-phoneme ones are NOT segmented** (§7).
8. **Register any new GP pair** (§8) — an unregistered pair is a `console.error`.
9. **Ambiguity → ask** the maintainer for genuinely arguable phoneme specs (weak vowel /ɪ/=`I` vs
   /ə/=`E`, variant pronunciations); fix unambiguous specs directly.
10. **Audio** — new entries fall back to TTS until an MP3 is generated (§9).

## 3. Picture or context

Every entry needs one:

- **Picturable** → an emoji `image_ref` (`@emoji` or `word@emoji`). If picturable but **no suitable
  emoji exists**, **warn the maintainer** rather than leaving it silently imageless.
- **Not picturable** (abstract — many, much, have…) → **empty `image_ref`** and a short **context
  sentence** carrying the target in `<…>`.

## 4. Segmenting: boxes, phonemes, defaults

Split the word-to-type into `=`-separated **segments**, one typed box each — either `grapheme` or
`grapheme/phoneme` (explicit ascii phoneme id after `/`).

- **Write `/phoneme` only when the sound differs from the grapheme's default.** A bare grapheme uses
  `segment_default_phoneme`. Key defaults (the common gotchas are the vowels):

  | grapheme | default | grapheme | default | grapheme | default |
  |---|---|---|---|---|---|
  | a | `ae` /æ/ | e | `e` /e/ | i | `I` /ɪ/ |
  | o | `o` /ɒ/ | u | `U` /ʊ/ | y | `I` /ɪ/ |
  | c | `k` | ch | `tS` | ck | `k` |
  | ph | `f` | sh | `S` | x | `ks` |
  | ai/ay | `eI` | ee/ea | `i:` | oo | `u:` |
  | ar | `a:` | er | `Er` | or | `O:` |
  | ir/ur | `3:` | igh | `aI` | ear | `IE` |

  Single consonants and their doubles (`bb`,`ll`,…) default to their own sound. Full map:
  `segment_default_phoneme` in spellbee.html. So *cat* = `<c=a=t>` (all default), but *many* needs
  `<m=a/e=n=y>` because "a" here is /e/, not the default /æ/.
- **Phoneme ids** are the keys of `phoneme_sounds` (source of truth, with IPA comments); an unknown id
  is a `console.error`. Quick reference:

  | id | IPA | id | IPA | id | IPA |
  |---|---|---|---|---|---|
  | ae | /æ/ | A | /ʌ/ | o | /ɒ/ |
  | e | /e/ | I | /ɪ/ | U | /ʊ/ |
  | E | /ə/ | Er | /ə(r)/ "-er" | sl | syllabic l |
  | i: | /iː/ | u: | /uː/ | a: | /ɑː/ |
  | O: | /ɔː/ | 3: | /ɜː/ | | |
  | aI | /aɪ/ | eI | /eɪ/ | EU | /əʊ/ |
  | OI | /ɔɪ/ | aU | /aʊ/ | IE | /ɪə/ |
  | eE | /eə/ | UE | /ʊə/ | aIE | /aɪə/ |
  | S | /ʃ/ | tS | /tʃ/ | dZ | /dʒ/ |
  | T | /θ/ | D | /ð/ | Z | /ʒ/ |
  | ju: | /juː/ | ks | /ks/ | x | silent |

  Plus whole-morpheme pseudo-phonemes: `Ing` (-ing), `En` (-en /ən/), `Et` (-et), `SEn` (-tion),
  `Id` (-ed /ɪd/), `lI` (-ly), `tSE` (-ture), `IdZ` (-age), `In`/`kEn`/`de`/`re` prefixes, etc.
- **Capitalisation** — grapheme case is lowercased for GP-pair/phoneme lookup but preserved in the
  displayed wordtt: *Christmas* → `Ch/k=…`, *Earth* → `Ear/3:=…`.

## 5. Silent segments: `/x` vs `/X` — easy to get wrong

Both fold to the silent phoneme `x`; the difference is the **link**:

- **`/X` (capital)** — a silent final e that **marks the preceding vowel's free (tense) value**, and
  draws a link back to it two boxes to its left: `face` `<f=a/eI=c/s=e/X>`, `plane`
  `<p=l=a/eI=n=e/X>`, `cute` `<c=u/ju:=t=e/X>`. The e is a **marker**; it is not part of the vowel's
  grapheme, which stays the single letter (Venezky 1967's *free*/*checked* alternates and markers).
- **`/x` (lowercase)** — a **plain silent letter**, no link. Use for every other silent letter: a
  silent final e after a digraph vowel (`cheese …s/z=e/x`, `mouse …s/s=e/x`, `horse …s=e/x`), a silent
  o (`chocolate …c=o/x…`), a silent t (`Christmas …s=t/x==m…`).
- **Test — all three, else `/x`:** the segment two boxes back is (1) a **single primary vowel
  letter** (a, e, i, o, u — not a digraph, not r-controlled), (2) voicing that letter's **free
  alternate** — `a/eI`, `e/i:`, `i/aI`, `o/EU`, `u/ju:` or `u/u:` — and (3) separated from the e by
  exactly **one consonant box**. Test (2) is the one that catches lookalikes: *machine* has `i/i:`,
  not `i`'s free alternate `i/aI`, so its e marks nothing → `<m=a/E=ch/S=i/i:=n=e/x>`.

## 6. Morpheme-first segmentation

- Breaks fall on morpheme boundaries; the base stays intact; **no segment straddles two morphemes.**
  Use `==` (not `=`) between two *multi-segment* morphemes — same split, plus a divider bar
  (`micro==scope`, `Christ==mas`). It never merges a morpheme into one box; segment count (hence
  level) is unchanged.
- **Geminate at a boundary:** a morpheme collision (base-final C + suffix-initial C, *real+ly*) →
  **split** (`r=ea=l=ly`); a rule-doubling artifact that belongs to no morpheme (*run+ing→running*) →
  **keep the double as one box** (`r=u=nn=ing`).
- **-ing:** verb+ing → the `ing/Ing` morpheme box (feeding, running); a root merely containing the
  letters → `i=ng` (ring, thing, something).
- **Reduced, unstressed final syllable → ONE chunk**, regardless of morpheme status: `-et`→`Et`,
  `-en`→`En`, `-le`→`sl`, `-age`→`IdZ`, `-tion`→`SEn`, `-ture`→`tSE`. Keep phoneme grain for reliable
  single-grapheme bonds and **stressed** endings (pen `e=n`, pet `e=t`, bed `e=d`). Stress is the test.
- **Syllabic /əl/ ending** (-al/-el/-le/-ol: capital, table, symbol) → the dedicated phoneme **`sl`**
  ("syllabic l"): `table` `<t=a=b=le/sl>`. Not plain `l`/`E`/`O:` (`O:` only for true `all` /ɔːl/ words
  like tall/call). Watch the transposition typo `ls` (invalid; the audit flags `[!ls]`).

## 7. Single-phoneme words-to-type → unsegmented

A wordtt that is **one phoneme** — including a diphthong spelled as a unit (*eye* /aɪ/, *ear* /ɪə/) —
is entered as a **plain `<…>`** (no `=`), a whole-wordtt show → hide → reproduce problem. Segmenting
it would make a single pointless box.

## 8. GP-pair registries

Every segment's GP pair (`grapheme/phoneme`) must be registered, or it is a `console.error`:

- **`class_gp_pairs`** — *taught* pairs; each forms a CLASS (via `class_to_ix`).
- **`other_gp_pairs`** — valid but forming no class (never a useful drill set).
- **`predictable_gp_pairs`** — the *obvious/default* spellings (single consonants, lax vowels at their
  default letter). In the segment bank a predictable, not-in-focus pair gets **no chip** (the child
  produces it unaided); an unpredictable one is shown as a tile to copy. This is a separate list used
  only for the bank, not for validation.

Add a genuinely new pair to `class_gp_pairs` if it should be drilled as a class, else
`other_gp_pairs`. (Example: the silent `t/x` in *Christmas* was added to `other_gp_pairs`.)

## 9. Audio (MP3 / TTS)

Pronunciation is a pre-generated MP3 at
`assets/sounds/words/<phrase_lowercased_spaces_as_underscores>.mp3`; if absent, the app uses TTS. To
generate missing files, run `tools/tts/make_speech.py` (Kokoro model — see root CLAUDE.md "Generating
TTS Audio"); it derives the filename from each entry and only makes absent files. If the model handles
a word poorly, add it to the script's `avoid_tts()` list.

## 10. Reviewed marker + tools

A **reviewed** entry has an end-of-line comment **ending in the word `reviewed`** — real format
`// [word] reviewed`, NOT `// reviewed` (the `[word]` sits between `//` and `reviewed`). List
**unreviewed** segmented entries by filtering on the trailing word:

```
grep -nE '^"[^"]*\|[^"]*=' spellbee.html | grep -v 'reviewed'
```

Tools: `agent/segmented-audit.js` (extract/validate GP pairs & phonemes), `agent/apply-line-edits.js`
(batch line edits).
