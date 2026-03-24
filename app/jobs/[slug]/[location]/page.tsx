import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getOccupationBySlug,
  getAreaBySlug,
  getWage,
  getNationalWage,
  getTopPayingCities,
  getTopPayingJobs,
  getWagePagesChunk,
  countAllWagePages,
} from "@/lib/db";
import { formatSalary, shortAreaName, getDataYear } from "@/lib/format";
import { SalaryOverview, SalaryBar, CityComparisonTable, JobComparisonTable } from "@/components/SalaryTable";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FAQ } from "@/components/FAQ";
import { AdSlot } from "@/components/AdSlot";
import {
  occupationSchema,
  faqSchema,
  breadcrumbSchema,
  generateFAQs,
} from "@/lib/schema";

interface Props {
  params: Promise<{ slug: string; location: string }>;
}

export async function generateStaticParams() {
  // Generate top pages first; rest will be ISR
  const total = countAllWagePages();
  const limit = Math.min(total, 10000); // First 10K pages at build time
  const pages = getWagePagesChunk(0, limit);
  return pages.map((p) => ({ slug: p.occ_slug, location: p.area_slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, location } = await params;
  const occ = getOccupationBySlug(slug);
  const area = getAreaBySlug(location);
  if (!occ || !area) return {};

  const wage = getWage(occ.soc_code, area.area_code);
  const year = getDataYear();
  const cityName = shortAreaName(area.area_title);

  return {
    title: `${occ.title} Salary in ${cityName} (${year})`,
    description: `The median ${occ.title} salary in ${cityName} is ${formatSalary(wage?.annual_median ?? null)} per year. See full salary range, compare with other cities and occupations.`,
    alternates: { canonical: `/jobs/${slug}/${location}` },
  };
}

export default async function JobLocationPage({ params }: Props) {
  const { slug, location } = await params;
  const occ = getOccupationBySlug(slug);
  const area = getAreaBySlug(location);
  if (!occ || !area) notFound();

  const wage = getWage(occ.soc_code, area.area_code);
  if (!wage) notFound();

  const nationalWage = getNationalWage(occ.soc_code);
  const topCities = getTopPayingCities(occ.soc_code, 10);
  const topJobs = getTopPayingJobs(area.area_code, 10);
  const cityName = shortAreaName(area.area_title);
  const year = getDataYear();

  const faqs = generateFAQs(occ.title, cityName, wage);

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Occupations", url: "/jobs" },
    { name: occ.title, url: `/jobs/${slug}` },
    { name: cityName, url: `/jobs/${slug}/${location}` },
  ];

  // Compare with national
  const diff =
    wage.annual_median && nationalWage?.annual_median
      ? wage.annual_median - nationalWage.annual_median
      : null;

  return (
    <div>
      <Breadcrumb
        items={breadcrumbs.map((b) => ({ label: b.name, href: b.url }))}
      />

      <h1 className="text-3xl font-bold mb-2">
        {occ.title} Salary in {cityName}
      </h1>
      <p className="text-slate-500 mb-6">
        {year} wage data from the Bureau of Labor Statistics
      </p>

      {/* Hero stats */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-sm text-slate-500">Median Salary</div>
            <div className="text-2xl font-bold text-blue-700">
              {formatSalary(wage.annual_median)}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Average Salary</div>
            <div className="text-2xl font-bold">
              {formatSalary(wage.annual_mean)}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500">vs National</div>
            <div
              className={`text-lg font-semibold ${
                diff !== null && diff > 0
                  ? "text-green-600"
                  : diff !== null && diff < 0
                  ? "text-red-600"
                  : ""
              }`}
            >
              {diff !== null
                ? `${diff > 0 ? "+" : ""}${formatSalary(diff)}`
                : "N/A"}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Employed</div>
            <div className="text-lg font-semibold">
              {wage.employment?.toLocaleString("en-US") ?? "N/A"}
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-3">Salary Distribution</h2>
      <SalaryBar wage={wage} />
      <SalaryOverview wage={wage} jobTitle={occ.title} />

      <AdSlot id="job-location-mid" />

      {topCities.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">
            {occ.title} Salary in Other Cities
          </h2>
          <CityComparisonTable rows={topCities} jobSlug={slug} />
        </section>
      )}

      {topJobs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">
            Highest Paying Jobs in {cityName}
          </h2>
          <JobComparisonTable rows={topJobs} areaSlug={location} />
        </section>
      )}

      <AdSlot id="job-location-bottom" />

      <FAQ items={faqs} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            occupationSchema(occ.title, wage, area.area_title)
          ),
        }}
      />
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema(faqs)),
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema(breadcrumbs)),
        }}
      />
    </div>
  );
}
