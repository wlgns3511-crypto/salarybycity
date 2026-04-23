/**
 * MethodologyInline — E-E-A-T signal for data pages
 *
 * Shows source provenance, release/cadence, DB freshness, known limits,
 * and (optionally) the computation formula — all collapsed behind a
 * <details> so it doesn't dominate the layout.
 *
 * Each page passes its own data; no site.config dependency so this
 * works across both v3-template and legacy sites.
 *
 * Usage:
 *   <MethodologyInline
 *     source={{ name: "BLS OEWS", url: "https://www.bls.gov/oes/" }}
 *     release="May 2025 OEWS release"
 *     dataYear={2025}
 *     cadence="Annual (spring)"
 *     dbUpdated="2026-04-01"
 *     limits={["Excludes self-employed and tips"]}
 *     formula="Hourly wage × 2,080 (40h/wk × 52wk)"
 *     fullHref="/methodology/"
 *   />
 */

interface Source {
  name: string;
  url: string;
}

interface Props {
  source: Source;
  /** e.g. "May 2025 OEWS release" or "Q1 2026 BEA RPP" */
  release: string;
  dataYear: number;
  /** e.g. "Annual (spring release)" */
  cadence: string;
  /** ISO date YYYY-MM-DD — when this site's DB was last rebuilt */
  dbUpdated: string;
  /** General limits applicable to all pages of this site */
  limits?: string[];
  /** Page-specific limits (merged with `limits`) */
  pageLimits?: string[];
  /** Optional formula for calculator/derived pages */
  formula?: string;
  /** Link to full methodology page */
  fullHref?: string;
  /** Expand by default */
  defaultOpen?: boolean;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function MethodologyInline({
  source,
  release,
  dataYear,
  cadence,
  dbUpdated,
  limits = [],
  pageLimits = [],
  formula,
  fullHref = '/methodology/',
  defaultOpen = false,
}: Props) {
  const allLimits = [...pageLimits, ...limits];

  return (
    <details
      className="my-6 rounded-lg border border-slate-200 bg-slate-50 [&_summary::-webkit-details-marker]:hidden"
      open={defaultOpen}
    >
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Methodology & data sources
        </span>
        <span className="text-xs font-normal text-slate-500">Click to expand</span>
      </summary>

      <div className="px-4 pb-4 pt-1 text-sm text-slate-700 space-y-3">
        <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-2 text-xs">
          <dt className="font-semibold text-slate-500 uppercase tracking-wider">Source</dt>
          <dd>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-800 underline underline-offset-2 decoration-slate-300 hover:decoration-slate-600"
            >
              {source.name}
            </a>
          </dd>

          <dt className="font-semibold text-slate-500 uppercase tracking-wider">Release</dt>
          <dd className="text-slate-700">{release}</dd>

          <dt className="font-semibold text-slate-500 uppercase tracking-wider">Data year</dt>
          <dd className="text-slate-700">{dataYear}</dd>

          <dt className="font-semibold text-slate-500 uppercase tracking-wider">Update cadence</dt>
          <dd className="text-slate-700">{cadence}</dd>

          <dt className="font-semibold text-slate-500 uppercase tracking-wider">DB updated</dt>
          <dd className="text-slate-700">
            <time dateTime={dbUpdated}>{fmtDate(dbUpdated)}</time>
          </dd>
        </dl>

        {formula && (
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Formula
            </div>
            <code className="block text-xs bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-800 font-mono">
              {formula}
            </code>
          </div>
        )}

        {allLimits.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Known limitations
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-xs">
              {allLimits.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200">
          <a
            href={fullHref}
            className="text-xs text-slate-600 hover:text-slate-900 underline underline-offset-2"
          >
            Full methodology →
          </a>
        </div>
      </div>
    </details>
  );
}
