#!/usr/bin/env node
// Audit segmented problem entries for review (see agent/segmented-review.md).
//
// Usage:  node agent/segmented-audit.js [html-file]
//         default: html-file = ../spellbee.html (repo root)
//
// Entry format is "<image>|<phrase>" or "<image>|<phrase>|<class>" (there is no level field). For
// every segmented entry (any word whose <…> region contains a '=') it prints the target text with
// each segment resolved to its phoneme (marking an explicit '/phoneme' spec with '*', a missing
// phoneme as '[?]', a segment that resolved to an UNKNOWN phoneme id as '[!x]', and a split-digraph
// link '/X' with a trailing '~'), and flags a missing phoneme, an invalid phoneme, a split-digraph
// link with no target box two segments to its left ('link-no-target'), and — once the pair
// registries are populated — a grapheme/phoneme pair that is in neither gp_grouping_pairs nor
// gp_other_pairs ('unknown-pair', mirroring the app's own check in init_wordlist_impl).
//
// A missing image is NOT a gap: for a non-picturable word an empty image is the correct final
// state, and telling those apart from "not done yet" is a human/LLM judgement (see
// agent/segmented-review.md), so the audit does not flag it. An empty class field is likewise NOT a
// gap: classes are auto-derived from the segments' grapheme/phoneme pairs, so most entries carry no
// class field at all.
//
// A '/X' link folds to the silent phoneme 'x' at runtime, so it is a valid phoneme, not a gap;
// this audit only checks its structure (that a vowel box exists two segments to its left). Whether
// '/X' is the right call - i.e. the vowel is genuinely tensed by the silent e - is the human/LLM
// review step (see agent/segmented-review.md), same as judging any phoneme's RP correctness.
//
// It loads the app's own parser out of the HTML — word_repository, process_word_data (which caches
// the processed word on word_data.proc_cache), phoneme_sounds, default_phoneme, and the
// gp_grouping_pairs / gp_other_pairs registries — so the audit always matches runtime behaviour.
//
// It flags structural gaps (missing / invalid phonemes, unknown pairs); it does not judge whether
// a valid resolved phoneme is correct for RP - that is the human/LLM review step. Re-run after
// editing to confirm nothing needs work.

const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, '..', 'spellbee.html');

const html = fs.readFileSync(file, 'utf8');

// Concatenate the inline <script> blocks that define the word data + parser (skip a lone
// bootstrap() call and any external src= scripts, which would need a real browser).
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
let m, code = '';
while((m = re.exec(html)) !== null) {
    if(/^\s*bootstrap\(\)\s*;?\s*$/.test(m[1])) continue;
    code += m[1] + '\n';
}

// Minimal browser mocks so the app scripts evaluate under Node.
const $ = function(a) {
    if(typeof a === 'function') return undefined; // ignore DOM-ready callbacks
    const o = new Proxy(function(){ return o; }, {
        get: (t, p) => (p === 'length' ? 0 : (p === 'text' ? () => '' : (p === 'hasClass' ? () => false : o))),
        apply: () => o
    });
    return o;
};
const noop = () => {};
const silent = { log: noop, warn: noop, error: noop }; // silence the app's own console.* during load

const audit = `
    // Grapheme/phoneme pairs are validated only once the registries hold entries — they are empty
    // during the class-system rebuild, and flagging every pair would drown the phoneme gaps. When
    // empty, pair validation is inactive (reported below).
    const pairs_active = (Object.keys(gp_grouping_pairs).length + Object.keys(gp_other_pairs).length) > 0;
    const rows = [];
    for(const raw of word_repository) {
        if(typeof raw !== 'string') continue;
        const w = process_word_data(raw);   // parses "image|phrase[|class]" and caches on w.proc_cache
        const p = w.proc_cache;
        if(!p.is_segmented) continue; // review every segmented entry (a '=' in the text)
        const inner = (w.text.match(/<([^>]*)>/) || [])[1] || '';
        const rawsegs = inner.split(/=+/); // '=+' so a '==' morpheme boundary collapses to one split, staying aligned with add_words
        const segs = [];
        let missing = 0, invalid = 0, badLinks = 0;
        const badPairs = [];
        for(let i = 0; i < p.add_words.length; i++) {
            const explicit = (rawsegs[i] || '').indexOf('/') >= 0;
            const link = !!(p.connectors && p.connectors[i]); // '/X' split-digraph link
            if(link && i < 2) { badLinks++; }                 // link needs a vowel box two segments to its left
            const ph = p.phonemes[i];
            let tag;
            if(ph === '') { missing++; tag = '?'; }                                    // unmapped: no default and no spec
            else if(phoneme_sounds[ph] === undefined) { invalid++; tag = '!' + ph; }   // resolved to an unknown phoneme id (typo)
            else tag = ph;
            // grapheme/phoneme pair, exactly as the app derives it for grouping/validation
            // (grapheme lower-cased, matching init_wordlist_impl, so sentence-initial capitals
            // like "S" in "Saturday" resolve to the same pair as mid-sentence)
            const pair = p.add_words[i].toLowerCase() + '/' + ph;
            if(pairs_active && gp_grouping_pairs[pair] === undefined && gp_other_pairs[pair] === undefined) { badPairs.push(pair); }
            segs.push(p.add_words[i] + '[' + tag + ']' + (explicit ? '*' : '') + (link ? '~' : ''));
        }
        rows.push({
            display: w.text.replace(/<[^>]*>/, '<' + p.add_words.join('=') + '>'),
            segs: segs.join(' '),
            missing: missing,
            invalid: invalid,
            badLinks: badLinks,
            badPairs: badPairs
        });
    }
    return { rows: rows, pairs_active: pairs_active };
`;

const fn = new Function('$', 'esc_html', 'shuffle', 'console', 'setTimeout', 'clearTimeout', 'document', 'window',
    code + '\n' + audit);
const result = fn($, String, a => a, silent, noop, noop, { addEventListener: noop }, {});
const rows = result.rows;

let needWork = 0;
for(const r of rows) {
    const flags = [
        r.missing ? r.missing + ' missing-phoneme' : '',
        r.invalid ? r.invalid + ' invalid-phoneme' : '',
        r.badLinks ? r.badLinks + ' link-no-target' : '',
        r.badPairs.length ? 'unknown-pair:' + r.badPairs.join(',') : ''
    ].filter(Boolean).join(', ');
    if(flags) needWork++;
    console.log(r.display);
    console.log('    ' + r.segs + (flags ? '   <<< ' + flags : ''));
}
console.log('\n' + rows.length + ' segmented entries; ' + needWork + ' need work.  (* = explicit /phoneme, ~ = split-digraph link /X, [?] = missing, [!x] = unknown phoneme)'
    + (result.pairs_active ? '' : '\nNote: gp_grouping_pairs / gp_other_pairs are empty — grapheme/phoneme pair validation is inactive.'));
