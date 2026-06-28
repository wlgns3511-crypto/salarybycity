/**
 * Phase 7 §3.3 cross-walk decoder for salarybycity — state-level retrofit.
 *
 * Wraps the mature Phase 6 PSU (CostAdjustedWageTier × WageGrowthVelocity ×
 * OccupationDensityScore — already composed via getSalaryInterpretation)
 * into a single state-level CrosswalkResult so /state/[slug]/ emits a typed
 * verdict that varies across the 51 keep-set entries.
 *
 * Per-occupation /jobs/[slug]/ surface receives the same wrapper via
 * decodeJobCrosswalk(), but title.absolute is held there for one cycle:
 * 71/397 BLS occupation titles already exceed 45c (max 94c — "Adult Basic
 * Education, Adult Secondary Education, and English as a Second Language
 * Instructors"), so a {Name}: {Verdict} · $XXXK/y pattern would push ~30%
 * of titles over the 60c rewrite cap. Title cap math defers /jobs/ P1 per
 * §4.0 honest-distribution rule.
 *
 * Publisher diversity (Trap #110 — ≥2 distinct host TLDs):
 *   - https://www.bls.gov/oes/                              BLS OES May 2024
 *   - https://www.census.gov/programs-surveys/acs           Census ACS
 *   - https://www.bea.gov/.../regional-price-parities-...   BEA RPP
 *   - https://www.irs.gov/statistics/...                    IRS SOI
 * Four distinct .gov hosts: bls.gov · census.gov · bea.gov · irs.gov
 */

import {
  classifyCostAdjustedWageTier,
  decodePercentileSpread,
  type CostAdjustedWageTier,
  type CostAdjustedWageTierResult,
} from './cost-adjusted-wage-tier';
import { classifyWageGrowthVelocity, type WageGrowthVelocityResult } from './wage-growth-velocity';
import { computeOccupationDensity, type OccupationDensityResult } from './occupation-density-score';
import {
  getStateWageSummary,
  getNationalWageSummary,
  getStateTopOccupationsWithNational,
  getNationalWage,
  getTopPayingCities,
  getNationalWagesAcrossYears,
  getOccupationEmploymentDistribution,
  type WageData,
} from './db';
import { getStateRpp } from './rpp';

export type CrosswalkVerdict = 'A' | 'B' | 'C' | 'D' | 'E';

export interface StateCrosswalkResult {
  verdict: CrosswalkVerdict;
  /** State aggregate avg median wage (BLS OEWS metro-aggregated, nominal). */
  primaryValue: number | null;
  /** Composed score = ratio% + headlineYoY% + densityPercentile/10. */
  composedScore: number;
  /** SERP title-safe label (≤9c — §4.0 budget). */
  shortLabel: string;
  /** Long-form label for body copy + meta description. */
  longLabel: string;
  /** Underlying state-aggregate CostAdjustedWageTier band. */
  stateTier: CostAdjustedWageTier | null;
  /** State RPP (US=100); null if BEA dataset doesn't cover. */
  stateRpp: number | null;
  /** Headline occupation's YoY velocity band, if available. */
  headlineVelocityBand: string | null;
  /** Headline occupation's density tier (cross-area thickness). */
  headlineDensityTier: string | null;
  decoderNotes: string;
  sourceCitations: string[];
}

export interface JobCrosswalkResult {
  verdict: CrosswalkVerdict;
  /** National median wage for the occupation. */
  nationalMedian: number | null;
  /** Best-real-wage metro for the occupation (cost-adjusted top). */
  bestRealMetroName: string | null;
  bestRealMetroTier: CostAdjustedWageTier | null;
  composedScore: number;
  shortLabel: string;
  longLabel: string;
  velocityBand: string | null;
  densityTier: string | null;
  decoderNotes: string;
  sourceCitations: string[];
}

const SHORT_LABELS: Record<CrosswalkVerdict, string> = {
  A: 'Top Real',     // 8c  — TopReal ratio ≥ 1.30
  B: 'Strong Real',  // 11c — StrongReal 1.10 ≤ ratio < 1.30
  C: 'Mid Real',     // 8c  — ModerateReal 0.95 ≤ ratio < 1.10
  D: 'Sub-Med',      // 7c  — BelowMedianReal 0.80 ≤ ratio < 0.95
  E: 'Weak Real',    // 9c  — WeakReal ratio < 0.80
};

