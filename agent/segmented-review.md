# spellbee-new.html — reviewing segmented problem entries

How to review a **segmented** problem entry (a word entry whose `<…>` region is split into
`=`-separated segments, e.g. `"20|@🐘|<e=l=e=ph=a/E=n=t>|ph/f"`). Segmented entries currently
live at **level 20**. For the format itself see [`spellbee-content.md`](spellbee-content.md);
for the phoneme ids see the `phoneme_sounds` object and for class tags
[`spellbee-classes.md`](spellbee-classes.md).

## Per-entry checklist

For each entry `"level|image|text|class"`:

1. **Image** (2nd field). If empty (`"20||…"`), add one that hints at the target word —
   `@<emoji>`, `word@<emoji>`, or a `~file.svg` / named ref (same forms as any word entry).
2. **Class tag** (4th field). If empty, add the appropriate `spelling/phoneme` tag(s) for the
   target word's notable grapheme(s) (see [`spellbee-classes.md`](spellbee-classes.md)). Only
   add when the field is empty — don't churn existing tags.
3. **Phonemes.** Every segment's resolved phoneme must be the correct **Received Pronunciation
   (SSBE)** sound. A segment resolves via its explicit `/phoneme` spec, else via
   `segment_default_phoneme` (`default_phoneme()`), else to `''` (unmapped). Go through **every**
   segment and, wherever the resolved phoneme is missing (`''`) **or wrong for RP**, add/replace
   an explicit `/phoneme` with the correct id from `phoneme_sounds` (e.g. `/ɒ/`→`o`, `/ɔː/`→`O:`,
   `/ɑː/`→`a:`, `/ə/`→`E`, `/ʌ/`→`A`, `/eɪ/`→`eI`, silent→`x`). **Always override a wrong
   default** — the defaults are broad and frequently wrong in context (see below); never leave a
   segment voicing the wrong sound just because a default supplied one.
4. **Mark it.** Append an end-of-line comment `// reviewed` so the line is not re-reviewed.

## Tooling that surfaces gaps

Two `console.error`s fire during page load (open the browser console):

- **`Unknown phoneme "" for segment …`** — from `get_processed_word()`; flags a segment whose
  phoneme is missing from `phoneme_sounds` (i.e. resolves to `''`). These are exactly the
  segments step 3 fills.
- **`Unknown class tag …`** — from `init_wordlist_impl()`; flags a class tag absent from
  `class_highlight_rules` (a typo). `false`-valued entries there are known grouping-only tags.

To enumerate gaps in bulk, run the saved extractor [`segmented-audit.js`](segmented-audit.js):

```
node agent/segmented-audit.js [html-file] [level]     # defaults: spellbee-new.html, level 20
```

It loads the app's own `word_repository` / `process_word_data()` / `get_processed_word()` and
lists, for each **segmented** entry at that level, every segment resolved to its phoneme
(`*` = explicit spec, `[?]` = missing), flagging a missing image / class / phoneme — so the
audit always matches runtime behaviour. It reports gaps only; judging whether a resolved
phoneme is *correct for RP* is the (LLM/human) review step.

Once the edits are decided, apply them with [`apply-line-edits.js`](apply-line-edits.js):

```
node agent/apply-line-edits.js spellbee-new.html edits.json [--dry-run]
```

`edits.json` is an array of `{"old": "<full entry line>", "new": "<edited line>"}` (edits may
also be piped on STDIN with `-`). It is **transactional**: each `old` must occur exactly once
or it writes nothing and lists the offenders, so use the whole line as `old` — including its
trailing `,` and `// reviewed` comment — to keep it unique. Then re-run `segmented-audit.js`
to confirm 0 gaps remain.

**Round-trip:** `segmented-audit.js` (find gaps) → decide RP phonemes/images/classes → append
`// reviewed` and emit `old`→`new` line pairs → `apply-line-edits.js` (commit) → re-audit.

## Judgement notes

- **Reduced / elided vowels.** Unstressed vowels are usually `/ə/` = `E` (e.g. the `a` of
  *elephant*, *distance*). A vowel that is dropped in RP is silent = `x` (e.g. the middle `o`
  of *chocolate* /ˈtʃɒklət/).
- **Same grapheme, context-dependent sound.** `o` is `o` /ɒ/ in *box*, but `A` /ʌ/ in *monkey*,
  *something*; `a` is `ae` /æ/ in *hanging*, `O:` /ɔː/ in *water*, `E` /ə/ in *distance*. Judge
  by the word, not the letter — the class tag on the entry is for grouping and may differ.
- **No single-phoneme match.** Syllabic endings like the `al` /əl/ of *crystal* have no single
  ascii phoneme; approximate with the schwa `E` and flag for a maintainer decision.
- **`-ed` endings** are `Id` /ɪd/ only after t/d (*wanted*); otherwise `/t/`=`t` after a
  voiceless sound (*walked*) or `/d/`=`d` after a voiced one (*mentioned*).
- **Common wrong defaults to watch.** `e`→`/e/` is wrong for the many reduced `e`s that are
  `/ɪ/` (*market, kitchen, elephant*'s 2nd `e`, *express*'s 1st `e`) or `/ə/` (*wooden, garden,
  different*); `u`→`/ʊ/` is wrong for the usual `/ʌ/` (*lunch*); `oo`→`/uː/` is wrong for the
  `/ʊ/` of *foot/book*; `y`→`/ɪ/` is wrong when `y` is the consonant `/j/` (*young*); `s`→`/s/`
  is wrong for a voiced plural `/z/` (*windows*); `n`→`/n/` is `/ŋ/` before k/g (*monkey*).
- **Fix wrong explicit specs too.** A clearly-wrong explicit spec is corrected, not just flagged
  (e.g. *walked*'s `-ed` is `/t/` after /k/, not `/d/`).
