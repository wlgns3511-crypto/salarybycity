import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { US_STATES, getStateBySlug } from "@/lib/states-data";
import {
  getAllStateCodes,
  getAreasByState,
  getHighestPayingJobsNational,
  getStateTopOccupationsWithNational,
  getStateWageSummary,
  getNationalWageSummary,
  getNationalWagesAcrossYears,
  getOccupationEmploymentDistribution,
} from "@/lib/db";
import { formatSalary, getDataYear } from "@/lib/format";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FAQ } from "@/components/FAQ";
import { AdSlot } from "@/components/AdSlot";
import { AuthorBox } from "@/components/AuthorBox";
import { breadcrumbSchema, faqSchema, datasetSchema } from "@/lib/schema";
import { BLS_PUBLISHED } from "@/lib/authorship";
import { COST_ADJUSTED_WAGE_TIER_CUTOFFS, decodePercentileSpread, tierLabel, tierToneColor, type CostAdjustedWageTier, type CostAdjustedWageTierResult } from "@/lib/cost-adjusted-wage-tier";
import { getWageSpreadInterpretation } from "@/lib/wage-spread-interpretation";
import { classifyWageGrowthVelocity } from "@/lib/wage-growth-velocity";
import { computeOccupationDensity } from "@/lib/occupation-density-score";
import { getSalaryInterpretation } from "@/lib/salary-interpretation";
import { SalaryInterpretation } from "@/components/upgrades/SalaryInterpretation";
import { StateRich } from '@/components/state/StateRich';
import { EmptyStatePage } from "@/components/state/EmptyStatePage";
import { StateHeroImage } from "@/components/StateHeroImage";
import { getStateImage } from "@/lib/state-images";
import { getStateFacts } from "@/lib/salary-facts";
import { getStateNarrative } from "@/lib/salary-cluster-insights";
import { pickVariant } from "@/lib/content-helpers";
import { getStateRpp, getRppMeta } from "@/lib/rpp";
import { decodeStateCrosswalk, buildStateP1Title } from "@/lib/crosswalk-salary";
import { CrosswalkBridge } from "@/components/upgrades/CrosswalkBridge";
import { TrustBlock } from "@/components/upgrades/TrustBlock";
import { TableOfContents } from "@/components/upgrades/TableOfContents";
import { InsightBlock, type Insight } from "@/components/upgrades/InsightBlock";
import { RelatedEntities } from "@/components/upgrades/RelatedEntities";
import { TakeHomeCalculator } from "@/components/TakeHomeCalculator";
import { SOURCE_AUTHORITIES, DB_UPDATED } from "@/lib/authorship";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  // All 51 US states + DC. States without BLS metro wage data (~21) render
  // an EmptyStatePage with national context + nearby-state pointers instead
  // of a 404 — the OEWS extract simply doesn't include their metro rows.
  return US_STATES.map((s) => ({ slug: s.slug }));
}

function nearbyWithDataStates(target: string, codesWithData: Set<string>, count = 5) {
  const liveStates = US_STATES.filter((s) => codesWithData.has(s.code));
  const targetIdx = US_STATES.findIndex((s) => s.slug === target);
  if (targetIdx === -1) return liveStates.slice(0, count);
  // Sort live states by alphabetical distance from the target state in US_STATES order.
  return [...liveStates]
    .sort((a, b) => {
      const aIdx = US_STATES.findIndex((s) => s.code === a.code);
      const bIdx = US_STATES.findIndex((s) => s.code === b.code);
      return Math.abs(aIdx - targetIdx) - Math.abs(bIdx - targetIdx);
    })
    .slice(0, count);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) return {};
  const year = getDataYear();

  // Phase 7 P1 title.absolute — bypass " | SalaryByCity" (15c) layout suffix.
  // Pattern: "{StateName}: {ShortVerdict} · $XXXK/y" — verdict varies across
  // 51 jurisdictions per CostAdjustedWageTier × BEA RPP composite.
  const crosswalk = decodeStateCrosswalk(state.code);
  const p1Title = crosswalk
    ? buildStateP1Title(state.name, crosswalk)
    : `${state.name} Salaries — BLS ${year} Wage Data`;
  const description = crosswalk
    ? `${crosswalk.longLabel}. BLS OEWS ${year} state-aggregate wage data for ${state.name} — ${crosswalk.decoderNotes}`
    : pickVariant(slug, [
        `Explore salary data for ${state.name}. Highest-paying occupations, state-vs-national comparison, and percentile breakdowns. ${year} BLS OEWS data.`,
        `${state.name} salary tables: top 20 highest-paying jobs, average median wage, and how state pay stacks up against the national figure. ${year} BLS data.`,
        `Salaries in ${state.name} (${year}): browse the highest-paying occupations, see state-vs-national pay gaps, and dive into per-occupation percentile breakdowns.`,
      ], 8);

  return {
    title: { absolute: p1Title },
    description,
    alternates: { canonical: `/state/${slug}/` },
    openGraph: { title: p1Title, description, url: `/state/${slug}/` },
  };
}

