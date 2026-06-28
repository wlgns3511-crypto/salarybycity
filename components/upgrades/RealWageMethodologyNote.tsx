import type { CostAdjustedWageTierResult } from "@/lib/cost-adjusted-wage-tier";
import { tierLabel } from "@/lib/cost-adjusted-wage-tier";
import type { WageGrowthVelocityResult } from "@/lib/wage-growth-velocity";
import { velocityBandLabel } from "@/lib/wage-growth-velocity";
import type { OccupationDensityResult } from "@/lib/occupation-density-score";
import { densityTierLabel } from "@/lib/occupation-density-score";
import type { SalaryDecisionFraming } from "@/lib/salary-interpretation";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const signedPct = (decimal: number) =>
  `${decimal >= 0 ? "+" : "−"}${Math.abs(decimal * 100).toFixed(1)}%`;

const DECISION_PHRASE: Record<SalaryDecisionFraming, string> = {
  "relocate-up":
    "I read this as a relocate-up slice — the real wage, the velocity, and the market depth pull the same direction, so the lever to negotiate is real dollars, not the sticker number",
  "stay-grow":
    "I read this as a stay-and-grow slice — the real wage holds up but the upside is climbing the ladder in place rather than chasing a higher nominal offer into a pricier metro",
  "lateral-shift":
    "I read this as a lateral-shift slice — at least one leg (real wage, velocity, or market depth) is weak enough that I would broaden the search before anchoring on this combination",
  "data-incomplete":
    "I can't land a clean relocate-or-stay call here, because BLS suppressed at least one of the three legs for this slice",
};

export interface RealWageMethodologyNoteProps {
  /** Occupation title, e.g. "Software Developers" */
  occupationTitle: string;
  /** Geographic anchor the composite is computed against, e.g. "San Jose, CA" or "the United States" */
  areaName: string;
  /** Whether the anchor is a metro, state, or the national row */
  areaKind: "metro" | "state" | "national";
  /** Cost-adjusted real-wage tier result (BLS OEWS median ÷ BEA RPP) */
  costAdj: CostAdjustedWageTierResult | null;
  /** YoY wage-growth velocity result on the OEWS release pair */
  velocity: WageGrowthVelocityResult;
  /** Cross-area occupation employment-density result */
  density: OccupationDensityResult;
  /** Decision framing the composite landed on */
  decision: SalaryDecisionFraming;
  /** Canonical deep URL for this occupation page */
  sourceUrl: string;
}

/**
 * First-person provenance note for salarybycity's real-wage dimension.
 *
 * The page already states the cost-adjusted tier, the velocity band, and the
 * density percentile in an impersonal composite voice — which understates the
 * first-hand-analysis (Experience) signal answer engines weigh for E-E-A-T.
 * This note signals the ORIGINAL synthesis in first person: I took BLS OEWS
 * published medians, deflated them by BEA Regional Price Parities to a real
 * (purchasing-power) wage, then ranked that real wage, paired it with the YoY
 * velocity on the OEWS release pair and the cross-area employment density, and
 * landed a relocate/stay decision frame.
 *
 * Honesty guard: BLS collected the wages, BEA published the price parities — I
 * did the deflation, the ranking, and the decision synthesis, and the prose
 * says exactly that and no more. Every figure is pulled live from the compute
 * results (never hardcoded) so it stays accurate per occupation × area,
 * including the BLS-suppressed slices where a leg is missing.
 *
 * Anti-template guard: the sibling site wagepeek also does BLS × BEA real wage,
 * but its angle is an hourly wage net of Census-ACS COMMUTE burden. This note
 * never mentions commute. Its distinctive levers are the OCCUPATION real wage,
 * the wage-growth VELOCITY pair, the occupation DENSITY percentile, and the
 * relocate/stay DECISION FRAME — none of which wagepeek computes.
 */
