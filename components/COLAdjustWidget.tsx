/**
 * Cost-of-living salary calculator. Pure server component.
 *
 * Form is a standard HTML <form method="GET"> that submits to the same URL
 * with from/to/salary as querystring params. Page reads searchParams, runs
 * the math, and re-renders. No client JS, no recharts. SEO-friendly because
 * any (from, to, salary) tuple becomes a URL the user can bookmark.
 */
import Link from 'next/link';
import { adjustSalary, getRppForArea, getEffectiveRpp } from '@/lib/rpp';

interface AreaOption {
  area_code: string;
  area_title: string;
}

interface COLAdjustWidgetProps {
  /** Available areas to choose from (50 MSAs + national, typically). */
  areas: AreaOption[];
  /** Action target URL (defaults to current page). */
  action?: string;
  /** User-supplied form values via URL searchParams. */
  fromArea?: string;
  toArea?: string;
  salary?: string;
  /** Optional title override. */
  heading?: string;
}

function formatUsd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function COLAdjustWidget({
  areas,
  action,
  fromArea,
  toArea,
  salary,
  heading = 'Cost-of-living salary calculator',
}: COLAdjustWidgetProps) {
  const salaryNum = salary ? Number(salary.replace(/[$,]/g, '')) : NaN;
  const hasInput = fromArea && toArea && Number.isFinite(salaryNum) && salaryNum > 0;

  let result: ReturnType<typeof adjustSalary> | null = null;
  let fromTitle = '';
  let toTitle = '';
  let fromMeta = '';
  let toMeta = '';

  if (hasInput) {
    result = adjustSalary(salaryNum, fromArea!, toArea!);
    const fromArea_ = areas.find((a) => a.area_code === fromArea);
    const toArea_ = areas.find((a) => a.area_code === toArea);
    fromTitle = fromArea_?.area_title ?? fromArea!;
    toTitle = toArea_?.area_title ?? toArea!;

    const fromRpp = getRppForArea(fromArea!);
    const toRpp = getRppForArea(toArea!);
    const fromEff = getEffectiveRpp(fromArea!);
    const toEff = getEffectiveRpp(toArea!);
    fromMeta = `RPP ${fromEff.value.toFixed(1)} (${fromEff.level === 'msa' ? 'MSA' : fromEff.level === 'state' ? 'state' : 'national'}${fromRpp?.state ? `, ${fromRpp.state}` : ''})`;
    toMeta = `RPP ${toEff.value.toFixed(1)} (${toEff.level === 'msa' ? 'MSA' : toEff.level === 'state' ? 'state' : 'national'}${toRpp?.state ? `, ${toRpp.state}` : ''})`;
  }

  return (
    <section className="my-6 rounded-lg border border-slate-200 bg-white p-4">
      <header className="mb-3">
        <h3 className="text-base font-semibold text-slate-900">{heading}</h3>
        <p className="text-xs text-slate-600">
          Convert a salary in one area to its purchasing-power equivalent in another, using BEA Regional Price Parities (2024).
        </p>
      </header>

      <form method="GET" action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-xs">
          <span className="mb-1 block font-medium text-slate-700">Starting area</span>
          <select
            name="from"
            defaultValue={fromArea ?? ''}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            required
          >
            <option value="">Select…</option>
            {areas.map((a) => (
              <option key={`f${a.area_code}`} value={a.area_code}>
                {a.area_title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block font-medium text-slate-700">Salary in starting area</span>
          <input
            type="text"
            name="salary"
            inputMode="numeric"
            defaultValue={salary ?? ''}
            placeholder="100000"
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            required
          />
        </label>
        <label className="text-xs">
          <span className="mb-1 block font-medium text-slate-700">Target area</span>
          <select
            name="to"
            defaultValue={toArea ?? ''}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            required
          >
            <option value="">Select…</option>
            {areas.map((a) => (
              <option key={`t${a.area_code}`} value={a.area_code}>
                {a.area_title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="sm:col-span-3 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Calculate equivalent
        </button>
      </form>

      {hasInput && result && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="text-slate-700">
            {formatUsd(salaryNum)} in <strong>{fromTitle}</strong> has the same purchasing power as
            {' '}
            <strong className="text-slate-900">{formatUsd(result.equivalent)}</strong>
            {' '}in <strong>{toTitle}</strong>
            {' '}
            <span className="text-slate-500">
              ({result.deltaPct >= 0 ? '+' : ''}{result.deltaPct}% {result.deltaPct >= 0 ? 'higher' : 'lower'} nominal).
            </span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            <span className="font-medium">{fromTitle}:</span> {fromMeta}
            {' · '}
            <span className="font-medium">{toTitle}:</span> {toMeta}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Method: target salary = source salary × (target RPP / source RPP). MSA RPP used when available, otherwise state RPP, otherwise national (=100).
          </p>
        </div>
      )}

      <p className="mt-3 text-[11px] text-slate-500">
        RPP source: <Link href="https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area" rel="nofollow noopener" target="_blank" className="underline">BEA Regional Price Parities, released February 2025</Link>. Higher RPP = costlier area.
      </p>
    </section>
  );
}
