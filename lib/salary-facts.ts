/**
 * salary-facts.ts — salarybycity HCU 5-chunk patch (2026-04-28).
 *
 * Layer 1: SQL-derived facts + occupation status classification.
 *
 * Pattern source: caloriewize lib/food-facts.ts → adapted to BLS OEWS schema.
 *
 * Each occupation gets:
 *   • Percentile context (p10/p25/median/p75/p90, p90/p10 ratio)
 *   • National-relative band (vs $48K national median reference)
 *   • Top metro premium (top metro median ÷ national)
 *   • Employment scale (TINY/SMALL/MID/LARGE/MASS)
 *   • Major-group rank (where this occ falls inside its SOC family)
 *   • Status (one of 9 buckets, evaluated in priority order)
 *
 * The Status drives which commentary builder gets called. Each status has
 * 4 slots (headline / fact / context / implication) × 3-4 variants × slug-hash.
 */

import { getDb, getNationalWage, type Occupation, type WageData, type WageWithArea, type WageWithOccupation } from './db';

const NATIONAL_MEDIAN_REFERENCE = 48060; // 2024 BLS all-occupations national median

// ──────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────

export type OccupationStatus =
  | 'top_specialist'         // p90 ≥ $200K, employment < 50K, narrow specialty
  | 'six_figure_broad'       // median ≥ $100K, employment ≥ 100K (broad high-pay)
  | 'high_pay_mass_market'   // median ≥ $80K, employment ≥ 500K (mass mid-high)
  | 'mid_market_solid'       // median $50K–$80K, employment ≥ 250K
  | 'wide_pay_range'         // p90/p10 ratio ≥ 3.5 (long tail roles)
  | 'narrow_pay_range'       // p90/p10 ratio ≤ 1.7 (compressed pay band)
  | 'metro_premium_heavy'    // top metro ≥ 1.5× national (geographically skewed)
  | 'entry_level_low'        // median < $35K, p25 < $30K (entry tier)
  | 'standard_occupation';   // fallback bucket

export type EmploymentBand = 'tiny' | 'small' | 'mid' | 'large' | 'mass';

export interface OccupationFacts {
  occ: Occupation;
  wage: WageData;
  status: OccupationStatus;
  // Percentile context
  median: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  spreadRatio: number;        // p90 / p10
  // Reference comparisons
  vsNationalMedian: number;   // median / 48060 (e.g. 1.85 = 85% above national average)
  vsNationalDelta: number;    // median - 48060 (signed dollars)
  // Employment context
  employment: number;
  employmentBand: EmploymentBand;
  // Metro premium (uses top metro if available)
  topMetroMedian: number | null;
  topMetroPremium: number | null;  // topMetro / national, e.g. 1.42
  topMetroName: string | null;
  // Group context
  majorGroupRank: number;     // 1 = highest median in group
  majorGroupSize: number;
}

// ──────────────────────────────────────────────────────────────────
// Cached aggregates (avoid N² SQL during prerender)
// ──────────────────────────────────────────────────────────────────

let _majorGroupRanks: Map<string, { rank: number; size: number }> | null = null;

function buildMajorGroupRanks(): Map<string, { rank: number; size: number }> {
  if (_majorGroupRanks) return _majorGroupRanks;
  const rows = getDb().prepare(`
    SELECT o.soc_code, o.major_group, w.annual_median
    FROM occupations o
    JOIN wages w ON w.soc_code = o.soc_code
    JOIN areas a ON a.area_code = w.area_code
    WHERE a.area_type = 'N' AND w.annual_median IS NOT NULL
    ORDER BY o.major_group, w.annual_median DESC
  `).all() as { soc_code: string; major_group: string; annual_median: number }[];

  const groups: Record<string, string[]> = {};
  for (const r of rows) {
    if (!groups[r.major_group]) groups[r.major_group] = [];
    groups[r.major_group].push(r.soc_code);
  }
  const map = new Map<string, { rank: number; size: number }>();
  for (const g of Object.keys(groups)) {
    const list = groups[g];
    list.forEach((soc, i) => map.set(soc, { rank: i + 1, size: list.length }));
  }
  _majorGroupRanks = map;
  return map;
}

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

function classifyEmployment(emp: number): EmploymentBand {
  if (emp >= 1_000_000) return 'mass';
  if (emp >= 250_000) return 'large';
  if (emp >= 50_000) return 'mid';
  if (emp >= 10_000) return 'small';
  return 'tiny';
}

