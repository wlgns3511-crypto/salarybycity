/**
 * PurchasingPowerComparison — RPP-adjusted salary comparison block.
 *
 * Site-specific (salarybycity): depends on lib/rpp which uses BEA Regional
 * Price Parities to convert nominal local salaries into purchasing-power
 * benchmarks against the U.S. national average (US=100).
 *
 * Used by:
 *   - app/jobs/[slug]/page.tsx — top metros for an occupation
 *   - app/state/[slug]/page.tsx — top metros within a state
 *
 * Server component (no client JS, SEO-friendly table).
 */
import { getEffectiveRpp, nominalToReal, getRppMeta } from "@/lib/rpp";
import { formatSalary } from "@/lib/format";

export interface CityRow {
  /** 7-digit BLS area_code, e.g. "0035620" */
  area_code: string;
  area_title: string;
  area_slug: string;
  /** Local nominal annual median salary (USD). */
  annual_median: number | null;
}

export interface PurchasingPowerComparisonProps {
  /** Subject of the comparison (occupation title or "in {state}" phrase). */
  contextLabel: string;
  /** Cities to compare. Component picks top 5 by nominal pay if >5 supplied. */
  cities: CityRow[];
  /**
   * National-baseline median to anchor the "vs national" delta column.
   * For occupation pages, this is the BLS national median for the same SOC.
   * For state pages, pass the state-mean median (or omit) — when omitted,
   * delta column is computed against U.S. national average (RPP=100).
   */
  baselineMedian?: number | null;
  /** Heading override. Defaults to "Top {contextLabel} salaries adjusted for cost of living". */
  heading?: string;
  /**
   * If true, render only the table without the surrounding section/explainer.
   * Used when embedding inside an existing layout block.
   */
  bare?: boolean;
}

export function PurchasingPowerComparison({
  contextLabel,
  cities,
  baselineMedian,
  heading,
  bare = false,
}: PurchasingPowerComparisonProps) {
  const usable = cities
    .filter((c) => c.annual_median != null && c.annual_median > 0)
    .slice(0, 5);

  if (usable.length < 3) return null;

  const rppMeta = getRppMeta();

  const rows = usable.map((city) => {
    const rpp = getEffectiveRpp(city.area_code);
    const nominal = city.annual_median as number;
    const real = nominalToReal(nominal, city.area_code);
    const baseline = baselineMedian ?? nominal; // fallback so we never divide by zero
    const deltaVsBaseline = baselineMedian
      ? Math.round(((real - baseline) / baseline) * 100)
      : null;
    return {
      name: city.area_title,
      slug: city.area_slug,
      nominal,
      rpp: rpp.value,
      rppLevel: rpp.level,
      real,
      deltaVsBaseline,
    };
  });

  const title =
    heading ?? `Top ${contextLabel} salaries adjusted for cost of living`;

  const table = (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-2 py-2">Metro</th>
            <th className="px-2 py-2 text-right">Nominal median</th>
            <th className="px-2 py-2 text-right">RPP</th>
            <th className="px-2 py-2 text-right">Real (US=100)</th>
            {baselineMedian != null && (
              <th className="px-2 py-2 text-right">vs baseline</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-slate-100">
              <td className="px-2 py-2 align-top">{row.name}</td>
              <td className="px-2 py-2 text-right align-top tabular-nums">
                {formatSalary(row.nominal)}
              </td>
              <td className="px-2 py-2 text-right align-top text-slate-500 tabular-nums">
                {row.rpp.toFixed(1)}
                <span className="ml-1 text-[11px] text-slate-400">
                  ({row.rppLevel})
                </span>
              </td>
              <td className="px-2 py-2 text-right align-top tabular-nums">
                {formatSalary(row.real)}
              </td>
              {baselineMedian != null && (
                <td
                  className={`px-2 py-2 text-right align-top font-medium tabular-nums ${
                    (row.deltaVsBaseline ?? 0) >= 0
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {(row.deltaVsBaseline ?? 0) >= 0 ? "+" : ""}
                  {row.deltaVsBaseline}%
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (bare) return table;

  return (
    <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Purchasing power benchmark
      </p>
      <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        High-paying metros usually have a higher cost of living too. The table
        converts each nominal median salary to its U.S. national-average
        purchasing power using BEA Regional Price Parities (
        {rppMeta.year} release). RPP &gt; 100 means the metro is more expensive
        than the national average; RPP &lt; 100 means cheaper. The
        &ldquo;Real&rdquo; column shows what each salary buys at U.S.-average
        prices.
      </p>

      {table}

      <p className="mt-4 text-xs text-slate-500">
        Source: {rppMeta.source} ({rppMeta.year}). Real (US=100) divides the
        local nominal salary by the local price level (RPP / 100).
        Purchasing-power differences do not account for state/local taxes,
        housing-vs-other spending mix, or commute costs. For a custom
        comparison between any two metros, use the{" "}
        <a
          href="/tools/col-calculator/"
          className="underline hover:text-slate-700"
        >
          cost-of-living calculator
        </a>
        .
      </p>
    </section>
  );
}
