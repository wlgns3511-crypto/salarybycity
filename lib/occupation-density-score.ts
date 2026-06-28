/**
 * OccupationDensityScore — 5-tier classifier of how thick an area's labor
 * market is for a given occupation, anchored on the cross-area employment
 * distribution published by BLS OEWS for that occupation.
 *
 * Why it matters: a high cost-adjusted real wage in an area with very low
 * employment for the same occupation is fragile — a single layoff cycle or
 * the closure of the dominant employer can erase the premium. Density adds
 * a second axis to the salary read so a relocation decision is not driven
 * by purchasing power alone.
 *
 * Inputs:
 *   - currentEmployment : BLS OEWS employment for the area × occupation cell
 *   - distribution      : the cross-area employment values for the same
 *                         occupation (one entry per area_type='M' metro that
 *                         published a wage for this SOC). The caller assembles
 *                         this from getOccupationEmploymentDistribution() in
 *                         lib/db.ts.
 *
 * The score is a percentile rank of `currentEmployment` inside `distribution`.
 *
 * Tier cutoffs (our heuristic — not a BLS classification):
 *   VeryThick  ≥ 95th percentile of cross-area employment for this occupation
 *   Thick      75th ≤ pct < 95th
 *   Average    25th ≤ pct < 75th
 *   Thin        5th ≤ pct < 25th
 *   VeryThin   < 5th
 *
 * Suppression behaviour: if `currentEmployment` is null (BLS small-cell
 * suppression) or the distribution has <10 published areas (insufficient
 * cross-area baseline), the classifier returns tier=null with evidence
 * explaining the gap rather than fabricating a percentile.
 */

export type OccupationDensityTier =
  | 'VeryThick'
  | 'Thick'
  | 'Average'
  | 'Thin'
  | 'VeryThin';

export interface OccupationDensityResult {
  tier: OccupationDensityTier | null;
  percentile: number | null;          // 0-100, the area's rank inside the distribution
  currentEmployment: number | null;
  distributionN: number;              // areas in the published cross-area baseline
  evidence: string;
  caveats: string[];
  confidence: 'high' | 'med' | 'low' | 'insufficient-data';
}

export const OCCUPATION_DENSITY_CUTOFFS = [
  { tier: 'VeryThick' as OccupationDensityTier, min: 95, rule: 'Top 5% of published BLS OEWS metros by employment for this occupation — a structurally thick labor market for the role' },
  { tier: 'Thick' as OccupationDensityTier, min: 75, rule: '75th–95th percentile — a thick market where multiple employers compete on this occupation' },
  { tier: 'Average' as OccupationDensityTier, min: 25, rule: '25th–75th percentile — a typical employment density for the occupation' },
  { tier: 'Thin' as OccupationDensityTier, min: 5,  rule: '5th–25th percentile — a thin market; concentrated risk in fewer employers' },
  { tier: 'VeryThin' as OccupationDensityTier, min: 0,  rule: 'Bottom 5% — a very thin market; the slice is fragile to a single-employer event' },
];

function tierFromPercentile(p: number): OccupationDensityTier {
  if (p >= 95) return 'VeryThick';
  if (p >= 75) return 'Thick';
  if (p >= 25) return 'Average';
  if (p >= 5)  return 'Thin';
  return 'VeryThin';
}

/**
 * Compute the cross-area percentile rank for an employment value.
 *
 * Uses the linear-interpolation convention (Wikipedia "exclusive" PR formula
 * adjusted to 0-100): the percentile is the share of distribution entries
 * strictly less than `value`, plus half the ties, divided by total N. The
 * result is clamped to [0, 100].
 */
function percentileRank(value: number, distribution: number[]): number {
  const n = distribution.length;
  if (n === 0) return 0;
  let below = 0;
  let equal = 0;
  for (const d of distribution) {
    if (d < value) below++;
    else if (d === value) equal++;
  }
  const raw = (below + 0.5 * equal) / n * 100;
  return Math.max(0, Math.min(100, raw));
}

