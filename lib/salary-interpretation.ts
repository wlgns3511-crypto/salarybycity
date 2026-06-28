/**
 * Salary Interpretation (PSU 1차 stacked over 0차 baseline) — composite
 * verdict atop three BLS OEWS-derived levers:
 *
 *   1. CostAdjustedWageTier   (5-band real-wage tier — OEWS × BEA RPP)
 *   2. WageGrowthVelocityBand (5-band YoY trajectory — OEWS pair)
 *   3. OccupationDensityScore (5-tier cross-area market thickness — OEWS)
 *
 * Output is the "Salary Interpretation" composite the reader sees in the
 * hero of /jobs/[slug]/ and /state/[slug]/. Each composite carries:
 *
 *   - verdict     : 1-line summary that names all three lever readings
 *   - tone        : tailwind color group keyed off the cost-adjusted tier
 *   - decision    : one of 'relocate-up' | 'stay-grow' | 'lateral-shift' |
 *                   'data-incomplete' — the framing the reader should use
 *   - paragraphs  : 4 paragraphs — costAdjusted reading, growth trajectory,
 *                   market thickness, decision framing
 *
 * The composite is deterministic. Same inputs → byte-identical output.
 *
 * Sources cited in the prose:
 *   - BLS OEWS p10/p50/p90 + employment per area  (oews.bls.gov)
 *   - BEA Regional Price Parities                (bea.gov)
 *
 * Suppression behaviour: when any of the three lever readings is null the
 * composite still emits a verdict line plus the "data-incomplete" decision
 * framing — the reader sees the gap as honest signal rather than an omission.
 */

import type { CostAdjustedWageTierResult, CostAdjustedWageTier, PercentileSpreadResult } from './cost-adjusted-wage-tier';
import { tierLabel, tierToneColor } from './cost-adjusted-wage-tier';
import type { WageGrowthVelocityResult, WageGrowthVelocityBand } from './wage-growth-velocity';
import { velocityBandLabel } from './wage-growth-velocity';
import type { OccupationDensityResult, OccupationDensityTier } from './occupation-density-score';
import { densityTierLabel } from './occupation-density-score';

export type SalaryDecisionFraming =
  | 'relocate-up'      // strong real wage + thick market or surging growth → push the negotiation, the slice has runway
  | 'stay-grow'        // strong real wage + steady growth + average/thick density → stay and climb the ladder in place
  | 'lateral-shift'    // weak real wage or stagnant/declining velocity or thin density → broaden the search; do not anchor on this slice
  | 'data-incomplete'; // any lever returned suppression → reader should consult the broader area/national page

export interface SalaryInterpretationContext {
  /** "Software Developer" — occupation title for the verdict line */
  occupationTitle: string;
  /** "Austin, TX" or "Texas" — geographic anchor for the verdict line */
  areaName: string;
  /** "metro" | "state" | "national" — what the area unit is */
  areaKind: 'metro' | 'state' | 'national';
}

export interface SalaryInterpretation {
  verdict: string;
  decision: SalaryDecisionFraming;
  tone: { bg: string; ring: string; text: string };
  paragraphs: {
    /** Cost-adjusted reading — what the real-wage tier × percentile spread says */
    costAdjusted: string;
    /** Growth trajectory — what the YoY velocity band says */
    growth: string;
    /** Market thickness — what the cross-area density tier says */
    density: string;
    /** Decision framing — concrete "what to do with this composite" */
    decisionFraming: string;
  };
}

const TIER_HEADLINE: Record<CostAdjustedWageTier, string> = {
  TopReal: 'a top-decile real wage',
  StrongReal: 'a strong real-wage premium',
  ModerateReal: 'a typical real-wage tier',
  BelowMedianReal: 'a below-median real-wage tier',
  WeakReal: 'a weak real-wage tier where the cost of living erodes the nominal premium',
};

const VELOCITY_HEADLINE: Record<WageGrowthVelocityBand, string> = {
  Surging: 'a surging YoY growth pair',
  Strong: 'a strong YoY growth pair',
  Steady: 'a steady YoY growth pair',
  Stagnant: 'a stagnant YoY pair',
  Declining: 'a declining YoY pair',
};

const DENSITY_HEADLINE: Record<OccupationDensityTier, string> = {
  VeryThick: 'a top-5% thick labor market',
  Thick: 'a thick labor market',
  Average: 'an average-density labor market',
  Thin: 'a thin labor market',
  VeryThin: 'a very thin labor market',
};

