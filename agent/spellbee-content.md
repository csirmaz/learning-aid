# spellbee.html — problem list content

## Problem-entry format

Problems live between `// [PROBLEMS START]` and `// [PROBLEMS END]` comments as pipe-delimited
strings:

```
"image_ref|text|class1,class2"
```

- **image_ref**: how the prompt image is chosen —
  - `@emoji` — the literal emoji is used as the prompt image.
  - `word@emoji` — a named image key, with the emoji as fallback.
  - `word` alone — resolved to an image at runtime by the app's image resolver.
  - `~word` — loads `assets/images/words/<word>` directly, bypassing the resolver.
  - empty — no image (correct final state for non-picturable problems; see [`segmented-review.md`](segmented-review.md)).
- **text**: the prompt sentence; angle-bracket sections `<…>` mark the **word-to-type** (`wordtt`) — what the child must produce. Multiple `<>` regions trigger "story" layout; a `<…>` region split into `=`-separated segments is a **segmented** entry (see [`segmented-review.md`](segmented-review.md)). Within a segmented region a `==` separator (in place of `=`) also marks a **morpheme boundary**, drawn as a thin vertical divider bar between those two boxes (e.g. `<m=i=c=r=o==s=c=o=p=e>` → `micro|scope`). It splits segments exactly like `=`, so it never merges a morpheme into one box and does not change the segment count (hence level).
- **class** *(optional trailing field)*: explicit phonics CLASSES. Normally omitted — classes are **derived automatically** from a segmented entry's GP pairs (see [`spellbee-classes.md`](spellbee-classes.md)). An explicit comma-separated list is merged with the derived ones and is used only where auto-derivation doesn't classify as wanted (currently just `calendar` and `end:ly`).

**A disabled problem is the literal `false`** in place of the entry string: `init_problem_list_impl()`
keeps its slot in `bee.problem_list` (as `false`), gives it no classes and zero selection weight, and
`new_question()` discards a queued reference to it. Retire a problem this way rather than deleting
the entry — deletion shifts every index below it, and players' persisted question queues store
indices.

**Level (difficulty) is derived, not written.** `init_problem_list_impl()` sets each entry's `level` to its number of segments (`proc_cache.segments.length`); `choose_using_levels20` then weights selection by `bee.level_weight_base^(-level)`, so shorter words-to-type come up more often. There is no longer a `level` field, and the player's level range no longer filters the list (`init_problem_list_impl`'s `min`/`max` args are currently unused — see its TODO).

MP3 files are resolved as `assets/sounds/words/<phrase_lowercased_spaces_as_underscores>.mp3`. If absent, TTS is used.

## Long-format stories — removed

The long-format ("long") story feature — entries at level `≥ 100` queued as one consecutive
multi-prompt story — was **removed** on 2026-07-19. Its design, the code symbols it used, its entry
format, and its authoring mechanics are preserved in [`removed-features.md`](removed-features.md) in
case it is restored. (The separate multi-`<…>` "story" layout noted above still exists.)
