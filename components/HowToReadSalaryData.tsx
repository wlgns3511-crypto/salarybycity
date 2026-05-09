/**
 * HowToReadSalaryData — common-mistake explainer block for occupation pages.
 *
 * Site-specific (salarybycity): targets the 5 most common misreadings of BLS
 * OEWS wage data. Server component, no client JS, SEO-friendly markup.
 *
 * Used by:
 *   - app/jobs/[slug]/page.tsx — occupation detail
 *
 * Rendered after the cost-of-living comparison block so the reader has just
 * seen "real" purchasing-power numbers and the gap between nominal and real
 * is fresh in mind. The block is intentionally text-heavy: the goal is to
 * shift the reader from "what is the salary" to "what does the salary
 * actually mean for me", which is the AdSense Helpful-Content signal we
 * want to demonstrate.
 */
import { formatSalary } from "@/lib/format";

export interface HowToReadSalaryDataProps {
  /** Occupation title for headline interpolation, e.g. "Software Developers". */
  occupationTitle: string;
  /** National median for the same occupation (used for the mean-vs-median example). */
  nationalMedian?: number | null;
  /** National mean for the same occupation (used to demonstrate the skew). */
  nationalMean?: number | null;
}

export function HowToReadSalaryData({
  occupationTitle,
  nationalMedian,
  nationalMean,
}: HowToReadSalaryDataProps) {
  // We only render the mean-vs-median sample line when both numbers are real
  // and the mean is actually higher than the median (which it almost always
  // is for wage distributions, but guard anyway).
  const showMeanMedianGap =
    nationalMedian != null &&
    nationalMean != null &&
    nationalMedian > 0 &&
    nationalMean > nationalMedian;
  const meanMedianGapPct = showMeanMedianGap
    ? Math.round(((nationalMean! - nationalMedian!) / nationalMedian!) * 100)
    : null;

  return (
    <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50/60 p-5 md:p-6">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
        Read before you cite
      </p>
      <h2 className="text-2xl font-bold text-slate-950">
        How to read {occupationTitle} salary data without getting fooled
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        BLS wage tables are clean and authoritative, but they are easy to
        misread. Five gotchas catch most people, and each one can change a
        career or relocation decision by tens of thousands of dollars.
      </p>

      <ol className="mt-5 space-y-5 text-sm leading-6 text-slate-800">
        <li>
          <p className="font-semibold text-slate-900">
            1. Mean is not median &mdash; and the gap is usually big.
          </p>
          <p className="mt-1">
            The median is the middle worker; half earn more, half earn less.
            The mean (the average) is pulled up by the highest-paid workers,
            so it sits above the median in almost every occupation.
            {showMeanMedianGap ? (
              <>
                {" "}For {occupationTitle.toLowerCase()}, the national mean of
                {" "}{formatSalary(nationalMean!)} is{" "}
                <strong>about {meanMedianGapPct}% higher</strong> than the
                national median of {formatSalary(nationalMedian!)} &mdash;
                which means the &ldquo;average&rdquo; figure overstates what
                a typical worker actually takes home.
              </>
            ) : (
              " For most occupations the mean overstates what a typical worker actually earns; quote the median when you want a representative number."
            )}{" "}
            When in doubt, cite the median.
          </p>
        </li>

        <li>
          <p className="font-semibold text-slate-900">
            2. These are individual occupational wages, not household income.
          </p>
          <p className="mt-1">
            Every figure on this page is what one person earns in this one
            occupation, before taxes and before benefits. Household income
            (the number you see in Census or American Community Survey
            tables) is the combined pay of everyone working in a household
            and is usually higher than any one occupational wage. Do not
            compare a {occupationTitle.toLowerCase()} salary to a metro
            &ldquo;median household income&rdquo; figure as if they measure
            the same thing &mdash; they do not.
          </p>
        </li>

        <li>
          <p className="font-semibold text-slate-900">
            3. The data lags 12&ndash;18 months. It is not today&apos;s spot
            market.
          </p>
          <p className="mt-1">
            BLS publishes OEWS roughly a year after the survey reference
            period, so the numbers reflect what employers were paying then,
            not what they are paying right now. In a tight or rapidly
            cooling labor market the real spot rate can be visibly different.
            Treat the figure on this page as a calibrated benchmark, not a
            live job-board quote.
          </p>
        </li>

        <li>
          <p className="font-semibold text-slate-900">
            4. Base wage only &mdash; bonus, equity, and benefits are not
            included.
          </p>
          <p className="mt-1">
            OEWS captures cash wages and salary income paid by traditional
            employers. It excludes performance bonuses, sales commissions,
            stock and RSU grants, sign-on bonuses, healthcare and retirement
            contributions, and the dollar value of paid leave. In
            sales-driven, equity-heavy, or benefit-rich roles
            (tech, finance, federal employment, large healthcare systems)
            total compensation can be 10&ndash;50% higher than the base
            number you see here.
          </p>
        </li>

        <li>
          <p className="font-semibold text-slate-900">
            5. A bigger nominal salary is not always a bigger real salary.
          </p>
          <p className="mt-1">
            Pay in San Francisco or New York looks higher because it is
            higher in dollars &mdash; but housing, food, and services cost
            more there too. Use the BEA Regional Price Parity column in the
            cost-of-living comparison above (or our{" "}
            <a
              href="/tools/col-calculator/"
              className="text-blue-700 underline hover:text-blue-900"
            >
              cost-of-living calculator
            </a>
            ) to convert to real, U.S.-baseline dollars before comparing
            offers across metros. A salary that buys 30% more groceries is
            usually a better salary, even if the headline number is smaller.
          </p>
        </li>
      </ol>

      <p className="mt-5 text-xs text-slate-600">
        These caveats apply to every BLS-derived wage figure on the
        internet, not just SalaryByCity. They are documented in the{" "}
        <a href="/methodology/" className="underline hover:text-slate-900">
          methodology
        </a>{" "}
        and built into our{" "}
        <a href="/about/" className="underline hover:text-slate-900">
          editorial process
        </a>
        .
      </p>
    </section>
  );
}