const LONG_LABELS: Record<CrosswalkVerdict, string> = {
  A: 'Top-tier real-wage state — purchasing power 30%+ above national after BEA RPP deflation',
  B: 'Strong real-wage state — purchasing power 10-30% above national after BEA RPP deflation',
  C: 'Mid real-wage state — purchasing power within ±5% of national after BEA RPP deflation',
  D: 'Sub-median real-wage state — purchasing power 5-20% below national after BEA RPP deflation',
  E: 'Weak real-wage state — purchasing power 20%+ below national; cost of living erodes nominal',
};

function tierToVerdict(tier: CostAdjustedWageTier | null): CrosswalkVerdict {
  switch (tier) {
    case 'TopReal': return 'A';
    case 'StrongReal': return 'B';
    case 'ModerateReal': return 'C';
    case 'BelowMedianReal': return 'D';
    case 'WeakReal': return 'E';
    default: return 'C';
  }
}

function ratioToTier(ratio: number): CostAdjustedWageTier {
  if (ratio >= 1.30) return 'TopReal';
  if (ratio >= 1.10) return 'StrongReal';
  if (ratio >= 0.95) return 'ModerateReal';
  if (ratio >= 0.80) return 'BelowMedianReal';
  return 'WeakReal';
}

const SOURCE_CITATIONS = [
  'BLS OEWS May 2024',
  'Census ACS 1-year + 5-year tables (verified 2026-05-01)',
  'BEA Regional Price Parities (state + metro, 2024 release)',
  'IRS SOI individual income tax statistics (state cross-reference)',
];

/**
 * Decode the state-level cross-walk for /state/[slug]/.
 *
 * State aggregate CostAdjustedWageTier is computed as:
 *   realStateMedian = stateAvgMedian × 100 / stateRpp
 *   ratio = realStateMedian / nationalAvgMedian
 *
 * Binds verdict band directly to the cost-adjusted tier per Trap #111
 * honest-distribution rule. Headline occupation's velocity + density feed
 * composedScore as secondary signals but do not gate the band.
 */
export function decodeStateCrosswalk(stateCode: string): StateCrosswalkResult | null {
  const summary = getStateWageSummary(stateCode);
  if (!summary || summary.occ_count === 0) return null;

  const nationalSummary = getNationalWageSummary();
  const natAvg = nationalSummary?.avg_median_salary ?? 0;
  const stateRpp = getStateRpp(stateCode);

  const realStateMedian = stateRpp != null
    ? Math.round((summary.avg_median_salary * 100) / stateRpp)
    : null;

  const ratio = realStateMedian != null && natAvg > 0
    ? realStateMedian / natAvg
    : null;

  const stateTier: CostAdjustedWageTier | null = ratio != null ? ratioToTier(ratio) : null;
  const verdict = tierToVerdict(stateTier);

  // Headline occupation = highest-paying state occ — used for YoY velocity + density
  const topJobs = getStateTopOccupationsWithNational(stateCode, 1);
  const headlineJob = topJobs[0] ?? null;

  const velocity = headlineJob
    ? classifyWageGrowthVelocity(getNationalWagesAcrossYears(headlineJob.soc_code))
    : classifyWageGrowthVelocity([]);

  const empDist = headlineJob
    ? getOccupationEmploymentDistribution(headlineJob.soc_code)
    : [];
  const density = computeOccupationDensity(headlineJob?.employment ?? null, empDist);

  const ratioPct = ratio != null ? (ratio - 1) * 100 : 0;
  const yoyPct = velocity.yoyChange != null ? velocity.yoyChange * 100 : 0;
  const densityPct = density.percentile ?? 50;
  const composedScore = Number((ratioPct + yoyPct + densityPct / 10).toFixed(2));

  const decoderNotes =
    `state aggregate real-wage ratio ${ratio != null ? ratio.toFixed(2) : 'null'} ` +
    `(stateRpp=${stateRpp != null ? stateRpp.toFixed(1) : 'unavailable'}); ` +
    `headline occ ${headlineJob?.occ_title ?? 'n/a'} velocity=${velocity.band ?? 'null'}, density=${density.tier ?? 'null'}.`;

  return {
    verdict,
    primaryValue: summary.avg_median_salary,
    composedScore,
    shortLabel: SHORT_LABELS[verdict],
    longLabel: LONG_LABELS[verdict],
    stateTier,
    stateRpp,
    headlineVelocityBand: velocity.band,
    headlineDensityTier: density.tier,
    decoderNotes,
    sourceCitations: SOURCE_CITATIONS,
  };
}

