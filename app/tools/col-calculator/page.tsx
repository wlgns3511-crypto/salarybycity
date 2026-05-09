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

      <section className="mt-8 space-y-5" data-content="psu-col-calculator">
        <div className="max-w-3xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            How to read the result
          </p>
          <h2 className="text-2xl font-bold text-slate-950">
            A purchasing-power match, not a relocation budget
          </h2>
          <p className="mt-3 leading-relaxed text-slate-600">
            The calculator answers one narrow question: what salary in the target metro would buy
            a similar basket of goods and services as your current salary. Use the result as a
            purchasing-power benchmark, then check taxes, rent, insurance, commute costs, and job
            market pay separately.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Formula
            </h3>
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
              target salary = source salary x (target RPP / source RPP)
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              BEA Regional Price Parities set the U.S. average to 100. A metro at 120 is about
              20% above the national price level, while a metro at 90 is about 10% below it.
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              What RPP captures
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>Housing and rent within the consumer spending basket.</li>
              <li>Utilities, food, transit, services, and local goods prices.</li>
              <li>A broad metro or state-level price level, not one household&rsquo;s exact budget.</li>
            </ul>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Check separately
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>State and local income taxes, property taxes, and payroll deductions.</li>
              <li>Your actual rent, mortgage, childcare, healthcare, and insurance costs.</li>
              <li>Whether employers in the target market pay above or below the adjusted number.</li>
            </ul>
          </article>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
          <h3 className="text-lg font-semibold text-slate-950">How to use the number</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-white p-4 shadow-sm shadow-blue-100/40">
              <h4 className="font-semibold text-slate-900">For job offers</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Compare the offer against the adjusted salary and the local median pay for your
                occupation. A lower adjusted offer may still work if benefits, remote flexibility,
                or career upside are materially better.
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm shadow-blue-100/40">
              <h4 className="font-semibold text-slate-900">For relocation planning</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Run the same salary through several target metros. If the results are close,
                compare housing and tax assumptions directly before treating one city as cheaper.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sources</h3>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <a
              href="https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area"
              rel="nofollow noopener"
              target="_blank"
              className="font-medium text-blue-700 hover:underline"
            >
              BEA Regional Price Parities by State and Metropolitan Statistical Area, 2008-2024
            </a>
            <a
              href="https://www.bls.gov/oes/tables.htm"
              rel="nofollow noopener"
              target="_blank"
              className="font-medium text-blue-700 hover:underline"
            >
              BLS OEWS area definitions
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
