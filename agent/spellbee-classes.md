# spellbee.html — phonics class tags

The **class** field is the 4th pipe-delimited field of a word entry
(`"level|image_ref|text|class1,class2"`, see [`spellbee-content.md`](spellbee-content.md)).
A class tag names an **orthographic rule**: a way a phoneme is spelled, written
`spelling/phoneme`. An entry may carry several comma-separated classes when its target word
shows more than one pattern.

## What the engine does with a class tag

The tag string is otherwise **opaque** to the engine — the `spelling` and `phoneme` halves
and the `/` between them are a human naming convention only, never parsed. Only the exact
full string matters, and it drives two mechanisms:

1. **Grouping** (`class_to_ix`, built in `init_wordlist_impl()`). After picking a first
   word, `new_question()` queues up to ~7 words sharing **one** of its classes (chosen at
   random), so a session drills one orthographic rule at a time. An entry with an empty
   class field falls into the catch-all `'noclass:'` bucket.

2. **Highlighting** (`class_highlight_rules`, consumed by `get_class_highlight_mask()`).
   Each rule is a regex over the word being typed; the matched letters (or, if the regex
   has capture groups, the captured letters) are highlighted in the help text so the child
   sees the grapheme. The highlight only renders when the regex matches **exactly once** —
   zero or multiple matches highlight nothing. Capture groups let a rule pick out
   non-adjacent letters, e.g. the split digraph `a…e` while skipping the consonant between
   (`a/eI` = `(a)[bcdfgklmnpstvz](e)|(a)(?: |$)`).

A class used for grouping does **not** need a highlight rule. Six grouping-only classes
have no entry in `class_highlight_rules` and so never highlight: `common`, `tricky`,
`calendar`, `dge/dZ`, `au/O:`, `end:ey`.

## Tagging multi-target fragments

A normal entry usually has one `<word>` target, so its class list describes that single
word. A **story fragment** (an entry with several `<word>` targets — including demoted
long-story fragments now living at a normal level) is tagged by the **union of the classes
applicable to each of its target words**. Conventions:

- The list **need not be exhaustive** — a fragment with several targets, each showing
  several patterns, would otherwise accumulate a long, unfocused class list.
- When choosing which classes to include, **prefer classes that have few example words**.
  A fragment carrying a rare orthographic feature should be tagged with it so the fragment
  surfaces when a session happens to drill that rare grapheme; common patterns (the
  short-vowel tags `e/e`, `i/I`, …, and `common`) are already well covered by ordinary
  words and can be omitted.

Note this is a grouping convention only: grouping needs the class to be in `class_to_ix`,
which any tag satisfies. Whether the highlight actually renders is independent — for a
multi-target fragment the highlight regex runs against the concatenation of all the
target words and must match **exactly once** there (per the rule above), so a grapheme
that appears in two of the targets will not highlight even though the tag is still valid
for grouping.

## Naming convention

```
spelling/phoneme
```

- **spelling** — the grapheme, the letters as written (`ee`, `igh`, `ck`, `a`, …).
- **phoneme** — an ascii phoneme id from the `phoneme_sounds` inventory (`i:`, `eI`, `f`,
  `3:`, `dZ`, …). The `/` mirrors the per-segment phoneme notation used inside segmented
  words (`<grapheme/phoneme>`), and the ids are the same set.

Because the tag pairs *both* halves, it distinguishes the two ways spellings and sounds
overlap, keeping each spelling its own group and its own highlight regex:

- **One sound, several spellings → several tags.** /iː/ is `ee/i:` (tree), `ea/i:` (eat),
  `e/i:` (he); /eɪ/ is `a/eI` (snake), `ai/eI` (rain), `ay/eI` (play); /ɜː/ is `or/3:`
  (work), `ir/3:` (shirt), `ur/3:` (turn), `er/3:` (person).
- **One spelling, several sounds → several tags.** `a/ae` (cat) vs `a/eI` (snake) vs
  `a/a:` (bath) vs `a/E` (banana); `o/o` (hot) vs `o/EU` (rose) vs `o/E` (lemon).

### Legacy tags (kept in the old `category:grapheme` form)

A handful of tags do **not** reduce to a single ascii phoneme, so they keep their original
names:

