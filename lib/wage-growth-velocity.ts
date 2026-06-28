/**
 * WageGrowthVelocityBand — 5-band classifier on year-over-year change in the
 * BLS OEWS annual median wage for the same occupation × area.
 *
 * Inputs:
 *   - WageData[] across two or more consecutive BLS release years for the same
 *     (soc_code, area_code) tuple. The classifier consumes the latest pair —
 *     `latest` (most recent published year) and `prior` (the year before it).
 *
 * YoY change = (latest.annual_median - prior.annual_median) / prior.annual_median
 *
 * Band cutoffs (our heuristic — not a BLS official rating):
 *   Surging      yoy ≥ +7%
 *   Strong       +4% ≤ yoy < +7%
 *   Steady       +1% ≤ yoy < +4%
 *   Stagnant     −1% ≤ yoy < +1%
 *   Declining    yoy < −1%
 *
 * Suppression behaviour: BLS does not publish small-cell estimates (<5
 * employers in a metro × SOC combination). When either year's annual_median is
 * null the classifier returns band=null with evidence string explaining that
 * the pair could not be assembled. SOC code mapping changes between OEWS
 * releases are flagged in `caveats` so that a reader treats the velocity
 * reading with appropriate caution.
 */

import type { WageData } from './db';

export type WageGrowthVelocityBand =
  | 'Surging'
  | 'Strong'
  | 'Steady'
  | 'Stagnant'
  | 'Declining';

export interface WageGrowthVelocityResult {
  band: WageGrowthVelocityBand | null;
  yoyChange: number | null;       // signed decimal, e.g. 0.082 = +8.2% YoY
  latestYear: number | null;
  priorYear: number | null;
  latestMedian: number | null;
  priorMedian: number | null;
  evidence: string;
  caveats: string[];
  confidence: 'high' | 'med' | 'low' | 'insufficient-data';
}

export const WAGE_GROWTH_VELOCITY_CUTOFFS = [
  { band: 'Surging' as WageGrowthVelocityBand, min: 0.07, rule: 'YoY change ≥ +7% — wage growth ranks among the fastest for this slice; often tight-supply or surge-demand niches' },
  { band: 'Strong' as WageGrowthVelocityBand, min: 0.04, rule: '+4% ≤ YoY < +7% — wage growth runs ahead of recent US CPI bands' },
  { band: 'Steady' as WageGrowthVelocityBand, min: 0.01, rule: '+1% ≤ YoY < +4% — wage growth tracks broad nominal-pay trends in the published BLS releases' },
  { band: 'Stagnant' as WageGrowthVelocityBand, min: -0.01, rule: '−1% ≤ YoY < +1% — nominal wage essentially flat; real-wage direction depends on prevailing inflation' },
  { band: 'Declining' as WageGrowthVelocityBand, min: -Infinity, rule: 'YoY < −1% — published median is lower than the prior release; mix-shift inside the occupation × area cell often explains it' },
];

function bandFromYoy(yoy: number): WageGrowthVelocityBand {
  if (yoy >= 0.07) return 'Surging';
  if (yoy >= 0.04) return 'Strong';
  if (yoy >= 0.01) return 'Steady';
  if (yoy >= -0.01) return 'Stagnant';
  return 'Declining';
}

/**
 * Classify the year-over-year velocity from a wage-history series.
 *
 * @param history Wage rows for one (soc_code, area_code) sorted ASC by year.
 *                Caller is expected to supply at least two consecutive years
 *                of published medians; gaps are tolerated and the most recent
 *                published pair is used.
 */
