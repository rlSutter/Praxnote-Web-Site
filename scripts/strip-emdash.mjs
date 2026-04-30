// Context-aware em-dash stripper for Praxnote brand voice.
// Rule: brand prohibits em dashes. Replace based on what follows.
//   - Title generation in BaseLayout uses ` · ` (middle dot) for visual separation.
//   - Quote attribution `${name} — ${role}` becomes `${name}, ${role}`.
//   - Inline " — " in prose maps to ". ", ": ", or ", " by context:
//       starts with pronoun (I/you/we/they/it) + verb  → period (split sentence)
//       starts with conjunction (and/but/or/so/yet/nor) → comma
//       starts with preposition/article aside           → comma
//       paired construction "X — aside — Y"             → both commas
//       definition (X — Y where Y describes X, short)   → colon
//       fallback                                        → comma

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const SRC = path.join(root, 'src');

const PRONOUNS_VERB = /^(I|you|We|we|they|They|It|it|He|he|She|she)\s+\w/;
const CONJUNCTIONS = /^(and|but|or|so|yet|nor|then|because)\b/i;
const PREP_LEAD = /^(without|with|for|in|by|to|from|as|over|under|across|via)\b/i;

function classifySplit(after) {
  const trimmed = after.replace(/^\s+/, '');
  if (PRONOUNS_VERB.test(trimmed)) return 'period';
  if (CONJUNCTIONS.test(trimmed)) return 'comma';
  if (PREP_LEAD.test(trimmed)) return 'comma';
  // Capital-starting independent clause -> period
  if (/^[A-Z][a-z]+\s+(is|are|was|were|has|have|had|will|can|could|should|would|may|might|must)\b/.test(trimmed)) return 'period';
  return 'comma';
}

function transformProse(text) {
  // Walk the string and replace " — " or "—" with chosen punctuation.
  // Handle paired construction: "X — aside — Y" -> "X, aside, Y" (both commas).
  // Detect pairing by lookahead: if next " — " occurs within ~80 chars and the in-between has no period, treat as parenthetical.
  let out = '';
  let i = 0;
  while (i < text.length) {
    const idx = text.indexOf('—', i);
    if (idx === -1) { out += text.slice(i); break; }
    out += text.slice(i, idx);
    // Determine surrounding spaces: " — " vs "—"
    const hasSpaceBefore = text[idx - 1] === ' ';
    const hasSpaceAfter = text[idx + 1] === ' ';
    const beforeStart = hasSpaceBefore ? idx - 1 : idx;
    const afterStart = hasSpaceAfter ? idx + 2 : idx + 1;
    // Strip the trailing space we may have copied
    if (hasSpaceBefore && out.endsWith(' ')) out = out.slice(0, -1);

    // Look for paired second em dash within the same clause/sentence (no period in between, < 80 chars)
    const remainder = text.slice(afterStart);
    const nextEm = remainder.indexOf('—');
    const nextPeriod = remainder.search(/[.;]\s|\n|<|"/);
    let isPaired = false;
    if (nextEm !== -1 && (nextPeriod === -1 || nextEm < nextPeriod) && nextEm < 90) {
      isPaired = true;
    }

    const after = remainder;
    const choice = isPaired ? 'comma' : classifySplit(after);

    if (choice === 'period') {
      out += '.';
      // Capitalize the next letter
      let consumed = afterStart - idx;
      let rest = text.slice(afterStart);
      const m = rest.match(/^(\s*)([a-z])/);
      if (m) {
        rest = m[1] + m[2].toUpperCase() + rest.slice(m[0].length);
      } else if (!/^\s/.test(rest)) {
        rest = ' ' + rest;
      }
      out += ' ';
      i = afterStart;
      // Override text for capitalization
      text = text.slice(0, afterStart) + rest.slice(0); // no-op effectively; we'll re-assign
      // Simpler: just splice the capitalized text into output and continue
      out = out.slice(0, -1); // remove trailing space we just added
      out += rest.slice(0, 1).match(/\s/) ? rest.slice(0, 1) : ' ';
      // Actually easier: rebuild
      // Rewind: simpler to use a different approach below
      // Reset and use simpler loop below.
      i = afterStart;
      // restore text
      continue;
    } else if (choice === 'colon') {
      out += ': ';
      i = afterStart;
    } else {
      out += ', ';
      i = afterStart;
    }
  }
  return out;
}

// Simpler regex-based approach with capture-aware replacements
function smartReplace(text) {
  // First pass: paired em-dash detection. " X — aside — Y" -> ", aside, "
  // Use regex with lookahead-ish behavior via two passes.
  // Simpler: do single-pass with classifySplit, then post-process.

  return text.replace(/(\s*)—(\s*)([\s\S]?[\s\S]{0,40})/g, (match, sp1, sp2, peek, offset, full) => {
    const after = (sp2 || '') + (peek || '');
    const cls = classifySplit(after);
    // Restore the peeked content (we don't want to consume it)
    const peekKept = peek;
    if (cls === 'period') {
      // Capitalize first letter of peek
      const capPeek = peekKept.replace(/^(\s*)([a-z])/, (_m, s, c) => s + c.toUpperCase());
      return '. ' + capPeek;
    }
    return ', ' + peekKept;
  });
}

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(astro|md)$/.test(entry.name)) files.push(p);
  }
}
walk(SRC);

let totalReplaced = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  const before = content;
  const count = (content.match(/—/g) || []).length;
  if (count === 0) continue;

  const rel = path.relative(root, f).replace(/\\/g, '/');

  // Special-case BaseLayout title separator
  if (rel.endsWith('layouts/BaseLayout.astro')) {
    content = content.replace(/\$\{title\} — Praxnote/g, '${title} · Praxnote');
    content = content.replace(/Praxnote — HIPAA-grade/g, 'Praxnote, HIPAA-grade');
  }

  // Special-case Quote.astro author/role separator
  if (rel.endsWith('components/Quote.astro')) {
    content = content.replace(/` — \$\{role\}`/g, '`, ${role}`');
  }

  // General prose pass
  content = smartReplace(content);

  if (content !== before) {
    fs.writeFileSync(f, content);
    const after = (content.match(/—/g) || []).length;
    const fixed = count - after;
    totalReplaced += fixed;
    console.log(`${rel}: -${fixed} (was ${count}, now ${after})`);
  }
}

console.log(`\nTotal em dashes replaced: ${totalReplaced}`);
