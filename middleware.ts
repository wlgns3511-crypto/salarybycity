import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// HCU Phase C — 2026-04-25
// Kill the 16K-URL doorway matrix + duplicate/thin routes with HTTP 410 Gone.
//
// GSC evidence (3-month):
//   - 1 click total ("architectural and engineering managers" → /jobs/{occ}/ hub)
//   - 17,226 발견됨-색인X (Google saw, refused) — mostly /compare/, /blog/, /category/
//   - 11,551 404 — all /compare/{occ-vs-occ}/
//   - 6,429 크롤링됨-색인X — /jobs/{occ}/{loc}/ matrix + /es/jobs/
//   - sitemap pre-Phase C: 16,308 URLs (16,092 of them /jobs/{occ}/{loc}/ leaves)
//
// Kills:
//   /jobs/{occ}/{loc}/   — leaf matrix doorway (15,880 URLs); KEEP /jobs/{occ}/ hubs
//   /locations/, /locations/{slug}/  — 51 thin metro-area pages
//   /compare/, /compare/{slugs}/     — 11,551 404 + thin keep-set
//   /category/, /category/{slug}/    — 21 BLS major-group hubs (zero traffic)
//   /rankings/, /rankings/{type}/    — 31 thin "highest paying" lists
//   /states/, /states/{slug}/        — duplicate of /state/ (richer content lives in /state/)
//   /sitemap/, /sitemap/{id}/        — HTML sitemap mirrors
//   /embed/                          — embed widget (not for SEO)
//   /es/, /es/jobs/                  — 5-locale relic, zero clicks ever
//
// Kept:
//   /jobs/, /jobs/{occ}/             — 397 occupation hubs (real signal)
//   /jobs/list/, /jobs/list/{type}/  — 1+12 curated rankings (HCU 5-chunk patch, 2026-04-28)
//   /state/, /state/{slug}/, /state/{slug}/salary-ranges/  — 1+51+51 = 103
//   /, /blog/, /guide/, /about/, /contact/, /methodology/, /privacy/, /terms/,
//   /disclaimer/, /editorial-policy/, /corrections-policy/, /search/
//
// IMPORTANT: the /jobs/{occ}/{loc}/ branch uses a negative lookahead to spare
// /jobs/list/{type}/ from the leaf-matrix kill switch. Without it, all 12 list
// pages return 410 because `list/{type}` looks like `{occ}/{loc}` to the matcher.
const KILLED_ROUTES =
  /^(?:\/(?:es))?\/jobs\/(?!list(?:\/|$))[^/]+\/[^/]+|^\/(?:locations|compare|category|rankings|states|sitemap|embed)(?:\/|$)|^\/es(?:\/|$)/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (KILLED_ROUTES.test(pathname)) {
    return new NextResponse('Gone', { status: 410 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|robots.txt|sitemap.xml|api).*)'],
};