function generateStateFaqs(
  stateName: string,
  stateCode: string,
  summary: { avg_median_salary: number; top_median: number; total_employment: number; occ_count: number },
  nationalSummary: { avg_median_salary: number } | undefined,
  topJobs: { occ_title: string; annual_median: number | null; national_median: number | null }[],
  metroCount: number,
): { question: string; answer: string }[] {
  const year = getDataYear();
  const faqs: { question: string; answer: string }[] = [];

  // 1. Average salary
  faqs.push({
    question: `What is the average salary in ${stateName}?`,
    answer: `The average median salary across all occupations in ${stateName} is ${formatSalary(summary.avg_median_salary)} as of ${year} BLS data. This covers ${summary.occ_count.toLocaleString()} tracked occupations in the state.`,
  });

  // 2. Highest paying job
  if (topJobs.length > 0 && topJobs[0].annual_median) {
    faqs.push({
      question: `What is the highest paying job in ${stateName}?`,
      answer: `The highest paying occupation in ${stateName} is ${topJobs[0].occ_title} with a median annual salary of ${formatSalary(topJobs[0].annual_median)}.${topJobs[0].national_median ? ` The national median for this role is ${formatSalary(topJobs[0].national_median)}.` : ''}`,
    });
  }

  // 3. Comparison to national
  if (nationalSummary) {
    const diff = summary.avg_median_salary - nationalSummary.avg_median_salary;
    const pct = ((diff / nationalSummary.avg_median_salary) * 100).toFixed(1);
    faqs.push({
      question: `How do ${stateName} salaries compare to the national average?`,
      answer: `${stateName}'s average median salary of ${formatSalary(summary.avg_median_salary)} is ${diff >= 0 ? `${pct}% above` : `${Math.abs(Number(pct))}% below`} the national average of ${formatSalary(nationalSummary.avg_median_salary)}. ${diff >= 0 ? 'This ranks it among the higher-paying states.' : 'However, cost of living differences can offset this gap.'}`,
    });
  }

  // 4. Employment
  if (summary.total_employment) {
    faqs.push({
      question: `How many people are employed in ${stateName}?`,
      answer: `${stateName} has approximately ${summary.total_employment.toLocaleString()} employed workers across all tracked occupations according to ${year} BLS data. This spans ${summary.occ_count.toLocaleString()} distinct occupation categories.`,
    });
  }

  // 5. Metro areas
  if (metroCount > 0) {
    faqs.push({
      question: `How many metro areas are in ${stateName}?`,
      answer: `There are ${metroCount} metropolitan statistical areas in ${stateName} tracked by BLS wage data. Salaries can vary significantly between metro areas due to local industry mix, cost of living, and labor demand.`,
    });
  }

  return faqs.slice(0, 5);
}

