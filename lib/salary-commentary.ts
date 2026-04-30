/**
 * salary-commentary.ts — salarybycity HCU 5-chunk patch (Layer 2 v2).
 *
 * Per-occupation narrative built from OccupationFacts. 9 statuses × 4 slots
 * × 3-4 variants × slug-hash → ~120 distinct strings per occupation, deterministic
 * per slug but corpus-wide diverse. Defeats template detection.
 *
 * Pattern source: caloriewize lib/food-commentary.ts → salary-domain mapping.
 *
 * Each OccupationCommentary returns:
 *   - headline    — section title, status-inflected
 *   - fact        — FACT paragraph (raw numbers + percentile context)
 *   - context     — INTERPRETATION paragraph (peer comparison + signal)
 *   - implication — IMPLICATION paragraph (career/negotiation/geography use)
 *
 * Page consumes these as four distinct visual blocks. Avoid cross-paragraph
 * stuffing — each slot has one job.
 */

import type { OccupationFacts, OccupationStatus } from './salary-facts';
import {
  pickVariant, fmtUSD, fmtUSDCompact, fmtRatio, fmtCount, ordinalSuffix,
} from './content-helpers';

export interface OccupationCommentary {
  headline: string;
  fact: string;
  context: string;
  implication: string;
  status: OccupationStatus;
}

// ──────────────────────────────────────────────────────────────────
// Helpers local to commentary
// ──────────────────────────────────────────────────────────────────

function groupLabel(occ: { major_group_title?: string | null; major_group?: string | null }): string {
  const t = occ.major_group_title || occ.major_group;
  if (!t) return 'this occupation family';
  // BLS major-group titles already read well; lowercase to fit mid-sentence.
  return t.toLowerCase();
}

/** "ranks 7th of 42 by median pay" */
function rankClause(facts: OccupationFacts): string {
  if (!facts.majorGroupRank || !facts.majorGroupSize) return '';
  return `ranks ${ordinalSuffix(facts.majorGroupRank)} of ${facts.majorGroupSize} by median pay within ${groupLabel(facts.occ)}`;
}

/** "national median sits 73% above the all-occupations baseline" */
function nationalClause(facts: OccupationFacts): string {
  const m = facts.vsNationalMedian;
  if (!m || !isFinite(m)) return '';
  const pct = Math.round(Math.abs(m - 1) * 100);
  if (m >= 1.05) return `national median sits ${pct}% above the $48,060 all-occupations baseline`;
  if (m <= 0.95) return `national median falls ${pct}% below the $48,060 all-occupations baseline`;
  return `national median tracks the all-occupations baseline closely`;
}

/** Top-metro phrasing or empty string when not available. */
function metroClause(facts: OccupationFacts): string {
  if (!facts.topMetroMedian || !facts.topMetroPremium || !facts.topMetroName) return '';
  const prem = Math.round((facts.topMetroPremium - 1) * 100);
  if (prem >= 5) return `${facts.topMetroName} pays roughly ${prem}% more than the national median`;
  if (prem <= -5) return `${facts.topMetroName} pays roughly ${Math.abs(prem)}% less than the national median`;
  return `${facts.topMetroName} pays in line with the national median`;
}

/** Spread phrase: "the p90/p10 spread is 4.2× — a wide pay range". */
function spreadClause(facts: OccupationFacts): string {
  const r = facts.spreadRatio;
  if (!r || !isFinite(r) || r <= 0) return '';
  if (r >= 3.5) return `the p90/p10 spread is ${fmtRatio(r)} — a wide pay range that rewards experience and specialization`;
  if (r <= 1.7) return `the p90/p10 spread is ${fmtRatio(r)} — a compressed pay range with limited upside above the median`;
  return `the p90/p10 spread is ${fmtRatio(r)} — a typical experience-driven pay curve`;
}

