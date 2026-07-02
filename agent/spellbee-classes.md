# spellbee.html — phonics class tags

The **class** field is the 4th pipe-delimited field of a word entry
(`"level|image_ref|text|class1,class2"`, see [`spellbee-content.md`](spellbee-content.md)).
A class tag names an **orthographic rule**: a way a phoneme is spelled. An entry may carry
several comma-separated classes when its target word shows more than one pattern.

## What the engine does with a class tag

The tag string is otherwise **opaque** to the engine — the `category:` prefix and any
variant suffix are a human naming convention only, never parsed. Only the exact full
string matters, and it drives two mechanisms:

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
   (`tense:a` = `(a)[bcdfgklmnpstvz](e)|(a)(?: |$)`).

A class used for grouping does **not** need a highlight rule. Six grouping-only classes
have no entry in `class_highlight_rules` and so never highlight: `common`, `tricky`,
`calendar`, `cons:dZ`, `di:au`, `end:ey`.

## Tagging multi-target fragments

A normal entry usually has one `<word>` target, so its class list describes that single
word. A **story fragment** (an entry with several `<word>` targets — including demoted
long-story fragments now living at a normal level) is tagged by the **union of the classes
applicable to each of its target words**. Conventions:

- The list **need not be exhaustive** — a fragment with several targets, each showing
  several patterns, would otherwise accumulate a long, unfocused class list.
- When choosing which classes to include, **prefer classes that have few example words**.
  A fragment carrying a rare orthographic feature should be tagged with it so the fragment
  surfaces when a session happens to drill that rare grapheme; common patterns
  (`lax:*`, `common`, …) are already well covered by ordinary words and can be omitted.

Note this is a grouping convention only: grouping needs the class to be in `class_to_ix`,
which any tag satisfies. Whether the highlight actually renders is independent — for a
multi-target fragment the highlight regex runs against the concatenation of all the
target words and must match **exactly once** there (per the rule above), so a grapheme
that appears in two of the targets will not highlight even though the tag is still valid
for grouping.

## Naming convention

```
category:grapheme[variant]
```

- **category prefix** — `lax` short vowel, `tense` long vowel (incl. split digraph / magic-e),
  `di` vowel digraph / diphthong, `br` r-controlled ("bossy r") vowel, `dark` dark/velar L,
  `cons` consonant grapheme, `beg` word-initial grapheme, `end` word-final grapheme,
  `t` trigraph. Bare `o@` / `a@` are the schwa cases.
- **grapheme** — the letters as written (`ee`, `igh`, `ck`, …).
- **variant suffix** — disambiguates phonemes that share a spelling:
  - `@` — a different vowel value of the same letters: `di:ow` *cow* /aʊ/ vs `di:ow@` *snow* /əʊ/.
  - a **digit** — the /ɜː/ NURSE vowel ("er" sound) spelled otherwise: `br:or` *corn* /ɔː/ vs
    `br:or3` *work* /ɜː/.
  - a **capital letter** — the consonant *sound* a soft/odd grapheme makes:
    `Z` = /dʒ/ ("j") in `cons:gZ`, `S` = /ʃ/ ("sh") in `cons:chS`, `tS` = /tʃ/ ("ch") in `cons:tur:tS`.

## Catalogue

Each row: **tag** · grapheme highlighted (`—` = grouping only, no highlight) · the sound
(keyword) · example targets drawn from the word list.

### Short ("lax") vowels

| tag | highlights | sound | examples |
|---|---|---|---|
| `lax:a` | `a` | /a/ *cat* | cat, bag, hand, bank |
| `lax:e` | `e` | /e/ *pen* | pen, red, bed, nest |
| `lax:i` | `i` | /i/ *fish* | fish, swim, pin, ring |
| `lax:o` | `o` | /o/ *box* | box, hot, fox, dog |
| `lax:u` | `u` | /u/ *sun* | sun, drum, duck, just |
| `lax:y` | `y` | /i/ *gym* | gym, myth, crystal, pyramid |
| `lax:dbl` | doubled consonant | short-vowel doubling | smelly, rapper, running, arrest |

### Long ("tense") vowels — split digraph (a–e) or open vowel

| tag | highlights | sound | examples |
|---|---|---|---|
| `tense:a` | `a…e` / final `a` | /eɪ/ *snake* | snake, plane, blaze, inflate |
| `tense:aa` | `a` | /ɑː/ broad-a *bath* | bath, grass, pasta |
| `tense:e` | `e…e` / final `e` | /iː/ *he* | he, she, video, complete |
| `tense:i` | `i…e` / final `i` | /aɪ/ *shine* | shine, slime, likes |
| `tense:o` | `o…e` / final `o` | /əʊ/ *rose* | rose, home, nose, stone |
| `tense:u` | `u…e` / `u…i/e` | /juː/–/uː/ *cube* | cube, continue, ruler, unit |
| `tense:y` | `y…e` / final `y` | /aɪ/ *cry* | cry, fly, dry, my |

### Vowel digraphs / diphthongs

