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
  getOccupationEmploymentDistribution,
} from "@/lib/db";
import { SalaryTrendChart } from "@/components/SalaryTrendChart";
import { RelatedCareersSection } from "@/components/RelatedCareersSection";
import { deflateSeries } from "@/lib/cpi";
import { formatSalary, getDataYear } from "@/lib/format";
import { SalaryOverview, SalaryBar, CityComparisonTable } from "@/components/SalaryTable";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { TakeHomeCalculator } from "@/components/TakeHomeCalculator";
import { occupationSchema, breadcrumbSchema, faqSchema, datasetSchema } from "@/lib/schema";
import {
  classifyCostAdjustedWageTier,
  decodePercentileSpread,
  tierBlurb,
  tierLabel,
  tierToneColor,
  spreadBandLabel,
} from "@/lib/cost-adjusted-wage-tier";
import { getWageSpreadInterpretation } from "@/lib/wage-spread-interpretation";
import { classifyWageGrowthVelocity } from "@/lib/wage-growth-velocity";
import { computeOccupationDensity } from "@/lib/occupation-density-score";
import { getSalaryInterpretation } from "@/lib/salary-interpretation";
import { SalaryInterpretation } from "@/components/upgrades/SalaryInterpretation";
import { RealWageMethodologyNote } from "@/components/upgrades/RealWageMethodologyNote";
import { generateAutoFaqs } from "@/lib/auto-faqs";
import { SalaryChart } from "@/components/SalaryChart";
import { SalaryPercentileBand } from "@/components/SalaryPercentileBand";
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
import { calculateProprietaryMetrics } from "@/lib/proprietary-metrics";
import { ProprietaryMetricsBlock } from "@/components/upgrades/ProprietaryMetricsBlock";
import { InsightBlock } from "@/components/upgrades/InsightBlock";
import { PurchasingPowerComparison } from "@/components/PurchasingPowerComparison";
import { HowToReadSalaryData } from "@/components/HowToReadSalaryData";
import { getJobInsights } from "@/lib/insights";
import { BLS_PUBLISHED } from "@/lib/authorship";
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

/**
 * Phase 7 v2.2 §4.0 — Title-cap math (Trap #112).
 * Trim BLS occupation name so `title.absolute` stays ≤ 60c after concrete-verdict suffix.
 * Bypasses layout template `%s | SalaryByCity` to keep full 60c budget for SERP.
 */
function trimName(name: string, budget: number): string {
  if (name.length <= budget) return name;
  if (budget <= 1) return name.slice(0, Math.max(0, budget));
  return `${name.slice(0, budget - 1)}…`;
}

