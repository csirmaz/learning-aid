#!/usr/bin/env node
// Audit segmented problem entries for review (see agent/segmented-review.md).
//
// Usage:  node agent/segmented-audit.js [html-file] [expected-level]
//         defaults: html-file = ../spellbee.html (repo root), expected-level = 20
//
// For every segmented entry (any word whose <…> region contains a '=', at ANY level) it prints
// the target text with each segment resolved to
// its phoneme (marking an explicit '/phoneme' spec with '*', a missing phoneme as '[?]', and a
// segment that resolved to an UNKNOWN phoneme id as '[!x]'), and flags a missing image /
// missing class / missing phoneme, an invalid phoneme, a class tag that is absent from
// class_highlight_rules, or an entry whose level is not the expected-level (segmented problems
// currently all live at that level - see EXPECTED_LEVEL; this may change in future).
// It loads the app's own parser (word_repository, process_word_data,
// get_processed_word, phoneme_sounds, class_highlight_rules, segment_default_phoneme) out of
// the HTML, so the audit always matches runtime behaviour.
//
// It flags structural gaps (missing / invalid phonemes and classes); it does not judge whether
// a valid resolved phoneme is correct for RP - that is the human/LLM review step. Re-run after
// editing to confirm nothing needs work.

const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, '..', 'spellbee.html');
// Every segmented (=) entry is reviewed, at any level - we no longer filter by level. Segmented
// problems currently all live at this one level, so an entry with a '=' anywhere else is reported
// as a finding. This expectation may change in future; override with the 2nd argument if so.
const EXPECTED_LEVEL = String(process.argv[3] || '20');

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
    const rows = [];
    for(const raw of word_repository) {
        if(typeof raw !== 'string') continue;
        const w = process_word_data(raw);
        bee.words = [w]; w.proc_cache = undefined;
        const p = get_processed_word(0);
        if(!p.is_segmented) continue; // review every segmented entry (a '=' in the text), at any level
        const inner = (w.text.match(/<([^>]*)>/) || [])[1] || '';
        const rawsegs = inner.split('=');
        const segs = [];
        let missing = 0, invalid = 0;
        for(let i = 0; i < p.add_words.length; i++) {
            const explicit = (rawsegs[i] || '').indexOf('/') >= 0;
            const ph = p.phonemes[i];
            let tag;
            if(ph === '') { missing++; tag = '?'; }                                    // unmapped: no default and no spec
            else if(phoneme_sounds[ph] === undefined) { invalid++; tag = '!' + ph; }   // resolved to an unknown phoneme id (typo)
            else tag = ph;
            segs.push(p.add_words[i] + '[' + tag + ']' + (explicit ? '*' : ''));
        }
        const badClasses = (w.class || []).filter(c => class_highlight_rules[c] === undefined); // tag absent from class_highlight_rules
        rows.push({
            display: w.text.replace(/<[^>]*>/, '<' + p.add_words.join('=') + '>'),
            segs: segs.join(' '),
            level: String(raw).split('|')[0], // 1st field; flagged below if not the expected level
            missing: missing,
            invalid: invalid,
            badClasses: badClasses,
            noImage: (w.emoji === undefined && w.ref === undefined && w.imgref === undefined),
            noClass: (!w.class || w.class.length === 0)
        });
    }
    return rows;
`;

const fn = new Function('$', 'esc_html', 'shuffle', 'console', 'setTimeout', 'clearTimeout', 'document', 'window',
    code + '\n' + audit);
const rows = fn($, String, a => a, silent, noop, noop, { addEventListener: noop }, {});

let needWork = 0;
for(const r of rows) {
    const flags = [
        r.missing ? r.missing + ' missing-phoneme' : '',
        r.invalid ? r.invalid + ' invalid-phoneme' : '',
        r.badClasses.length ? 'invalid-class:' + r.badClasses.join(',') : '',
        r.level !== EXPECTED_LEVEL ? 'UNEXPECTED-LEVEL:' + r.level + ' (expected ' + EXPECTED_LEVEL + ')' : '',
        r.noImage ? 'NO-IMAGE' : '',
        r.noClass ? 'NO-CLASS' : ''
    ].filter(Boolean).join(', ');
    if(flags) needWork++;
    console.log(r.display);
    console.log('    ' + r.segs + (flags ? '   <<< ' + flags : ''));
}
console.log('\n' + rows.length + ' segmented entries; ' + needWork + ' need work.  (* = explicit /phoneme, [?] = missing, [!x] = unknown phoneme)');
