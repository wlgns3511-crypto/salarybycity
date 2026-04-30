/**
 * salary-cluster-insights.ts — salarybycity HCU 5-chunk patch (Layer 2 cluster).
 *
 * Layer 2 commentary for cluster pages (state hubs + list hubs).
 *
 * Pattern source: caloriewize lib/food-cluster-insights.ts → mapped to BLS
 * occupation/state schema.
 *
 * Two consumer surfaces:
 *   1. State pages (/state/[slug]/) — narrative built from StateFacts +
 *      cross-state context, slug-hashed by state code so each of the 51
 *      pages reads differently.
 *   2. List pages (/jobs/list/[type]/) — curated occupation lists like
 *      "highest-paying", "six-figure", "wide-pay-range", etc. Each list
 *      type has a profile (title, description, query, narrative slot),
 *      and the page renders ranked occupations with status-aware framing.
 */

import {
  pickVariant, fmtUSD, fmtUSDCompact, fmtCount, fmtRatio, ordinalSuffix, titleCase,
} from './content-helpers';
import type { StateFacts } from './salary-facts';
import type { WageWithOccupation } from './db';
import { getDb } from './db';

// ──────────────────────────────────────────────────────────────────
// 1) State cluster narratives (Layer 2 for /state/[slug]/)
// ──────────────────────────────────────────────────────────────────

export interface StateNarrative {
  headline: string;
  fact: string;
  context: string;
  implication: string;
}

/** Phrase the top-job-vs-national premium clause. */
function topJobNationalClause(facts: StateFacts): string {
  if (facts.topJobVsNational == null || !isFinite(facts.topJobVsNational)) return '';
  const r = facts.topJobVsNational;
  const pct = Math.round(Math.abs(r - 1) * 100);
  if (r >= 1.05) return `the top job in this state pays ${pct}% above the national median for the same occupation`;
  if (r <= 0.95) return `the top job here pays ${pct}% below the national median for the same occupation`;
  return `the top job here pays in line with the national median for that occupation`;
}

function spreadClauseState(facts: StateFacts): string {
  const r = facts.spreadRatio;
  if (!r || !isFinite(r) || r <= 0) return '';
  if (r >= 6) return `the highest-paying job pays ${fmtRatio(r)} as much as the lowest — an unusually wide in-state distribution`;
  if (r >= 3) return `the top-to-bottom pay multiple is ${fmtRatio(r)} — typical for a diversified state economy`;
  return `the top-to-bottom pay multiple is just ${fmtRatio(r)} — a relatively flat in-state distribution`;
}

export function getStateNarrative(stateSlug: string, stateName: string, facts: StateFacts): StateNarrative {
  const top = facts.topJobs[0];
  const topTitle = top?.occ_title || 'the highest-paying role';

  const headline = pickVariant(stateSlug, [
    `${stateName} Pay at a Glance: ${fmtUSDCompact(facts.avgMedian)} Average Median`,
    `What ${stateName} Pays Across ${fmtCount(facts.occCount)} Occupations`,
    `${stateName} Salary Profile — From ${fmtUSDCompact(facts.bottomMedian)} to ${fmtUSDCompact(facts.topMedian)}`,
    `${stateName} Pay Snapshot: Top, Bottom, and Average`,
  ], 1);

  const fact = pickVariant(stateSlug, [
    `Across ${fmtCount(facts.occCount)} BLS-tracked occupations in ${stateName}, the average median salary is ${fmtUSD(facts.avgMedian)}, with the top-paying role (${topTitle}) at ${fmtUSD(facts.topMedian)} and the bottom at ${fmtUSD(facts.bottomMedian)}. Total state employment is ${fmtCount(facts.totalEmployment)}.`,
    `${stateName} reports ${fmtCount(facts.totalEmployment)} workers across ${fmtCount(facts.occCount)} occupations per BLS OEWS 2024. Median pay averages ${fmtUSD(facts.avgMedian)}, ranging from ${fmtUSD(facts.bottomMedian)} at the low end to ${fmtUSD(facts.topMedian)} at the top.`,
    `In ${stateName}, BLS data shows a top-job median of ${fmtUSD(facts.topMedian)} (${topTitle}), a bottom-job median of ${fmtUSD(facts.bottomMedian)}, and a state-wide average of ${fmtUSD(facts.avgMedian)} across ${fmtCount(facts.occCount)} occupations.`,
  ], 2);

  const context = pickVariant(stateSlug, [
    `${spreadClauseState(facts)}; ${topJobNationalClause(facts)}.`,
    `Compared to other states, ${spreadClauseState(facts)} — and ${topJobNationalClause(facts)}. The mix of top-end specialty roles and broad-employment occupations explains most of the spread.`,
    `Within ${stateName}, ${spreadClauseState(facts)}. ${topJobNationalClause(facts) ? topJobNationalClause(facts).charAt(0).toUpperCase() + topJobNationalClause(facts).slice(1) : ''}.`,
  ], 3);

  const implication = pickVariant(stateSlug, [
    `For workers comparing offers, the average median is a baseline reference; the spread between bottom and top tells you how much occupational choice matters in ${stateName} specifically. Cost-of-living adjustments still apply on top.`,
    `If you're considering relocation, the table below shows where ${stateName} ranks for specific occupations relative to the national figure. The state-vs-national gap is often more decision-relevant than the headline state average.`,
    `Employers benchmarking pay should treat the average median as a centroid only — actual hire rates cluster around occupation-specific medians, which the rankings below break out individually.`,
  ], 4);

  return { headline, fact, context, implication };
}

