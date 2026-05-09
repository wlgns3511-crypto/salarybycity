import { DB_UPDATED, PUBLISHER, SOURCE_AUTHORITIES } from "@/lib/authorship";

// Compact display labels for the AuthorBox source strip. The full Schema.org
// names live in SOURCE_AUTHORITIES (used by JSON-LD reviewedBy); these are the
// human-readable short forms shown to readers as clickable badges so they can
// trace any wage figure back to the upstream table.
const SOURCE_LABELS: Record<string, string> = {
  'U.S. Bureau of Labor Statistics — OEWS': 'BLS OEWS',
  'U.S. Census Bureau — American Community Survey': 'Census ACS',
  'U.S. Bureau of Economic Analysis — Regional Price Parities': 'BEA RPP',
  'U.S. Internal Revenue Service — Statistics of Income': 'IRS SOI',
};

export function AuthorBox() {
  const reviewedAt = DB_UPDATED;
  const dataVintage = "Public dataset snapshot";

  return (
    <div className="mt-10 p-5 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 text-sm">
            Salary data source notes
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Part of the <a href={PUBLISHER.url} className="text-slate-700 hover:underline" rel="noopener">{PUBLISHER.name}</a>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed mb-3">
        Salary figures are sourced from BLS OEWS public datasets and checked against the original
        BLS releases. Methodology — including median and mean derivation,
        percentile bands, and the typical 12–18 month BLS publication lag — is documented in our{" "}
        <a href="/methodology/" className="underline hover:text-slate-900">methodology page</a>.
        Wage figures are statistical aggregates and should not substitute for personalized financial
        or career advice; for individual decisions, consult a CPA, financial planner, or qualified
        career counselor.
      </p>
      <div className="mb-3 pt-3 border-t border-slate-200">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-1.5">
          Primary upstream sources
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SOURCE_AUTHORITIES.map((src) => {
            const label = SOURCE_LABELS[src.name] ?? src.name;
            return (
              <a
                key={src.name}
                href={src.url}
                title={src.name}
                className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                {label}
              </a>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {reviewedAt && (
          <>
            <span>Dataset updated: <time dateTime={reviewedAt}>{reviewedAt}</time></span>
            <span className="text-slate-300">·</span>
          </>
        )}
        <span>Data vintage: {dataVintage}</span>
        <span className="text-slate-300">·</span>
        <a href="https://datapeekfacts.com/editorial-policy/" className="underline underline-offset-2 hover:text-slate-900" rel="noopener">Editorial policy</a>
        <span className="text-slate-300">·</span>
        <a href="/methodology/" className="underline underline-offset-2 hover:text-slate-900">Methodology</a>
        <span className="text-slate-300">·</span>
        <a href="/contact/" className="underline underline-offset-2 hover:text-slate-900">Send a correction</a>
      </div>
    </div>
  );
}