export default async function StateDetailPage({ params }: Props) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();

  const year = getDataYear();
  const summary = getStateWageSummary(state.code);
  const nationalSummary = getNationalWageSummary();
  const topJobs = getStateTopOccupationsWithNational(state.code, 20);
  const metros = getAreasByState(state.code);

  // Phase 7 P0 — state-level cross-walk verdict (CostAdjustedWageTier wrap).
  const stateCrosswalk = decodeStateCrosswalk(state.code);

  if (!summary || summary.occ_count === 0) {
    const codesWithData = new Set(getAllStateCodes());
    const nearby = nearbyWithDataStates(slug, codesWithData, 5);
    const topNational = getHighestPayingJobsNational(10);
    return (
      <EmptyStatePage
        state={state}
        nationalSummary={nationalSummary}
        topNationalJobs={topNational}
        nearbyStates={nearby}
      />
    );
  }

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "States", url: "/state/" },
    { name: state.name, url: `/state/${slug}/` },
  ];

  const faqs = generateStateFaqs(
    state.name,
    state.code,
    summary,
    nationalSummary,
    topJobs,
    metros.length,
  );

  const natAvg = nationalSummary?.avg_median_salary ?? 0;
  const diff = natAvg ? summary.avg_median_salary - natAvg : 0;
  const diffPct = natAvg ? ((diff / natAvg) * 100).toFixed(1) : "0";

  // Purchasing-power view: deflate state nominal avg-median by state RPP to
  // get real (US-baseline) dollars. Falls back to "not available" if BEA RPP
  // dataset doesn't cover this state.
  const stateRpp = getStateRpp(state.code);
  const rppMeta = getRppMeta();
  const realStateMedian = stateRpp
    ? Math.round((summary.avg_median_salary * 100) / stateRpp)
    : null;
  const realDeltaVsNatPct =
    realStateMedian != null && natAvg > 0
      ? Math.round(((realStateMedian - natAvg) / natAvg) * 100)
      : null;

  // Layer 2 cluster narrative — slug-hashed across 51 state pages.
  const stateFacts = getStateFacts(state.code, topJobs, summary);
  const narrative = getStateNarrative(slug, state.name, stateFacts);

  const headlineJob = topJobs[0] ?? null;

  const trustSources = [...SOURCE_AUTHORITIES].map((s) => ({
    name: s.name,
    url: s.url,
  }));

  const insights: Insight[] = [
    {
      text: `The average median salary in ${state.name} is ${formatSalary(summary.avg_median_salary)} (${diff >= 0 ? '+' : ''}${diffPct}% vs the national average of ${formatSalary(natAvg)}).`,
      sentiment: diff >= 0 ? 'positive' : 'neutral',
    },
    {
      text: stateRpp != null && realStateMedian != null
        ? `Adjusted for local cost of living (RPP index: ${stateRpp.toFixed(1)}), the real purchasing power of the average median wage stretches to ${formatSalary(realStateMedian)} (${realDeltaVsNatPct != null && realDeltaVsNatPct >= 0 ? '+' : ''}${realDeltaVsNatPct}% vs national avg).`
        : `Nominal salaries reflect local market rates; cost-of-living index details are partially available.`,
      sentiment: realDeltaVsNatPct != null && realDeltaVsNatPct >= 0 ? 'positive' : 'negative',
    },
    {
      text: headlineJob 
        ? `The highest-paying occupation is ${headlineJob.occ_title} with a median annual salary of ${formatSalary(headlineJob.annual_median ?? 0)}.`
        : `Top-paying jobs in the state are documented in the detailed wage directory tables below.`,
      sentiment: 'neutral',
    }
  ];

  const relatedStates = US_STATES.filter((s) => s.slug !== slug).slice(0, 6);
  const relatedItems = relatedStates.map((s) => ({
    name: `Salaries in ${s.name}`,
    href: `/state/${s.slug}/`,
  }));

  // State-aggregate CostAdjustedWageTier — reuses the same cutoffs as the
  // occupation-level classifier so /state/ and /jobs/ pages stay aligned.
  const stateAggregateRatio =
    stateRpp != null && realStateMedian != null && natAvg > 0
      ? realStateMedian / natAvg
      : null;
  const stateAggregateTier: CostAdjustedWageTier | null =
    stateAggregateRatio == null
      ? null
      : stateAggregateRatio >= 1.30
        ? 'TopReal'
        : stateAggregateRatio >= 1.10
          ? 'StrongReal'
          : stateAggregateRatio >= 0.95
            ? 'ModerateReal'
            : stateAggregateRatio >= 0.80
              ? 'BelowMedianReal'
              : 'WeakReal';

  // Interpretation Strip (PSU 1차) — state-aggregate tier paired with the
  // top-paying state occupation's p90/p10 spread. The strip headlines the
  // representative occupation rather than the aggregate so the reader sees
  // an actionable verdict instead of a generic state ratio.
  const stateStripCostAdj: CostAdjustedWageTierResult | null =
    stateAggregateTier && stateAggregateRatio != null
      ? {
          tier: stateAggregateTier,
          nominalWage: summary.avg_median_salary,
          rppIndex: stateRpp ?? 100,
          rppLevel: stateRpp != null ? 'state' : 'national',
          realWage: realStateMedian,
          nationalRealMedian: natAvg > 0 ? natAvg : null,
          ratio: stateAggregateRatio,
          evidence: `state real median ${formatSalary(realStateMedian ?? 0)} / national avg median ${formatSalary(natAvg)}`,
          caveats: [
            'State aggregate averages BLS OEWS metro-level wages within the state and then deflates by the BEA state-level Regional Price Parity.',
          ],
          confidence: 'med',
        }
      : null;
  const stateStripSpread = headlineJob
    ? decodePercentileSpread({
        annual_p10: headlineJob.annual_p10,
        annual_p25: headlineJob.annual_p25,
        annual_median: headlineJob.annual_median,
        annual_p75: headlineJob.annual_p75,
        annual_p90: headlineJob.annual_p90,
      } as any)
    : null;
  const stateInterpretation = getWageSpreadInterpretation(stateStripCostAdj, stateStripSpread, {
    occupationTitle: headlineJob ? headlineJob.occ_title : `Top-paying occupations`,
    areaName: state.name,
    areaKind: 'state',
  });

  // Composite Salary Interpretation (PSU 1차) — anchors on the headline job
  // for YoY velocity (national pair, since state-level OEWS time series in
  // this extract is metro-aggregated) and on the cross-area employment
  // distribution for density. State-aggregate cost-adjusted tier reuses the
  // same readings the existing strip already computed.
  const headlineVelocity = headlineJob
    ? classifyWageGrowthVelocity(getNationalWagesAcrossYears(headlineJob.soc_code))
    : classifyWageGrowthVelocity([]);
  const headlineEmpDistribution = headlineJob
    ? getOccupationEmploymentDistribution(headlineJob.soc_code)
    : [];
  const headlineDensity = computeOccupationDensity(
    headlineJob?.employment ?? null,
    headlineEmpDistribution,
  );
  const stateComposite = getSalaryInterpretation(
    stateStripCostAdj,
    headlineVelocity,
    headlineDensity,
    stateStripSpread,
    {
      occupationTitle: headlineJob ? headlineJob.occ_title : 'Top-paying occupations',
      areaName: state.name,
      areaKind: 'state',
    },
  );

  return (
    <div>
      <Breadcrumb items={breadcrumbs.map((b) => ({ label: b.name, href: b.url }))} />

      <h1 className="text-3xl font-bold mb-2">Salaries in {state.name}</h1>
      <p className="text-slate-600 mb-3">
        {year} wage data for {summary.occ_count.toLocaleString()} occupations across {state.name} ({state.code}), powered by BLS OEWS.
      </p>

      {/* Phase 7 verdict chip — typed CrosswalkResult surfaced in body */}
      {stateCrosswalk && (
        <p className="mb-6 text-sm">
          <span className="inline-block rounded-md bg-slate-100 px-3 py-1 text-slate-800">
            <span className="font-semibold">Band {stateCrosswalk.verdict} · {stateCrosswalk.shortLabel}</span>
            <span className="ml-2 text-slate-600">— {stateCrosswalk.decoderNotes}</span>
          </span>
        </p>
      )}

      {/* Above-the-fold Wikipedia photo (graceful null when manifest lacks an entry). */}
      {(() => {
        const img = getStateImage(slug);
        return img ? <StateHeroImage img={img} /> : null;
      })()}

      <TrustBlock sources={trustSources} updated={DB_UPDATED} label="Verified Data Sourcing" />

      <TableOfContents />

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="text-sm text-slate-500">Avg Median Salary</div>
          <div className="text-2xl font-bold text-blue-700">{formatSalary(summary.avg_median_salary)}</div>
          {natAvg > 0 && (
            <div className={`text-xs mt-1 ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {diff >= 0 ? '+' : ''}{diffPct}% vs national
            </div>
          )}
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
          <div className="text-sm text-slate-500">Highest Salary</div>
          <div className="text-2xl font-bold text-slate-800">{formatSalary(summary.top_median)}</div>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
          <div className="text-sm text-slate-500">Total Employment</div>
          <div className="text-2xl font-bold text-slate-800">{summary.total_employment.toLocaleString()}</div>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
          <div className="text-sm text-slate-500">Occupations</div>
          <div className="text-2xl font-bold text-slate-800">{summary.occ_count.toLocaleString()}</div>
        </div>
      </div>

      {/* Interpretation Strip (PSU 1차) — state aggregate × headline-occupation spread */}
      <section
        data-upgrade="wage-spread-interpretation"
        aria-label={`Interpretation strip for ${state.name}`}
        className={`mb-8 rounded-xl border p-5 md:p-6 ring-1 ${stateInterpretation.tierTone.bg} ${stateInterpretation.tierTone.ring}`}
      >
        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${stateInterpretation.tierTone.text}`}>
          Real-wage verdict — BLS OEWS × BEA RPP
        </p>
        <p className="text-lg md:text-xl font-bold text-slate-900 leading-snug mb-4">
          {stateInterpretation.verdict}
        </p>
        <div className="space-y-3 text-sm md:text-[15px] text-slate-700 leading-relaxed">
          <p><strong className="text-slate-900">What the band means.</strong> {stateInterpretation.paragraphs.bandMeaning}</p>
          <p><strong className="text-slate-900">Inside this occupation.</strong> {stateInterpretation.paragraphs.occupationMeaning}</p>
          <p><strong className="text-slate-900">Versus other states.</strong> {stateInterpretation.paragraphs.areaComparison}</p>
          <p><strong className="text-slate-900">Acting on the verdict.</strong> {stateInterpretation.paragraphs.readerAction}</p>
        </div>
      </section>

      <InsightBlock
        entityName={state.name}
        heading={`Salary & Purchasing Power Insights`}
        insights={insights}
      />

      <SalaryInterpretation data={stateComposite} />

      {/* Layer 2 cluster narrative — slug-hashed per state */}
      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold mb-3 text-slate-900">{narrative.headline}</h2>
        <p className="text-slate-700 leading-relaxed mb-3"><strong className="text-slate-900">By the numbers.</strong> {narrative.fact}</p>
        <p className="text-slate-700 leading-relaxed mb-3"><strong className="text-slate-900">Reading the spread.</strong> {narrative.context}</p>
        <p className="text-slate-700 leading-relaxed"><strong className="text-slate-900">For comparison.</strong> {narrative.implication}</p>
      </section>

      {/* Purchasing power band — RPP-adjusted state real median */}
      {stateRpp != null && realStateMedian != null && (
        <section className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Purchasing power
          </p>
          <h2 className="text-2xl font-bold text-slate-950">
            {state.name} salaries in real (cost-of-living-adjusted) terms
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-4 border border-slate-200">
              <div className="text-xs uppercase tracking-wide text-slate-500">Nominal avg median</div>
              <div className="mt-1 text-xl font-bold text-slate-900 tabular-nums">{formatSalary(summary.avg_median_salary)}</div>
              <div className="mt-1 text-xs text-slate-500">As reported by BLS OEWS</div>
            </div>
            <div className="rounded-lg bg-white p-4 border border-slate-200">
              <div className="text-xs uppercase tracking-wide text-slate-500">{state.name} RPP ({rppMeta.year})</div>
              <div className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                {stateRpp.toFixed(1)}
                <span className="ml-1 text-sm font-normal text-slate-500">vs US=100</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {stateRpp > 100
                  ? `${(stateRpp - 100).toFixed(1)}% pricier than U.S. average`
                  : `${(100 - stateRpp).toFixed(1)}% cheaper than U.S. average`}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 border border-slate-200">
              <div className="text-xs uppercase tracking-wide text-slate-500">Real (US=100)</div>
              <div className="mt-1 text-xl font-bold text-slate-900 tabular-nums">{formatSalary(realStateMedian)}</div>
              {realDeltaVsNatPct != null && (
                <div className={`mt-1 text-xs font-medium ${realDeltaVsNatPct >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {realDeltaVsNatPct >= 0 ? "+" : ""}{realDeltaVsNatPct}% vs national avg
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            The &ldquo;Real&rdquo; column deflates the nominal {state.name} avg median by the
            state&rsquo;s BEA Regional Price Parity ({rppMeta.year} release).
            {realDeltaVsNatPct != null && realDeltaVsNatPct >= 0 ? (
              <> A positive delta versus national means {state.name}&rsquo;s headline pay stretches further than the U.S.-average dollar.</>
            ) : (
              <> A negative delta versus national means {state.name}&rsquo;s headline pay buys less locally than the U.S.-average dollar.</>
            )}{" "}
            For a side-by-side comparison between any two metros, use the{" "}
            <a href="/tools/col-calculator/" className="underline hover:text-slate-700">
              cost-of-living calculator
            </a>
            .
          </p>
        </section>
      )}

      {stateAggregateTier && stateAggregateRatio != null && (
        <section
          data-upgrade="state-cost-adjusted-wage-tier"
          aria-label={`State-wide cost-adjusted wage tier for ${state.name}`}
          className={`mb-8 rounded-xl border p-5 ring-1 ${tierToneColor(stateAggregateTier).bg} ${tierToneColor(stateAggregateTier).ring}`}
        >
          <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${tierToneColor(stateAggregateTier).text}`}>
            State-aggregate CostAdjustedWageTier
          </p>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {state.name} — {tierLabel(stateAggregateTier)}
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed mb-2">
            Across {summary.occ_count.toLocaleString()} BLS-tracked occupations, {state.name}&apos;s nominal
            average median is {formatSalary(summary.avg_median_salary)}. After deflating by the state&apos;s
            BEA RPP of {stateRpp?.toFixed(1)} (US=100), real purchasing power lands at{' '}
            {realStateMedian != null ? formatSalary(realStateMedian) : '—'}, a ratio of{' '}
            {stateAggregateRatio.toFixed(2)} against the national average median of {formatSalary(natAvg)}.
          </p>
          <p className="text-xs text-slate-600">
            5-band cutoffs (our heuristic, not a BLS rating): TopReal ≥1.30, StrongReal 1.10–1.30, ModerateReal 0.95–1.10, BelowMedianReal 0.80–0.95, WeakReal &lt;0.80. Full methodology:{' '}
            CostAdjustedWageTier explainer.
          </p>
        </section>
      )}

      {/* Top occupations with national comparison */}
      {topJobs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Top 20 Highest Paying Jobs in {state.name}</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold">#</th>
                  <th className="text-left p-3 font-semibold">Occupation</th>
                  <th className="text-right p-3 font-semibold">{state.code} Median</th>
                  <th className="text-right p-3 font-semibold hidden sm:table-cell">National Median</th>
                  <th className="text-right p-3 font-semibold hidden sm:table-cell">vs National</th>
                </tr>
              </thead>
              <tbody>
                {topJobs.map((job, i) => {
                  const jobDiff = job.annual_median && job.national_median
                    ? job.annual_median - job.national_median
                    : null;
                  const jobDiffPct = job.national_median && jobDiff !== null
                    ? ((jobDiff / job.national_median) * 100).toFixed(1)
                    : null;
                  return (
                    <tr key={job.soc_code} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-3 text-slate-400">{i + 1}</td>
                      <td className="p-3">
                        <a href={`/jobs/${job.occ_slug}/`} className="text-blue-600 hover:underline">
                          {job.occ_title}
                        </a>
                      </td>
                      <td className="p-3 text-right font-medium">{formatSalary(job.annual_median)}</td>
                      <td className="p-3 text-right text-slate-600 hidden sm:table-cell">
                        {formatSalary(job.national_median)}
                      </td>
                      <td className="p-3 text-right hidden sm:table-cell">
                        {jobDiffPct !== null && (
                          <span className={Number(jobDiffPct) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {Number(jobDiffPct) >= 0 ? '+' : ''}{jobDiffPct}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AdSlot id="state-mid" />

      {/* Salary ranges cross-link (HCU depth expansion) */}
      <section className="mb-8">
        <a
          href={`/state/${slug}/salary-ranges/`}
          className="block rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 hover:border-blue-400 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Deeper breakdown
              </div>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {state.name} Salary Ranges — p10 to p90 Percentiles
              </h3>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                Top 20 occupations with 10th / 25th / 50th / 75th / 90th percentile wages — the full
                pay distribution instead of a single median number.
              </p>
            </div>
            <span className="text-blue-700 font-semibold shrink-0">View ranges &rarr;</span>
          </div>
        </a>
      </section>

      {/* Metro areas in this state */}
      {metros.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Metro Areas in {state.name}</h2>
          <p className="text-slate-600 text-sm mb-4">
            {state.name} contains {metros.length} BLS-tracked metropolitan areas. State-level
            wage aggregates are shown above; metro-level breakdowns are not separately published
            on this site.
          </p>
        </section>
      )}

      {/* Context section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">About {state.name} Salary Data</h2>
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700 leading-relaxed space-y-3">
          <p>
            Wages in {state.name} reflect the state&rsquo;s industry mix, cost of living, and labor market conditions.
            The BLS Occupational Employment and Wage Statistics (OEWS) survey covers nonfarm payroll employment
            and provides annual salary estimates at the state level.
          </p>
          <p>
            The {formatSalary(summary.avg_median_salary)} average median across {summary.occ_count.toLocaleString()} occupations
            {natAvg > 0 && (
              <> is {diff >= 0 ? 'above' : 'below'} the national average of {formatSalary(natAvg)}</>
            )}.
            However, nominal wages alone do not capture purchasing power &mdash; pair this data with
            local cost-of-living indexes for a complete picture.
          </p>
          <p className="text-sm text-slate-500">
            BLS data typically lags by 12&ndash;18 months. {state.name}&rsquo;s {year} figures reflect the
            most recent complete OEWS release and do not include self-employed, farm, or military workers.
          </p>
        </div>
      </section>

      <TakeHomeCalculator defaultSalary={summary.avg_median_salary} defaultState={state.code} />

      <RelatedEntities
        entityName={state.name}
        items={relatedItems}
        heading="Other States"
      />

      <FAQ items={faqs} />

      {/* JSON-LD — Phase 7 P4 multi-creator dataset with variableMeasured PropertyValue */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ...datasetSchema(
              `${state.name} Salary and Wage Data (${year})`,
              `BLS OEWS state-aggregated wage data for ${state.name}, including median, percentile bands, top-paying occupations, and state-aggregate CostAdjustedWageTier rollup combining nominal OEWS with BEA RPP and Census ACS demographic anchors.`,
              `/state/${slug}/`,
              [
                {
                  '@type': 'PropertyValue',
                  name: 'CrosswalkVerdict',
                  value: stateCrosswalk?.verdict ?? 'C',
                  description: stateCrosswalk?.longLabel ?? 'Mid real-wage state (verdict unavailable)',
                },
                {
                  '@type': 'PropertyValue',
                  name: 'StateAggregateMedian',
                  value: summary.avg_median_salary,
                  unitText: 'USD/year',
                },
                {
                  '@type': 'PropertyValue',
                  name: 'StateBEARppIndex',
                  value: stateRpp ?? 100,
                  unitText: 'US=100',
                },
                {
                  '@type': 'PropertyValue',
                  name: 'RealStateMedian',
                  value: realStateMedian ?? summary.avg_median_salary,
                  unitText: 'USD/year (RPP-deflated)',
                },
                {
                  '@type': 'PropertyValue',
                  name: 'HeadlineVelocityBand',
                  value: stateCrosswalk?.headlineVelocityBand ?? 'unavailable',
                },
                {
                  '@type': 'PropertyValue',
                  name: 'HeadlineDensityTier',
                  value: stateCrosswalk?.headlineDensityTier ?? 'unavailable',
                },
              ],
            ),
            dateModified: BLS_PUBLISHED,
            spatialCoverage: { '@type': 'Place', name: state.name },
            isBasedOn: [
              'https://www.bls.gov/oes/',
              'https://www.census.gov/programs-surveys/acs',
              'https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area',
              'https://www.irs.gov/statistics/soi-tax-stats-individual-income-tax-statistics',
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(breadcrumbs)) }}
      />
      {(faqs?.length ?? 0) > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }}
        />
      )}

      <StateRich slug={slug} state={state} />

      {/* Phase 7 P5 — internal cross-walk bridge to 5 portfolio siblings */}
      <CrosswalkBridge stateName={state.name} stateSlug={slug} />

      <AuthorBox />

    </div>
  );
}
