import type { Metadata } from "next";
import { getTopComparisons, getOccupationBySlug, getNationalWage } from "@/lib/db";
import { formatSalary, getDataYear } from "@/lib/format";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Salary Comparisons - Compare Occupations Side by Side",
  description:
    "Compare salaries between occupations. See side-by-side salary data, percentile ranges, and employment numbers for 800+ US occupations.",
  alternates: { canonical: "/compare" },
};

export default function CompareIndexPage() {
  const comparisons = getTopComparisons(200);
  const year = getDataYear();

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Compare Salaries", url: "/compare" },
  ];

  // Group into categories for a cleaner grid
  const enriched = comparisons.map((c) => {
    const occA = getOccupationBySlug(c.slugA);
    const occB = getOccupationBySlug(c.slugB);
    const wageA = occA ? getNationalWage(occA.soc_code) : undefined;
    const wageB = occB ? getNationalWage(occB.soc_code) : undefined;
    return { ...c, wageA, wageB };
  });

  return (
    <div>
      <Breadcrumb
        items={breadcrumbs.map((b) => ({ label: b.name, href: b.url }))}
      />

      <h1 className="text-3xl font-bold mb-2">
        Salary Comparisons ({year})
      </h1>
      <p className="text-slate-500 mb-8">
        Compare salaries between popular US occupations. Click any comparison to see detailed
        side-by-side salary data, percentile ranges, top paying cities, and more.
      </p>

      <AdSlot id="compare-index-top" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {enriched.map((c) => {
          const medianA = c.wageA?.annual_median ?? null;
          const medianB = c.wageB?.annual_median ?? null;
          return (
            <a
              key={`${c.slugA}-${c.slugB}`}
              href={`/compare/${c.slugA}-vs-${c.slugB}`}
              className="block border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="text-sm font-semibold text-blue-700 leading-tight">{c.titleA}</span>
                <span className="text-xs text-slate-400 shrink-0">vs</span>
                <span className="text-sm font-semibold text-emerald-700 leading-tight text-right">{c.titleB}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{formatSalary(medianA)}</span>
                <span>{formatSalary(medianB)}</span>
              </div>
            </a>
          );
        })}
      </div>

      <AdSlot id="compare-index-bottom" />

      <section className="mt-10 bg-slate-50 border border-slate-200 rounded-lg p-5">
        <h2 className="text-lg font-bold mb-2">About Salary Comparisons</h2>
        <p className="text-sm text-slate-600">
          All salary data comes from the U.S. Bureau of Labor Statistics Occupational Employment
          and Wage Statistics (OEWS) program. Comparisons include median, mean, and percentile
          salary breakdowns for {year}. Use these comparisons to evaluate career paths, negotiate
          salaries, or explore career change opportunities.
        </p>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema(breadcrumbs.map((b) => ({ name: b.name, url: b.url })))
          ),
        }}
      />
    </div>
  );
}
