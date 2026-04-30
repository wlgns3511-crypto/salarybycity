#!/usr/bin/env tsx
/**
 * indexnow-gsc-rescue.ts — salarybycity HCU Phase C rescue ping (2026-04-25).
 *
 * Context: 3-month GSC report showed 1 click ("architectural and engineering
 * managers" → /jobs/{occ}/ hub), 17,226 발견됨-색인X, 11,551 404 (/compare/),
 * 6,429 크롤링됨-색인X (/jobs/leaves + /es/jobs/). Phase C just deindexed the
 * 15.8K-URL doorway matrix via 410 + sitemap purge (16,308 → 570).
 *
 * This script pings the SURVIVORS — the real-signal hubs Google should now
 * reconsider — to Bing/Yandex via IndexNow. Google ignores IndexNow but the
 * sitemap.xml ping in /api/indexnow GET already pokes Google.
 *
 * Strategy: ~50 URLs, not all 570. Targets the GSC click landing page,
 * top BLS hubs by visibility, large states, and core nav. Sitemap delivers
 * the rest passively.
 *
 * Usage:
 *   npx tsx scripts/indexnow-gsc-rescue.ts
 */

const KEY = '0c558ef183574c1eaa5e7806022150d6';
const HOST = 'salarybycity.com';

const URLS = [
  // Core nav
  `https://${HOST}/`,
  `https://${HOST}/sitemap.xml`,
  `https://${HOST}/jobs/`,
  `https://${HOST}/state/`,
  `https://${HOST}/blog/`,
  `https://${HOST}/guide/`,
  `https://${HOST}/search/`,
  `https://${HOST}/about/`,
  `https://${HOST}/methodology/`,

  // GSC top click target (THE proof Phase C is right)
  `https://${HOST}/jobs/architectural-and-engineering-managers/`,

  // High-visibility BLS occupation hubs (top searched on BLS OEWS)
  `https://${HOST}/jobs/registered-nurses/`,
  `https://${HOST}/jobs/software-developers/`,
  `https://${HOST}/jobs/general-and-operations-managers/`,
  `https://${HOST}/jobs/accountants-and-auditors/`,
  `https://${HOST}/jobs/financial-managers/`,
  `https://${HOST}/jobs/lawyers/`,
  `https://${HOST}/jobs/physicians/`,
  `https://${HOST}/jobs/dentists-general/`,
  `https://${HOST}/jobs/electricians/`,
  `https://${HOST}/jobs/plumbers-pipefitters-and-steamfitters/`,
  `https://${HOST}/jobs/elementary-school-teachers-except-special-education/`,
  `https://${HOST}/jobs/secondary-school-teachers-except-special-and-careertechnical-education/`,
  `https://${HOST}/jobs/marketing-managers/`,
  `https://${HOST}/jobs/sales-managers/`,
  `https://${HOST}/jobs/human-resources-managers/`,
  `https://${HOST}/jobs/computer-and-information-systems-managers/`,
  `https://${HOST}/jobs/data-scientists/`,
  `https://${HOST}/jobs/web-developers/`,
  `https://${HOST}/jobs/civil-engineers/`,
  `https://${HOST}/jobs/mechanical-engineers/`,
  `https://${HOST}/jobs/pharmacists/`,
  `https://${HOST}/jobs/police-and-sheriffs-patrol-officers/`,
  `https://${HOST}/jobs/firefighters/`,
  `https://${HOST}/jobs/registered-dietitians-and-nutritionists/`,
  `https://${HOST}/jobs/physical-therapists/`,

  // Top 10 states by population (largest GSC volume)
  `https://${HOST}/state/california/`,
  `https://${HOST}/state/texas/`,
  `https://${HOST}/state/florida/`,
  `https://${HOST}/state/new-york/`,
  `https://${HOST}/state/pennsylvania/`,
  `https://${HOST}/state/illinois/`,
  `https://${HOST}/state/ohio/`,
  `https://${HOST}/state/georgia/`,
  `https://${HOST}/state/north-carolina/`,
  `https://${HOST}/state/michigan/`,
];

async function main() {
  console.log(`Submitting ${URLS.length} URLs to IndexNow (host=${HOST})...`);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: URLS,
    }),
  });
  console.log(`IndexNow response: ${res.status} ${res.statusText}`);
  if (res.status >= 400) {
    const body = await res.text();
    console.error(body);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
