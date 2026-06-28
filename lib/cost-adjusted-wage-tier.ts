/**
 * CostAdjustedWageTier — 5-band classifier combining BLS OEWS nominal wages
 * with BEA Regional Price Parities to surface real (purchasing-power) wage
 * tiers per occupation × area.
 *
 * Inputs:
 *   - nominal annual median (BLS OEWS p50)
 *   - area RPP (BEA Regional Price Parities, US=100)
 *   - national real median for the same occupation (anchor)
 *
 * realWage     = nominalWage × 100 / rppIndex
 * ratio        = realWage / nationalRealMedian
 *
 * Tier cutoffs (our heuristic — not a BLS official rating):
 *   TopReal        ratio ≥ 1.30
 *   StrongReal     1.10 ≤ ratio < 1.30
 *   ModerateReal   0.95 ≤ ratio < 1.10
 *   BelowMedianReal 0.80 ≤ ratio < 0.95
 *   WeakReal       ratio < 0.80
 *
 * BLS occasionally suppresses small-cell estimates (e.g. <5 employers in a
 * metro × SOC combination). When the underlying nominal median is null we
 * return tier=null with confidence='insufficient-data' rather than fabricating
 * a value.
 */

import type { WageData } from './db';
import { getEffectiveRpp } from './rpp';

export type CostAdjustedWageTier =
  | 'TopReal'
  | 'StrongReal'
  | 'ModerateReal'
  | 'BelowMedianReal'
  | 'WeakReal';

export interface CostAdjustedWageTierResult {
  tier: CostAdjustedWageTier | null;
  nominalWage: number | null;
  rppIndex: number;
  rppLevel: 'msa' | 'state' | 'national';
  realWage: number | null;
  nationalRealMedian: number | null;
  ratio: number | null;
  evidence: string;
  caveats: string[];
  confidence: 'high' | 'med' | 'low' | 'insufficient-data';
}

export const COST_ADJUSTED_WAGE_TIER_CUTOFFS = [
  { tier: 'TopReal' as CostAdjustedWageTier, min: 1.30, rule: 'Real-wage ratio ≥ 1.30 — purchasing power 30%+ above national real median for the same occupation' },
  { tier: 'StrongReal' as CostAdjustedWageTier, min: 1.10, rule: '1.10 ≤ ratio < 1.30 — purchasing power 10-30% above national real median' },
  { tier: 'ModerateReal' as CostAdjustedWageTier, min: 0.95, rule: '0.95 ≤ ratio < 1.10 — purchasing power within ±5% of national real median' },
  { tier: 'BelowMedianReal' as CostAdjustedWageTier, min: 0.80, rule: '0.80 ≤ ratio < 0.95 — purchasing power 5-20% below national real median' },
  { tier: 'WeakReal' as CostAdjustedWageTier, min: 0, rule: 'ratio < 0.80 — purchasing power >20% below national real median; nominal wage premium does not cover the area cost' },
];

function tierFromRatio(ratio: number): CostAdjustedWageTier {
  if (ratio >= 1.30) return 'TopReal';
  if (ratio >= 1.10) return 'StrongReal';
  if (ratio >= 0.95) return 'ModerateReal';
  if (ratio >= 0.80) return 'BelowMedianReal';
  return 'WeakReal';
}