// ──────────────────────────────────────────────────────────────────
// Status builders — one per OccupationStatus
// ──────────────────────────────────────────────────────────────────

function build_top_specialist(facts: OccupationFacts): OccupationCommentary {
  const slug = facts.occ.slug;
  const { occ, median, p90, employment } = facts;

  const headline = pickVariant(slug, [
    `Top-decile specialist: ${fmtUSDCompact(p90)} at p90, only ${fmtCount(employment)} employed`,
    `A narrow, top-paying specialty`,
    `High pay, small workforce — a specialist role`,
    `${fmtUSDCompact(p90)} at the 90th percentile in a tight labor pool`,
  ], 1);

  const fact = pickVariant(slug, [
    `${occ.title} carries a national median of ${fmtUSD(median)} with a 90th-percentile pay of ${fmtUSD(p90)}. Total US employment is just ${fmtCount(employment)}, marking it as a narrow specialty rather than a broad-market job. ${rankClause(facts)}.`,
    `Per BLS OEWS, ${occ.title} pays ${fmtUSD(median)} at the median and reaches ${fmtUSD(p90)} at the 90th percentile. Fewer than ${fmtCount(employment)} workers hold this title nationally — a thin pool that consistently signals specialization.`,
    `${occ.title} clears ${fmtUSD(p90)} at p90 with a national median of ${fmtUSD(median)}. Only ${fmtCount(employment)} are employed across the country, which puts this role in the rare-but-well-paid quadrant of the BLS occupation map.`,
  ], 2);

  const context = pickVariant(slug, [
    `Roles at this density typically require advanced credentials, multi-year specialization, or rare technical experience. ${nationalClause(facts)}, and ${spreadClause(facts)}.`,
    `Top-specialist occupations tend to cluster in medicine, niche engineering, executive specialties, and regulated technical fields. Employment caps stay low because demand is bounded by specific institutional needs. ${metroClause(facts)}.`,
    `When p90 clears six figures and headcount stays under 50,000, the labor market behaves more like a hiring tournament than a broad job market — pay tracks scarcity, not throughput. ${nationalClause(facts)}.`,
  ], 3);

  const implication = pickVariant(slug, [
    `For candidates: the path in is usually long (graduate degree, board certification, or a decade of accumulated specialization). The payoff is the upper-end pay; the constraint is the limited number of seats nationally.`,
    `For employers: budgeting against the 75th–90th percentile is closer to market reality than the median, since competing offers in this band tend to come from the same handful of organizations.`,
    `Geographic mobility matters less here than at scale roles — the specialty is the leverage. Negotiation tends to happen on total comp (sign-on, equity, retention) rather than base alone.`,
  ], 4);

  return { headline, fact, context, implication, status: 'top_specialist' };
}

function build_six_figure_broad(facts: OccupationFacts): OccupationCommentary {
  const slug = facts.occ.slug;
  const { occ, median, p90, employment } = facts;

  const headline = pickVariant(slug, [
    `Six-figure median across a ${fmtCount(employment)}-strong workforce`,
    `A broad high-pay occupation`,
    `${fmtUSDCompact(median)} median with mass employment`,
  ], 1);

  const fact = pickVariant(slug, [
    `${occ.title} posts a national median of ${fmtUSD(median)} with ${fmtCount(employment)} employed across the US. The 90th percentile reaches ${fmtUSD(p90)}. ${rankClause(facts)}.`,
    `BLS OEWS reports a ${fmtUSD(median)} median for ${occ.title}, with employment at ${fmtCount(employment)} nationally. The role pays ${fmtUSD(p90)} at p90 — both broad in scale and well above average.`,
    `Per 100 hires nationally, ${occ.title} workers earn ${fmtUSD(median)} at the median. The occupation employs ${fmtCount(employment)} workers and reaches ${fmtUSD(p90)} at the 90th percentile.`,
  ], 2);

  const context = pickVariant(slug, [
    `Six-figure-with-scale occupations are unusual: most fields trade pay for headcount or vice versa. ${nationalClause(facts)}, and ${spreadClause(facts)}.`,
    `Roles that combine 100K+ median pay with 100K+ employment typically appear in management, advanced engineering, and large professional-service categories. ${metroClause(facts)}.`,
    `When pay and headcount both clear six figures, the occupation is a mainstream career destination rather than a specialty — broad demand, broadly funded. ${nationalClause(facts)}.`,
  ], 3);

  const implication = pickVariant(slug, [
    `For candidates: the wide hiring volume means more entry points and lateral mobility than specialist roles offer. Base pay above the median is reachable through location, employer tier, and credentialing.`,
    `For salary negotiation: the spread between the 50th and 90th percentile is the bargaining range. Hitting the 75th percentile is realistic with 5–10 years of relevant experience.`,
    `Geographic premium matters more here than at the specialist tier — top metros routinely pay 15–30% above national median in this band.`,
  ], 4);

  return { headline, fact, context, implication, status: 'six_figure_broad' };
}