function classifyStatus(facts: Omit<OccupationFacts, 'status'>): OccupationStatus {
  const { p90, median, p25, employment, spreadRatio, topMetroPremium } = facts;

  // Priority order: most distinctive first.
  if (p90 >= 200_000 && employment < 50_000) return 'top_specialist';
  if (median >= 100_000 && employment >= 100_000) return 'six_figure_broad';
  if (median >= 80_000 && employment >= 500_000) return 'high_pay_mass_market';
  if (median < 35_000 && p25 < 30_000) return 'entry_level_low';
  if (spreadRatio >= 3.5) return 'wide_pay_range';
  if (spreadRatio <= 1.7 && median > 0) return 'narrow_pay_range';
  if (topMetroPremium != null && topMetroPremium >= 1.5) return 'metro_premium_heavy';
  if (median >= 50_000 && median < 80_000 && employment >= 250_000) return 'mid_market_solid';
  return 'standard_occupation';
}

// ──────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────

export function getOccupationFacts(
  occ: Occupation,
  nationalWage: WageData,
  topCities: WageWithArea[],
): OccupationFacts | null {
  if (!nationalWage.annual_median || !nationalWage.annual_p10 || !nationalWage.annual_p90) return null;

  const median = nationalWage.annual_median;
  const p10 = nationalWage.annual_p10;
  const p25 = nationalWage.annual_p25 ?? p10;
  const p75 = nationalWage.annual_p75 ?? median;
  const p90 = nationalWage.annual_p90;
  const employment = nationalWage.employment ?? 0;
  const spreadRatio = p10 > 0 ? p90 / p10 : 1;

  const groupInfo = buildMajorGroupRanks().get(occ.soc_code) ?? { rank: 0, size: 0 };

  let topMetroMedian: number | null = null;
  let topMetroPremium: number | null = null;
  let topMetroName: string | null = null;
  if (topCities.length > 0 && topCities[0].annual_median) {
    topMetroMedian = topCities[0].annual_median;
    topMetroPremium = topMetroMedian / median;
    topMetroName = topCities[0].area_title;
  }

  const partial = {
    occ,
    wage: nationalWage,
    median,
    p10,
    p25,
    p75,
    p90,
    spreadRatio,
    vsNationalMedian: median / NATIONAL_MEDIAN_REFERENCE,
    vsNationalDelta: median - NATIONAL_MEDIAN_REFERENCE,
    employment,
    employmentBand: classifyEmployment(employment),
    topMetroMedian,
    topMetroPremium,
    topMetroName,
    majorGroupRank: groupInfo.rank,
    majorGroupSize: groupInfo.size,
  };

  return { ...partial, status: classifyStatus(partial) };
}

// ──────────────────────────────────────────────────────────────────
// State-level facts (for /state/[slug]/ Layer 2)
// ──────────────────────────────────────────────────────────────────

export interface StateFacts {
  state: string;
  topJobs: WageWithOccupation[];
  topMedian: number;
  bottomMedian: number;
  avgMedian: number;
  totalEmployment: number;
  occCount: number;
  // Cross-state context
  topJobVsNational: number | null;  // top job median ÷ national same-occ median
  // Pay distribution within state
  spreadRatio: number;              // top median ÷ bottom median (within state)
}

export function getStateFacts(
  stateCode: string,
  topJobs: WageWithOccupation[],
  summary: { total_employment: number; avg_median_salary: number; top_median: number; bottom_median: number; occ_count: number },
): StateFacts {
  const spreadRatio = summary.bottom_median > 0 ? summary.top_median / summary.bottom_median : 1;
  let topJobVsNational: number | null = null;
  if (topJobs.length > 0 && topJobs[0].annual_median) {
    const nat = getNationalWage(topJobs[0].soc_code);
    if (nat?.annual_median) topJobVsNational = topJobs[0].annual_median / nat.annual_median;
  }

  return {
    state: stateCode,
    topJobs,
    topMedian: summary.top_median,
    bottomMedian: summary.bottom_median,
    avgMedian: summary.avg_median_salary,
    totalEmployment: summary.total_employment,
    occCount: summary.occ_count,
    topJobVsNational,
    spreadRatio,
  };
}