export function classifyCostAdjustedWageTier(
  areaWage: WageData | null | undefined,
  nationalWage: WageData | null | undefined,
  areaCode: string,
): CostAdjustedWageTierResult {
  const rpp = getEffectiveRpp(areaCode);
  const nominalWage = areaWage?.annual_median ?? null;
  const nationalNominal = nationalWage?.annual_median ?? null;

  if (nominalWage == null || nationalNominal == null) {
    return {
      tier: null,
      nominalWage,
      rppIndex: rpp.value,
      rppLevel: rpp.level,
      realWage: null,
      nationalRealMedian: null,
      ratio: null,
      evidence: nominalWage == null
        ? 'BLS suppressed this occupation × area combination (small-cell estimate). Real-wage classification unavailable.'
        : 'National median unavailable for this occupation. Real-wage ratio cannot be anchored.',
      caveats: ['BLS suppression rule: estimates with <5 employers in the cell are not published.'],
      confidence: 'insufficient-data',
    };
  }

  const realWage = Math.round((nominalWage * 100) / rpp.value);
  // National real median = national nominal median (RPP_national = 100 by definition).
  const nationalRealMedian = nationalNominal;
  const ratio = realWage / nationalRealMedian;
  const tier = tierFromRatio(ratio);

  const confidence: CostAdjustedWageTierResult['confidence'] =
    rpp.level === 'msa' ? 'high' : rpp.level === 'state' ? 'med' : 'low';

  const evidence =
    `Nominal $${nominalWage.toLocaleString('en-US')} / RPP ${rpp.value.toFixed(1)} (${rpp.level}) = ` +
    `Real $${realWage.toLocaleString('en-US')} ` +
    `(national real median $${nationalRealMedian.toLocaleString('en-US')}, ratio ${ratio.toFixed(2)})`;

  const caveats: string[] = [];
  if (rpp.level === 'state') {
    caveats.push('Area RPP not published at metro level; falling back to state-level RPP. Within-state cost variation not captured.');
  }
  if (rpp.level === 'national') {
    caveats.push('Neither metro nor state RPP available; assuming national average (RPP=100). Treat real-wage tier as approximate.');
  }
  caveats.push('Real wage ≠ take-home pay: federal/state taxes, FICA, and employer-side benefits are not deducted.');
  caveats.push('RPP measures consumer-price differences only; housing tenure (owner vs renter) and within-metro neighborhood variation are not captured.');

  return {
    tier,
    nominalWage,
    rppIndex: rpp.value,
    rppLevel: rpp.level,
    realWage,
    nationalRealMedian,
    ratio,
    evidence,
    caveats,
    confidence,
  };
}

export function tierBlurb(result: CostAdjustedWageTierResult): string {
  if (!result.tier || result.ratio == null) {
    return 'Real-wage tier unavailable for this combination — BLS suppressed the small-cell estimate.';
  }
  const pct = Math.round(Math.abs(result.ratio - 1) * 100);
  switch (result.tier) {
    case 'TopReal':
      return `Real purchasing power runs ${pct}% above the national real median for this occupation — among the strongest cost-adjusted metros for this role.`;
    case 'StrongReal':
      return `Real purchasing power is ${pct}% above the national real median for this occupation, after BEA cost adjustment.`;
    case 'ModerateReal':
      return `Real purchasing power sits within ${pct}% of the national real median — the nominal premium roughly offsets the area's cost level.`;
    case 'BelowMedianReal':
      return `Real purchasing power is ${pct}% below the national real median — the nominal wage does not fully offset the area's cost level.`;
    case 'WeakReal':
      return `Real purchasing power runs ${pct}% below the national real median — nominal premium fails to cover the area cost. Often a high-RPP area with no occupation-specific wage premium.`;
  }
}

export function tierLabel(tier: CostAdjustedWageTier | null): string {
  switch (tier) {
    case 'TopReal': return 'Top Real-Wage Tier';
    case 'StrongReal': return 'Strong Real-Wage Tier';
    case 'ModerateReal': return 'Moderate Real-Wage Tier';
    case 'BelowMedianReal': return 'Below-Median Real-Wage Tier';
    case 'WeakReal': return 'Weak Real-Wage Tier';
    default: return 'Insufficient data';
  }
}

export function tierToneColor(tier: CostAdjustedWageTier | null): { bg: string; ring: string; text: string } {
  switch (tier) {
    case 'TopReal': return { bg: 'bg-emerald-50', ring: 'ring-emerald-300', text: 'text-emerald-900' };
    case 'StrongReal': return { bg: 'bg-teal-50', ring: 'ring-teal-300', text: 'text-teal-900' };
    case 'ModerateReal': return { bg: 'bg-amber-50', ring: 'ring-amber-300', text: 'text-amber-900' };
    case 'BelowMedianReal': return { bg: 'bg-orange-50', ring: 'ring-orange-300', text: 'text-orange-900' };
    case 'WeakReal': return { bg: 'bg-red-50', ring: 'ring-red-300', text: 'text-red-900' };
    default: return { bg: 'bg-slate-50', ring: 'ring-slate-200', text: 'text-slate-700' };
  }
}