function build_high_pay_mass_market(facts: OccupationFacts): OccupationCommentary {
  const slug = facts.occ.slug;
  const { occ, median, p90, employment } = facts;

  const headline = pickVariant(slug, [
    `High pay at mass scale: ${fmtUSDCompact(median)} median across ${fmtCount(employment)} jobs`,
    `A mass-market occupation paying above $80K`,
    `${fmtCount(employment)} employed at a ${fmtUSDCompact(median)} median`,
  ], 1);

  const fact = pickVariant(slug, [
    `${occ.title} employs ${fmtCount(employment)} workers nationally at a median of ${fmtUSD(median)}. The 90th percentile reaches ${fmtUSD(p90)}. ${rankClause(facts)}.`,
    `Per BLS, ${occ.title} carries a ${fmtUSD(median)} median across ${fmtCount(employment)} workers — high-pay territory at full mass-market scale. p90 sits at ${fmtUSD(p90)}.`,
    `${occ.title} represents one of the larger high-pay occupations in the BLS catalog: ${fmtCount(employment)} jobs at a ${fmtUSD(median)} median, with ${fmtUSD(p90)} at p90.`,
  ], 2);

  const context = pickVariant(slug, [
    `Mass-scale, high-pay roles are economic backbones — large enough to absorb new entrants, paid enough to anchor middle-class outcomes. ${nationalClause(facts)}, and ${spreadClause(facts)}.`,
    `Occupations with 500K+ employment and 80K+ median typically span healthcare, specialized trades, and core technical functions. ${metroClause(facts)}.`,
    `The combination of breadth and pay means this occupation tends to set the wage benchmark for adjacent fields — recruiters use it as a comparison point. ${nationalClause(facts)}.`,
  ], 3);

  const implication = pickVariant(slug, [
    `For candidates: expect a structured hiring market with credential gates and predictable pay bands. Location and employer size typically explain most of the spread.`,
    `For long-term planning: mass-market high-pay roles are durable through cycles — large employer base means hiring rarely stops entirely, even in downturns.`,
    `Negotiating up from the median takes either credentials, geographic flexibility, or a high-leverage employer. The 75th percentile is a realistic target with 7+ years experience.`,
  ], 4);

  return { headline, fact, context, implication, status: 'high_pay_mass_market' };
}

