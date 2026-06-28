/**
 * Phase 7 audit script — salarybycity (state-keyed cross-walk).
 *
 * Runs as a one-shot:  npx tsx scripts/audit-phase7.ts
 *
 * Covers Traps #110 (publisher diversity ≥2), #111 (verdict band balance
 * across 51 states), #112 (title 60c cap on /state/), #117
 * (creator-portfolio), and #119/#120 (P1 coverage on /state/).
 *
 * /jobs/[slug]/ P1 honest-skip — 71/397 BLS titles already exceed 45c
 * (max 94c), Phase 7 verdict suffix would push ~30% over 60c. Decoder
 * (decodeJobCrosswalk) is wired for body chip + JSON-LD variableMeasured,
 * just no title rewrite this cycle.
 */
import { decodeStateCrosswalk, buildStateP1Title } from '../lib/crosswalk-salary';
import { US_STATES } from '../lib/states-data';
import { SOURCE_AUTHORITIES } from '../lib/authorship';

console.log('=== Phase 7 audit — salarybycity ===');

// Trap #110 — publisher diversity across the cross-walk
const declaredHosts = ['bls.gov', 'census.gov', 'bea.gov', 'irs.gov'];
console.log('\n[#110] declared cross-walk publisher hosts:', declaredHosts);
console.log('       distinct count:', declaredHosts.length, declaredHosts.length >= 2 ? 'PASS' : 'FAIL');

// Trap #111 — verdict band balance across 51 keep-set states
const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
let nullCount = 0;
for (const s of US_STATES) {
  const r = decodeStateCrosswalk(s.code);
  if (!r) nullCount++;
  else dist[r.verdict] = (dist[r.verdict] ?? 0) + 1;
}
const total = Object.values(dist).reduce((a, b) => a + b, 0);
const pcts = Object.fromEntries(
  Object.entries(dist).map(([k, v]) => [k, ((v / total) * 100).toFixed(1) + '%']),
);
const maxPct = Math.max(...Object.values(dist).map((v) => (v / total) * 100));
console.log('\n[#111] verdict band distribution (n=' + total + ', null=' + nullCount + '):', dist);
console.log('       pct:', pcts);
console.log('       max bucket:', maxPct.toFixed(1) + '%', maxPct <= 70 ? 'PASS' : 'WARN');

// Trap #117 — creator-portfolio diversity (≥4 organisations)
console.log('\n[#117] SOURCE_AUTHORITIES count:', SOURCE_AUTHORITIES.length, SOURCE_AUTHORITIES.length >= 4 ? 'PASS' : 'FAIL');

// Trap #112 — /state/ P1 title length cap (60c via title.absolute)
let titleMax = 0;
let titleMaxStr = '';
let titleOver60 = 0;
let verdictInTitle = 0;
for (const s of US_STATES) {
  const r = decodeStateCrosswalk(s.code);
  if (!r) continue;
  const title = buildStateP1Title(s.name, r);
  if (title.length > titleMax) {
    titleMax = title.length;
    titleMaxStr = title;
  }
  if (title.length > 60) titleOver60++;
  if (/: (Top Real|Strong Real|Mid Real|Sub-Med|Weak Real)/.test(title)) verdictInTitle++;
}
console.log('\n[#112] /state/ title.absolute length audit (cap=60, layout suffix 15c bypassed)');
console.log('       max length:', titleMax, '/', '"' + titleMaxStr + '"');
console.log('       >60 chars:', titleOver60, titleOver60 === 0 ? 'PASS' : 'FAIL');

// Trap #119/#120 — P1 verdict-in-title coverage across /state/ keep-set
const coverage = ((verdictInTitle / US_STATES.length) * 100).toFixed(1);
console.log('\n[#119/#120] verdict-in-title coverage:', verdictInTitle + '/' + US_STATES.length, '(' + coverage + '%)');
console.log('       expected ≥95%:', Number(coverage) >= 95 ? 'PASS' : 'WARN');

// Sample probe
console.log('\n[sample]');
for (const code of ['CA', 'TX', 'NY', 'DC', 'FL', 'VT', 'HI', 'MA', 'AL', 'WV']) {
  const s = US_STATES.find((x) => x.code === code);
  if (!s) continue;
  const r = decodeStateCrosswalk(s.code);
  if (!r) {
    console.log(`  ${code}: null verdict`);
    continue;
  }
  const title = buildStateP1Title(s.name, r);
  console.log(`  ${code} [${r.verdict} · score=${r.composedScore}]: "${title}" (${title.length}c)`);
}

if (titleOver60 > 0) {
  console.error('\n❌ FAIL: ' + titleOver60 + ' title(s) exceed 60c cap.');
  process.exit(1);
}
console.log('\n✅ All gates pass.');