| tag | highlights | sound | examples |
|---|---|---|---|
| `di:ee` | `ee` | /iː/ *tree* | tree, sleep, green, cheese |
| `di:ea` | `ea` | /iː/ *eat* | eat, meat, please, heal |
| `di:eae` | `ea` | /e/ *bread* | bread, head, dead, already |
| `di:ai` | `ai` | /eɪ/ *rain* | train, rain, mail |
| `di:ay` | `ay` | /eɪ/ *play* | play, tray, away, holiday |
| `di:oa` | `oa` | /əʊ/ *boat* | coat, road, goal, coal |
| `di:oo` | `oo` | /uː/ *moon* | moon, spoon, food, school |
| `di:ooU` | `oo` | /ʊ/ *book* | foot, book, bookshelf, cookie |
| `di:ou` | `ou` | /aʊ/ *mouse* | mouse, house, cloud |
| `di:ow` | `ow` | /aʊ/ *cow* | cow, down, crown |
| `di:ow@` | `ow` | /əʊ/ *snow* | snow, bow, rainbow, follow |
| `di:oi` | `oi` | /ɔɪ/ *coin* | coin, poison, noise, toilet |
| `di:oy` | `oy` | /ɔɪ/ *toy* | toy, boy, enjoy, annoying |
| `di:ew` | `ew` | /uː/–/juː/ *new* | new, few, knew, screw |
| `di:aw` | `aw` | /ɔː/ *draw* | draw, raw, spawn |
| `di:au` | — | /ɔː/ *pause* | pause, because, dinosaur, cauldron |
| `t:igh` | `igh` | /aɪ/ *light* | light, night, right |

### R-controlled ("bossy r") vowels

| tag | highlights | sound | examples |
|---|---|---|---|
| `br:ar` | `ar` | /ɑː/ *car* | car, shark, card, dark |
| `br:or` | `or` | /ɔː/ *corn* | corn, horse, morning, door |
| `br:or3` | `or` | /ɜː/ *work* | work, world |
| `br:ir` | `ir` | /ɜː/ *shirt* | shirt, birthday |
| `br:ur3` | `ur` | /ɜː/ *turn* | turn, burn, hurt |
| `br:er3` | `er` | /ɜː/ (stressed) *person* | person, expert, desert |
| `br:ea:i@` | `ea` | /ɪə/ *ear* | ear, hear, year |
| `br:ai:e@` | `ai` | /eə/ *air* | air, hair, fair, pair |

### Dark L

| tag | highlights | sound | examples |
|---|---|---|---|
| `dark:al` | `al` / `all` | /ɔːl/ *call* | small, call, tall, wall |
| `dark:ol` | `ol` | /əʊl/ *cold* | cold, gold, golf |

### Consonant graphemes

| tag | highlights | sound | examples |
|---|---|---|---|
| `cons:th` | `th` | /θ/–/ð/ *this* | this, breath, feather |
| `cons:ph` | `ph` | /f/ *phone* | phone, dolphin, sulphur |
| `cons:ck` | `ck` | /k/ *duck* | duck, rock, socks, black |
| `cons:wh` | `wh` | /w/ *wheel* | wheel, where, white |
| `cons:gZ` | `g`(before i/e) | soft g /dʒ/ *huge* | huge, edges, change |
| `cons:dZ` | — | /dʒ/ (dge/ge) *village* | village, package, giraffe |
| `cons:cs` | `c`(before i/e) | soft c /s/ *ice* | ice, police, furnace |
| `cons:chS` | `ch`(before i/e) | /ʃ/ "sh" *chef* | chef, machine, moustache |
| `cons:ti` | `ti` | /ʃ/ "sh" *potion* | potion, competition, destruction |
| `cons:tur:tS` | `tur` | /tʃ/ "ch" *picture* | picture, structure |

### Word beginnings & endings

| tag | highlights | sound | examples |
|---|---|---|---|
| `beg:kn` | initial `kn` | silent k *knot* | knot, know, knight |
| `beg:wr` | initial `wr` | silent w *wrong* | wrong, write |
| `end:y@` | final `y` | /i/ *smelly* | smelly, baby, mystery |
| `end:ey` | — | /i/ *monkey* | monkey, donkey, key |
| `end:er` | final `er` | /ə/ *teacher* | teacher, ruler, river, ladder |
| `end:le` | final `le` | /əl/ *table* | table, jungle, turtle |
| `end:al@` | final `al` | /əl/ *portal* | portal, hospital, animal |
| `end:ly` | final `ly` | /li/ (adverb) *really* | really, finally, secretly |
| `end:et` | final `et` | /ɪt/ *toilet* | toilet, basket, trumpet |
| `end:ot` | final `ot` | /ət/ *parrot* | parrot, pilot |
| `end:ie` | `ie` | *cookie* / *shield* | cookie, shield |

### Schwa / unstressed

| tag | highlights | sound | examples |
|---|---|---|---|
| `o@` | `o` | unstressed /ə/ *lemon* | lemon, skeleton, anchor, crayon |
| `a@` | `a` | unstressed /ə/ *banana* | banana, pasta, lava |

### Non-phonetic groupings (no highlight rule)

| tag | purpose | examples |
|---|---|---|
| `common` | high-frequency / common-exception words | is, he, she, I, you |
| `tricky` | irregular spellings | one, love, eye, woman, women |
| `calendar` | themed set: days of the week | Monday, Tuesday, … Sunday |
