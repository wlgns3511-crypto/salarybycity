#!/usr/bin/env tsx
/**
 * build-sitemap.ts — salarybycity sitemap (HCU Phase C, 2026-04-25).
 *
 * PRUNING HISTORY:
 *   2026-04-22 Tier S/F: dropped /es/jobs (397) + /salary-ranges (54) + /states (30).
 *     Sitemap settled at ~16.3K (16,092 of them /jobs/{occ}/{loc}/ leaves).
 *
 *   2026-04-25 Phase C (this rewrite):
 *     GSC after 3 months: 1 click ("architectural and engineering managers" →
 *     /jobs/{occ}/ hub), 17,226 발견됨-색인X, 11,551 404 (/compare/), 6,429
 *     크롤링됨-색인X (/jobs/leaves + /es/jobs/). The matrix wasn't earning;
 *     it was bleeding crawl budget while Google refused to index it.
 *
 *     Killed (410 via middleware): /jobs/{occ}/{loc}/ leaves (15,880 doorway URLs),
 *       /locations, /compare, /category, /rankings, /states, /sitemap, /embed, /es.
 *     Kept: /jobs/ + /jobs/{occ}/ × 397 (occupation hubs — REAL signal),
 *       /state/ + /state/{slug}/ × 51 (+ /salary-ranges/ if exists),
 *       /blog, /guide, /about, /contact, /methodology, /privacy, /terms,
 *       /disclaimer, /editorial-policy, /corrections-policy, /search.
 *     Sitemap: ~16.3K → ~570 URLs (-97%, mirror of wagepeek 12,353→333 outcome).
 *
 * USAGE:
 *   npx tsx scripts/build-sitemap.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { getAllOccupations, getAllStateCodes } from '../lib/db';
import { getAllPosts } from '../lib/blog';
import { US_STATES } from '../lib/states-data';
import { getAllGuides } from '../lib/guides';
import { getAllListTypes } from '../lib/salary-cluster-insights';
import { GLOSSARY } from '../lib/glossary-data';

const SITE_URL = 'https://salarybycity.com';
const NOW = new Date().toISOString().split('T')[0];
const SHARD_SIZE = 40000;
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'public');

// Honest entity lastmod via git: when did the file backing this entity last
// change? Falls back to NOW if git is unavailable (e.g. CI/Docker without .git).
// All occupation hubs share one template, so they share one lastmod — that is
// truthful, not a bug. Per-entity diversity comes from data files (glossary,
// guides, blog) which DO have their own commits.
function gitLastModified(relPath: string): string {
  try {
    const out = execSync(`git log -1 --format=%cs -- "${relPath}"`, {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    return out || NOW;
  } catch {
    return NOW;
  }
}

const OCC_HUB_LASTMOD = gitLastModified('app/jobs/[slug]/page.tsx');
const STATE_HUB_LASTMOD = gitLastModified('app/state/[slug]/page.tsx');
const GLOSSARY_LASTMOD = gitLastModified('lib/glossary-data.ts');
const TOOLS_LASTMOD = gitLastModified('app/tools/page.tsx');
const LIST_LASTMOD = gitLastModified('lib/salary-cluster-insights.ts');

interface Entry { url: string; lastmod?: string; priority?: string; changefreq?: string; }
function urlTag(e: Entry): string {
  return `  <url><loc>${e.url}</loc><lastmod>${e.lastmod ?? NOW}</lastmod><changefreq>${e.changefreq ?? 'monthly'}</changefreq><priority>${e.priority ?? '0.6'}</priority></url>`;
}
function writeShard(id: number, entries: Entry[]) {
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries.map(urlTag).join('\n') + '\n</urlset>\n';
  fs.writeFileSync(path.join(OUT_DIR, `sitemap-${id}.xml`), xml);
}

const seen = new Set<string>();
const entries: Entry[] = [];
function add(e: Entry) { if (!seen.has(e.url)) { seen.add(e.url); entries.push(e); } }

// ── Static / hub pages ───────────────────────────────────────────────────────
for (const [p, pr, cf] of [
  ['/', '1.0', 'monthly'],
  ['/jobs/', '0.9', 'monthly'],
  ['/jobs/list/', '0.8', 'monthly'],
  ['/state/', '0.9', 'monthly'],
  ['/blog/', '0.8', 'weekly'],
  ['/guide/', '0.8', 'weekly'],
  ['/about/', '0.4', 'yearly'],
  ['/contact/', '0.3', 'yearly'],
  ['/methodology/', '0.5', 'yearly'],
  ['/privacy/', '0.3', 'yearly'],
  ['/terms/', '0.3', 'yearly'],
  ['/disclaimer/', '0.3', 'yearly'],
  ['/editorial-policy/', '0.3', 'yearly'],
  ['/corrections-policy/', '0.3', 'yearly'],
] as [string, string, string][]) {
  add({ url: `${SITE_URL}${p}`, priority: pr, changefreq: cf });
}

// ── Guides (lib/guides.ts) ───────────────────────────────────────────────────
for (const g of getAllGuides()) {
  add({
    url: `${SITE_URL}/guide/${g.slug}/`,
    lastmod: g.updatedAt ? new Date(g.updatedAt).toISOString().split('T')[0] : NOW,
    priority: '0.7',
  });
}

// ── Blog posts (lib/blog.ts) ─────────────────────────────────────────────────
for (const p of getAllPosts()) {
  const lm = p.updatedAt ?? p.publishedAt;
  add({
    url: `${SITE_URL}/blog/${p.slug}/`,
    lastmod: lm ? new Date(lm).toISOString().split('T')[0] : NOW,
    priority: '0.7',
  });
}

// ── Occupation hubs — THE PRIMARY KEEPERS (~397) ─────────────────────────────
// GSC top click: "architectural and engineering managers" → /jobs/{occ}/ hub.
// All BLS-themed top queries target this surface.
for (const occ of getAllOccupations()) {
  add({ url: `${SITE_URL}/jobs/${occ.slug}/`, lastmod: OCC_HUB_LASTMOD, priority: '0.8' });
}

// ── Curated list hubs (HCU 5-chunk patch, 2026-04-28) ────────────────────────
// New /jobs/list/[type]/ surface — 12 curated rankings (highest-paying,
// six-figure, mass-market, mid-market, entry, STEM, healthcare, management,
// largest-employment, specialist, wide-pay-range, compressed-pay).
for (const t of getAllListTypes()) {
  add({ url: `${SITE_URL}/jobs/list/${t}/`, lastmod: LIST_LASTMOD, priority: '0.7' });
}

// ── State pages (all 51) + /salary-ranges/ subpage ───────────────────────────
// All 51 US_STATES are SSG'd. ~30 have BLS metro data and render the full
// StateRich page; the other ~21 render EmptyStatePage with national context
// + nearby-state pointers (HCU honesty: we don't 404 on missing data, and we
// don't fabricate metro-level wages we don't have).
// The salary-ranges subpage is only emitted for states with metro data.
const statesWithData = new Set(getAllStateCodes());
const hasSalaryRanges = fs.existsSync(
  path.join(REPO_ROOT, 'app', 'state', '[slug]', 'salary-ranges'),
);
for (const s of US_STATES) {
  add({ url: `${SITE_URL}/state/${s.slug}/`, lastmod: STATE_HUB_LASTMOD, priority: '0.7' });
  if (hasSalaryRanges && statesWithData.has(s.code)) {
    add({ url: `${SITE_URL}/state/${s.slug}/salary-ranges/`, lastmod: STATE_HUB_LASTMOD, priority: '0.6' });
  }
}

// ── Glossary (HCU 5-청크 patch, 2026-05-02) ──────────────────────────────────
// 50 BLS/IRS/FLSA/comp term entries with primary-source citations.
add({ url: `${SITE_URL}/glossary/`, lastmod: GLOSSARY_LASTMOD, priority: '0.7' });
for (const entry of GLOSSARY) {
  add({ url: `${SITE_URL}/glossary/${entry.slug}/`, lastmod: GLOSSARY_LASTMOD, priority: '0.6' });
}

// ── Tools (HCU 5-청크 patch, 2026-05-02) ─────────────────────────────────────
// Tools index + COL calculator (BEA RPP 2024).
add({ url: `${SITE_URL}/tools/`, lastmod: TOOLS_LASTMOD, priority: '0.6' });
add({ url: `${SITE_URL}/tools/col-calculator/`, lastmod: TOOLS_LASTMOD, priority: '0.7' });

// ── Cardinality guard ────────────────────────────────────────────────────────
// Phase C target ~570. Tripwire at 750.
if (entries.length > 750 && !process.env.SITEMAP_LARGE_OK) {
  throw new Error(
    `salarybycity sitemap has ${entries.length.toLocaleString()} URLs — Phase C budget is ~570.\n` +
      `Did /jobs/{occ}/{loc}/ leaves (~15.8K) or /locations/ /compare/ /category/ /rankings/ /states/ /es/ get re-added?\n` +
      `That's the doorway matrix HCU Phase C explicitly killed.\n` +
      `Run with SITEMAP_LARGE_OK=1 if you genuinely meant to expand the tier.`,
  );
}

// ── Clean old sitemaps ───────────────────────────────────────────────────────
for (const f of fs.readdirSync(OUT_DIR)) {
  if (/^sitemap(-\d+)?\.xml$/.test(f)) fs.unlinkSync(path.join(OUT_DIR, f));
}
const oldDir = path.join(OUT_DIR, 'sitemap');
if (fs.existsSync(oldDir)) fs.rmSync(oldDir, { recursive: true, force: true });

const shardCount = Math.ceil(entries.length / SHARD_SIZE);
if (shardCount <= 1) {
  writeShard(0, entries);
  fs.renameSync(path.join(OUT_DIR, 'sitemap-0.xml'), path.join(OUT_DIR, 'sitemap.xml'));
} else {
  for (let i = 0; i < shardCount; i++) writeShard(i, entries.slice(i * SHARD_SIZE, (i + 1) * SHARD_SIZE));
  const idx = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    Array.from({ length: shardCount }, (_, i) => `  <sitemap><loc>${SITE_URL}/sitemap-${i}.xml</loc><lastmod>${NOW}</lastmod></sitemap>`).join('\n') + '\n</sitemapindex>\n';
  fs.writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), idx);
}
console.log(`✓ ${entries.length} URLs, ${shardCount || 1} shard(s)`);
