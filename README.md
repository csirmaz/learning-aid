# learning-aid

Reusable web-based tools to help KS1 and KS2 children (5 years and up) with maths and literacy.

## Pages

- Literacy: https://csirmaz.github.io/learning-aid/spellbee.html
- Arithmetic: https://csirmaz.github.io/learning-aid/count.html

## Literacy

![screenshot](https://csirmaz.github.io/learning-aid/assets/spell-sample2.png)

The Spellbee game was designed to help consolidate how English sounds are written, 
which can be problematic with some readers with dyslexia.
It was inspired by Elkonin's boxes, which pair phonemes and graphemes (one box per sound or sound group, and the child writes
the grapheme for each into its box), and which was shown to result in larger gains than e.g. awareness taught orally.

The problem words have been carefully designed to be segmented around morpheme boundaries
to follow the complex morphophonemic English orthography rules.
Morphology has also been shown to be the segmentation tool that helps less able and older learners.

The app focuses on a single grapheme-phoneme (or phoneme group) pair at a time to help committing the link to long-term memory,
scaffolding the rest of the word with a visible word segment bank.
It tracks success rates per pair and returns to segments as needed with spaced training, which
again was shown to have the best effect on learning.

The phonology and pronunciation reflects UK English (non-rhotic Southern). Note that Spellbee is a practice aid for home use, not a clinical intervention.

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