// ──────────────────────────────────────────────────────────────────
// 2) List hub profiles (/jobs/list/[type]/)
// ──────────────────────────────────────────────────────────────────

export type ListType =
  | 'highest-paying'
  | 'six-figure'
  | 'mass-market-high-pay'
  | 'mid-market-broad'
  | 'entry-level'
  | 'top-stem'
  | 'top-healthcare'
  | 'largest-employment'
  | 'specialist-roles'
  | 'wide-pay-range'
  | 'compressed-pay'
  | 'top-management';

export interface ListProfile {
  type: ListType;
  slug: string;
  title: string;          // page <h1>
  metaTitle: string;      // <title>
  metaDescription: string;
  intro: string;          // 1-2 paragraph hook
  query: () => WageWithOccupation[];
  countCap: number;       // soft cap on items shown
}

// SQL helpers — each returns WageWithOccupation rows for the National row only.
const NATIONAL = `JOIN areas a ON a.area_code = w.area_code WHERE a.area_type = 'N' AND w.annual_median IS NOT NULL`;

function highestPaying(): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON o.soc_code = w.soc_code
    ${NATIONAL}
    ORDER BY w.annual_median DESC LIMIT 50
  `).all() as WageWithOccupation[];
}

function sixFigure(): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON o.soc_code = w.soc_code
    ${NATIONAL} AND w.annual_median >= 100000
    ORDER BY w.annual_median DESC LIMIT 60
  `).all() as WageWithOccupation[];
}

function massMarketHighPay(): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON o.soc_code = w.soc_code
    ${NATIONAL} AND w.annual_median >= 80000 AND w.employment >= 500000
    ORDER BY w.employment DESC LIMIT 40
  `).all() as WageWithOccupation[];
}

function midMarketBroad(): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON o.soc_code = w.soc_code
    ${NATIONAL} AND w.annual_median BETWEEN 50000 AND 80000 AND w.employment >= 250000
    ORDER BY w.employment DESC LIMIT 40
  `).all() as WageWithOccupation[];
}

function entryLevel(): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON o.soc_code = w.soc_code
    ${NATIONAL} AND w.annual_median < 35000 AND w.annual_p25 < 30000
    ORDER BY w.employment DESC LIMIT 40
  `).all() as WageWithOccupation[];
}

function byMajorGroupPrefix(prefix: string, limit = 40): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON o.soc_code = w.soc_code
    ${NATIONAL} AND o.major_group LIKE ?
    ORDER BY w.annual_median DESC LIMIT ?
  `).all(prefix + '%', limit) as WageWithOccupation[];
}

function topStem(): WageWithOccupation[] {
  // SOC major groups: 15 (Computer/Math), 17 (Architecture/Engineering), 19 (Life/Physical/Social Sci)
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON o.soc_code = w.soc_code
    ${NATIONAL} AND (o.major_group LIKE '15-%' OR o.major_group LIKE '17-%' OR o.major_group LIKE '19-%')
    ORDER BY w.annual_median DESC LIMIT 50
  `).all() as WageWithOccupation[];
}

function topHealthcare(): WageWithOccupation[] {
  return byMajorGroupPrefix('29-', 50);
}

function topManagement(): WageWithOccupation[] {
  return byMajorGroupPrefix('11-', 40);
}

function largestEmployment(): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON o.soc_code = w.soc_code
    ${NATIONAL} AND w.employment IS NOT NULL
    ORDER BY w.employment DESC LIMIT 40
  `).all() as WageWithOccupation[];
}