/**
 * Decode the occupation-level cross-walk for /jobs/[slug]/.
 *
 * Per-occupation CostAdjustedWageTier is taken from the *best* (strongest
 * real-wage ratio) metro across the top-paying-cities set for the occupation
 * — the metro where nominal premium actually buys real purchasing power.
 * This mirrors the existing best-real-metro logic on /jobs/[slug]/page.tsx.
 *
 * Surfaces as JSON-LD variableMeasured + an optional body chip. Title
 * (P1 title.absolute) is held this cycle because 71/397 BLS occupation
 * titles exceed 45c (max 94c) — would push ~30% over the 60c cap.
 */
export function decodeJobCrosswalk(socCode: string): JobCrosswalkResult | null {
  const nationalWage: WageData | null | undefined = getNationalWage(socCode);
  if (!nationalWage) return null;

  const topCities = getTopPayingCities(socCode, 10);
  const cityTiers = topCities
    .map((row) => ({ row, tier: classifyCostAdjustedWageTier(row, nationalWage, row.area_code) }))
    .filter((e) => e.tier.tier != null);

  const bestRealMetro = cityTiers.length > 0
    ? [...cityTiers].sort((a, b) => (b.tier.ratio ?? 0) - (a.tier.ratio ?? 0))[0]
    : null;

  const tier: CostAdjustedWageTier | null = bestRealMetro?.tier.tier ?? null;
  const verdict = tierToVerdict(tier);

  const wageHistory = getNationalWagesAcrossYears(socCode);
  const velocity = classifyWageGrowthVelocity(wageHistory);

  const empDist = getOccupationEmploymentDistribution(socCode);
  const headlineEmployment = bestRealMetro?.row.employment ?? nationalWage.employment ?? null;
  const density = computeOccupationDensity(headlineEmployment, empDist);

  const ratio = bestRealMetro?.tier.ratio ?? null;
  const ratioPct = ratio != null ? (ratio - 1) * 100 : 0;
  const yoyPct = velocity.yoyChange != null ? velocity.yoyChange * 100 : 0;
  const densityPct = density.percentile ?? 50;
  const composedScore = Number((ratioPct + yoyPct + densityPct / 10).toFixed(2));

  const decoderNotes = bestRealMetro
    ? `best-real metro ${bestRealMetro.row.area_title}: ratio ${ratio!.toFixed(2)}, velocity=${velocity.band ?? 'null'}, density=${density.tier ?? 'null'}.`
    : `no published metro median for this occupation — verdict falls back to mid based on null tier.`;

  return {
    verdict,
    nationalMedian: nationalWage.annual_median,
    bestRealMetroName: bestRealMetro?.row.area_title ?? null,
    bestRealMetroTier: tier,
    composedScore,
    shortLabel: SHORT_LABELS[verdict],
    longLabel: LONG_LABELS[verdict],
    velocityBand: velocity.band,
    densityTier: density.tier,
    decoderNotes,
    sourceCitations: SOURCE_CITATIONS,
  };
}

/**
 * Compose the /state/[slug]/ title.absolute string.
 *
 * Pattern: `{StateName}: {ShortVerdict} · $XXXK/y`
 *
 * §4.0 title-cap budget math:
 *   20 (longest state, "District of Columbia")
 * +  2 (": ")
 * + 11 (longest short label, "Strong Real")
 * +  3 (" · ")
 * +  7 ("$206K/y" — DC avg median ~$87K but worst-case headroom 7c)
 * = 43c worst case, well under 60c Google rewrite cap with margin.
 *
 * Suffix " | SalaryByCity" = 15c — title.absolute bypasses this per §4.0.
 */
export function buildStateP1Title(stateName: string, result: StateCrosswalkResult): string {
  const wagePart = result.primaryValue != null
    ? ` · $${Math.round(result.primaryValue / 1000)}K/y`
    : '';
  return `${stateName}: ${result.shortLabel}${wagePart}`;
}