// ---------- decodePercentileSpread ----------

export type PercentileSpreadBand = 'Compressed' | 'Moderate' | 'Wide' | 'Extreme';

export interface PercentileSpreadResult {
  spreadRatio: number | null;
  band: PercentileSpreadBand | null;
  interpretation: string;
  evidence: string;
  caveats: string[];
}

export const PERCENTILE_SPREAD_CUTOFFS = [
  { band: 'Compressed' as PercentileSpreadBand, max: 3.0, rule: 'p90/p10 < 3.0 — narrow earnings ladder; experience and specialization buy little premium' },
  { band: 'Moderate' as PercentileSpreadBand, max: 4.0, rule: '3.0 ≤ p90/p10 < 4.0 — typical mid-skill ladder' },
  { band: 'Wide' as PercentileSpreadBand, max: 6.0, rule: '4.0 ≤ p90/p10 < 6.0 — meaningful experience premium; common in tech/legal/finance' },
  { band: 'Extreme' as PercentileSpreadBand, max: Infinity, rule: 'p90/p10 ≥ 6.0 — bimodal distribution; specialization or partnership tracks dominate top decile' },
];

function bandFromSpread(ratio: number): PercentileSpreadBand {
  if (ratio < 3.0) return 'Compressed';
  if (ratio < 4.0) return 'Moderate';
  if (ratio < 6.0) return 'Wide';
  return 'Extreme';
}

export function decodePercentileSpread(wage: WageData | null | undefined): PercentileSpreadResult {
  if (!wage || wage.annual_p10 == null || wage.annual_p90 == null) {
    return {
      spreadRatio: null,
      band: null,
      interpretation: 'Percentile spread unavailable — BLS did not publish p10 or p90 for this combination (small-cell suppression).',
      evidence: '',
      caveats: ['BLS publishes p10/p90 only when sufficient sample observations support the estimate.'],
    };
  }
  const ratio = wage.annual_p90 / wage.annual_p10;
  const band = bandFromSpread(ratio);

  let interpretation = '';
  switch (band) {
    case 'Compressed':
      interpretation = `Top earners (p90) make ${ratio.toFixed(1)}× bottom earners (p10) — a narrow ladder. Typical of public-sector or unionized occupations where experience premiums are bounded by step-and-grade pay scales.`;
      break;
    case 'Moderate':
      interpretation = `Top earners (p90) make ${ratio.toFixed(1)}× bottom earners (p10) — a typical mid-skill ladder. Experience buys a meaningful but not dramatic premium.`;
      break;
    case 'Wide':
      interpretation = `Top earners (p90) make ${ratio.toFixed(1)}× bottom earners (p10) — a wide earnings ladder. Specialization, certification, or seniority track substantially separates top from bottom decile (common in tech, legal, finance).`;
      break;
    case 'Extreme':
      interpretation = `Top earners (p90) make ${ratio.toFixed(1)}× bottom earners (p10) — an extreme spread. Often reflects a bimodal split (e.g. partnership track vs salaried associate; surgeon vs trainee) where top decile is dominated by a structurally distinct career path.`;
      break;
  }

  const evidence =
    `p10 $${wage.annual_p10.toLocaleString('en-US')} → ` +
    `p90 $${wage.annual_p90.toLocaleString('en-US')} ` +
    `(spread ratio ${ratio.toFixed(2)}×)`;

  return {
    spreadRatio: Math.round(ratio * 100) / 100,
    band,
    interpretation,
    evidence,
    caveats: [
      'Spread reflects within-occupation variation only; it does not control for years of experience, employer size, or sub-specialty.',
      'Cross-occupation spread comparisons should anchor on the same area to hold cost-of-living constant.',
    ],
  };
}

export function spreadBandLabel(band: PercentileSpreadBand | null): string {
  switch (band) {
    case 'Compressed': return 'Compressed ladder';
    case 'Moderate': return 'Moderate ladder';
    case 'Wide': return 'Wide ladder';
    case 'Extreme': return 'Extreme spread';
    default: return 'Insufficient data';
  }
}
