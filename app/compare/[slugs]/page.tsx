import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getTopComparisons,
  getComparisonBySlugs,
  getOccupationBySlug,
  getNationalWage,
  getTopPayingCities,
  type WageData,
} from "@/lib/db";
import { formatSalary, formatNumber, getDataYear } from "@/lib/format";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { DataFeedback } from "@/components/DataFeedback";
import { FreshnessTag } from "@/components/FreshnessTag";
import { FAQ } from "@/components/FAQ";
import { faqSchema, breadcrumbSchema } from "@/lib/schema";

interface Props {
  params: Promise<{ slugs: string }>;
}

function parseSlugs(slugs: string): { slugA: string; slugB: string } | null {
  const parts = slugs.split("-vs-");
  if (parts.length !== 2) return null;
  const slugA = parts[0];
  const slugB = parts[1];
  if (!slugA || !slugB) return null;
  return { slugA, slugB };
}

export async function generateStaticParams() {
  // Pre-build top 500 comparisons; rest served via ISR
  const comparisons = getTopComparisons(500);
  return comparisons.map((c) => ({
    slugs: `${c.slugA}-vs-${c.slugB}`,
  }));
}

export const dynamicParams = false;
export const revalidate = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugs } = await params;
  const parsed = parseSlugs(slugs);
  if (!parsed) return {};

  const comp = getComparisonBySlugs(parsed.slugA, parsed.slugB);
  if (!comp) return {};

  const occA = getOccupationBySlug(comp.slugA);
  const occB = getOccupationBySlug(comp.slugB);
  if (!occA || !occB) return {};

  const wageA = getNationalWage(occA.soc_code);
  const wageB = getNationalWage(occB.soc_code);
  const year = getDataYear();

  const medianA = formatSalary(wageA?.annual_median ?? null);
  const medianB = formatSalary(wageB?.annual_median ?? null);

  return {
    title: `${occA.title} vs ${occB.title} Salary Comparison (${year})`,
    description: `Compare ${occA.title} (${medianA}) and ${occB.title} (${medianB}) salaries side by side. See median, percentile ranges, employment numbers, and top paying cities.`,
    alternates: { canonical: `/compare/${slugs}` },
    openGraph: { url: `/compare/${slugs}` },
  };
}

function SalaryRangeBar({
  wage,
  color,
  globalMin,
  globalMax,
}: {
  wage: WageData;
  color: "blue" | "emerald";
  globalMin: number;
  globalMax: number;
}) {
  if (!wage.annual_p10 || !wage.annual_p90 || !wage.annual_median) return null;
  const range = globalMax - globalMin;
  if (range <= 0) return null;

  const p10Pos = ((wage.annual_p10 - globalMin) / range) * 100;
  const p90Pos = ((wage.annual_p90 - globalMin) / range) * 100;
  const medianPos = ((wage.annual_median - globalMin) / range) * 100;
  const p25Pos = wage.annual_p25 ? ((wage.annual_p25 - globalMin) / range) * 100 : p10Pos;
  const p75Pos = wage.annual_p75 ? ((wage.annual_p75 - globalMin) / range) * 100 : p90Pos;

  const bg = color === "blue" ? "bg-blue-400" : "bg-emerald-400";
  const marker = color === "blue" ? "bg-blue-800" : "bg-emerald-800";

  return (
    <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`absolute h-full ${bg} opacity-60`}
        style={{ left: `${p25Pos}%`, width: `${Math.max(p75Pos - p25Pos, 1)}%` }}
      />
      <div
        className={`absolute h-full w-1 ${marker}`}
        style={{ left: `${medianPos}%` }}
      />
    </div>
  );
}