function pickDecision(
  tier: CostAdjustedWageTier | null,
  velocity: WageGrowthVelocityBand | null,
  density: OccupationDensityTier | null,
): SalaryDecisionFraming {
  if (tier == null || velocity == null || density == null) return 'data-incomplete';

  const strongReal = tier === 'TopReal' || tier === 'StrongReal';
  const weakReal = tier === 'BelowMedianReal' || tier === 'WeakReal';
  const positiveVel = velocity === 'Surging' || velocity === 'Strong';
  const negativeVel = velocity === 'Declining' || velocity === 'Stagnant';
  const thickEnough = density === 'VeryThick' || density === 'Thick';
  const thinEnough = density === 'VeryThin' || density === 'Thin';

  if (strongReal && (positiveVel || thickEnough)) return 'relocate-up';
  if (weakReal || negativeVel || thinEnough) return 'lateral-shift';
  return 'stay-grow';
}

function pickTone(
  decision: SalaryDecisionFraming,
  tier: CostAdjustedWageTier | null,
): { bg: string; ring: string; text: string } {
  if (decision === 'data-incomplete') {
    return { bg: 'bg-slate-50', ring: 'ring-slate-200', text: 'text-slate-700' };
  }
  if (decision === 'relocate-up') {
    return { bg: 'bg-emerald-50', ring: 'ring-emerald-300', text: 'text-emerald-900' };
  }
  if (decision === 'lateral-shift') {
    return { bg: 'bg-rose-50', ring: 'ring-rose-300', text: 'text-rose-900' };
  }
  // stay-grow — modulate the amber by tier so a ModerateReal stay-grow still
  // reads visually distinct from a Top/StrongReal relocate-up.
  return tier === 'TopReal' || tier === 'StrongReal'
    ? { bg: 'bg-teal-50', ring: 'ring-teal-300', text: 'text-teal-900' }
    : { bg: 'bg-amber-50', ring: 'ring-amber-300', text: 'text-amber-900' };
}