export function computeOccupationDensity(
  currentEmployment: number | null | undefined,
  distribution: number[],
): OccupationDensityResult {
  const employed = currentEmployment ?? null;
  const dist = (distribution ?? []).filter((d): d is number => d != null && d > 0);
  const distributionN = dist.length;

  if (employed == null || distributionN < 10) {
    return {
      tier: null,
      percentile: null,
      currentEmployment: employed,
      distributionN,
      evidence: employed == null
        ? 'BLS OEWS suppressed the employment cell for this occupation × area combination.'
        : `Cross-area baseline only includes ${distributionN} published areas — under the 10-area floor needed for a density tier.`,
      caveats: [
        'BLS suppression rule: estimates with <5 employers in the cell are not published.',
        'Density compares against the metros that published employment for the same SOC — not against the universe of US metros.',
      ],
      confidence: 'insufficient-data',
    };
  }

  const percentile = percentileRank(employed, dist);
  const tier = tierFromPercentile(percentile);

  const evidence =
    `Employment ${employed.toLocaleString('en-US')} — ` +
    `${percentile.toFixed(1)}th percentile of ${distributionN} published metros for this occupation`;

  const caveats: string[] = [];
  if (distributionN < 30) {
    caveats.push(`Cross-area baseline is narrow (${distributionN} metros). Percentile rank is more sensitive to suppression than for occupations with broad geographic coverage.`);
  }
  caveats.push('Density is a count-of-jobs reading, not a hiring-rate reading. A thick market with low turnover can have fewer open roles than a thin market in a high-churn industry.');
  caveats.push('OEWS publishes a single point-in-time employment estimate per release; turnover and within-year dynamics are not captured.');

  const confidence: OccupationDensityResult['confidence'] =
    distributionN >= 100 ? 'high'
    : distributionN >= 30 ? 'med'
    : 'low';

  return {
    tier,
    percentile: Math.round(percentile * 10) / 10,
    currentEmployment: employed,
    distributionN,
    evidence,
    caveats,
    confidence,
  };
}

export function densityTierLabel(tier: OccupationDensityTier | null): string {
  switch (tier) {
    case 'VeryThick': return 'Very thick market';
    case 'Thick':     return 'Thick market';
    case 'Average':   return 'Average density';
    case 'Thin':      return 'Thin market';
    case 'VeryThin':  return 'Very thin market';
    default:          return 'Insufficient data';
  }
}

export function densityBlurb(result: OccupationDensityResult): string {
  if (!result.tier || result.percentile == null) {
    return 'Cross-area density unavailable — BLS suppression on this occupation × area cell or a narrow published baseline.';
  }
  const pctile = result.percentile.toFixed(0);
  switch (result.tier) {
    case 'VeryThick':
      return `Employment ranks at the ${pctile}th percentile of the ${result.distributionN} published metros for this occupation — a top-5% thick market for the role.`;
    case 'Thick':
      return `Employment ranks at the ${pctile}th percentile of ${result.distributionN} published metros — a thick labor market where multiple employers compete on this occupation.`;
    case 'Average':
      return `Employment ranks at the ${pctile}th percentile of ${result.distributionN} published metros — a typical employment density for this occupation.`;
    case 'Thin':
      return `Employment ranks at the ${pctile}th percentile of ${result.distributionN} published metros — a thin market; concentrated risk in fewer employers.`;
    case 'VeryThin':
      return `Employment ranks at the ${pctile}th percentile of ${result.distributionN} published metros — a very thin market; the slice is fragile to a single-employer event.`;
  }
}

export function densityToneColor(tier: OccupationDensityTier | null): { bg: string; ring: string; text: string } {
  switch (tier) {
    case 'VeryThick': return { bg: 'bg-emerald-50', ring: 'ring-emerald-300', text: 'text-emerald-900' };
    case 'Thick':     return { bg: 'bg-teal-50',    ring: 'ring-teal-300',    text: 'text-teal-900'    };
    case 'Average':   return { bg: 'bg-sky-50',     ring: 'ring-sky-300',     text: 'text-sky-900'     };
    case 'Thin':      return { bg: 'bg-amber-50',   ring: 'ring-amber-300',   text: 'text-amber-900'   };
    case 'VeryThin':  return { bg: 'bg-orange-50',  ring: 'ring-orange-300',  text: 'text-orange-900'  };
    default:          return { bg: 'bg-slate-50',   ring: 'ring-slate-200',   text: 'text-slate-700'   };
  }
}
