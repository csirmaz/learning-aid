#!/usr/bin/env node
// Apply a set of exact string replacements to a file (see agent/segmented-review.md).
//
// Usage:  node agent/apply-line-edits.js <target-file> [edits.json] [--dry-run]
//         edits default to STDIN if the file arg is omitted or '-'.
//
// The edits are a JSON array; each item is either {"old": "...", "new": "..."} or ["old","new"].
// Each 'old' must occur EXACTLY ONCE in the target (make it unique by using the whole entry line,
// including its trailing `,` and any `// reviewed` comment). The tool is transactional:
//   - it first checks every 'old' occurs exactly once (0 = not found, >1 = ambiguous),
//   - if any check fails it writes NOTHING and lists the offenders (fix and re-run the whole set),
//   - otherwise it applies all replacements and writes (unless --dry-run).
// Intended for LLM-judged review edits: the model emits old->new line pairs, this applies them
// safely. Pairs with old === new are treated as no-ops.
//
// Example:
//   node agent/apply-line-edits.js spellbee.html - --dry-run <<'JSON'
//   [{"old":"\"20|@🐘|<e=l=e=ph=a=n=t>|ph/f\", // reviewed",
//     "new":"\"20|@🐘|<e=l=e/I=ph=a/E=n=t>|ph/f\", // reviewed"}]
//   JSON

const fs = require('fs');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const rest = args.filter(a => a !== '--dry-run');
const target = rest[0];
const editsSrc = rest[1] || '-';

if(!target) {
    console.error('usage: node agent/apply-line-edits.js <target-file> [edits.json|-] [--dry-run]');
    process.exit(2);
}

let editsRaw;
try {
    editsRaw = fs.readFileSync(editsSrc === '-' ? 0 : editsSrc, 'utf8');
} catch(e) {
    console.error('cannot read edits (' + editsSrc + '): ' + e.message);
    process.exit(2);
}

let edits;
try {
    edits = JSON.parse(editsRaw);
} catch(e) {
    console.error('edits are not valid JSON: ' + e.message);
    process.exit(2);
}
if(!Array.isArray(edits)) { console.error('edits must be a JSON array'); process.exit(2); }

// Normalise to {old, new}
edits = edits.map((e, i) => {
    if(Array.isArray(e)) return { old: e[0], new: e[1] };
    if(e && typeof e === 'object') return { old: e.old, new: e.new };
    throw new Error('edit #' + i + ' is not an object or [old,new] pair');
});

let content = fs.readFileSync(target, 'utf8');

// Verify each 'old' occurs exactly once (transactional pre-check).
const problems = [];
edits.forEach((e, i) => {
    if(typeof e.old !== 'string' || typeof e.new !== 'string') { problems.push('edit #' + i + ': old/new must be strings'); return; }
    const count = content.split(e.old).length - 1;
    if(count === 0) problems.push('edit #' + i + ': NOT FOUND -> ' + JSON.stringify(e.old.slice(0, 80)));
    else if(count > 1) problems.push('edit #' + i + ': AMBIGUOUS (' + count + ' matches) -> ' + JSON.stringify(e.old.slice(0, 80)));
});

if(problems.length) {
    console.error('Aborted, nothing written. ' + problems.length + ' problem(s):');
    problems.forEach(p => console.error('  ' + p));
    process.exit(1);
}

// Apply (each old is unique, so split/join replaces exactly that occurrence).
let changed = 0, noop = 0;
for(const e of edits) {
    if(e.old === e.new) { noop++; continue; }
    content = content.split(e.old).join(e.new);
    changed++;
}

if(dryRun) {
    console.log('[dry-run] ' + changed + ' edit(s) would apply, ' + noop + ' no-op(s); nothing written.');
} else {
    fs.writeFileSync(target, content);
    console.log('applied ' + changed + ' edit(s), ' + noop + ' no-op(s) -> ' + target);
}
