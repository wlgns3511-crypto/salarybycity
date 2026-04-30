#!/usr/bin/env tsx
/**
 * indexnow-hcu-2026-04-28.ts — salarybycity HCU 5-chunk patch IndexNow push.
 *
 * Submits the freshly diversified pages (Layer 2 commentary added/changed):
 *   • Hubs: /, /jobs/, /jobs/list/, /state/, /blog/, /guide/
 *   • 12 list-type pages (/jobs/list/{type}/)
 *   • 51 state pages
 *   • 51 state salary-ranges pages
 *   • Top 100 occupation pages (alphabetical from DB)
 *
 * Total ~225 URLs — well under IndexNow's per-batch limit.
 *
 * Pattern source: caloriewize indexnow-hcu-2026-04-28.ts.
 */

import { US_STATES } from '../lib/states-data';
import { getAllOccupations, getAllStateCodes } from '../lib/db';
import { getAllListTypes } from '../lib/salary-cluster-insights';

const HOST = 'salarybycity.com';
const KEY = '0c558ef183574c1eaa5e7806022150d6';

const urls: string[] = [];

// Hubs
urls.push(`https://${HOST}/`);
urls.push(`https://${HOST}/jobs/`);
urls.push(`https://${HOST}/jobs/list/`);
urls.push(`https://${HOST}/state/`);
urls.push(`https://${HOST}/blog/`);
urls.push(`https://${HOST}/guide/`);

// 12 list-type hubs
for (const t of getAllListTypes()) {
  urls.push(`https://${HOST}/jobs/list/${t}/`);
}

// State pages — only the ~30 with BLS metro data; the rest soft-404
const statesWithData = new Set(getAllStateCodes());
for (const s of US_STATES) {
  if (!statesWithData.has(s.code)) continue;
  urls.push(`https://${HOST}/state/${s.slug}/`);
  urls.push(`https://${HOST}/state/${s.slug}/salary-ranges/`);
}

// First 100 occupations (alphabetical from DB)
const occs = getAllOccupations();
for (const occ of occs.slice(0, 100)) {
  urls.push(`https://${HOST}/jobs/${occ.slug}/`);
}

console.log(`[INDEXNOW] submitting ${urls.length} URLs to api.indexnow.org...`);

(async () => {
  const resp = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls,
    }),
  });
  console.log(`[INDEXNOW] HTTP ${resp.status} ${resp.statusText}`);
  if (resp.status >= 400) {
    const body = await resp.text().catch(() => '');
    console.log(`Body: ${body.slice(0, 500)}`);
  }
})();
