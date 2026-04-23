import type { Metadata } from "next";

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

      <h2>Corrections and feedback</h2>
      <p>
        If a published BLS figure disagrees with what you see here, please
        <a href="/contact/"> contact us</a> with the occupation, metro,
        and the BLS URL. Corrections from the community help us catch
        ingestion bugs quickly.
      </p>

      <p className="text-sm text-slate-500 border-t pt-4 mt-8">
        This methodology page was last reviewed in March 2026. Material
        changes to how we source or compute the data will be reflected
        here before they reach production pages.
      </p>
    </article>
  );
}
