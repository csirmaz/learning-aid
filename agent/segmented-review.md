# spellbee.html — reviewing segmented problem entries

How to review a **segmented** problem entry (a word entry whose `<…>` region is split into
`=`-separated segments, e.g. `"@🐘|<e=l=e/I=ph/f=a/E=n=t>"`). **Every** entry whose text contains a
`=` is in scope. For the entry format see [`spellbee-content.md`](spellbee-content.md); for the
phoneme ids see the `phoneme_sounds` object; for how classes are derived from the segments see
[`spellbee-classes.md`](spellbee-classes.md).

## Per-entry checklist

For each entry `"image|text|class"` (the `class` field is optional and usually absent):

1. **Image** (1st field). If empty (`"|…"`) **and the target word is picturable**, add one that
   hints at the word — `@<emoji>`, `word@<emoji>`, or a `~file.svg` / named ref (same forms as any
   word entry). The picture must denote the **specific** target — for a homophone, specifically
   enough to distinguish it (a *sea* scene for `sea`, not `see`).
   **Only picture what is picturable.** A word with no clear, unambiguous depiction — abstract and
   function words (*were, this, just, because, very, of*) — is **left imageless**: a vague or
   miscuing picture is worse than none. An empty image on such a word is a valid **final** state,
   not an omission — so confirm the word is genuinely not picturable, then leave the field empty
   and mark the line reviewed. The audit does **not** flag a missing image (it can't tell "not done
   yet" from "deliberately none"), so an empty image never shows as needing work — judging
   picturability is this review step's job, not the audit's.
2. **Classes.** Normally nothing to do — classes are derived automatically from the segments'
   grapheme/phoneme pairs (see [`spellbee-classes.md`](spellbee-classes.md)), so getting the
   phonemes right (step 3) is what makes the classes right. Add an explicit `class` field (last,
   optional) only for a grouping auto-derivation can't produce, and don't churn existing ones.
3. **Phonemes.** Every segment's resolved phoneme must be the correct **Received Pronunciation
   (SSBE)** sound. A segment resolves via its explicit `/phoneme` spec, else via
   `segment_default_phoneme` (`default_phoneme()`), else to `''` (unmapped). Go through **every**
   segment and, wherever the resolved phoneme is missing (`''`) **or wrong for RP**, add/replace
   an explicit `/phoneme` with the correct id from `phoneme_sounds` (e.g. `/ɒ/`→`o`, `/ɔː/`→`O:`,
   `/ɑː/`→`a:`, `/ə/`→`E` (`Er` for an `-er` ending), `/ʌ/`→`A`, `/eɪ/`→`eI`, silent→`x`). **Always override a wrong
   default** — the defaults are broad and frequently wrong in context (see below); never leave a
   segment voicing the wrong sound just because a default supplied one.
   - **Split-digraph link `/X`.** A silent split-digraph "e" that lengthens the vowel **two boxes
     to its left** (one consonant box between them, e.g. `<h=o/EU=m=e/X>`) may be spec'd `/X`
     (capital) instead of `/x`: it is silent exactly like `/x` but also draws a linking line back
     to the vowel box in the UI. Use `/X` only when the vowel is genuinely tensed by the e (`eI`,
     `i:`, `aI`, `EU`, `ju:`, `u:`); leave r-controlled or reduced vowels (horse, come, chocolate)
     as plain `/x`. It folds to `x`, so the audit still sees a valid phoneme — **do not "correct"
     `/X` back to `/x`.**
   - **Morpheme boundary `==`.** A `==` used in place of a `=` separator marks a morpheme boundary:
     it splits segments exactly like `=` but also draws a thin vertical divider bar between the two
     boxes (e.g. `<m=i=c=r=o==s=c=o=p=e>` → `micro|scope`). It is purely presentational — it changes
     no phoneme, class, segment count or level — so **do not "correct" `==` back to `=`.** Use it only
     where a morpheme seam falls **between** boxes; a seam that falls *inside* a box (the doubled `nn`
     of *running* `r=u=nn=ing`, kept whole to preserve `ing`) gets no bar. Boxes stay per-grapheme — a
     morpheme is never collapsed into one box. The audit treats `==` as one separator (no special work).
4. **Mark it.** Append an end-of-line comment `// reviewed` so the line is not re-reviewed.

## Tooling that surfaces gaps

Two `console.error`s fire during page load (open the browser console):

- **`Unknown phoneme "" for segment …`** — from `process_word_internals()` (which caches the
  processed word on `word_data.proc_cache`); flags a segment whose phoneme is missing from
  `phoneme_sounds` (i.e. resolves to `''`). These are exactly the segments step 3 fills.
- **`Unknown grapheme/phoneme pair …`** — from `init_wordlist_impl()`; flags a segment's
  `grapheme/phoneme` pair that is in neither `gp_grouping_pairs` nor `gp_other_pairs` (a typo, or a
  new pattern to classify).

To enumerate gaps in bulk, run the saved extractor [`segmented-audit.js`](segmented-audit.js):

```
node agent/segmented-audit.js [html-file]   # default: spellbee.html
```

It loads the app's own `word_repository` / `process_word_data()` (which caches the processed word on
`word_data.proc_cache`) / `phoneme_sounds` / `gp_grouping_pairs` / `gp_other_pairs` and lists, for
**every** segmented entry (any whose text contains a `=`), every segment resolved to its phoneme
(`*` = explicit spec, `~` = a `/X` split-digraph link, `[?]` = missing, `[!x]` = resolved to an
unknown phoneme id), flagging a **missing phoneme**, an **invalid phoneme**, a **`/X` link with no
target box two segments to its left** (`link-no-target`), or a **grapheme/phoneme pair in neither
registry** (`unknown-pair`) — so the audit always matches runtime behaviour. (Pair validation is
inactive while both registries are empty; the tool notes this.) It reports
structural gaps only; judging whether a *valid* resolved phoneme is *correct for RP* — or whether
a `/X` link is warranted (the vowel is genuinely tensed by the silent e) — is the (LLM/human)
review step, and **arguable specs are put to the maintainer** (see Judgement notes). A **missing
image is not a gap** and is not flagged: for a non-picturable word (step 1) an empty image is the
correct final state, so judging picturability is the review step's job, not the audit's.