export function getSalaryInterpretation(
  costAdj: CostAdjustedWageTierResult | null | undefined,
  velocity: WageGrowthVelocityResult | null | undefined,
  density: OccupationDensityResult | null | undefined,
  spread: PercentileSpreadResult | null | undefined,
  ctx: SalaryInterpretationContext,
): SalaryInterpretation {
  const tier = costAdj?.tier ?? null;
  const ratio = costAdj?.ratio ?? null;
  const ratioPct = ratio != null ? Math.round((ratio - 1) * 100) : null;
  const velocityBand = velocity?.band ?? null;
  const yoy = velocity?.yoyChange ?? null;
  const densityTier = density?.tier ?? null;
  const pctile = density?.percentile ?? null;

  const decision = pickDecision(tier, velocityBand, densityTier);
  const tone = pickTone(decision, tier);

  const tierFragment = tier
    ? `${tierLabel(tier)}${ratioPct != null ? ` (${ratioPct >= 0 ? '+' : ''}${ratioPct}% vs national real median)` : ''}`
    : 'real-wage tier suppressed';
  const velocityFragment = velocityBand
    ? `${velocityBandLabel(velocityBand)}${yoy != null ? ` (${yoy >= 0 ? '+' : ''}${(yoy * 100).toFixed(1)}% YoY)` : ''}`
    : 'YoY velocity suppressed';
  const densityFragment = densityTier
    ? `${densityTierLabel(densityTier)}${pctile != null ? ` (${pctile.toFixed(0)}th percentile of published metros)` : ''}`
    : 'cross-area density suppressed';

  const verdict =
    `${ctx.occupationTitle} in ${ctx.areaName}: ${tierFragment} · ${velocityFragment} · ${densityFragment}.`;

  // ---- Paragraph 1 — cost-adjusted reading ----
  const tierHead = tier ? TIER_HEADLINE[tier] : 'no published real-wage tier';
  const rppLine = costAdj?.rppIndex && costAdj.rppLevel !== 'national'
    ? `The BEA Regional Price Parity used for the deflation is ${costAdj.rppIndex.toFixed(1)} (US=100, ${costAdj.rppLevel}-level).`
    : 'The BEA Regional Price Parity for the area is the national 100 baseline.';
  const spreadRatio = spread?.spreadRatio ?? null;
  const spreadFragment = spread?.band && spreadRatio != null
    ? `Within the occupation the p90/p10 spread is ${spreadRatio.toFixed(1)}× — ${spread.band === 'Compressed' ? 'a compressed ladder' : spread.band === 'Moderate' ? 'a typical ladder' : spread.band === 'Wide' ? 'a wide ladder' : 'an extreme spread'}.`
    : 'BLS suppression on p10/p90 hides the within-occupation ladder for this slice.';
  const costAdjusted =
    `Combining the BLS OEWS published medians for ${ctx.occupationTitle} with the BEA Regional Price Parity for ${ctx.areaName}, the cost-adjusted reading lands at ${tierHead}. ${rppLine} ${spreadFragment}`;

  // ---- Paragraph 2 — growth trajectory ----
  const velocityHead = velocityBand ? VELOCITY_HEADLINE[velocityBand] : 'no published YoY pair';
  const yoyDisplay = yoy != null
    ? `${yoy >= 0 ? '+' : ''}${(yoy * 100).toFixed(1)}% nominal change`
    : 'nominal change suppressed';
  const velocityYears = velocity?.latestYear && velocity?.priorYear
    ? `${velocity.priorYear} → ${velocity.latestYear}`
    : 'latest pair';
  const velocityGapCaveat = velocity?.caveats?.some(c => c.startsWith('Adjacent release year suppressed'))
    ? ' The pair spans a suppressed adjacent release, annualized over the gap.'
    : '';
  const growth =
    `The latest BLS OEWS release pair for this slice (${velocityYears}) shows ${velocityHead} — ${yoyDisplay}.${velocityGapCaveat} Velocity is a nominal-wage reading; real-wage direction depends on the CPI-W / CPI-U / PCE deflator a reader chooses for the same window.`;

  // ---- Paragraph 3 — market thickness ----
  const densityHead = densityTier ? DENSITY_HEADLINE[densityTier] : 'no published density tier';
  const densityFragment2 = density?.distributionN
    ? `The percentile rank is computed against the ${density.distributionN} BLS-published metros that issued an employment figure for the same SOC.`
    : 'The cross-area baseline lacks the 10-metro floor needed to rank density.';
  const densitySensitivity = density?.distributionN && density.distributionN < 30
    ? ' The published baseline is narrow, so the percentile rank is more sensitive to BLS suppression than for occupations with broad geographic coverage.'
    : '';
  const densityPara =
    `For ${ctx.occupationTitle}, the cross-area density reading lands at ${densityHead}. ${densityFragment2}${densitySensitivity} Density is a count-of-jobs reading; a thick market with low turnover can have fewer open roles than a thin market in a high-churn industry.`;

  // ---- Paragraph 4 — decision framing ----
  const decisionFraming = (() => {
    if (decision === 'data-incomplete') {
      return `One or more of the three lever readings (cost-adjusted tier, YoY velocity, cross-area density) is suppressed for this slice. Read the next-broader unit — state if this is a metro, national if this is a state — alongside this composite; the broader cell often passes BLS suppression while this one does not. Treat the gap as a data-availability signal, not a wage signal.`;
    }
    if (decision === 'relocate-up') {
      return `The composite supports a relocate-up framing: ${tierHead}, ${velocityHead}, and ${densityHead} reinforce each other. A nominal offer in a different ${ctx.areaKind === 'state' ? 'state' : 'metro'} should be benchmarked on real wage (this site's tier label) and not on sticker dollars — a 10% nominal raise into a 20%-higher RPP is a real-wage cut. The thick market reduces single-employer concentration risk that often shows up at the negotiating table.`;
    }
    if (decision === 'stay-grow') {
      return `The composite supports a stay-grow framing: ${tierHead} and ${velocityHead} are aligned, and ${densityHead} carries enough employer breadth to climb inside the occupation. Career upside in this slice is usually about moving up the ladder rather than relocating; check the percentile spread on this page to see whether the top decile is reachable inside ${ctx.occupationTitle} or whether it requires a sub-specialty pivot.`;
    }
    // lateral-shift
    return `The composite supports a lateral-shift framing: at least one of ${tierHead}, ${velocityHead}, or ${densityHead} weakens the slice. Broaden the search before anchoring on this combination — read the same occupation in a ModerateReal-or-better area with a positive velocity pair, or read a related occupation inside the same major group on the cross-career table on this page. The CostAdjustedWageTier table and the related-by-pay list at the bottom of this page are anchored to the same BLS OEWS and BEA RPP vintage used here.`;
  })();

  return {
    verdict,
    decision,
    tone,
    paragraphs: {
      costAdjusted,
      growth,
      density: densityPara,
      decisionFraming,
    },
  };
}
