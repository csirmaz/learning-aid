# spellbee.html — word list & long-story content

## Word-entry format

Words live between `// [WORDS START]` and `// [WORDS END]` comments as pipe-delimited strings:

```
"level|image_ref|text|class1,class2"
```

- **level**: difficulty. Values `0–10` are normal words / short stories; words from levels ≤ the player's current range are included. Values `≥ MIN_LONGSTORY_LEVEL` flag the entry as belonging to a **long-format story** — see below.
- **image_ref**: how the prompt image is chosen —
  - `@emoji` — the literal emoji is used as the prompt image.
  - `word@emoji` — a named image key, with the emoji as fallback.
  - `word` alone — resolved to an image at runtime by the app's image resolver.
  - `~word` — loads `assets/images/words/<word>` directly, bypassing the resolver.

  Long-story entries typically leave this empty (until per-scene images are added).
- **text**: the prompt sentence; angle-bracket sections `<word>` mark what the child must type. Multiple `<>` regions trigger "story" layout.
- **class tags**: phonics classification (e.g. `lax:e`, `di:ee`, `tense:a`); used by `class_highlight_rules` to visually highlight the phonics pattern in the displayed word and to group questions. The naming convention and the full catalogue of class tags are in [`spellbee-classes.md`](spellbee-classes.md). Long-story entries leave this empty (they are not grouped by phonics).

MP3 files for words are resolved as `assets/sounds/words/<phrase_lowercased_spaces_as_underscores>.mp3`. If absent, TTS is used.

## Long-format stories

Any word whose level is `≥ MIN_LONGSTORY_LEVEL` is treated as one fragment of a long, multi-prompt story. **Story identity is the level number itself**: all consecutive entries sharing the same level form one story, asked in order from start to finish. When `init_wordlist_impl()` finds long-story levels in range it records the start index of each story in `bee.longstory_beginnings`; if this map is non-empty, the question-selection loop switches to "long story mode" — it picks a random story and queues every fragment of that story instead of using the normal phonics-class grouping (see [`agent/question-cycle.md`](question-cycle.md)).

### Authoring a new long story — mechanics

- Pick the **next unused level `≥ MIN_LONGSTORY_LEVEL`** and place all its fragments as a single consecutive block inside the `// [WORDS START]`…`// [WORDS END]` region, after the previous story.
- **One fragment per line**, each a single JS string in the `"level|image_ref|text|class"` shape. The **class field stays empty** for long stories.
- **Escape in-dialogue double quotes as `\"`** so each fragment stays one valid JS string.
- A complete story is an arc of roughly **20–50 fragments**. Audience is KS1/KS2 (5+), British English.
- **Validate after editing:** every fragment has exactly 4 pipe-separated fields, and the whole word array still parses as JS.

### Editorial conventions are maintainer-owned

The *editorial* choices for a new story — how many typing targets (`<word>` regions) per fragment, whether/how much to reuse existing vocabulary, and the style and content constraints for any custom prompt images — are maintainer preferences, not fixed rules of the codebase. **Confirm them with the maintainer before authoring** rather than assuming.
