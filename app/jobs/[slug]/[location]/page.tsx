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
import { analyzeSalary } from "@/lib/salary-analysis";
import { getCrossRefInsights } from '@/lib/crossref';
import { DataFeedback } from "@/components/DataFeedback";
import { EmbedButton } from "@/components/EmbedButton";
import { FreshnessTag } from "@/components/FreshnessTag";

interface Props {
  params: Promise<{ slug: string; location: string }>;
}

export async function generateStaticParams() {
  // Generate top pages first; rest will be ISR
  const total = countAllWagePages();
  const limit = Math.min(total, 1000); // First 1K pages at build, rest ISR on demand
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

  const crossInsights = getCrossRefInsights(location, 'salary');
  const analysis = analyzeSalary(occ.title, cityName, wage, nationalWage ?? null);
  const baseFaqs = generateFAQs(occ.title, cityName, wage);
  const faqs = [
    ...baseFaqs,
    { question: `Is ${occ.title} a good career in ${cityName}?`, answer: analysis.summary },
    ...(analysis.growthPotential ? [{ question: `What is the earning potential for ${occ.title}s?`, answer: analysis.growthPotential }] : []),
    { question: `Is the ${occ.title} salary enough to live in ${cityName}?`, answer: analysis.costOfLivingNote },
  ];

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

      {/* Salary Analysis */}
      <section className="mb-6">
        <h2 className="text-xl font-bold mb-3">Salary Overview</h2>
        <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-lg mb-4">
          <p className="text-slate-700 text-sm">{analysis.summary}</p>
        </div>

        {analysis.insights.length > 0 && (
          <div className="space-y-2 mb-4">
            {analysis.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-500 text-sm mt-0.5">💡</span>
                <p className="text-slate-700 text-sm">{insight}</p>
              </div>
            ))}
          </div>
        )}

        {analysis.costOfLivingNote && (
          <div className="bg-amber-50 border-l-4 border-amber-300 p-3 rounded-r-lg">
            <p className="font-medium text-amber-800 text-xs mb-1">Cost of Living Consideration</p>
            <p className="text-slate-700 text-sm">{analysis.costOfLivingNote}</p>
          </div>
        )}
      </section>

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

      {crossInsights.length > 0 && (
        <section className="mt-8 mb-6">
          <h2 className="text-xl font-bold mb-3">Related Data Insights</h2>
          <div className="space-y-2">
            {crossInsights.map((insight, i) => (
              <div key={i} className="p-3 bg-slate-50 border-l-4 border-slate-300 rounded-r-lg">
                <p className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: insight }} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 p-4 bg-slate-50 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Explore More About This Area</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href={`https://costbycity.com/cities/${location}/`} className="text-emerald-600 hover:underline" target="_blank" rel="noopener">Cost of Living in {cityName}</a>
          <a href={`https://guidebycity.com/city/${location}/`} className="text-teal-600 hover:underline" target="_blank" rel="noopener">City Guide: {cityName}</a>
        </div>
      </section>

      <FreshnessTag source="Bureau of Labor Statistics" />

          <EmbedButton url="https://salarybycity.com" title="Data from SalaryByCity" site="SalaryByCity" siteUrl="https://salarybycity.com" />

          <DataFeedback />

          <section className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Planning Your Career Move?</h3>
        <p className="text-blue-800 text-sm leading-relaxed">
          Considering a move for this role? Compare <a href={`https://costbycity.com/cities/${location}`} className="underline font-medium">cost of living in {cityName}</a> to make an informed decision.
          Don&apos;t forget to factor in moving costs, renters insurance, and state income tax differences when evaluating your total compensation package.
        </p>
      </section>

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