function build_mid_market_solid(facts: OccupationFacts): OccupationCommentary {
  const slug = facts.occ.slug;
  const { occ, median, p25, p75, employment } = facts;

  const headline = pickVariant(slug, [
    `Mid-market median: ${fmtUSDCompact(median)} across ${fmtCount(employment)} jobs`,
    `A solid mid-range occupation`,
    `${fmtUSDCompact(median)} median with broad employment`,
  ], 1);

  const fact = pickVariant(slug, [
    `${occ.title} pays ${fmtUSD(median)} at the median across ${fmtCount(employment)} workers nationally. The middle 50% earn between ${fmtUSD(p25)} and ${fmtUSD(p75)}. ${rankClause(facts)}.`,
    `Per BLS OEWS, ${occ.title} employs ${fmtCount(employment)} at a ${fmtUSD(median)} median — solidly mid-range. The interquartile range runs ${fmtUSD(p25)} to ${fmtUSD(p75)}.`,
    `${occ.title} sits at ${fmtUSD(median)} median pay with ${fmtCount(employment)} employed. The 25th percentile is ${fmtUSD(p25)}, the 75th is ${fmtUSD(p75)} — a typical middle-band distribution.`,
  ], 2);

  const context = pickVariant(slug, [
    `Mid-range, large-headcount occupations are the workhorses of the US labor market — neither premium nor entry-level. ${nationalClause(facts)}, and ${spreadClause(facts)}.`,
    `These roles tend to have stable demand, defined credentials, and predictable promotion paths. ${metroClause(facts)}.`,
    `When the IQR is tight relative to the median, pay differentiation comes mostly from employer, sector, and metro — not from individual performance leverage. ${nationalClause(facts)}.`,
  ], 3);

  const implication = pickVariant(slug, [
    `For candidates: pay band is well-defined; outsized earnings usually come from moving up to a senior or management title rather than from negotiation alone.`,
    `For long-term planning: cost-of-living matching matters more than chasing the 90th percentile — a $60K job in a mid-cost metro often beats a $75K job in a high-cost one.`,
    `Cross-occupation moves into adjacent higher-paid fields (with retraining) is a common path to break above the IQR ceiling.`,
  ], 4);

  return { headline, fact, context, implication, status: 'mid_market_solid' };
}

function build_wide_pay_range(facts: OccupationFacts): OccupationCommentary {
  const slug = facts.occ.slug;
  const { occ, median, p10, p90, spreadRatio } = facts;

  const headline = pickVariant(slug, [
    `Wide pay range: ${fmtRatio(spreadRatio)} spread between p10 and p90`,
    `A long-tail occupation with high upside`,
    `Pay spans ${fmtUSDCompact(p10)} to ${fmtUSDCompact(p90)}`,
  ], 1);

  const fact = pickVariant(slug, [
    `${occ.title} shows a wide pay distribution: ${fmtUSD(p10)} at the 10th percentile, ${fmtUSD(median)} at the median, and ${fmtUSD(p90)} at the 90th. The p90/p10 ratio is ${fmtRatio(spreadRatio)}. ${rankClause(facts)}.`,
    `Per BLS, ${occ.title} pay ranges from ${fmtUSD(p10)} (p10) to ${fmtUSD(p90)} (p90) — a ${fmtRatio(spreadRatio)} spread. Median sits at ${fmtUSD(median)}.`,
    `${occ.title} carries one of the wider pay distributions in its category: bottom-decile workers earn ${fmtUSD(p10)}, top-decile workers ${fmtUSD(p90)} — a ${fmtRatio(spreadRatio)} multiple. The median is ${fmtUSD(median)}.`,
  ], 2);

  const context = pickVariant(slug, [
    `Wide-spread occupations reward experience, specialization, employer choice, or geographic concentration heavily. The same job title produces dramatically different pay outcomes. ${metroClause(facts)}.`,
    `When the p90/p10 ratio clears 3.5×, the title alone undersells the variance — entry positions and senior positions effectively look like different jobs. ${nationalClause(facts)}.`,
    `Occupations like this often combine entry-level apprenticeship rates with high-leverage senior compensation: sales, certain medical roles, finance-adjacent positions, and creative/professional services. ${nationalClause(facts)}.`,
  ], 3);

  const implication = pickVariant(slug, [
    `For candidates: the headline median understates the upside. Aim for the trajectory toward p75 and p90 rather than benchmarking against median when assessing long-term opportunity.`,
    `For early-career planning: choosing the right employer, sub-specialty, or metro early can compound into the upper-decile bracket faster than waiting for tenure.`,
    `For employers: posting median pay in this band signals "entry"; posting above the 75th percentile is what attracts the upper tail of the workforce.`,
  ], 4);

  return { headline, fact, context, implication, status: 'wide_pay_range' };
}

