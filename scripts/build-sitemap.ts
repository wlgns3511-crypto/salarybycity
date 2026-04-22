#!/usr/bin/env tsx
/**
 * build-sitemap.ts — Static sitemap XML generator for salarybycity.
 *
 * Pre-render limits (from page.tsx files):
 *   /jobs/[slug]/[location] → getWagePagesChunk(0, 5000)
 *   /compare/[slugs]        → getTopComparisons(5000)  (dynamicParams=false)
 *   /locations/[slug]       → getAllMetroAreas() (all)
 *   /jobs/[slug]            → getAllOccupations() (all)
 *   /es/jobs/[slug]         → getAllOccupations() (all)
 *   /rankings/[type]        → national + per state
 *   /states/[slug]          → all state codes
 *   /state/[slug]           → US_STATES (all)
 *
 * USAGE:
 *   npx tsx scripts/build-sitemap.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  getAllOccupations, getAllMetroAreas, getAllStateCodes,
  getWagePagesChunk, countAllWagePages, getMajorGroups,
} from '../lib/db';
import { getAllPosts } from '../lib/blog';
import { US_STATES } from '../lib/states-data';
import { getAllGuides } from '../lib/guides';

const SITE_URL = 'https://salarybycity.com';
const NOW = new Date().toISOString().split('T')[0];
const SHARD_SIZE = 40000;
const OUT_DIR = path.resolve(__dirname, '..', 'public');

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// State code → slug mapping (from rankings/[type]/page.tsx)
const STATE_SLUG_MAP: Record<string, string> = {
  'AL': 'alabama', 'AK': 'alaska', 'AZ': 'arizona', 'AR': 'arkansas', 'CA': 'california',
  'CO': 'colorado', 'CT': 'connecticut', 'DE': 'delaware', 'FL': 'florida', 'GA': 'georgia',
  'HI': 'hawaii', 'ID': 'idaho', 'IL': 'illinois', 'IN': 'indiana', 'IA': 'iowa',
  'KS': 'kansas', 'KY': 'kentucky', 'LA': 'louisiana', 'ME': 'maine', 'MD': 'maryland',
  'MA': 'massachusetts', 'MI': 'michigan', 'MN': 'minnesota', 'MS': 'mississippi', 'MO': 'missouri',
  'MT': 'montana', 'NE': 'nebraska', 'NV': 'nevada', 'NH': 'new-hampshire', 'NJ': 'new-jersey',
  'NM': 'new-mexico', 'NY': 'new-york', 'NC': 'north-carolina', 'ND': 'north-dakota', 'OH': 'ohio',
  'OK': 'oklahoma', 'OR': 'oregon', 'PA': 'pennsylvania', 'RI': 'rhode-island', 'SC': 'south-carolina',
  'SD': 'south-dakota', 'TN': 'tennessee', 'TX': 'texas', 'UT': 'utah', 'VT': 'vermont',
  'VA': 'virginia', 'WA': 'washington', 'WV': 'west-virginia', 'WI': 'wisconsin', 'WY': 'wyoming',
  'DC': 'district-of-columbia', 'PR': 'puerto-rico', 'GU': 'guam', 'VI': 'virgin-islands',
};

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

// Static pages
for (const [p, pr, cf] of [
  ['/', '1.0', 'monthly'], ['/jobs/', '0.9', 'monthly'], ['/locations/', '0.9', 'monthly'],
  ['/editorial-policy/', '0.3', 'yearly'], ['/corrections-policy/', '0.3', 'yearly'],
] as [string, string, string][]) {
  add({ url: `${SITE_URL}${p}`, priority: pr, changefreq: cf });
}

// Guide pages
const guides = getAllGuides();
add({ url: `${SITE_URL}/guide/`, priority: '0.8', changefreq: 'weekly' });
for (const g of guides) {
  add({ url: `${SITE_URL}/guide/${g.slug}/`, lastmod: g.updatedAt ? new Date(g.updatedAt).toISOString().split('T')[0] : NOW, priority: '0.7' });
}

// Blog pages
const posts = getAllPosts();
add({ url: `${SITE_URL}/blog/`, priority: '0.8', changefreq: 'weekly' });
for (const p of posts) {
  const lm = p.updatedAt ?? p.publishedAt;
  add({ url: `${SITE_URL}/blog/${p.slug}/`, lastmod: lm ? new Date(lm).toISOString().split('T')[0] : NOW, priority: '0.7' });
}

// Occupation pages
const occupations = getAllOccupations();
for (const occ of occupations) {
  add({ url: `${SITE_URL}/jobs/${occ.slug}/`, priority: '0.8' });
}

// ─── /es/jobs/ × 397 DROPPED 2026-04-22 (HCU defense) ───────────────────
// Thin Spanish translation over identical occupation data. Route stays
// live via dynamicParams — existing URLs remain 200.

// Category pages
for (const group of getMajorGroups()) {
  add({ url: `${SITE_URL}/category/${slugify(group.major_group_title)}/`, priority: '0.7' });
}

// Metro area location pages
const areas = getAllMetroAreas();
for (const area of areas) {
  add({ url: `${SITE_URL}/locations/${area.slug}/`, priority: '0.7' });
}

// State pages via getAllStateCodes
const stateCodes = getAllStateCodes();
add({ url: `${SITE_URL}/state/`, priority: '0.8' });
for (const s of US_STATES) {
  add({ url: `${SITE_URL}/state/${s.slug}/`, priority: '0.7' });
  // /salary-ranges/ × 54 DROPPED 2026-04-22 — derivative subpage over same state entity.
}
// NOTE: /states/ index removed from sitemap (2026-04-17) — no app/states/page.tsx exists.
// /states/[code]/ × 30 DROPPED 2026-04-22 — duplicate of /state/[slug]/ (slug vs code).

// Rankings: national + per state
add({ url: `${SITE_URL}/rankings/highest-paying-jobs/`, priority: '0.8' });
for (const code of stateCodes) {
  const slug = STATE_SLUG_MAP[code.toUpperCase()];
  if (slug) {
    add({ url: `${SITE_URL}/rankings/highest-paying-jobs-in-${slug}/`, priority: '0.7' });
  }
}

// Compare pairs excluded from sitemap (2026-04-18)
// HCU doorway-thin content + scaled-content policy risk.
// Pages still render via generateStaticParams (CAP=100); just not announced.
add({ url: `${SITE_URL}/compare/`, priority: '0.8' });

// Job x location pages — full valid set (THE PRODUCT: salary by city × job).
// Kept intact at ~15,694 URLs per user directive 2026-04-22: "salary×city 조합이
// 이 사이트의 존재 이유". HCU-defense focuses on thin translations + duplicate
// routes above; the matrix itself stays.
const totalWagePages = countAllWagePages();
for (let offset = 0; offset < totalWagePages; offset += 5000) {
  const wagePages = getWagePagesChunk(offset, 5000);
  for (const page of wagePages) {
    add({ url: `${SITE_URL}/jobs/${page.occ_slug}/${page.area_slug}/`, priority: '0.6' });
  }
}

// ─── Cardinality guard ────────────────────────────────────────────────────
if (entries.length > 17500 && !process.env.SITEMAP_LARGE_OK) {
  throw new Error(
    `salarybycity sitemap has ${entries.length.toLocaleString()} URLs — Option B+ budget is ~16.3K.\n` +
      `Did /es/jobs/ (397), /salary-ranges/ (54), or /states/ (30) get re-added?\n` +
      `That's exactly the loop that caused the original cardinality collapse.\n` +
      `Run with SITEMAP_LARGE_OK=1 if you genuinely meant to expand the tier.`,
  );
}

// ─── Clean old sitemaps ────────────────────────────────────────────────────
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