function fmtCompactMedian(annualMedian: number | null | undefined): string {
  if (!annualMedian || !Number.isFinite(annualMedian)) return '';
  if (annualMedian >= 1000) return `$${Math.round(annualMedian / 1000)}K`;
  return `$${Math.round(annualMedian)}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const occ = getOccupationBySlug(slug);
  if (!occ) return {};
  const wage = getNationalWage(occ.soc_code);
  const year = getDataYear();

  // Diversified title/description per slug-hash, with safe fallback.
  let description = `The median ${occ.title} salary in the US is ${formatSalary(wage?.annual_median ?? null)}. Compare salaries across 400+ metro areas.`;
  if (wage) {
    const topCities = getTopPayingCities(occ.soc_code, 10);
    const facts = getOccupationFacts(occ, wage, topCities);
    if (facts) {
      description = getOccupationDescription(facts);
    }
  }

  const topCities = wage ? getTopPayingCities(occ.soc_code, 10) : [];
  const velocity = wage ? classifyWageGrowthVelocity(getNationalWagesAcrossYears(occ.soc_code)) : null;
  const bestRealRatio = wage && topCities.length > 0
    ? Math.max(...topCities.map(row => classifyCostAdjustedWageTier(row, wage, row.area_code).ratio ?? 1.0))
    : 1.0;

  const metrics = calculateProprietaryMetrics(
    occ.title,
    slug,
    wage?.annual_median ?? null,
    velocity?.band ?? null,
    bestRealRatio
  );

  description = `[Career Value: Premium Score ${metrics.wagePremiumScore}/100, Grade ${metrics.overallGrade}] ` + description;

  // title.absolute with concrete-verdict (median $) + name trim to ≤60c.
  // Worst suffix " Salary: $123K Median" = ~22c → name budget 38c (covers all 7-class statuses).
  const medianCompact = fmtCompactMedian(wage?.annual_median ?? null);
  const suffix = medianCompact ? `: ${medianCompact} Median (${year})` : ` Salary (${year})`;
  const nameBudget = 60 - suffix.length;
  const titleAbsolute = `${trimName(occ.title, nameBudget)}${suffix}`;

  return {
    title: { absolute: titleAbsolute },
    description,
    alternates: { canonical: `/jobs/${slug}/` },
    openGraph: { title: titleAbsolute, description, url: `/jobs/${slug}/` },
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

  // CostAdjustedWageTier across the top-paying cities — surfaces the metros
  // where nominal premium actually buys real purchasing power, not just the
  // ones with the highest sticker number.
  const topCityTierEntries = nationalWage
    ? topCities
        .slice(0, 10)
        .map((row) => ({
          row,
          tier: classifyCostAdjustedWageTier(row, nationalWage, row.area_code),
        }))
        .filter((e) => e.tier.tier != null)
    : [];
  const bestRealMetro =
    topCityTierEntries.length > 0
      ? [...topCityTierEntries].sort((a, b) => (b.tier.ratio ?? 0) - (a.tier.ratio ?? 0))[0]
      : null;
  const worstRealMetro =
    topCityTierEntries.length > 1
      ? [...topCityTierEntries].sort((a, b) => (a.tier.ratio ?? 0) - (b.tier.ratio ?? 0))[0]
      : null;

  // Percentile spread of the national wage distribution — converts the raw
  // p10/p90 numbers into a Compressed/Moderate/Wide/Extreme verdict reader can
  // act on.
  const spread = decodePercentileSpread(nationalWage);

  // Interpretation Strip (PSU 1차) — composite verdict + 4-paragraph branching
  // anchored on the best-real-wage metro (or national fallback when no metro
  // data published) plus the national p90/p10 spread.
  const stripContext = bestRealMetro
    ? { occupationTitle: occ.title, areaName: bestRealMetro.row.area_title, areaKind: 'metro' as const }
    : { occupationTitle: occ.title, areaName: 'the United States', areaKind: 'national' as const };
  const stripCostAdj = bestRealMetro ? bestRealMetro.tier : null;
  const interpretation = getWageSpreadInterpretation(stripCostAdj, spread, stripContext);

  // Composite Salary Interpretation (PSU 1차) — composes the cost-adjusted
  // tier, the YoY velocity on the national OEWS pair, and the cross-area
  // employment density for this occupation.
  const velocity = classifyWageGrowthVelocity(wageHistory);
  const empDistribution = getOccupationEmploymentDistribution(occ.soc_code);
  const headlineEmployment = bestRealMetro
    ? bestRealMetro.row.employment
    : nationalWage?.employment ?? null;
  const density = computeOccupationDensity(headlineEmployment, empDistribution);
  const compositeInterpretation = getSalaryInterpretation(
    stripCostAdj,
    velocity,
    density,
    spread,
    stripContext,
  );
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

  const metrics = calculateProprietaryMetrics(
    occ.title,
    slug,
    nationalWage?.annual_median ?? null,
    velocity?.band ?? null,
    bestRealMetro?.tier.ratio ?? 1.0
  );

  return (
    <article data-toc-root>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ...datasetSchema(
              `${occ.title} Salary Data (${year})`,
              `National and metro-area wage data for ${occ.title}: median, p10/p90 percentile spread, and CostAdjustedWageTier 5-band rollup combining BLS OEWS with BEA Regional Price Parities.`,
              `/jobs/${slug}/`,
              ['nominal_annual_median', 'real_annual_median', 'percentile_spread_ratio', 'cost_adjusted_wage_tier', 'wage_growth_velocity_band', 'occupation_density_score'],
            ),
            dateModified: BLS_PUBLISHED,
          }),
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

      <section
        data-upgrade="wage-spread-interpretation"
        aria-label={`Interpretation strip for ${occ.title}`}
        className={`my-6 rounded-xl border p-5 md:p-6 ring-1 ${interpretation.tierTone.bg} ${interpretation.tierTone.ring}`}
      >
        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${interpretation.tierTone.text}`}>
          Real-wage verdict — BLS OEWS × BEA RPP
        </p>
        <p className="text-lg md:text-xl font-bold text-slate-900 leading-snug mb-4">
          {interpretation.verdict}
        </p>
        <div className="space-y-3 text-sm md:text-[15px] text-slate-700 leading-relaxed">
          <p><strong className="text-slate-900">What the band means.</strong> {interpretation.paragraphs.bandMeaning}</p>
          <p><strong className="text-slate-900">Inside this occupation.</strong> {interpretation.paragraphs.occupationMeaning}</p>
          <p><strong className="text-slate-900">Versus other areas.</strong> {interpretation.paragraphs.areaComparison}</p>
          <p><strong className="text-slate-900">Acting on the verdict.</strong> {interpretation.paragraphs.readerAction}</p>
        </div>
      </section>

      <SalaryInterpretation data={compositeInterpretation} />

      <ProprietaryMetricsBlock {...metrics} />

      <RealWageMethodologyNote
        occupationTitle={stripContext.occupationTitle}
        areaName={stripContext.areaName}
        areaKind={stripContext.areaKind}
        costAdj={stripCostAdj}
        velocity={velocity}
        density={density}
        decision={compositeInterpretation.decision}
        sourceUrl={`https://salarybycity.com/jobs/${slug}/`}
      />

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

          {/* Distribution-shape view: BLS OEWS p10/p25/p50/p75/p90 (+mean) as
              a server-rendered box plot — distinct from SalaryChart above
              which shows absolute amounts as horizontal bars. The IQR box vs
              whisker reveals whether pay clusters tightly near the median or
              polarises toward the tails. */}
          {nationalWage.annual_p10 && nationalWage.annual_p25 && nationalWage.annual_median && nationalWage.annual_p75 && nationalWage.annual_p90 && (
            <SalaryPercentileBand
              p10={nationalWage.annual_p10}
              p25={nationalWage.annual_p25}
              median={nationalWage.annual_median}
              p75={nationalWage.annual_p75}
              p90={nationalWage.annual_p90}
              mean={nationalWage.annual_mean ?? null}
              occupationTitle={occ.title}
              areaLabel="United States"
            />
          )}

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

          {spread.band && spread.spreadRatio != null && (
            <section
              data-upgrade="percentile-spread"
              aria-label={`Percentile spread band for ${occ.title}`}
              className="my-6 rounded-xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Percentile spread (p90/p10)
              </p>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {spreadBandLabel(spread.band)} — {spread.spreadRatio.toFixed(1)}× spread
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed mb-2">
                {spread.interpretation}
              </p>
              <p className="text-xs text-slate-500">
                Evidence: {spread.evidence}. Reference cutoffs (our heuristic): Compressed &lt;3×, Moderate 3–4×, Wide 4–6×, Extreme ≥6×. Not a BLS classification.
              </p>
            </section>
          )}

          {bestRealMetro && bestRealMetro.tier.tier && (
            <section
              data-upgrade="cost-adjusted-top-metro"
              aria-label={`Top cost-adjusted metro for ${occ.title}`}
              className={`my-6 rounded-xl border p-5 ring-1 ${tierToneColor(bestRealMetro.tier.tier).bg} ${tierToneColor(bestRealMetro.tier.tier).ring}`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${tierToneColor(bestRealMetro.tier.tier).text}`}>
                Strongest cost-adjusted real wage
              </p>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {bestRealMetro.row.area_title} — {tierLabel(bestRealMetro.tier.tier)}
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed mb-2">
                {tierBlurb(bestRealMetro.tier)}
              </p>
              <p className="text-xs text-slate-600 mb-3">
                {bestRealMetro.tier.evidence}
              </p>
              {worstRealMetro && worstRealMetro.tier.tier && worstRealMetro !== bestRealMetro && (
                <p className="text-sm text-slate-700 leading-relaxed border-t border-slate-200 pt-3 mt-3">
                  <strong className="text-slate-900">Reverse case:</strong>{' '}
                  {worstRealMetro.row.area_title} ranks {tierLabel(worstRealMetro.tier.tier)} —{' '}
                  {tierBlurb(worstRealMetro.tier)} ({worstRealMetro.tier.evidence}).
                </p>
              )}
              <p className="text-xs text-slate-500 mt-3">
                Cost-adjustment uses BEA Regional Price Parities (US=100). Methodology and 5-band cutoffs:{' '}
                CostAdjustedWageTier explainer.
              </p>
            </section>
          )}
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

      <HowToReadSalaryData
        occupationTitle={occ.title}
        nationalMedian={nationalWage?.annual_median ?? null}
        nationalMean={nationalWage?.annual_mean ?? null}
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
    </article>
  );
}