function build_narrow_pay_range(facts: OccupationFacts): OccupationCommentary {
  const slug = facts.occ.slug;
  const { occ, median, p10, p90, spreadRatio } = facts;

  const headline = pickVariant(slug, [
    `Compressed pay range: ${fmtRatio(spreadRatio)} between p10 and p90`,
    `A narrow-band occupation`,
    `Limited spread above the median`,
  ], 1);

  const fact = pickVariant(slug, [
    `${occ.title} pays ${fmtUSD(p10)} at p10 and ${fmtUSD(p90)} at p90 — a tight ${fmtRatio(spreadRatio)} range. Median is ${fmtUSD(median)}. ${rankClause(facts)}.`,
    `Per BLS, ${occ.title} shows one of the more compressed pay distributions in its category: 10th percentile ${fmtUSD(p10)}, 90th percentile ${fmtUSD(p90)}. The p90/p10 ratio is just ${fmtRatio(spreadRatio)}.`,
    `${occ.title} carries a narrow pay band — ${fmtUSD(p10)} to ${fmtUSD(p90)} from bottom to top decile. Median sits near the middle at ${fmtUSD(median)}.`,
  ], 2);

  const context = pickVariant(slug, [
    `Compressed pay ranges typically appear in unionized roles, regulated occupations, or fields where credentialing locks pay to standardized scales. ${nationalClause(facts)}.`,
    `When the p90/p10 ratio falls below 1.7×, individual performance has limited room to move pay. Pay differentiation usually comes from tenure steps, geographic differentials, or employer category. ${metroClause(facts)}.`,
    `Tight bands often signal a mature, well-defined occupation — pay norms are settled, hiring is structured, and outliers are rare. ${nationalClause(facts)}.`,
  ], 3);

  const implication = pickVariant(slug, [
    `For candidates: outsized earnings typically require leaving the title — either into management, an adjacent specialty, or a higher-paid sector with overlapping skills.`,
    `For long-term planning: predictable pay makes financial modeling easier but caps upside. Tenure steps and pension/benefits structure are often the real lever, not negotiation.`,
    `For employers: top-of-band offers don't move much above the 75th percentile, so pay-based recruiting works best at the entry tier; retention leans on benefits and stability.`,
  ], 4);

  return { headline, fact, context, implication, status: 'narrow_pay_range' };
}