- `cons:th` — /θ/ *and* /ð/ share the `th` spelling (two phonemes).
- `dark:al`, `dark:ol` — a vowel plus dark/velar L (/ɔːl/, /əʊl/).
- `end:le`, `end:al@`, `end:et`, `end:ot`, `end:ly` — syllabic / vowel+consonant endings
  (/əl/, /ɪt/, /ət/, /li/).
- `end:y@`, `end:ey` — the "happy" vowel /i/, which is not in the phoneme inventory.
- `end:ie` — mixed value (/i/ *cookie* vs /iː/ *shield*).
- `lax:dbl` — a doubled consonant marking a short vowel (not a phoneme in its own right).
- `common`, `tricky`, `calendar` — non-phonetic groupings.

## Catalogue

Each row: **tag** · grapheme highlighted (`—` = grouping only, no highlight) · the sound
(keyword) · example targets drawn from the word list.

### Short ("lax") vowels

| tag | highlights | sound | examples |
|---|---|---|---|
| `a/ae` | `a` | /æ/ *cat* | cat, bag, hand, bank |
| `e/e` | `e` | /e/ *pen* | pen, red, bed, nest |
| `i/I` | `i` | /ɪ/ *fish* | fish, swim, pin, ring |
| `o/o` | `o` | /ɒ/ *box* | box, hot, fox, dog |
| `u/A` | `u` | /ʌ/ *sun* | sun, drum, duck, just |
| `y/I` | `y` | /ɪ/ *gym* | gym, myth, crystal, pyramid |
| `lax:dbl` | doubled consonant | short-vowel doubling *(legacy)* | smelly, rapper, running, arrest |

### Long ("tense") vowels — split digraph (a–e) or open vowel

| tag | highlights | sound | examples |
|---|---|---|---|
| `a/eI` | `a…e` / final `a` | /eɪ/ *snake* | snake, plane, blaze, inflate |
| `a/a:` | `a` | /ɑː/ broad-a *bath* | bath, grass, pasta |
| `e/i:` | `e…e` / final `e` | /iː/ *he* | he, she, video, complete |
| `i/aI` | `i…e` / final `i` | /aɪ/ *shine* | shine, slime, likes |
| `o/EU` | `o…e` / final `o` | /əʊ/ *rose* | rose, home, nose, stone |
| `u/u:` | `u…e` / `u…i/e` | /juː/–/uː/ *cube* | cube, continue, ruler, unit |
| `y/aI` | `y…e` / final `y` | /aɪ/ *cry* | cry, fly, dry, my |

### Vowel digraphs / diphthongs

| tag | highlights | sound | examples |
|---|---|---|---|
| `ee/i:` | `ee` | /iː/ *tree* | tree, sleep, green, cheese |
| `ea/i:` | `ea` | /iː/ *eat* | eat, meat, please, heal |
| `ea/e` | `ea` | /e/ *bread* | bread, head, dead, already |
| `ai/eI` | `ai` | /eɪ/ *rain* | train, rain, mail |
| `ay/eI` | `ay` | /eɪ/ *play* | play, tray, away, holiday |
| `oa/EU` | `oa` | /əʊ/ *boat* | coat, road, goal, coal |
| `oo/u:` | `oo` | /uː/ *moon* | moon, spoon, food, school |
| `oo/U` | `oo` | /ʊ/ *book* | foot, book, bookshelf, cookie |
| `ou/aU` | `ou` | /aʊ/ *mouse* | mouse, house, cloud |
| `ow/aU` | `ow` | /aʊ/ *cow* | cow, down, crown |
| `ow/EU` | `ow` | /əʊ/ *snow* | snow, bow, rainbow, follow |
| `oi/OI` | `oi` | /ɔɪ/ *coin* | coin, poison, noise, toilet |
| `oy/OI` | `oy` | /ɔɪ/ *toy* | toy, boy, enjoy, annoying |
| `ew/u:` | `ew` | /uː/–/juː/ *new* | new, few, knew, screw |
| `aw/O:` | `aw` | /ɔː/ *draw* | draw, raw, spawn |
| `au/O:` | — | /ɔː/ *pause* | pause, because, dinosaur, cauldron |
| `igh/aI` | `igh` | /aɪ/ *light* | light, night, right |

