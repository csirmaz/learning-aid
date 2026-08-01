# learning-aid

Reusable web-based tools to help KS1 and KS2 children (5 years and up) with maths and literacy.

## Pages

- Literacy: https://csirmaz.github.io/learning-aid/spellbee.html
- Arithmetic: https://csirmaz.github.io/learning-aid/count.html

## Literacy

![screenshot](https://csirmaz.github.io/learning-aid/assets/spell-sample2.png)

The Spellbee game has been designed to help consolidate how English sounds are written, which can be problematic
with some readers with dyslexia, whose spoken phonology is often secure long before the orthography is.
It was inspired by Elkonin's boxes, which pair phonemes and graphemes — one box per sound or sound group, and the child writes
the grapheme for each into its box. Phonemic awareness taught *with letters* produces significantly larger
reading and spelling gains than the same awareness taught orally [[1]](#references), and bonding graphemes to
phonemes within a word is the mechanism by which its spelling enters long-term word memory [[2]](#references).

The problem words have been carefully designed to be segmented around morpheme boundaries
to follow the complex morphophonemic English orthography rules,
with morphology being the segmentation tool that helps less able and older learners [[3]](#references) [[4]](#references).
Phonics, orthographic rules and morphology are the three approaches with moderate-to-high impact on spelling
in dyslexia; rote memorisation strategies could not be confirmed as effective [[5]](#references).

It focuses on a single grapheme-phoneme (or phoneme group) pair at a time to help committing the link to long-term memory,
scaffolding the rest of the word with a visible word segment bank.
It tracks success rates per pair and returns to segments as needed with spaced training, which
again was shown to have the best effect on learning [[6]](#references) — and is the mechanism-matched
response where the weakness sits at the transition from short- to long-term memory [[7]](#references).

The phonology and pronunciation reflects UK English (RP). Note that Spellbee is a practice aid for home use, not a clinical intervention.

**Further features**

- Fully voiced words, phrases, phonemes and phoneme groups (pre-generated MP3s, falling back to TTS)
- On-screen keyboard with dynamic hit areas
- Visible morpheme boundaries
- Marker links: a silent "e" is joined to the vowel it modifies
- Shuffled segment tiles scaffold word parts except the one being taught
- "?" key reveals the whole bank on demand (counted as help); "💬" key replays the word
- Tap any box to (re)hear its sound to encourage exploration and strengthening sound-grapheme links
- Mastery-driven selection: per-pair success rates decide which pattern is taught next
- Words typed unaided are marked known and come up less often; hesitant or aided solves are rescheduled a few
  questions later
- Avoids visual cluttering and miscueing
- Custom word wrap logic
- Remembers question asked across page refreshes, so a hard word cannot be skipped by reloading


## Maths

![screenshot](https://csirmaz.github.io/learning-aid/assets/count-sample.png)

- Multiple problem generators
- Relative frequencies of problem types set by difficulty level
- Help system that generates a grid, speech, etc. to help with counting
- On-screen keypad
- Segmented teaching of times-tables


## Common, reusable features

Use the common modules to implement new learning tools:

- Simple technologies (HTML5, CSS, JS, jQuery)
- Consists of static files, serve from any simple webserver
- Compatible with touch screens
- Scoring system
- Multiple types of rewards
    - Positive sound & animation feedback after every solution
    - Periodic celebration with confetti
    - Video clips shown as reward (supply your clips)
    - "Level complete" reward
    - Gifts (stickers) awarded about every two levels; list, view and exchange stickers
    - Build your own aquarium with fish and items as rewards
- Text-to-speech support
- Audio playback tools
- Video overlay tools
- In-page dialogs that also work in embedded webviews, where the native ones are suppressed
- Multiple players per browser, each with their own progress, kept in local storage

![screenshot](https://csirmaz.github.io/learning-aid/assets/aquarium.png)


## References

1. Ehri, Nunes, Willows, Schuster, Yaghoub-Zadeh & Shanahan (2001). Phonemic awareness instruction helps children
   learn to read. *Reading Research Quarterly*, 36(3), 250–287.
   [DOI](https://doi.org/10.1598/RRQ.36.3.2)
2. Ehri (2014). Orthographic mapping in the acquisition of sight word reading, spelling memory, and vocabulary
   learning. *Scientific Studies of Reading*, 18(1), 5–21.
   [DOI](https://doi.org/10.1080/10888438.2013.819356)
3. Ehri, Nunes, Stahl & Willows (2001). Systematic phonics instruction helps students learn to read: evidence from
   the National Reading Panel's meta-analysis. *Review of Educational Research*, 71(3), 393–447.
   [DOI](https://doi.org/10.3102/00346543071003393)
4. Bowers, Kirby & Deacon (2010). The effects of morphological instruction on literacy skills.
   *Review of Educational Research*, 80(2), 144–179.
   [DOI](https://doi.org/10.3102/0034654309359353)
5. Galuschka, Görgen, Kalmar, Haberstroh, Schmalz & Schulte-Körne (2020). Effectiveness of spelling interventions
   for learners with dyslexia. *Educational Psychologist*, 55(1), 1–20.
   [DOI](https://doi.org/10.1080/00461520.2019.1659794)
6. Cepeda, Pashler, Vul, Wixted & Rohrer (2006). Distributed practice in verbal recall tasks: a review and
   quantitative synthesis. *Psychological Bulletin*, 132(3), 354–380.
   [DOI](https://doi.org/10.1037/0033-2909.132.3.354)
7. Hachmann, Bogaerts, Szmalec, Woumans, Duyck & Job (2014). Short-term memory for order but not for item
   information is impaired in developmental dyslexia. *Annals of Dyslexia*, 64(2), 121–136.
   [DOI](https://doi.org/10.1007/s11881-013-0089-5)

