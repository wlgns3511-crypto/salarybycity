import type { Metadata } from "next";
import { AuthorBox } from "@/components/AuthorBox";

export const metadata: Metadata = {
  title: "Our Methodology — How SalaryByCity Builds Its Wage Data",
  description:
    "Exactly how SalaryByCity sources US salary and wage data — anchored in the Bureau of Labor Statistics OEWS dataset and cross-referenced with Census ACS and BEA personal income.",
  alternates: { canonical: "/methodology/" },
  openGraph: { url: "/methodology/" },
};

export default function MethodologyPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1>Our Methodology</h1>
      <p className="lead text-lg text-slate-600">
        Salary data drives real money decisions — negotiating an offer,
        relocating, picking a major. We want you to know exactly where our
        numbers come from, what they cover, and what their limits are.
      </p>

      <h2>Primary source: BLS Occupational Employment and Wage Statistics (OEWS)</h2>
      <p>
        Every wage figure on SalaryByCity is anchored in the{" "}
        <a
          href="https://www.bls.gov/oes/"
          target="_blank"
          rel="noopener noreferrer"
        >
          US Bureau of Labor Statistics Occupational Employment and Wage
          Statistics (OEWS)
        </a>{" "}
        program. OEWS surveys roughly 1.1 million establishments over a
        rolling three-year cycle and publishes annual wage estimates for
        about 830 occupations across all 50 states, the District of
        Columbia, US territories, and 595 metropolitan and nonmetropolitan
        areas. It is the most authoritative source of US salary data and is
        the underlying dataset for almost every published &ldquo;average
        salary&rdquo; figure you see on government and major media sites.
      </p>
      <p>For each city and occupation we publish:</p>
      <ul>
        <li>
          the <strong>annual median</strong> &mdash; the 50th percentile,
          usually a more honest benchmark than the mean,
        </li>
        <li>
          the <strong>annual mean</strong> &mdash; the average, which can be
          pulled up by very high earners,
        </li>
        <li>
          the 10th, 25th, 75th, and 90th percentile bands so you can see
          where you would sit relative to others in the same job in the
          same metro,
        </li>
        <li>
          the corresponding hourly rates,
        </li>
        <li>
          the BLS-reported employment count for that occupation in that
          area, which tells you how thick the job market is.
        </li>
      </ul>

      <h2>Geography: BLS metro and nonmetro areas</h2>
      <p>
        BLS uses the OMB-defined Metropolitan Statistical Area (MSA) and
        Nonmetropolitan Statistical Area definitions for geographic
        breakdowns. These are documented at the{" "}
        <a
          href="https://www.bls.gov/oes/current/msa_def.htm"
          target="_blank"
          rel="noopener noreferrer"
        >
          BLS area definitions page
        </a>
        . An MSA is anchored on a Core Based Statistical Area (CBSA) and
        usually includes the central city plus surrounding counties that
        have strong commuting ties to it. Our city pages map to those MSA
        definitions, so when we say &ldquo;San Francisco&rdquo; we mean the
        San Francisco-Oakland-Berkeley MSA, not the city limits.
      </p>

      <h2>Occupation codes (SOC)</h2>
      <p>
        BLS publishes wages by Standard Occupational Classification (SOC)
        code. SOC is a hierarchical taxonomy: a 6-digit code identifies a
        specific occupation (e.g. 15-1252 Software Developers), the first
        2 digits identify the major group (15 Computer and Mathematical),
        and intermediate levels group related work. Our occupation pages
        and salary tables follow the SOC structure exactly so you can
        cross-reference any number against the BLS source page.
      </p>

      <h2>Cross-reference and verification</h2>
      <p>
        We link out to authoritative sources so you can verify any salary
        you&apos;re about to negotiate or budget around:
      </p>
      <ul>
        <li>
          <a
            href="https://www.bls.gov/oes/"
            target="_blank"
            rel="noopener noreferrer"
          >
            BLS OEWS
          </a>{" "}
          &mdash; the primary source for all our wage figures.
        </li>
        <li>
          <a
            href="https://www.census.gov/topics/income-poverty/income.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            US Census Bureau Income
          </a>{" "}
          &mdash; household income data from the American Community Survey,
          useful for context (a $90k salary in a metro with a $75k median
          household income lands very differently).
        </li>
        <li>
          <a
            href="https://www.bea.gov/data/income-saving/personal-income-by-state"
            target="_blank"
            rel="noopener noreferrer"
          >
            BEA Personal Income by State
          </a>{" "}
          &mdash; Bureau of Economic Analysis personal income statistics,
          updated quarterly.
        </li>
        <li>
          <a
            href="https://www.irs.gov/statistics/soi-tax-stats-individual-income-tax-statistics"
            target="_blank"
            rel="noopener noreferrer"
          >
            IRS SOI Tax Stats
          </a>{" "}
          &mdash; the IRS Statistics of Income division publishes
          individual income tax data by state and ZIP code.
        </li>
      </ul>

      <h2>Update frequency</h2>
      <p>
        BLS releases OEWS data once a year, usually in spring, with data
        for the previous calendar year. There is a typical lag of 12-18
        months between the survey reference period and publication. We
        refresh our dataset within days of each OEWS release. Each page
        labels the data year so you know exactly how fresh the numbers are.
      </p>

      <h2>Limitations you should know about</h2>
      <ul>
        <li>
          <strong>Establishment-based survey.</strong> OEWS surveys
          employers, not workers. It captures wages paid by traditional
          employers and excludes self-employed workers, business owners,
          and most contract workers (1099 income). For
          contractor-heavy fields, real income may differ.
        </li>
        <li>
          <strong>Cell suppression.</strong> When BLS has too few
          observations to publish a reliable estimate (or could identify
          a specific employer), it suppresses the cell. You will sometimes
          see &ldquo;not available&rdquo; for a niche occupation in a small
          metro. That is BLS protecting confidentiality, not us hiding data.
        </li>
        <li>
          <strong>Annualization assumes full-time year-round.</strong> BLS
          annualizes hourly wages assuming 2,080 hours per year. Part-time
          and seasonal workers will have lower actual earnings.
        </li>
        <li>
          <strong>No bonus, equity, or benefits.</strong> OEWS captures
          base wage and salary income only. Tech bonuses, sales
          commissions, RSU grants, and benefit-rich compensation packages
          (healthcare, retirement match) are not included.
        </li>
        <li>
          <strong>Not financial advice.</strong> Nothing on SalaryByCity
          constitutes professional financial, career, or relocation
          advice. For decisions with real money on the line, work with a
          qualified advisor.
        </li>
      </ul>

      <h2>Who runs this site</h2>
      <p>
        SalaryByCity is operated by an independent publisher based in South
        Korea. We are not a U.S.-resident research firm and we do not employ
        U.S.-based labor economists. What we do is build a presentation and
        navigation layer over the same public-domain BLS OEWS, BEA RPP, and
        Census ACS releases that anyone can download &mdash; with consistent
        cross-referencing, cost-of-living adjustment via BEA RPP, take-home
        pay calculations using IRS SOI and state tax tables, and links back
        to each primary source on every figure. We do not accept paid
        placements, sponsored salary surveys, or commissions on job
        listings; we have no contractual relationships with U.S. employers,
        recruiters, payroll vendors, or staffing firms. Editorial work is
        limited to mapping BLS OEWS occupation × area cells, BEA RPP metro
        and state values, Census ACS demographic context, and IRS SOI tax
        cross-references into the SalaryByCity presentation; interpretation
        that requires on-the-ground U.S. labor-market expertise is
        explicitly outside our scope and we link to the original BLS OEWS
        source so you can take any figure to a qualified U.S.-resident
        professional.
      </p>

      <h2>Three-lever Salary Interpretation composite verdict</h2>
      <p>
        Every occupation and state page also carries a composite verdict box at the very top,
        generated by <code>getSalaryInterpretation</code> in <code>lib/salary-interpretation.ts</code>.
        The composite reads three deterministic levers — the CostAdjustedWageTier (level, from BLS
        OEWS nominal annual median deflated by BEA RPP), the WageGrowthVelocityBand (trajectory,
        from BLS OEWS year-over-year change), and the OccupationDensityScore (market thickness,
        from BLS OEWS cross-area employment percentile rank) — and emits one of four decision
        frames: relocate-up, stay-and-grow, lateral-shift, or data-incomplete.
      </p>
      <p>
        The decision frame is picked by a single linear pass through the lever bands. Any null
        lever (BLS OEWS cell suppression or below the minimum baseline floor for cross-area
        ranking) flips the frame to data-incomplete regardless of the other two readings. A
        StrongReal or TopReal CostAdjustedWageTier combined with non-negative WageGrowthVelocityBand
        or Thick OccupationDensityScore produces relocate-up. A WeakReal or BelowMedianReal
        CostAdjustedWageTier, or a Declining WageGrowthVelocityBand, or a VeryThin
        OccupationDensityScore produces lateral-shift. The residual produces stay-and-grow. The
        composite is deterministic: the same three lever readings from the same BLS OEWS vintage
        always produce the same verdict.
      </p>
      <p>
        The composite verdict box is colored by the decision frame (emerald for relocate-up, teal
        or amber for stay-and-grow, rose for lateral-shift, slate for data-incomplete), with a
        secondary modulation by the underlying CostAdjustedWageTier so visually distinct
        combinations are preserved. The 4-paragraph prose covers (1) the cost-adjusted reading,
        (2) the growth trajectory, (3) the market thickness, and (4) the concrete reader action
        tied to the decision frame. The full branching logic and the per-lever cutoffs are
        documented in the dedicated{' '}
        Salary Interpretation guide, with companion
        guides for the underlying levers at{' '}
        Wage Growth Velocity and{' '}
        OccupationDensityScore. The full
        page-reading walk-through (composite verdict box, Interpretation Strip, data tables, and
        cross-reference links) is at{' '}
        Reading SalaryByCity Pages.
      </p>

      <h2>CostAdjustedWageTier + percentile-spread Interpretation Strip</h2>
      <p>
        The Interpretation Strip on every occupation, state, and salary-ranges page composes two
        upstream classifiers: CostAdjustedWageTier (5 bands from BLS OEWS nominal annual median
        deflated by BEA RPP — TopReal, StrongReal, ModerateReal, BelowMedianReal, WeakReal) and
        the percentile-spread band (4 bands from BLS OEWS p90/p10 — Compressed, Moderate, Wide,
        Extreme). The strip is generated deterministically: the same BLS OEWS p10/p50/p90 and the
        same BEA RPP value always produce byte-identical output. When BLS OEWS suppresses the
        underlying cell, the strip surfaces "insufficient BLS OEWS data for a real-wage verdict"
        rather than substituting a fabricated value. When BEA RPP is unpublished for the metro,
        the strip falls back to BEA RPP at the state level or to BEA RPP=100 (national) and
        names the fallback level explicitly. The four-paragraph branching prose is documented in
        full in the dedicated{' '}
        wage-spread-interpretation guide;
        cutoffs for the CostAdjustedWageTier and percentile-spread classifiers are documented in
        the{' '}
        CostAdjustedWageTier guide and the{' '}
        percentile-spread decoder guide.
      </p>

      <h2>Source-by-source attribution for the composite verdict</h2>
      <p>
        Each lever in the composite is backed by a different upstream agency. The CostAdjustedWageTier
        reads BLS OEWS nominal annual median (BLS publication) deflated by BEA Regional Price Parity
        (BEA publication). The WageGrowthVelocityBand reads only BLS OEWS — the two most recent BLS
        OEWS published years for the same SOC × area pair. The OccupationDensityScore reads only
        BLS OEWS — the cross-area BLS-published employment counts for the same SOC. The percentile
        spread band on the Interpretation Strip reads only BLS OEWS p10 and p90.
      </p>
      <p>
        Beyond the four lever inputs, every SalaryByCity occupation and state page also surfaces
        Census ACS household-income context (Census Bureau publication, ACS 5-year release) and IRS
        SOI county-level effective tax rates (IRS Statistics of Income publication). The Census ACS
        and IRS SOI figures are context for the BLS OEWS wage — they do not feed any of the four
        levers, but they translate the headline BLS wage into household-relative and take-home terms.
        BEA personal-income-by-state is also linked from every page for readers who want the broader
        BEA personal-income trajectory alongside the BLS OEWS wage trajectory.
      </p>

      <h2>Corrections and feedback</h2>
      <p>
        If a published BLS OEWS figure disagrees with what you see here, please
        <a href="/contact/"> contact us</a> with the occupation, metro,
        and the BLS OEWS URL. Corrections from the community help us catch
        BLS OEWS or BEA RPP ingestion bugs quickly; the corrections process is documented in
        full at <a href="/corrections-policy/">/corrections-policy/</a>.
      </p>

      <p className="text-sm text-slate-500 border-t pt-4 mt-8">
        This methodology page was last reviewed in March 2026. Material
        changes to how we source or compute the data will be reflected
        here before they reach production pages.
      </p>

      <AuthorBox />
    </article>
  );
}