function PercentileRow({
  label,
  valA,
  valB,
}: {
  label: string;
  valA: number | null;
  valB: number | null;
}) {
  const diff =
    valA !== null && valB !== null ? valA - valB : null;
  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50">
      <td className="p-3 font-medium">{label}</td>
      <td className="p-3 text-right">{formatSalary(valA)}</td>
      <td className="p-3 text-right">{formatSalary(valB)}</td>
      <td className="p-3 text-right">
        {diff !== null ? (
          <span className={diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-slate-500"}>
            {diff > 0 ? "+" : ""}
            {formatSalary(diff)}
          </span>
        ) : (
          "N/A"
        )}
      </td>
    </tr>
  );
}

export default async function ComparePage({ params }: Props) {
  const { slugs } = await params;
  const parsed = parseSlugs(slugs);
  if (!parsed) notFound();

  const comp = getComparisonBySlugs(parsed.slugA, parsed.slugB);
  if (!comp) notFound();

  const occA = getOccupationBySlug(comp.slugA);
  const occB = getOccupationBySlug(comp.slugB);
  if (!occA || !occB) notFound();

  const wageA = getNationalWage(occA.soc_code);
  const wageB = getNationalWage(occB.soc_code);
  if (!wageA && !wageB) notFound();

  const topCitiesA = getTopPayingCities(occA.soc_code, 5);
  const topCitiesB = getTopPayingCities(occB.soc_code, 5);
  const year = getDataYear();

  // Determine which pays more
  const medianA = wageA?.annual_median ?? 0;
  const medianB = wageB?.annual_median ?? 0;
  const higherPay = medianA > medianB ? occA.title : medianB > medianA ? occB.title : null;
  const diff = Math.abs(medianA - medianB);
  const pctDiff = medianB > 0 && medianA > 0
    ? ((diff / Math.min(medianA, medianB)) * 100).toFixed(1)
    : null;

  // Global min/max for aligned salary bars
  const allVals = [
    wageA?.annual_p10, wageA?.annual_p90,
    wageB?.annual_p10, wageB?.annual_p90,
  ].filter((v): v is number => v !== null && v !== undefined);
  const globalMin = allVals.length > 0 ? Math.min(...allVals) : 0;
  const globalMax = allVals.length > 0 ? Math.max(...allVals) : 200000;

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Compare", url: "/compare" },
    { name: `${occA.title} vs ${occB.title}`, url: `/compare/${slugs}` },
  ];

  // FAQ items
  const faqs = [
    {
      question: `Who earns more: ${occA.title} or ${occB.title}?`,
      answer: higherPay
        ? `${higherPay} professionals earn more, with a median salary difference of ${formatSalary(diff)} (${pctDiff}% higher) as of ${year} BLS data.`
        : `Both occupations have the same median salary of ${formatSalary(medianA)} as of ${year}.`,
    },
    {
      question: `What is the salary range for ${occA.title}?`,
      answer: wageA
        ? `${occA.title} salaries range from ${formatSalary(wageA.annual_p10)} (10th percentile) to ${formatSalary(wageA.annual_p90)} (90th percentile), with a median of ${formatSalary(wageA.annual_median)}.`
        : `Salary data for ${occA.title} is not currently available.`,
    },
    {
      question: `What is the salary range for ${occB.title}?`,
      answer: wageB
        ? `${occB.title} salaries range from ${formatSalary(wageB.annual_p10)} (10th percentile) to ${formatSalary(wageB.annual_p90)} (90th percentile), with a median of ${formatSalary(wageB.annual_median)}.`
        : `Salary data for ${occB.title} is not currently available.`,
    },
    {
      question: `How many ${occA.title} and ${occB.title} jobs are there?`,
      answer: `There are approximately ${formatNumber(wageA?.employment ?? null)} ${occA.title} positions and ${formatNumber(wageB?.employment ?? null)} ${occB.title} positions nationwide according to ${year} BLS data.`,
    },
    {
      question: `Is it worth switching from ${occB.title} to ${occA.title}?`,
      answer: `Career decisions depend on many factors beyond salary. ${occA.title} has a median salary of ${formatSalary(medianA)} while ${occB.title} earns ${formatSalary(medianB)}. Consider job satisfaction, growth prospects, required education, and work-life balance.`,
    },
  ];

  return (
    <div>
      <Breadcrumb
        items={breadcrumbs.map((b) => ({ label: b.name, href: b.url }))}
      />

      <h1 className="text-3xl font-bold mb-2">
        {occA.title} vs {occB.title}: Salary Comparison ({year})
      </h1>
      <p className="text-slate-500 mb-6">
        Side-by-side salary comparison using {year} Bureau of Labor Statistics data.
      </p>

      {/* Hero comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h2 className="text-lg font-bold text-blue-800 mb-1">
            <a href={`/jobs/${occA.slug}`} className="hover:underline">{occA.title}</a>
          </h2>
          <div className="text-3xl font-bold text-blue-700 mb-1">
            {formatSalary(wageA?.annual_median ?? null)}
          </div>
          <p className="text-sm text-slate-500">Median annual salary</p>
          {wageA?.employment && (
            <p className="text-sm text-slate-500 mt-1">
              {formatNumber(wageA.employment)} employed nationally
            </p>
          )}
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
          <h2 className="text-lg font-bold text-emerald-800 mb-1">
            <a href={`/jobs/${occB.slug}`} className="hover:underline">{occB.title}</a>
          </h2>
          <div className="text-3xl font-bold text-emerald-700 mb-1">
            {formatSalary(wageB?.annual_median ?? null)}
          </div>
          <p className="text-sm text-slate-500">Median annual salary</p>
          {wageB?.employment && (
            <p className="text-sm text-slate-500 mt-1">
              {formatNumber(wageB.employment)} employed nationally
            </p>
          )}
        </div>
      </div>

      {/* Which pays more? */}
      {higherPay && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-8">
          <h2 className="text-xl font-bold mb-2">Which Career Pays More?</h2>
          <p className="text-slate-700">
            <strong>{higherPay}</strong> professionals earn{" "}
            <strong>{formatSalary(diff)}</strong> more per year than{" "}
            {higherPay === occA.title ? occB.title : occA.title} professionals
            {pctDiff ? ` — that's ${pctDiff}% higher` : ""}.
            {wageA && wageB && wageA.annual_p90 && wageB.annual_p90 && (
              <> At the 90th percentile, {occA.title} earns {formatSalary(wageA.annual_p90)} compared to {formatSalary(wageB.annual_p90)} for {occB.title}.</>
            )}
          </p>
        </div>
      )}

      {/* Visual salary range bars */}
      {wageA && wageB && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Salary Range Comparison</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-blue-700">{occA.title}</span>
                <span className="text-slate-500">
                  {formatSalary(wageA.annual_p10)} – {formatSalary(wageA.annual_p90)}
                </span>
              </div>
              <SalaryRangeBar wage={wageA} color="blue" globalMin={globalMin} globalMax={globalMax} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-emerald-700">{occB.title}</span>
                <span className="text-slate-500">
                  {formatSalary(wageB.annual_p10)} – {formatSalary(wageB.annual_p90)}
                </span>
              </div>
              <SalaryRangeBar wage={wageB} color="emerald" globalMin={globalMin} globalMax={globalMax} />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{formatSalary(globalMin)}</span>
              <span>{formatSalary(globalMax)}</span>
            </div>
          </div>
        </section>
      )}

      <AdSlot id="compare-mid" />

      {/* Percentile comparison table */}
      {wageA && wageB && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Detailed Salary Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold">Percentile</th>
                  <th className="text-right p-3 font-semibold text-blue-700">{occA.title}</th>
                  <th className="text-right p-3 font-semibold text-emerald-700">{occB.title}</th>
                  <th className="text-right p-3 font-semibold">Difference</th>
                </tr>
              </thead>
              <tbody>
                <PercentileRow label="10th Percentile" valA={wageA.annual_p10} valB={wageB.annual_p10} />
                <PercentileRow label="25th Percentile" valA={wageA.annual_p25} valB={wageB.annual_p25} />
                <PercentileRow label="Median (50th)" valA={wageA.annual_median} valB={wageB.annual_median} />
                <PercentileRow label="75th Percentile" valA={wageA.annual_p75} valB={wageB.annual_p75} />
                <PercentileRow label="90th Percentile" valA={wageA.annual_p90} valB={wageB.annual_p90} />
                <PercentileRow label="Mean (Average)" valA={wageA.annual_mean} valB={wageB.annual_mean} />
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Employment comparison */}
      {wageA && wageB && (wageA.employment || wageB.employment) && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Employment Numbers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-700">{occA.title}</h3>
              <p className="text-2xl font-bold mt-1">{formatNumber(wageA.employment)}</p>
              <p className="text-sm text-slate-500">employed nationwide</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-emerald-700">{occB.title}</h3>
              <p className="text-2xl font-bold mt-1">{formatNumber(wageB.employment)}</p>
              <p className="text-sm text-slate-500">employed nationwide</p>
            </div>
          </div>
        </section>
      )}

      {/* Top paying cities */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Top Paying Cities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topCitiesA.length > 0 && (
            <div>
              <h3 className="font-semibold text-blue-700 mb-2">
                Best Cities for {occA.title}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="text-left p-2 font-semibold">City</th>
                      <th className="text-right p-2 font-semibold">Median</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCitiesA.map((city) => (
                      <tr key={city.area_slug} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-2">
                          <a href={`/jobs/${occA.slug}/${city.area_slug}`} className="text-blue-600 hover:underline">
                            {city.area_title}
                          </a>
                        </td>
                        <td className="p-2 text-right font-medium">{formatSalary(city.annual_median)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {topCitiesB.length > 0 && (
            <div>
              <h3 className="font-semibold text-emerald-700 mb-2">
                Best Cities for {occB.title}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-emerald-50">
                      <th className="text-left p-2 font-semibold">City</th>
                      <th className="text-right p-2 font-semibold">Median</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCitiesB.map((city) => (
                      <tr key={city.area_slug} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-2">
                          <a href={`/jobs/${occB.slug}/${city.area_slug}`} className="text-blue-600 hover:underline">
                            {city.area_title}
                          </a>
                        </td>
                        <td className="p-2 text-right font-medium">{formatSalary(city.annual_median)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      <AdSlot id="compare-bottom" />

      <FAQ items={faqs} />

      {/* High-CPC footer */}
      <section className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-5">
        <h2 className="text-lg font-bold mb-3">Career Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-white rounded border border-slate-100">
            <h3 className="font-semibold mb-1">Career Change Resources</h3>
            <p className="text-slate-500 text-xs">Explore tools and guides for transitioning between careers.</p>
          </div>
          <div className="p-3 bg-white rounded border border-slate-100">
            <h3 className="font-semibold mb-1">Professional Certifications</h3>
            <p className="text-slate-500 text-xs">Find certifications that can boost your earning potential.</p>
          </div>
          <div className="p-3 bg-white rounded border border-slate-100">
            <h3 className="font-semibold mb-1">Online Degree Programs</h3>
            <p className="text-slate-500 text-xs">Browse accredited online degrees relevant to these careers.</p>
          </div>
          <div className="p-3 bg-white rounded border border-slate-100">
            <h3 className="font-semibold mb-1">Resume Writing Services</h3>
            <p className="text-slate-500 text-xs">Get professional help crafting a standout resume.</p>
          </div>
        </div>
      </section>

      {/* Cross-site links */}
      <section className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-5">
        <h2 className="text-lg font-bold mb-3">Explore More</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <a href="https://costbycity.com" className="text-blue-600 hover:underline">Cost of Living by City</a>
          <a href="https://degreewize.com" className="text-blue-600 hover:underline">College & University Data</a>
          <a href="https://calcpeek.com" className="text-blue-600 hover:underline">Salary Calculators</a>
        </div>
      </section>

      <DataFeedback />
      <FreshnessTag source="U.S. Bureau of Labor Statistics OEWS" />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema(faqs)),
        }}
      />
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