function build_metro_premium_heavy(facts: OccupationFacts): OccupationCommentary {
  const slug = facts.occ.slug;
  const { occ, median, topMetroMedian, topMetroPremium, topMetroName } = facts;
  const premPct = topMetroPremium ? Math.round((topMetroPremium - 1) * 100) : 0;

  const headline = pickVariant(slug, [
    `Metro-driven pay: ${topMetroName} runs ${premPct}% above national median`,
    `A geographically concentrated occupation`,
    `${topMetroName} pays a ${fmtRatio(topMetroPremium)} premium`,
  ], 1);

  const fact = pickVariant(slug, [
    `${occ.title} pays ${fmtUSD(median)} at the national median, but ${topMetroName} pushes that to ${fmtUSD(topMetroMedian)} — a ${fmtRatio(topMetroPremium)} multiple. ${rankClause(facts)}.`,
    `Per BLS OEWS, ${occ.title} workers in ${topMetroName} earn ${fmtUSD(topMetroMedian)} at the median — roughly ${premPct}% above the ${fmtUSD(median)} national figure.`,
    `${occ.title} shows a strong metro premium: national median ${fmtUSD(median)}, ${topMetroName} median ${fmtUSD(topMetroMedian)}. The ${fmtRatio(topMetroPremium)} ratio is well above the 1.0× baseline.`,
  ], 2);

  const context = pickVariant(slug, [
    `Geographic premiums of 1.5× and above typically indicate either a concentrated employer base in one region, or cost-of-living-adjusted demand. ${nationalClause(facts)}, and ${spreadClause(facts)}.`,
    `When the top metro pays a heavy premium, location is doing more work than tenure or specialization in determining pay outcomes — a candidate's biggest decision is where to base.`,
    `High-premium metros for an occupation usually combine three things: a critical mass of employers, regulatory or industry concentration, and high local cost of living that pulls wages upward.`,
  ], 3);

  const implication = pickVariant(slug, [
    `For candidates: relocating to a top-paying metro can outperform years of tenure-based raises elsewhere — but cost of living typically claws back a meaningful portion of the headline gain.`,
    `For remote workers: when employers index pay by metro, the premium can sometimes follow the role rather than the worker — worth confirming employer pay-policy before relocating.`,
    `For long-term planning: metro premium tends to be sticky over decades, but cost-adjusted "real" premium often shrinks to 5–15% net after housing and taxes.`,
  ], 4);

  return { headline, fact, context, implication, status: 'metro_premium_heavy' };
}

function build_entry_level_low(facts: OccupationFacts): OccupationCommentary {
  const slug = facts.occ.slug;
  const { occ, median, p10, p25, p90 } = facts;

  const headline = pickVariant(slug, [
    `Entry-tier pay: ${fmtUSDCompact(median)} median, p25 below ${fmtUSDCompact(p25)}`,
    `An entry-level occupation`,
    `Pay starts low — upside ceiling is ${fmtUSDCompact(p90)}`,
  ], 1);

  const fact = pickVariant(slug, [
    `${occ.title} pays ${fmtUSD(median)} at the median, with the 10th percentile at ${fmtUSD(p10)} and the 25th at ${fmtUSD(p25)}. Top-decile workers reach ${fmtUSD(p90)}. ${rankClause(facts)}.`,
    `Per BLS, ${occ.title} sits in the entry-pay tier: ${fmtUSD(median)} median, ${fmtUSD(p25)} at p25, ${fmtUSD(p90)} ceiling at p90.`,
    `${occ.title} is among the lower-paid occupations tracked by BLS — median ${fmtUSD(median)}, p10 ${fmtUSD(p10)}, p25 ${fmtUSD(p25)}.`,
  ], 2);

  const context = pickVariant(slug, [
    `Entry-tier occupations typically have low credential gates, high turnover, and pay scales tied closely to minimum-wage policy. ${metroClause(facts)}.`,
    `The narrow gap between p10 and the median reflects how much of the workforce is concentrated near the entry rate — a defining feature of the lower pay tier. ${spreadClause(facts)}.`,
    `Low-pay occupations are sensitive to local minimum-wage laws, tipping rules (where applicable), and seasonal employment cycles. ${nationalClause(facts)}.`,
  ], 3);

  const implication = pickVariant(slug, [
    `For candidates: career mobility usually requires either certification ladders within the field or sideways moves into higher-paid adjacent occupations.`,
    `For workers in this tier: state-level minimum-wage policy can shift earnings 10–20% between states — geographic mobility is a meaningful lever even at entry pay.`,
    `For long-term planning: industry-funded training programs and certificate ladders often outpace tenure raises at this level — the path up is faster through retraining than through staying put.`,
  ], 4);

  return { headline, fact, context, implication, status: 'entry_level_low' };
}