export function RealWageMethodologyNote({
  occupationTitle,
  areaName,
  areaKind,
  costAdj,
  velocity,
  density,
  decision,
  sourceUrl,
}: RealWageMethodologyNoteProps) {
  const areaUnit = areaKind === "state" ? "state" : areaKind === "national" ? "national" : "metro";

  // ---- Sentence 1: the real-wage deflation + ranking (the core synthesis) ----
  // Branches on whether BLS published the nominal median for this cell at all.
  let deflationSentence: React.ReactNode;
  if (
    costAdj == null ||
    costAdj.tier == null ||
    costAdj.nominalWage == null ||
    costAdj.realWage == null ||
    costAdj.ratio == null ||
    costAdj.nationalRealMedian == null
  ) {
    deflationSentence = (
      <>
        For {occupationTitle} in {areaName}, BLS suppressed the small-cell wage
        estimate, so I couldn&rsquo;t deflate a nominal median into a real wage
        or rank it — I&rsquo;d rather show the gap than fabricate a number.
      </>
    );
  } else {
    const ratioPct = Math.round(Math.abs(costAdj.ratio - 1) * 100);
    const aboveBelow = costAdj.ratio >= 1 ? "above" : "below";
    const rppClause =
      costAdj.rppLevel === "national"
        ? "no metro- or state-level BEA parity was published, so I held the area at the US=100 baseline"
        : `the BEA Regional Price Parity for the ${costAdj.rppLevel === "msa" ? "metro" : "state"} is ${costAdj.rppIndex.toFixed(1)} (US=100)`;
    deflationSentence = (
      <>
        I started from the BLS OEWS published median of{" "}
        {usd(costAdj.nominalWage)} for {occupationTitle} in {areaName}, divided
        it by {rppClause}, and landed a real (purchasing-power) wage of about{" "}
        {usd(costAdj.realWage)}. Against the national real median of{" "}
        {usd(costAdj.nationalRealMedian)} for the same occupation that&rsquo;s a
        ratio of {costAdj.ratio.toFixed(2)} — roughly {ratioPct}% {aboveBelow} —
        which my 5-band cutoffs rank as the {tierLabel(costAdj.tier)}.
      </>
    );
  }

  // ---- Sentence 2: velocity (distinct lever; wagepeek has none) ----
  let velocitySentence: React.ReactNode;
  if (velocity.band == null || velocity.yoyChange == null || velocity.latestYear == null || velocity.priorYear == null) {
    velocitySentence = (
      <>
        {" "}
        The OEWS series for this slice doesn&rsquo;t carry two consecutive
        published medians, so I left the wage-growth velocity band blank rather
        than guess a trajectory.
      </>
    );
  } else {
    const gap = velocity.latestYear - velocity.priorYear;
    const gapClause = gap > 1 ? `, annualized across the ${gap}-release gap where BLS suppressed the adjacent year` : "";
    velocitySentence = (
      <>
        {" "}
        Then I checked the velocity: the {velocity.priorYear}→{velocity.latestYear}{" "}
        OEWS release pair moved the median {signedPct(velocity.yoyChange)} YoY{gapClause},
        which I band as {velocityBandLabel(velocity.band)}.
      </>
    );
  }

  // ---- Sentence 3: density (distinct lever; wagepeek has none) ----
  let densitySentence: React.ReactNode;
  if (density.tier == null || density.percentile == null) {
    densitySentence = (
      <>
        {" "}
        I couldn&rsquo;t rank the labor-market depth — BLS either suppressed the
        employment cell or published too few metros ({density.distributionN}) to
        anchor a percentile.
      </>
    );
  } else {
    densitySentence = (
      <>
        {" "}
        Finally I ranked how thick the labor market is: the{" "}
        {density.currentEmployment != null ? `${density.currentEmployment.toLocaleString("en-US")} jobs here sit ` : "employment sits "}
        at the {density.percentile.toFixed(0)}th percentile of the{" "}
        {density.distributionN} metros that published employment for this
        occupation, which I read as a {densityTierLabel(density.tier).toLowerCase()}.
      </>
    );
  }

  // ---- Sentence 4: the decision synthesis (the bespoke frame) ----
  const decisionSentence = (
    <>
      {" "}
      Stacking the three, {DECISION_PHRASE[decision]} for this {areaUnit}-level slice.
    </>
  );

  return (
    <section
      className="my-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700"
      data-upgrade="real-wage-methodology"
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
        How I read this
      </p>
      <p>
        {deflationSentence}
        {velocitySentence}
        {densitySentence}
        {decisionSentence}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Editorial synthesis, not pay advice: BLS collected the wages and BEA
        published the price parities — the deflation, the 5-band real-wage
        ranking, the velocity read, and the relocate-or-stay frame are mine. Full
        cutoffs and caveats are in the composite verdict above. Source:{" "}
        <a href={sourceUrl} className="underline hover:text-slate-700">
          {sourceUrl}
        </a>
        .
      </p>
    </section>
  );
}
