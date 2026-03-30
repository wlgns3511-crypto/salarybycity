import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getOccupationBySlug,
  getAllOccupations,
  getNationalWage,
  getTopPayingCities,
  getRelatedOccupations,
  getWagesByOccupation,
} from "@/lib/db";
import { formatSalary, getDataYear } from "@/lib/format";
import { SalaryOverview, SalaryBar, CityComparisonTable } from "@/components/SalaryTable";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { TakeHomeCalculator } from "@/components/TakeHomeCalculator";
import { occupationSchema, breadcrumbSchema } from "@/lib/schema";
import { SalaryChart } from "@/components/SalaryChart";
import { CiteButton } from "@/components/CiteButton";
import { AuthorBox } from "@/components/AuthorBox";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  // Pre-build top occupations; rest served via ISR
  const occupations = getAllOccupations();
  return occupations.slice(0, 50).map((occ) => ({ slug: occ.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const occ = getOccupationBySlug(slug);
  if (!occ) return {};
  const wage = getNationalWage(occ.soc_code);
  const year = getDataYear();

  return {
    title: `${occ.title} Salary - ${year} National Wage Data`,
    description: `The median ${occ.title} salary in the US is ${formatSalary(wage?.annual_median ?? null)}. Compare salaries across 400+ metro areas.`,
    alternates: { canonical: `/jobs/${slug}` },
  };
}

export default async function JobDetailPage({ params }: Props) {
  const { slug } = await params;
  const occ = getOccupationBySlug(slug);
  if (!occ) notFound();

  const nationalWage = getNationalWage(occ.soc_code);
  const topCities = getTopPayingCities(occ.soc_code, 20);
  // Removed allCityWages to stay under Vercel body size limit
  const related = getRelatedOccupations(occ.major_group, occ.soc_code, 8);
  const year = getDataYear();

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Occupations", url: "/jobs" },
    { name: occ.title, url: `/jobs/${slug}` },
  ];

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            "name": `${occ.title} Salary Data (${year})`,
            "description": `National and metro-area wage data for ${occ.title} including median salary, salary range, and employment statistics.`,
            "url": `https://salarybycity.com/jobs/${slug}`,
            "license": "https://creativecommons.org/publicdomain/zero/1.0/",
            "creator": { "@type": "Organization", "name": "DataPeek Facts", "url": "https://datapeekfacts.com" },
            "temporalCoverage": "2024/2026",
            "distribution": { "@type": "DataDownload", "encodingFormat": "text/html" }
          })
        }}
      />
      <Breadcrumb
        items={breadcrumbs.map((b) => ({ label: b.name, href: b.url }))}
      />

      <h1 className="text-3xl font-bold mb-2">
        {occ.title} Salary ({year})
      </h1>
      <p className="text-slate-500 mb-1">SOC Code: {occ.soc_code}</p>
      <p className="text-slate-500 mb-6">Category: {occ.major_group_title}</p>

      <div className="flex items-center gap-4 mt-4">
        <CiteButton title={`${occ.title} Salary Data`} url={`https://salarybycity.com/jobs/${slug}`} source="SalaryByCity (BLS Data)" />
      </div>

      {nationalWage && (
        <>
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-slate-500">Median Salary</div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatSalary(nationalWage.annual_median)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Average Salary</div>
                <div className="text-2xl font-bold">
                  {formatSalary(nationalWage.annual_mean)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Salary Range</div>
                <div className="text-lg font-semibold">
                  {formatSalary(nationalWage.annual_p10)} - {formatSalary(nationalWage.annual_p90)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Total Employed</div>
                <div className="text-lg font-semibold">
                  {nationalWage.employment?.toLocaleString("en-US") ?? "N/A"}
                </div>
              </div>
            </div>
          </div>

          <SalaryChart
            p10={nationalWage.annual_p10 ?? 0}
            p25={nationalWage.annual_p25 ?? 0}
            median={nationalWage.annual_median ?? 0}
            p75={nationalWage.annual_p75 ?? 0}
            p90={nationalWage.annual_p90 ?? 0}
          />

          <h2 className="text-xl font-bold mb-3">National Salary Distribution</h2>
          <SalaryBar wage={nationalWage} />
          <SalaryOverview wage={nationalWage} jobTitle={occ.title} />
        </>
      )}

      <AdSlot id="job-detail-mid" />

      {topCities.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">
            Highest Paying Cities for {occ.title}s
          </h2>
          <CityComparisonTable rows={topCities} jobSlug={slug} />
        </section>
      )}


      {/* Take-Home Calculator */}
      {nationalWage?.annual_median && (
        <section className="mt-8">
          <TakeHomeCalculator defaultSalary={nationalWage.annual_median} />
        </section>
      )}

      <AuthorBox />

      {/* Cross-site links */}
      <section className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-5">
        <h2 className="text-lg font-bold mb-3">Explore More</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <a href="https://costbycity.com" className="text-blue-600 hover:underline">
            Cost of Living by City →
          </a>
          <a href="https://guidebycity.com" className="text-blue-600 hover:underline">
            City Guides & Rankings →
          </a>
          <a href="https://zippeek.com" className="text-blue-600 hover:underline">
            ZIP Code Demographics →
          </a>
          <a href="https://degreewize.com" className="text-blue-600 hover:underline">
            College & University Data →
          </a>
          <a href="https://calcpeek.com" className="text-blue-600 hover:underline">
            Salary Calculators →
          </a>
        </div>
      </section>

      <AdSlot id="job-detail-bottom" />

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">Related Occupations</h2>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm">
            {related.map((r) => (
              <li key={r.soc_code}>
                <a
                  href={`/jobs/${r.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* JSON-LD */}
      {nationalWage && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(occupationSchema(occ.title, nationalWage)),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                breadcrumbSchema(breadcrumbs)
              ),
            }}
          />
        </>
      )}
    </div>
  );
}
