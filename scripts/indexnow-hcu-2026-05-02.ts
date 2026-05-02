#!/usr/bin/env tsx
/**
 * indexnow-hcu-2026-05-02.ts — salarybycity HCU 5-청크 patch IndexNow push.
 *
 * Submits the new + reframed pages from the 2026-05-02 depth pass:
 *   • Glossary index + 50 entries (NEW surface)
 *   • Tools index + COL calculator (NEW surface)
 *   • Top 100 occupation pages (now ship 5-yr trend chart + nominal/real series + related-by-pay)
 *   • Hub pages: /, /jobs/, /jobs/list/, /state/, /blog/, /guide/
 *
 * Total ~158 URLs.
 *
 * Pattern source: scripts/indexnow-hcu-2026-04-28.ts.
 */
import { GLOSSARY } from '../lib/glossary-data';
import { getAllOccupations } from '../lib/db';

const HOST = 'salarybycity.com';
const KEY = '0c558ef183574c1eaa5e7806022150d6';

const urls: string[] = [];

// Hubs (re-ping after content depth additions)
urls.push(`https://${HOST}/`);
urls.push(`https://${HOST}/jobs/`);
urls.push(`https://${HOST}/jobs/list/`);
urls.push(`https://${HOST}/state/`);
urls.push(`https://${HOST}/blog/`);
urls.push(`https://${HOST}/guide/`);

// Glossary (NEW)
urls.push(`https://${HOST}/glossary/`);
for (const e of GLOSSARY) urls.push(`https://${HOST}/glossary/${e.slug}/`);

// Tools (NEW)
urls.push(`https://${HOST}/tools/`);
urls.push(`https://${HOST}/tools/col-calculator/`);

// First 100 occupation pages — now show SalaryTrendChart (5-yr nominal+real) +
// inequality narrative + related-by-pay. Worth re-pinging.
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
