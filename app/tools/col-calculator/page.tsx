import type { Metadata } from 'next';
import { COLAdjustWidget } from '@/components/COLAdjustWidget';
import { getAllMetroAreas, getNationalArea } from '@/lib/db';

interface SearchParams {
  searchParams: Promise<{ from?: string; to?: string; salary?: string }>;
}

/**
 * Per-variant noindex: if the visitor lands on a parameterized URL, tell crawlers
 * to skip indexing that variant. Combined with the canonical (also set here),
 * parameterized URLs consolidate to the bare /tools/col-calculator/ in Google's
 * index.
 *
 * Why this matters: even with the silent-ignore guard below, a parameterized URL
 * with valid MSA codes returns a result page that's near-duplicate of the bare
 * page (same H1/intro/explainer + small result block). We want only the bare
 * page indexed; user-facing parameterized URLs are tools, not search targets.
 *
 * Note: Next.js 16 forbids exporting both `metadata` and `generateMetadata` from
 * the same file (Trap #178b — discovered post-deploy on this very page). Static
 * fields are merged inline below.
 */
export async function generateMetadata({ searchParams }: SearchParams): Promise<Metadata> {
  const { from, to, salary } = await searchParams;
  const hasParams = Boolean(from || to || salary);
  return {
    title: 'Cost-of-living salary calculator (BEA Regional Price Parities, 2024)',
    description:
      'Free cost-of-living salary calculator. Convert a salary in one U.S. metro to its purchasing-power equivalent in another, using BEA Regional Price Parities for 2024.',
    alternates: { canonical: '/tools/col-calculator/' },
    openGraph: { url: '/tools/col-calculator/' },
    robots: hasParams ? { index: false, follow: true } : undefined,
  };
}

export default async function COLCalculatorPage({ searchParams }: SearchParams) {
  const { from, to, salary } = await searchParams;
  const metros = getAllMetroAreas();
  const national = getNationalArea();
  const areas = [
    ...(national ? [{ area_code: national.area_code, area_title: 'United States (national average)' }] : []),
    ...metros.map((a) => ({ area_code: a.area_code, area_title: a.area_title })),
  ];

  // Silent-ignore guard against slug-style or unknown area codes
  // (e.g. ?from=san-jose&to=birmingham). Without this, getEffectiveRpp() falls
  // back to national=100 and the calculator returns the input salary unchanged
  // — a confusing "$150,000 = $150,000" result. We strip invalid codes so the
  // form renders cleanly instead. SEO de-duplication is handled by the canonical
  // tag (above) + per-variant robots:noindex (generateMetadata, above);
  // notFound() was tried first but Next.js 16 throws NoFallbackError that
  // returns HTTP 200 + skeleton loading state — worse UX than this silent strip.
  const validCodes = new Set(areas.map((a) => a.area_code));
  const fromValid = from && validCodes.has(from) ? from : undefined;
  const toValid = to && validCodes.has(to) ? to : undefined;
  // Salary stays as-is; the widget already handles non-numeric/empty.

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Cost-of-living salary calculator</h1>
        <p className="mt-2 text-slate-600">
          Enter a salary, your current metro, and a target metro. We convert the salary into the
          equivalent dollar figure that buys the same basket of goods and services in the target
          area, using <strong>BEA Regional Price Parities (RPP)</strong> for 2024.
        </p>
      </header>

      <COLAdjustWidget
        areas={areas}
        action="/tools/col-calculator/"
        fromArea={fromValid}
        toArea={toValid}
        salary={salary}
        heading="Try a comparison"
      />

      <section className="prose prose-slate max-w-none mt-8">
        <h2>How the math works</h2>
        <p>
          BEA publishes a regional price index for every U.S. state, MSA, and metro/non-metro split,
          called <em>Regional Price Parity</em> (RPP). The U.S. average is set to 100. A metro with
          RPP of 120 means goods and services there cost 20% more than the national average; an RPP
          of 90 means 10% less.
        </p>
        <p>
          To convert a salary across metros we multiply by the ratio of the two RPPs:
        </p>
        <pre>
          target salary = source salary × (target RPP / source RPP)
        </pre>
        <p>
          When MSA-level RPP is available (currently 50 metros in our data), we use it. For metros
          we do not cover at the MSA level, we fall back to the state RPP. The national average
          row is fixed at RPP = 100 by definition.
        </p>

        <h2>What RPP captures (and what it doesn&rsquo;t)</h2>
        <p>
          RPP is a single index covering all consumer expenditures, weighted by what households
          actually spend on. It captures rents, utilities, food, transit, services, and goods.
          It does <strong>not</strong> separate housing from groceries — the housing component
          alone in coastal metros can be 2.5–3× the housing component of low-cost metros, even
          though the overall RPP is closer (because non-housing items are more uniform). If your
          household budget is very housing-heavy or very food-heavy, the RPP can either over- or
          under-state your true cost difference.
        </p>

        <h2>Sources</h2>
        <ul>
          <li>
            <a
              href="https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area"
              rel="nofollow noopener"
              target="_blank"
            >
              BEA Regional Price Parities by State and Metropolitan Statistical Area, 2008–2024
            </a>{' '}
            (released February 2025)
          </li>
          <li>
            <a
              href="https://www.bls.gov/oes/tables.htm"
              rel="nofollow noopener"
              target="_blank"
            >
              BLS Occupational Employment and Wage Statistics — area definitions
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