### R-controlled ("bossy r") vowels

| tag | highlights | sound | examples |
|---|---|---|---|
| `ar/a:` | `ar` | /ɑː/ *car* | car, shark, card, dark |
| `or/O:` | `or` | /ɔː/ *corn* | corn, horse, morning, door |
| `or/3:` | `or` | /ɜː/ *work* | work, world |
| `ir/3:` | `ir` | /ɜː/ *shirt* | shirt, birthday |
| `ur/3:` | `ur` | /ɜː/ *turn* | turn, burn, hurt |
| `er/3:` | `er` | /ɜː/ (stressed) *person* | person, expert, desert |
| `ea/IE` | `ea` | /ɪə/ *ear* | ear, hear, year |
| `ai/eE` | `ai` | /eə/ *air* | air, hair, fair, pair |

### Dark L *(legacy — vowel + dark L is not a single phoneme)*

| tag | highlights | sound | examples |
|---|---|---|---|
| `dark:al` | `al` / `all` | /ɔːl/ *call* | small, call, tall, wall |
| `dark:ol` | `ol` | /əʊl/ *cold* | cold, gold, golf |

### Consonant graphemes

| tag | highlights | sound | examples |
|---|---|---|---|
| `ph/f` | `ph` | /f/ *phone* | phone, dolphin, sulphur |
| `ck/k` | `ck` | /k/ *duck* | duck, rock, socks, black |
| `wh/w` | `wh` | /w/ *wheel* | wheel, where, white |
| `g/dZ` | `g`(before i/e) | soft g /dʒ/ *huge* | huge, edges, change |
| `dge/dZ` | — | /dʒ/ (dge/ge) *village* | village, package, giraffe |
| `c/s` | `c`(before i/e) | soft c /s/ *ice* | ice, police, furnace |
| `ch/S` | `ch`(before i/e) | /ʃ/ "sh" *chef* | chef, machine, moustache |
| `ch/tS` | `tch` / `ch` | /tʃ/ "ch" *chair* | chips, cheese, teacher, kitchen, church |
| `ti/S` | `ti` | /ʃ/ "sh" *potion* | potion, competition, destruction |
| `tur/tS` | `tur` | /tʃ/ "ch" *picture* | picture, structure |
| `cons:th` | `th` | /θ/–/ð/ *this* *(legacy)* | this, breath, feather |

### Word beginnings & endings

| tag | highlights | sound | examples |
|---|---|---|---|
| `kn/n` | initial `kn` | silent k *knot* | knot, know, knight |
| `wr/r` | initial `wr` | silent w *wrong* | wrong, write |
| `er/Er` | final `er` | /ə/ *teacher* | teacher, ruler, river, ladder |
| `end:y@` | final `y` | /i/ *smelly* *(legacy)* | smelly, baby, mystery |
| `end:ey` | — | /i/ *monkey* *(legacy)* | monkey, donkey, key |
| `end:le` | final `le` | /əl/ *table* *(legacy)* | table, jungle, turtle |
| `end:al@` | final `al` | /əl/ *portal* *(legacy)* | portal, hospital, animal |
| `end:ly` | final `ly` | /li/ (adverb) *really* *(legacy)* | really, finally, secretly |
| `end:et` | final `et` | /ɪt/ *toilet* *(legacy)* | toilet, basket, trumpet |
| `end:ot` | final `ot` | /ət/ *parrot* *(legacy)* | parrot, pilot |
| `end:ie` | `ie` | *cookie* / *shield* *(legacy)* | cookie, shield |

### Schwa / unstressed

| tag | highlights | sound | examples |
|---|---|---|---|
| `o/E` | `o` | unstressed /ə/ *lemon* | lemon, skeleton, anchor, crayon |
| `a/E` | `a` | unstressed /ə/ *banana* | banana, pasta, lava |

### Non-phonetic groupings (no highlight rule)

| tag | purpose | examples |
|---|---|---|
| `common` | high-frequency / common-exception words | is, he, she, I, you |
| `tricky` | irregular spellings | one, love, eye, woman, women |
| `calendar` | themed set: days of the week | Monday, Tuesday, … Sunday |