export function classifyWageGrowthVelocity(
  history: WageData[] | null | undefined,
): WageGrowthVelocityResult {
  const rows = (history ?? []).filter(r => r.annual_median != null);

  if (rows.length < 2) {
    return {
      band: null,
      yoyChange: null,
      latestYear: rows.at(-1)?.year ?? null,
      priorYear: null,
      latestMedian: rows.at(-1)?.annual_median ?? null,
      priorMedian: null,
      evidence: rows.length === 0
        ? 'BLS OEWS suppressed every release in the available series for this combination (small-cell estimate).'
        : 'Only one BLS OEWS release is available for this combination. A year-over-year velocity band requires two consecutive published medians.',
      caveats: [
        'BLS suppression rule: estimates with <5 employers in the cell are not published.',
        'OEWS releases occur annually in April for the prior May reference period.',
      ],
      confidence: 'insufficient-data',
    };
  }

  // Use the latest two consecutive years for a clean YoY computation. If the
  // series has gaps (e.g. 2022 → 2024 with 2023 suppressed), the pair span is
  // surfaced as a caveat rather than silently treated as 1-year.
  const sorted = [...rows].sort((a, b) => a.year - b.year);
  const latest = sorted[sorted.length - 1];
  const prior = sorted[sorted.length - 2];
  const gap = latest.year - prior.year;

  const latestMedian = latest.annual_median as number;
  const priorMedian = prior.annual_median as number;
  const yoyRaw = (latestMedian - priorMedian) / priorMedian;
  // Annualize when the published pair spans more than 1 year (suppression gap).
  const yoy = gap > 1 ? Math.pow(1 + yoyRaw, 1 / gap) - 1 : yoyRaw;
  const band = bandFromYoy(yoy);

  const pct = (yoy * 100).toFixed(1);
  const evidence =
    `${prior.year} median $${priorMedian.toLocaleString('en-US')} → ` +
    `${latest.year} median $${latestMedian.toLocaleString('en-US')} ` +
    `(${gap > 1 ? `annualized over ${gap} years; ` : ''}${yoy >= 0 ? '+' : ''}${pct}% YoY)`;

  const caveats: string[] = [];
  if (gap > 1) {
    caveats.push(`Adjacent release year suppressed; the pair spans ${gap} BLS releases (${prior.year} → ${latest.year}). Reading annualized over the span.`);
  }
  caveats.push('SOC code mapping changes between OEWS releases can shift the composition of a single occupation cell; treat large swings with corroboration.');
  caveats.push('Velocity is nominal-wage change. Real-wage direction depends on the CPI-W / CPI-U / PCE deflator the reader chooses.');

  // Confidence is "high" only when the pair is consecutive and the magnitude
  // is consistent with broad BLS release patterns. Larger swings on a
  // gap-spanning pair earn a more cautious confidence so cross-occupation
  // comparisons can weight them appropriately.
  const confidence: WageGrowthVelocityResult['confidence'] =
    gap === 1 && Math.abs(yoy) < 0.15 ? 'high'
    : gap === 1 ? 'med'
    : gap === 2 ? 'med'
    : 'low';

  return {
    band,
    yoyChange: Math.round(yoy * 10000) / 10000,
    latestYear: latest.year,
    priorYear: prior.year,
    latestMedian,
    priorMedian,
    evidence,
    caveats,
    confidence,
  };
}

export function velocityBandLabel(band: WageGrowthVelocityBand | null): string {
  switch (band) {
    case 'Surging':   return 'Surging growth';
    case 'Strong':    return 'Strong growth';
    case 'Steady':    return 'Steady growth';
    case 'Stagnant':  return 'Stagnant';
    case 'Declining': return 'Declining';
    default:          return 'Insufficient data';
  }
}

export function velocityBlurb(result: WageGrowthVelocityResult): string {
  if (!result.band || result.yoyChange == null) {
    return 'Year-over-year velocity unavailable — the BLS OEWS series for this slice lacks two consecutive published medians.';
  }
  const pct = (result.yoyChange * 100).toFixed(1);
  const signed = result.yoyChange >= 0 ? `+${pct}%` : `${pct}%`;
  const span = result.latestYear && result.priorYear ? `${result.priorYear} → ${result.latestYear}` : '';
  switch (result.band) {
    case 'Surging':
      return `Median wage moved ${signed} ${span} — a Surging release pair. Often tight-supply or rapid-onboarding occupations.`;
    case 'Strong':
      return `Median wage moved ${signed} ${span} — Strong growth running ahead of recent broad nominal-pay trends.`;
    case 'Steady':
      return `Median wage moved ${signed} ${span} — Steady growth tracking typical nominal-pay trends in the published BLS releases.`;
    case 'Stagnant':
      return `Median wage moved ${signed} ${span} — Stagnant pair. Real-wage direction will depend on the prevailing inflation deflator.`;
    case 'Declining':
      return `Median wage moved ${signed} ${span} — Declining pair. SOC-code mix-shifts inside the cell are a common cause.`;
  }
}

export function velocityToneColor(band: WageGrowthVelocityBand | null): { bg: string; ring: string; text: string } {
  switch (band) {
    case 'Surging':   return { bg: 'bg-emerald-50', ring: 'ring-emerald-300', text: 'text-emerald-900' };
    case 'Strong':    return { bg: 'bg-teal-50',    ring: 'ring-teal-300',    text: 'text-teal-900'    };
    case 'Steady':    return { bg: 'bg-sky-50',     ring: 'ring-sky-300',     text: 'text-sky-900'     };
    case 'Stagnant':  return { bg: 'bg-amber-50',   ring: 'ring-amber-300',   text: 'text-amber-900'   };
    case 'Declining': return { bg: 'bg-rose-50',    ring: 'ring-rose-300',    text: 'text-rose-900'    };
    default:          return { bg: 'bg-slate-50',   ring: 'ring-slate-200',   text: 'text-slate-700'   };
  }
}
