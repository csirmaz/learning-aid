#!/usr/bin/env node
// Copyright (C) 2025-2026 Elod Pal Csirmaz
// SPDX-License-Identifier: GPL-3.0-or-later
// Audit segmented problem entries for review (see agent/segmented-review.md).
//
// Usage:  node agent/segmented-audit.js [html-file]
//         default: html-file = ../spellbee.html (repo root)
//
// Entry format is "<image>|<phrase>" or "<image>|<phrase>|<class>" (there is no level field). For
// every segmented entry (any problem whose <…> region contains a '=') it prints the word-to-type with
// each segment resolved to its phoneme (marking an explicit '/phoneme' spec with '*', a missing
// phoneme as '[?]', a segment that resolved to an UNKNOWN phoneme id as '[!x]', and a marker
// link '/X' with a trailing '~'), and flags a missing phoneme, an invalid phoneme, a marker
// link with no target box two segments to its left ('link-no-target'), and — once the GP-pair
// registries are populated — a GP pair that is in neither class_gp_pairs nor
// other_gp_pairs ('unknown-pair', mirroring the app's own check in init_problem_list_impl).
//
// A missing image is NOT a gap: for a non-picturable problem an empty image is the correct final
// state, and telling those apart from "not done yet" is a human/LLM judgement (see
// agent/segmented-review.md), so the audit does not flag it. An empty class field is likewise NOT a
// gap: CLASSES are auto-derived from the segments' GP pairs, so most entries carry no
// class field at all.
//
// A '/X' link folds to the silent phoneme 'x' at runtime, so it is a valid phoneme, not a gap;
// this audit only checks its structure (that a vowel box exists two segments to its left). Whether
// '/X' is the right call - i.e. that vowel is voicing its free alternate - is the human/LLM
// review step (see agent/segmented-review.md), same as judging any phoneme's RP correctness.
//
// It loads the app's own parser out of the HTML — problem_repository, process_problem_data (which
// caches the processed problem on problem_data.proc_cache), phoneme_sounds, default_phoneme, and
// the class_gp_pairs / other_gp_pairs registries — so the audit always matches runtime behaviour.
//
// It flags structural gaps (missing / invalid phonemes, unknown pairs); it does not judge whether
// a valid resolved phoneme is correct for RP - that is the human/LLM review step. Re-run after
// editing to confirm nothing needs work.

const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, '..', 'spellbee.html');

const html = fs.readFileSync(file, 'utf8');

// Concatenate the inline <script> blocks that define the problem data + parser (skip a lone
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
    // GP pairs are validated only once the registries hold entries — they are empty
    // during the class-system rebuild, and flagging every pair would drown the phoneme gaps. When
    // empty, GP-pair validation is inactive (reported below).
    const pairs_active = (Object.keys(class_gp_pairs).length + Object.keys(other_gp_pairs).length) > 0;
    const rows = [];
    for(const raw of problem_repository) {
        if(typeof raw !== 'string') continue;
        const w = process_problem_data(raw);   // parses "image|phrase[|class]" and caches on w.proc_cache
        const p = w.proc_cache;
        if(!p.is_segmented) continue; // review every segmented entry (a '=' in the text)
        const inner = (w.text.match(/<([^>]*)>/) || [])[1] || '';
        const rawsegs = inner.split(/=+/); // '=+' so a '==' morpheme boundary collapses to one split, staying aligned with the segments array
        const segs = [];
        let missing = 0, invalid = 0, badLinks = 0;
        const badPairs = [];
        for(let i = 0; i < p.segments.length; i++) {
            const explicit = (rawsegs[i] || '').indexOf('/') >= 0;
            const link = !!(p.connectors && p.connectors[i]); // '/X' marker link
            if(link && i < 2) { badLinks++; }                 // link needs a vowel box two segments to its left
            const ph = p.phonemes[i];
            let tag;
            if(ph === '') { missing++; tag = '?'; }                                    // unmapped: no default and no spec
            else if(phoneme_sounds[ph] === undefined) { invalid++; tag = '!' + ph; }   // resolved to an unknown phoneme id (typo)
            else tag = ph;
            // GP pair, exactly as the app derives it for class assignment / validation, via the
            // app's own seg_gp_pair (in scope from the concatenated script). Grapheme lower-cased
            // (so sentence-initial capitals like "S" in "Saturday" resolve to the same pair as
            // mid-sentence) and split-digraph aware: a vowel marked by a '/X' silent "e" two boxes
            // on becomes "<vowel>.e/<phoneme>", e.g. "i.e/aI" for "tide" - matching init_problem_list_impl.
            const gp_pair = seg_gp_pair(p, i);
            if(pairs_active && class_gp_pairs[gp_pair] === undefined && other_gp_pairs[gp_pair] === undefined) { badPairs.push(gp_pair); }
            segs.push(p.segments[i] + '[' + tag + ']' + (explicit ? '*' : '') + (link ? '~' : ''));
        }
        rows.push({
            display: w.text.replace(/<[^>]*>/, '<' + p.segments.join('=') + '>'),
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
console.log('\n' + rows.length + ' segmented entries; ' + needWork + ' need work.  (* = explicit /phoneme, ~ = marker link /X, [?] = missing, [!x] = unknown phoneme)'
    + (result.pairs_active ? '' : '\nNote: class_gp_pairs / other_gp_pairs are empty — GP pair validation is inactive.'));