function build_standard_occupation(facts: OccupationFacts): OccupationCommentary {
  const slug = facts.occ.slug;
  const { occ, median, p10, p25, p75, p90, employment } = facts;

  const headline = pickVariant(slug, [
    `Standard profile: ${fmtUSDCompact(median)} median across ${fmtCount(employment)} jobs`,
    `A typical occupation in its band`,
    `Median pay ${fmtUSDCompact(median)}, IQR ${fmtUSDCompact(p25)}–${fmtUSDCompact(p75)}`,
  ], 1);

  const fact = pickVariant(slug, [
    `${occ.title} pays ${fmtUSD(median)} at the median nationally, with ${fmtCount(employment)} workers employed. The interquartile range runs ${fmtUSD(p25)} to ${fmtUSD(p75)}; the 90th percentile reaches ${fmtUSD(p90)}. ${rankClause(facts)}.`,
    `Per BLS OEWS, ${occ.title} reports a ${fmtUSD(median)} median, ${fmtUSD(p10)} at p10, ${fmtUSD(p90)} at p90, and ${fmtCount(employment)} workers nationally.`,
    `${occ.title} sits in the middle of the BLS occupation distribution: median ${fmtUSD(median)}, IQR ${fmtUSD(p25)}–${fmtUSD(p75)}, ${fmtCount(employment)} employed.`,
  ], 2);

  const context = pickVariant(slug, [
    `Roles in this band don't show extreme pay or extreme scale — they sit comfortably mid-distribution. ${nationalClause(facts)}, and ${spreadClause(facts)}.`,
    `When neither the median nor the spread mark a role as exceptional, the pay drivers tend to be sector, employer size, and metro of employment. ${metroClause(facts)}.`,
    `Standard-profile occupations often act as comparison anchors for adjacent jobs — recruiters and benchmarkers use them as reference points. ${nationalClause(facts)}.`,
  ], 3);

  const implication = pickVariant(slug, [
    `For candidates: pay outcomes are driven primarily by employer choice and metro selection. Negotiation gains 5–10% are realistic; outsized gains usually require a title change.`,
    `For long-term planning: the IQR (${fmtUSD(p25)}–${fmtUSD(p75)}) is the realistic earnings band. Reaching p90 typically means specializing, managing, or leaving the title.`,
    `For benchmarking: this occupation provides a useful reference for adjacent role pay — comparable titles within the same major group should track roughly with this profile.`,
  ], 4);

  return { headline, fact, context, implication, status: 'standard_occupation' };
}

// ──────────────────────────────────────────────────────────────────
// Public dispatch
// ──────────────────────────────────────────────────────────────────

export function getOccupationCommentary(facts: OccupationFacts): OccupationCommentary {
  switch (facts.status) {
    case 'top_specialist':       return build_top_specialist(facts);
    case 'six_figure_broad':     return build_six_figure_broad(facts);
    case 'high_pay_mass_market': return build_high_pay_mass_market(facts);
    case 'mid_market_solid':     return build_mid_market_solid(facts);
    case 'wide_pay_range':       return build_wide_pay_range(facts);
    case 'narrow_pay_range':     return build_narrow_pay_range(facts);
    case 'metro_premium_heavy':  return build_metro_premium_heavy(facts);
    case 'entry_level_low':      return build_entry_level_low(facts);
    case 'standard_occupation':  return build_standard_occupation(facts);
  }
}

// ──────────────────────────────────────────────────────────────────
// Title rewrite — diversifies <title> tags across slugs to defeat
// "{Occupation} Salary in {Year} — Median, p10, p90 by State" templating.
// ──────────────────────────────────────────────────────────────────

