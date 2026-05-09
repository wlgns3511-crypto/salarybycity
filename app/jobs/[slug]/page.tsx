import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getOccupationBySlug,
  getAllOccupations,
  getNationalWage,
  getTopPayingCities,
  getRelatedOccupations,
  getWagesByOccupation,
  getHighestPayingJobsNational,
  getNationalWagesAcrossYears,
  getRelatedByPay,
} from "@/lib/db";
import { SalaryTrendChart } from "@/components/SalaryTrendChart";
import { RelatedCareersSection } from "@/components/RelatedCareersSection";
import { deflateSeries } from "@/lib/cpi";
import { formatSalary, getDataYear } from "@/lib/format";
import { SalaryOverview, SalaryBar, CityComparisonTable } from "@/components/SalaryTable";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { TakeHomeCalculator } from "@/components/TakeHomeCalculator";
import { occupationSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { generateAutoFaqs } from "@/lib/auto-faqs";
import { SalaryChart } from "@/components/SalaryChart";
import { CiteButton } from "@/components/CiteButton";
import { AuthorBox } from "@/components/AuthorBox";
import { EditorNote } from "@/components/EditorNote";
import { DidYouKnow } from "@/components/DidYouKnow";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { CrossSiteLinks } from "@/components/CrossSiteLinks";
import { FeedbackButton } from "@/components/FeedbackButton";
import { SalaryGuessGame } from "@/components/SalaryGuessGame";
import { RelatedEntities } from "@/components/upgrades/RelatedEntities";
import { TableOfContents } from '@/components/upgrades/TableOfContents';
import { SalaryPercentile } from "@/components/tools/SalaryPercentile";
import { InsightBlock } from "@/components/upgrades/InsightBlock";
import { PurchasingPowerComparison } from "@/components/PurchasingPowerComparison";
import { getJobInsights } from "@/lib/insights";
import { BLS_PUBLISHED, REVIEWER_ORG, SOURCE_AUTHORITIES } from "@/lib/authorship";
import { getOccupationFacts } from "@/lib/salary-facts";
import { getOccupationCommentary, getOccupationTitle, getOccupationDescription } from "@/lib/salary-commentary";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;
export const revalidate = 86400;

export async function generateStaticParams() {
  // Pre-build top occupations; rest served via ISR
  const occupations = getAllOccupations();
  return occupations.map((occ) => ({ slug: occ.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const occ = getOccupationBySlug(slug);
  if (!occ) return {};
  const wage = getNationalWage(occ.soc_code);
  const year = getDataYear();

  // Diversified title/description per slug-hash, with safe fallback.
  let title = `${occ.title} Salary - ${year} National Wage Data`;
  let description = `The median ${occ.title} salary in the US is ${formatSalary(wage?.annual_median ?? null)}. Compare salaries across 400+ metro areas.`;
  if (wage) {
    const topCities = getTopPayingCities(occ.soc_code, 10);
    const facts = getOccupationFacts(occ, wage, topCities);
    if (facts) {
      title = getOccupationTitle(facts);
      description = getOccupationDescription(facts);
    }
  }

  return {
    title,
    description,
    alternates: { canonical: `/jobs/${slug}/` },
    openGraph: { url: `/jobs/${slug}/` },
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
  const wageHistory = getNationalWagesAcrossYears(occ.soc_code);
  const trendBaseYear = wageHistory.at(-1)?.year ?? 2024;
  const trendSeries = deflateSeries(
    wageHistory
      .filter((w) => w.annual_median != null)
      .map((w) => ({ year: w.year, nominal: w.annual_median as number })),
    trendBaseYear
  );
  const relatedByPay = getRelatedByPay(occ.soc_code, occ.major_group, 6);
  const facts = nationalWage ? getOccupationFacts(occ, nationalWage, topCities) : null;
  const commentary = facts ? getOccupationCommentary(facts) : null;
  const quizJobs = getHighestPayingJobsNational(30)
    .filter(j => j.annual_median && j.occ_slug !== slug)
    
    .map(j => ({ title: j.occ_title, slug: j.occ_slug, median: j.annual_median! }));
  const year = getDataYear();
  const faqs = nationalWage ? generateAutoFaqs(occ, nationalWage, topCities) : [];

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Occupations", url: "/jobs/" },
    { name: occ.title, url: `/jobs/${slug}/` },
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
            "url": `https://salarybycity.com/jobs/${slug}/`,
            "license": "https://creativecommons.org/publicdomain/zero/1.0/",
            "creator": { "@type": "Organization", "name": "DataPeek Facts", "url": "https://datapeekfacts.com" },
            "author": { "@type": "Organization", "name": "DataPeek" },
            "reviewedBy": [REVIEWER_ORG, ...SOURCE_AUTHORITIES],
            "isBasedOn": SOURCE_AUTHORITIES.map((s) => ({ "@type": "Dataset", name: s.name, url: s.url })),
            "dateModified": BLS_PUBLISHED,
            "temporalCoverage": `${year}/${year}`,
            "distribution": { "@type": "DataDownload", "encodingFormat": "text/html", "contentUrl": `https://salarybycity.com/jobs/${slug}/` }
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

      <TableOfContents />

      {commentary && (
        <section className="mt-6 mb-8 rounded-lg border border-slate-200 bg-white p-5 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold mb-3 text-slate-900">{commentary.headline}</h2>
          <p className="text-slate-700 leading-relaxed mb-3"><strong className="text-slate-900">By the numbers.</strong> {commentary.fact}</p>
          <p className="text-slate-700 leading-relaxed mb-3"><strong className="text-slate-900">What it means.</strong> {commentary.context}</p>
          <p className="text-slate-700 leading-relaxed"><strong className="text-slate-900">For workers and employers.</strong> {commentary.implication}</p>
        </section>
      )}

      {/* Legacy insight block kept for historical continuity below the v2 commentary. */}
      {nationalWage && !commentary && (
        <InsightBlock
          entityName={occ.title}
          insights={getJobInsights(occ.title, nationalWage, topCities)}
        />
      )}

      <EditorNote note={`${occ.title} salary figures reflect ${year} BLS Occupational Employment and Wage Statistics. Actual compensation varies by experience, location, and employer.`} />

      <div className="flex items-center gap-4 mt-4">
        <CiteButton title={`${occ.title} Salary Data`} url={`https://salarybycity.com/jobs/${slug}/`} source="SalaryByCity (BLS Data)" />
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

          {trendSeries.length >= 2 && (
            <SalaryTrendChart
              series={trendSeries}
              baseYear={trendBaseYear}
              title={`National median wage trend, ${trendSeries[0].year}–${trendSeries.at(-1)!.year}`}
            />
          )}

          <h2 className="text-xl font-bold mb-3">National Salary Distribution</h2>
          <SalaryBar wage={nationalWage} />
          <SalaryOverview wage={nationalWage} jobTitle={occ.title} />
        </>
      )}

      <AdSlot id="job-detail-mid" />

      {quizJobs.length >= 5 && <SalaryGuessGame jobs={quizJobs} />}

      {nationalWage?.annual_median && nationalWage.annual_p10 && nationalWage.annual_p25 && nationalWage.annual_p75 && nationalWage.annual_p90 && (
        <SalaryPercentile
          occupationTitle={occ.title}
          medianSalary={nationalWage.annual_median}
          p10={nationalWage.annual_p10}
          p25={nationalWage.annual_p25}
          p75={nationalWage.annual_p75}
          p90={nationalWage.annual_p90}
          nationalMedian={46310}
        />
      )}

      {topCities.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">
            Highest Paying Cities for {occ.title}s
          </h2>
          <CityComparisonTable rows={topCities} jobSlug={slug} />
        </section>
      )}

      <PurchasingPowerComparison
        contextLabel={`${occ.title}`}
        cities={topCities}
        baselineMedian={nationalWage?.annual_median ?? null}
      />

      <DidYouKnow fact={`The BLS tracks wage data for over 800 occupations across 400+ metro areas, making it the most comprehensive source for U.S. salary benchmarks.`} />

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-6 text-sm">
        <p className="text-slate-600">
          <strong>Related:</strong> See how salary relates to <a href="https://costbycity.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">cost of living</a> and <a href="https://fairrentwize.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">rent prices</a> in your area.
        </p>
      </div>

      {/* Take-Home Calculator */}
      {nationalWage?.annual_median && (
        <section className="mt-8">
          <TakeHomeCalculator defaultSalary={nationalWage.annual_median} />
        </section>
      )}

      <AuthorBox />

      <CrossSiteLinks current="SalaryData" />

      <AdSlot id="job-detail-bottom" />

      {relatedByPay.length > 0 && nationalWage?.annual_median ? (
        <RelatedCareersSection
          source={{ title: occ.title, nationalMedian: nationalWage.annual_median }}
          related={relatedByPay}
          majorGroupTitle={occ.major_group_title}
        />
      ) : (
        <RelatedEntities
          entityName={occ.title}
          heading={`Related Occupations`}
          items={related.map((r) => ({
            name: r.title,
            href: `/jobs/${r.slug}/`,
          }))}
        />
      )}

      <FeedbackButton pageId={slug} />

      <DataSourceBadge sources={[
        { name: "BLS", url: "https://www.bls.gov/oes/" },
        { name: "O*NET", url: "https://www.onetonline.org" },
      ]} />

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="mt-8 mb-8">
          <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="border border-slate-200 rounded-lg">
                <summary className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-50">{faq.question}</summary>
                <p className="px-4 pb-3 text-sm text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
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
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }}
        />
      )}
    </div>
  );
}