Once the edits are decided, apply them with [`apply-line-edits.js`](apply-line-edits.js):

```
node agent/apply-line-edits.js spellbee.html edits.json [--dry-run]
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
  *elephant*, *distance*), but an unstressed **`-er` ending** is its own phoneme **`Er`**
  (*teacher, water, rapper*) — and `er`→`Er` is a default, so an `er` segment resolves to `Er`
  without a spec. A vowel that is dropped in RP is silent = `x` (e.g. the middle `o` of
  *chocolate* /ˈtʃɒklət/).
- **Same grapheme, context-dependent sound.** `o` is `o` /ɒ/ in *box*, but `A` /ʌ/ in *monkey*,
  *something*; `a` is `ae` /æ/ in *hanging*, `O:` /ɔː/ in *water*, `E` /ə/ in *distance*. Judge
  by the word, not the letter — the phoneme you set for a segment is exactly what its derived
  `grapheme/phoneme` class becomes, so a right phoneme is a right class.
- **Syllabic `l` endings.** A syllabic `-al`/`-el`/`-le`/`-ol` /əl/ (as in *capital*, *portal*,
  *table*, *symbol*, *crystal*) is voiced with the dedicated **`sl`** phoneme ("syllabic l") —
  e.g. `<c=a=p=i=t=al/sl>`, `<t=a=b=le/sl>`. This is the maintainer's standing choice — do not use
  `l`, `E`, or `O:` for these (`O:` is only for true `all` /ɔːl/ words like *call*/*tall*/*wall*).
  Watch for the transposition typo `ls` (invalid — the audit flags it `[!ls]`).
- **Other no-single-phoneme matches.** For any *other* ending with no clean ascii phoneme,
  approximate with the nearest id and flag for a maintainer decision.
- **`-ed` endings** are `Id` /ɪd/ only after t/d (*wanted*); otherwise `/t/`=`t` after a
  voiceless sound (*walked*) or `/d/`=`d` after a voiced one (*mentioned*).
- **Plural / 3rd-person `-s` on a `/t/`-final base stays two segments** — `t` + `s`, never a
  merged `/ts/` (e.g. *boots* `<b=oo/u:=t=s/s>`, *cats* `<c=a=t=s/s>`). English has no `/ts/`
  phoneme: the [ts] here is `/t/`+`/s/` across a morpheme boundary, so splitting it keeps the base
  word intact and the regular plural pattern visible (`s`→`s` after a voiceless sound, `s`→`z`
  after a voiced one — see *windows* above). Merge into a `ts` affricate **only** when the [ts] is
  *tautomorphemic* (inside one morpheme, e.g. *pizza*, *tsar*), and only if a `ts` id exists — it
  currently does not, so a word like *pizza* is the sole motivation for ever adding one.
- **Common wrong defaults to watch.** `e`→`/e/` is wrong for the many reduced `e`s that are
  `/ɪ/` (*market, kitchen, elephant*'s 2nd `e`, *express*'s 1st `e`) or `/ə/` (*wooden, garden,
  different*); `u`→`/ʊ/` is wrong for the usual `/ʌ/` (*lunch*); `oo`→`/uː/` is wrong for the
  `/ʊ/` of *foot/book*; `y`→`/ɪ/` is wrong when `y` is the consonant `/j/` (*young*); `s`→`/s/`
  is wrong for a voiced plural `/z/` (*windows*); `n`→`/n/` is `/ŋ/` before k/g (*monkey*).
- **Fix wrong explicit specs too.** A clearly-wrong explicit spec is corrected, not just flagged
  (e.g. *walked*'s `-ed` is `/t/` after /k/, not `/d/`).
- **Ask the maintainer about arguable specs.** Where a segment's RP phoneme is genuinely
  uncertain — a weak vowel that could be `/ɪ/`=`I` or `/ə/`=`E`, or a variant pronunciation
  (e.g. *during* `u` = `ju:` vs a `UE`-type value, *real* `ea` = `i:` vs `IE`) — **do not decide
  silently**: ask the maintainer and apply their choice. This is a standing preference.