export function getOccupationTitle(facts: OccupationFacts): string {
  const slug = facts.occ.slug;
  const name = facts.occ.title;
  const median = facts.median;

  // Status-aware title pool — different roles get different headline framings.
  switch (facts.status) {
    case 'top_specialist':
      return pickVariant(slug, [
        `${name} Pay: ${fmtUSDCompact(median)} Median, ${fmtUSDCompact(facts.p90)} at p90`,
        `${name} Salary Profile — Specialist Pay by Percentile`,
        `What ${name} Earn — National Median ${fmtUSDCompact(median)}`,
      ], 5);
    case 'six_figure_broad':
      return pickVariant(slug, [
        `${name} Salary: ${fmtUSDCompact(median)} Median, ${fmtCount(facts.employment)} Employed`,
        `${name} Pay by Percentile and Metro`,
        `${name} Earnings — National Median ${fmtUSDCompact(median)}`,
      ], 5);
    case 'high_pay_mass_market':
      return pickVariant(slug, [
        `${name} Salary by Metro and Percentile — ${fmtUSDCompact(median)} Median`,
        `${name} Pay Across the US — ${fmtCount(facts.employment)} Workers`,
        `What ${name} Earn — ${fmtUSDCompact(median)} National Median`,
      ], 5);
    case 'mid_market_solid':
      return pickVariant(slug, [
        `${name} Salary: ${fmtUSDCompact(median)} Median by State`,
        `${name} Pay by Percentile — National and Metro Data`,
        `${name} Earnings — Median ${fmtUSDCompact(median)} per BLS`,
      ], 5);
    case 'wide_pay_range':
      return pickVariant(slug, [
        `${name} Salary Range: ${fmtUSDCompact(facts.p10)} to ${fmtUSDCompact(facts.p90)}`,
        `${name} Pay Spread — Bottom to Top Decile`,
        `${name} Salary by Experience Level — Wide-Range Profile`,
      ], 5);
    case 'narrow_pay_range':
      return pickVariant(slug, [
        `${name} Salary: Median ${fmtUSDCompact(median)} (Compressed Pay Band)`,
        `${name} Pay by State — Narrow Distribution`,
        `${name} Earnings — Tight Pay Scale Across Percentiles`,
      ], 5);
    case 'metro_premium_heavy':
      return pickVariant(slug, [
        `${name} Salary by Metro — ${facts.topMetroName} Pays Most`,
        `${name} Pay: Geographic Premium and National Median`,
        `${name} Earnings by City — Metro Premium Heavy`,
      ], 5);
    case 'entry_level_low':
      return pickVariant(slug, [
        `${name} Salary: ${fmtUSDCompact(median)} Median, Entry-Tier`,
        `${name} Pay by State and Percentile`,
        `${name} Earnings — Entry-Level Pay Scale`,
      ], 5);
    case 'standard_occupation':
    default:
      return pickVariant(slug, [
        `${name} Salary: ${fmtUSDCompact(median)} Median by State`,
        `${name} Pay by Percentile and Metro`,
        `${name} Earnings — Median, p10, p90`,
        `${name} Salary Across the US — BLS Data`,
      ], 5);
  }
}

// ──────────────────────────────────────────────────────────────────
// Meta description rewrite — companion to title rewrite for <head>.
// ──────────────────────────────────────────────────────────────────

export function getOccupationDescription(facts: OccupationFacts): string {
  const slug = facts.occ.slug;
  const name = facts.occ.title;
  const median = facts.median;

  return pickVariant(slug, [
    `${name} earn ${fmtUSD(median)} at the national median per BLS OEWS 2024 — see percentile pay (p10/p25/p75/p90), top-paying metros, and state-by-state breakdowns.`,
    `BLS data shows ${name} median pay at ${fmtUSD(median)}, with ${fmtCount(facts.employment)} employed nationally. Browse percentile bands, top metros, and how this role ranks within ${groupLabel(facts.occ)}.`,
    `Median pay for ${name} is ${fmtUSD(median)} (BLS OEWS 2024). View 10th–90th percentile breakdowns, the highest-paying US metros, and state comparisons.`,
    `${name} pay at a glance: ${fmtUSD(median)} median, ${fmtUSD(facts.p10)}–${fmtUSD(facts.p90)} between p10 and p90, ${fmtCount(facts.employment)} workers nationally per BLS.`,
  ], 6);
}