function specialistRoles(): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON o.soc_code = w.soc_code
    ${NATIONAL} AND w.annual_p90 >= 200000 AND w.employment < 50000
    ORDER BY w.annual_p90 DESC LIMIT 40
  `).all() as WageWithOccupation[];
}

function widePayRange(): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON o.soc_code = w.soc_code
    ${NATIONAL} AND w.annual_p10 > 0 AND (w.annual_p90 * 1.0 / w.annual_p10) >= 3.5
    ORDER BY (w.annual_p90 * 1.0 / w.annual_p10) DESC LIMIT 40
  `).all() as WageWithOccupation[];
}

function compressedPay(): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON o.soc_code = w.soc_code
    ${NATIONAL} AND w.annual_p10 > 0 AND w.annual_median > 0 AND (w.annual_p90 * 1.0 / w.annual_p10) <= 1.7
    ORDER BY w.annual_median DESC LIMIT 40
  `).all() as WageWithOccupation[];
}

const PROFILES: Record<ListType, Omit<ListProfile, 'query'> & { build: () => WageWithOccupation[] }> = {
  'highest-paying': {
    type: 'highest-paying', slug: 'highest-paying', countCap: 50,
    title: 'Highest-Paying Occupations in the US (2024 BLS)',
    metaTitle: '50 Highest-Paying Jobs in the US — BLS 2024 Median Pay',
    metaDescription: 'The 50 highest-paying occupations in the United States by national median salary, per BLS OEWS 2024 data. Includes employment, percentile pay, and SOC codes.',
    intro: 'Ranked by national median pay per BLS OEWS 2024, this list captures the occupations clearing the highest median salaries in the US. Most belong to specialized medical, executive, or technical fields where credential gates and tenure compound steeply over a career.',
    build: highestPaying,
  },
  'six-figure': {
    type: 'six-figure', slug: 'six-figure', countCap: 60,
    title: 'Jobs Paying Over $100,000 (Six-Figure Median)',
    metaTitle: 'Jobs Paying $100K+ — Six-Figure Median Salaries by BLS',
    metaDescription: 'Occupations with a national median above $100,000 per BLS OEWS 2024. Browse by employment scale and 90th-percentile pay ceiling.',
    intro: 'These occupations report a national median salary above $100,000 per BLS data. Some are mass-employment fields where the median itself is the broad-market rate; others are specialized roles whose hiring volume is small but pay sits well above the all-occupations baseline.',
    build: sixFigure,
  },
  'mass-market-high-pay': {
    type: 'mass-market-high-pay', slug: 'mass-market-high-pay', countCap: 40,
    title: 'High-Pay Mass-Market Occupations (Median ≥ $80K, 500K+ Workers)',
    metaTitle: 'High-Pay Jobs at Scale — Mass-Market Occupations Above $80K',
    metaDescription: 'Mass-employment occupations (500,000+ workers) with national medians above $80,000 per BLS OEWS 2024.',
    intro: 'The unusual combination: high pay and mass employment. Most well-paying occupations are narrow specialties; the roles below clear $80K median while still employing more than half a million workers nationally — a backbone of the US middle class.',
    build: massMarketHighPay,
  },
  'mid-market-broad': {
    type: 'mid-market-broad', slug: 'mid-market-broad', countCap: 40,
    title: 'Mid-Market Broad-Employment Occupations ($50K–$80K Median)',
    metaTitle: 'Mid-Market Jobs at Scale — $50K to $80K Median Pay',
    metaDescription: 'Broad-employment occupations (250,000+ workers) with median salaries between $50,000 and $80,000 per BLS OEWS 2024.',
    intro: 'Solid mid-band occupations: large enough to absorb new entrants, paid enough to anchor stable household incomes. These are the workhorses of the US labor market, with predictable pay scales and broad geographic distribution.',
    build: midMarketBroad,
  },
  'entry-level': {
    type: 'entry-level', slug: 'entry-level', countCap: 40,
    title: 'Entry-Tier Occupations (Median Under $35K)',
    metaTitle: 'Entry-Level Jobs in the US — Pay Under $35K Median',
    metaDescription: 'Entry-tier occupations with national medians below $35,000 and 25th-percentile pay below $30,000 per BLS OEWS 2024.',
    intro: 'Entry-tier roles per BLS OEWS — median below $35K, 25th-percentile pay below $30K. Pay scales are sensitive to local minimum-wage policy and tipping rules, and career mobility usually requires either certification ladders or sideways moves to higher-paid adjacent fields.',
    build: entryLevel,
  },
  'top-stem': {
    type: 'top-stem', slug: 'top-stem', countCap: 50,
    title: 'Top-Paying STEM Occupations',
    metaTitle: 'Top STEM Jobs by Pay — Engineering, Computing, Science',
    metaDescription: 'Highest-paying STEM occupations from BLS major groups 15 (Computer/Math), 17 (Engineering), and 19 (Sciences), per OEWS 2024.',
    intro: 'STEM occupations span computer/mathematical (15-xxxx), architecture/engineering (17-xxxx), and life/physical/social sciences (19-xxxx) per BLS classification. The roles below are ranked by national median pay across all three families.',
    build: topStem,
  },
  'top-healthcare': {
    type: 'top-healthcare', slug: 'top-healthcare', countCap: 50,
    title: 'Top-Paying Healthcare Practitioners',
    metaTitle: 'Top Healthcare Jobs by Pay — Practitioners, Specialists, Physicians',
    metaDescription: 'Healthcare practitioner and technical occupations (BLS major group 29) ranked by national median pay, per OEWS 2024.',
    intro: 'Healthcare practitioners and technical workers (BLS major group 29) include physicians, nurses, dentists, and licensed specialists. The list below ranks the highest-paid roles in this family — most require advanced degrees, board certification, or both.',
    build: topHealthcare,
  },
  'top-management': {
    type: 'top-management', slug: 'top-management', countCap: 40,
    title: 'Top-Paying Management Occupations',
    metaTitle: 'Top Management Jobs by Pay — Executives, Directors, Specialists',
    metaDescription: 'Management occupations (BLS major group 11) ranked by national median pay, per OEWS 2024.',
    intro: 'Management occupations (BLS major group 11) cover executive, operational, and specialist management roles. The list below ranks them by national median pay, with the upper tail dominated by chief-executive and specialist-management titles.',
    build: topManagement,
  },
  'largest-employment': {
    type: 'largest-employment', slug: 'largest-employment', countCap: 40,
    title: 'Largest US Occupations by Employment',
    metaTitle: 'Largest Occupations by Employment — Top 40 US Jobs by Headcount',
    metaDescription: 'The 40 largest US occupations by total employment, per BLS OEWS 2024. Includes median pay alongside national workforce counts.',
    intro: 'The 40 largest occupations in the US labor market, ranked by total employment per BLS OEWS 2024. Together they account for a meaningful share of total US employment — ranging from retail and food service through healthcare support and education.',
    build: largestEmployment,
  },
  'specialist-roles': {
    type: 'specialist-roles', slug: 'specialist-roles', countCap: 40,
    title: 'Specialist Roles (p90 ≥ $200K, Under 50K Employed)',
    metaTitle: 'Specialist Occupations — High p90 Pay, Small Workforce',
    metaDescription: 'Narrow-workforce occupations whose 90th-percentile pay clears $200,000 per BLS OEWS 2024.',
    intro: 'These are the rare-but-well-paid occupations: top-decile pay clears $200K while total US employment stays under 50,000. Most are clinical specialties, executive titles, or niche technical roles where the path in is long and the seats are limited.',
    build: specialistRoles,
  },
  'wide-pay-range': {
    type: 'wide-pay-range', slug: 'wide-pay-range', countCap: 40,
    title: 'Occupations With the Widest Pay Ranges',
    metaTitle: 'Widest Pay-Range Occupations — Long-Tail Salary Distributions',
    metaDescription: 'Occupations with the widest p90/p10 pay ratios per BLS OEWS 2024 — fields where experience, specialization, and employer choice drive dramatic pay differences.',
    intro: 'Pay distributions vary widely by occupation. The roles below show p90/p10 ratios of 3.5× or more — meaning top-decile workers earn at least three and a half times what bottom-decile workers earn in the same nominal job. Sales, finance-adjacent, and certain medical specialties dominate this list.',
    build: widePayRange,
  },
  'compressed-pay': {
    type: 'compressed-pay', slug: 'compressed-pay', countCap: 40,
    title: 'Occupations With Compressed Pay Ranges',
    metaTitle: 'Compressed Pay-Range Occupations — Narrow Salary Bands',
    metaDescription: 'Occupations with the narrowest p90/p10 pay ratios per BLS OEWS 2024 — fields with tight, standardized pay scales across percentiles.',
    intro: 'Some occupations have remarkably tight pay distributions: p90/p10 ratios at or below 1.7×. These typically reflect unionized fields, regulated occupations, or roles with credential-locked pay scales — where outsized earnings usually require leaving the title rather than negotiating within it.',
    build: compressedPay,
  },
};

export function getAllListTypes(): ListType[] {
  return Object.keys(PROFILES) as ListType[];
}

export function getListProfile(type: ListType): ListProfile | undefined {
  const p = PROFILES[type];
  if (!p) return undefined;
  return { ...p, query: p.build };
}

// ──────────────────────────────────────────────────────────────────
// Layer 2 narrative for list pages — slug-hashed so adjacent lists
// don't read identically.
// ──────────────────────────────────────────────────────────────────

export interface ListNarrative {
  headline: string;
  context: string;
  implication: string;
}

export function getListNarrative(type: ListType, rows: WageWithOccupation[]): ListNarrative {
  const top = rows[0];
  const last = rows[rows.length - 1];
  const topPay = top?.annual_median || 0;
  const lastPay = last?.annual_median || 0;
  const totalEmp = rows.reduce((s, r) => s + (r.employment || 0), 0);
  const profile = PROFILES[type];

  const headline = pickVariant(type, [
    `${profile.title}: ${rows.length} Occupations`,
    `Top to Bottom: ${fmtUSDCompact(topPay)} → ${fmtUSDCompact(lastPay)}`,
    `${rows.length} Roles, ${fmtCount(totalEmp)} Combined Workers`,
  ], 1);

  const context = pickVariant(type, [
    `Across this list of ${rows.length} occupations, total employment reaches ${fmtCount(totalEmp)} workers — concentrated in ${top?.occ_title || 'the top role'} at the top end. Median pay ranges from ${fmtUSD(topPay)} down to ${fmtUSD(lastPay)}.`,
    `The ranking spans ${rows.length} BLS-tracked occupations covering ${fmtCount(totalEmp)} workers in total. The top job (${top?.occ_title || 'unnamed'}) pays ${fmtUSD(topPay)} at the median; the lowest-ranked entry pays ${fmtUSD(lastPay)}.`,
    `${rows.length} occupations make this list, with combined US employment of ${fmtCount(totalEmp)}. The pay band runs ${fmtUSD(lastPay)}–${fmtUSD(topPay)} at the median.`,
  ], 2);

  const implication = pickVariant(type, [
    `The cards below link through to per-occupation detail pages with metro breakdowns, percentile pay, and ranking against the same role's national median.`,
    `Each occupation card opens a detail page covering metro premiums, percentile pay (p10/p25/p75/p90), and where the role ranks within its SOC major group.`,
    `Click any title for the full per-occupation profile — metro breakdowns, percentile pay, and major-group ranking.`,
  ], 3);

  return { headline, context, implication };
}

// ──────────────────────────────────────────────────────────────────
// Index page narrative (for /jobs/list/ root).
// ──────────────────────────────────────────────────────────────────

export interface ListIndexNarrative {
  intro: string;
  cards: { type: ListType; title: string; description: string }[];
}

export function getListIndexNarrative(): ListIndexNarrative {
  return {
    intro: 'Curated rankings of US occupations by pay, employment, and pay-distribution profile. Each list draws on BLS OEWS 2024 data and links through to per-occupation detail pages.',
    cards: getAllListTypes().map((t) => ({
      type: t,
      title: PROFILES[t].title,
      description: PROFILES[t].intro.split('.')[0] + '.',
    })),
  };
}

// ──────────────────────────────────────────────────────────────────
// Helper: ordinal-rank label used on list page rows
// ──────────────────────────────────────────────────────────────────

export function rankLabel(i: number): string {
  return `#${ordinalSuffix(i + 1).replace(/\d+/, String(i + 1))}`;
}

// Re-export titleCase since list page imports it via this module
export { titleCase };
