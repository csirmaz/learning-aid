#!/usr/bin/env node
// Audit segmented problem entries for review (see agent/segmented-review.md).
//
// Usage:  node agent/segmented-audit.js [html-file] [level]
//         defaults: html-file = ../spellbee-new.html (repo root), level = 20
//
// For every entry at the given level it prints the target text with each segment resolved to
// its phoneme (marking an explicit '/phoneme' spec with '*', a missing phoneme as '[?]'), and
// flags a missing image / missing class tag / missing phoneme. It loads the app's own parser
// (word_repository, process_word_data, get_processed_word, phoneme_sounds,
// segment_default_phoneme) out of the HTML, so the audit always matches runtime behaviour.
//
// It only reports gaps; it does not judge whether a resolved phoneme is correct for RP - that
// is the human review step. Re-run after editing to confirm no gaps remain.

const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, '..', 'spellbee-new.html');
const level = String(process.argv[3] || '20');

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
        if(typeof raw !== 'string' || !raw.startsWith(LEVEL + '|')) continue;
        const w = process_word_data(raw);
        bee.words = [w]; w.proc_cache = undefined;
        const p = get_processed_word(0);
        if(!p.is_segmented) continue; // only segmented entries (a '=' in the text) are reviewed here
        const inner = (w.text.match(/<([^>]*)>/) || [])[1] || '';
        const rawsegs = inner.split('=');
        const segs = [];
        let missing = 0;
        for(let i = 0; i < p.add_words.length; i++) {
            const explicit = (rawsegs[i] || '').indexOf('/') >= 0;
            const ph = p.phonemes[i];
            if(ph === '') missing++;
            segs.push(p.add_words[i] + '[' + (ph === '' ? '?' : ph) + ']' + (explicit ? '*' : ''));
        }
        rows.push({
            display: w.text.replace(/<[^>]*>/, '<' + p.add_words.join('=') + '>'),
            segs: segs.join(' '),
            missing: missing,
            noImage: (w.emoji === undefined && w.ref === undefined && w.imgref === undefined),
            noClass: (!w.class || w.class.length === 0)
        });
    }
    return rows;
`;

const fn = new Function('$', 'esc_html', 'shuffle', 'console', 'setTimeout', 'clearTimeout', 'document', 'window',
    code + '\n; const LEVEL = ' + JSON.stringify(level) + ';\n' + audit);
const rows = fn($, String, a => a, silent, noop, noop, { addEventListener: noop }, {});

let needWork = 0;
for(const r of rows) {
    const flags = [r.missing ? r.missing + ' missing-phoneme' : '', r.noImage ? 'NO-IMAGE' : '', r.noClass ? 'NO-CLASS' : ''].filter(Boolean).join(', ');
    if(flags) needWork++;
    console.log(r.display);
    console.log('    ' + r.segs + (flags ? '   <<< ' + flags : ''));
}
console.log('\n' + rows.length + ' level-' + level + ' entries; ' + needWork + ' need work.  (* = explicit /phoneme, [?] = missing)');
