import type { Metadata } from "next";
import { BLS_DATA_YEAR, BLS_PUBLISHED, DB_UPDATED } from "@/lib/authorship";

export const metadata: Metadata = {
  title: "About SalaryByCity",
  description:
    "How SalaryByCity verifies BLS Occupational Employment and Wage Statistics, our editorial review process, and the methodology limits you should know before citing our data.",
  alternates: { canonical: "/about/" },
  openGraph: { url: "/about/" },
};

export default function AboutPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">About SalaryByCity</h1>

      <p>
        SalaryByCity is a free reference for U.S. wage and salary data. We help job seekers,
        researchers, HR teams, and journalists compare median pay across hundreds of occupations
        and tracked metropolitan areas using public Bureau of Labor Statistics releases. Every
        figure on the site is traceable to a primary-source BLS table — we do not project,
        forecast, or interpolate wages we do not have.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Our Mission</h2>
      <p>
        We believe wage transparency leads to better career and hiring decisions. Our goal is to
        make the existing BLS Occupational Employment and Wage Statistics (OEWS) program more
        navigable: instead of downloading a multi-megabyte spreadsheet, you can read the median,
        percentile range, and employment count for an occupation in seconds. We do not charge,
        gate content, or sell user data, and our analytics are limited to aggregate page metrics.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">How We Verify BLS Data</h2>
      <p>
        Our wage tables are built from the BLS OEWS program, which surveys approximately 1.1
        million U.S. business establishments each year to estimate employment and wages for over
        800 occupations classified under the Standard Occupational Classification (SOC) system.
        OEWS is a probability sample, weighted to produce point estimates of mean and percentile
        wages at the national, state, and metropolitan-area levels.
      </p>
      <p>
        On import, we map each row in the OEWS extract by its six-digit SOC code to an occupation
        in our internal table, and by its area code to a state or Metropolitan Statistical Area
        (MSA — BLS&rsquo;s preferred geographic unit for labor data). Wage rows missing a median
        figure are excluded from listings rather than imputed; aggregations such as
        &ldquo;state average median&rdquo; are computed only over occupations that have a
        published median for that geography. The {BLS_DATA_YEAR} reference period (May
        {" "}{BLS_DATA_YEAR}) was published by BLS on {BLS_PUBLISHED}; that publication date is
        what appears in our Dataset JSON-LD as <code>dateModified</code>.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Editorial Review Process</h2>
      <p>
        SalaryByCity is published by an editorial team rather than under individual bylines —
        consistent with how government data aggregators typically operate. Each release of OEWS
        triggers a verification pass against a sample of high-traffic pages: we compare a random
        slice of occupation hubs and state pages against the official BLS tables to confirm the
        median, percentile bands, and employment counts match. The most recent verification was
        on {DB_UPDATED}, and that date appears as the &ldquo;Last verified&rdquo; badge on
        occupation and state pages.
      </p>
      <p>
        Corrections are handled openly: any reader can flag an inaccurate number through our{" "}
        <a href="/contact/" className="text-blue-600 hover:underline">contact page</a>, and we
        publish a record of substantive corrections on the{" "}
        <a href="/corrections-policy/" className="text-blue-600 hover:underline">
          corrections policy
        </a>{" "}
        page. We do not retroactively edit historical posts to disguise mistakes.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Methodology Limits You Should Know</h2>
      <p>
        OEWS is the most comprehensive U.S. wage dataset, but it has well-documented limits and we
        do not paper over them:
      </p>
      <ul>
        <li>
          <strong>Publication lag of 12–18 months.</strong> The May {BLS_DATA_YEAR} reference
          period was published in April {BLS_DATA_YEAR + 1}. Wages on this site reflect that
          reference period, not current spot-market pay.
        </li>
        <li>
          <strong>Excludes self-employed, agricultural, and military workers.</strong> OEWS
          covers nonfarm payroll employment only. Independent contractors, sole proprietors,
          farm workers, and active-duty military are not represented.
        </li>
        <li>
          <strong>Metro-level coverage is not universal.</strong> The public OEWS extract used
          here publishes metropolitan wage breakdowns for roughly 30 of the 51 U.S. states and
          DC; the remaining states are covered nationally and at the state level by BLS but the
          extract we use does not separately list their MSA rows. Where we lack metro data, the
          state page renders national context with explicit pointers to the BLS source — we do
          not synthesize a state-level wage from incomplete data.
        </li>
        <li>
          <strong>Cost-of-living is a separate adjustment.</strong> Nominal wages reported here
          are not adjusted for local price levels. For purchasing-power comparisons, pair our
          wage figures with the BEA Regional Price Parities (RPP) — our{" "}
          <a href="/tools/col-calculator/" className="text-blue-600 hover:underline">
            cost-of-living calculator
          </a>{" "}
          uses the latest BEA RPP release.
        </li>
        <li>
          <strong>Suppression of small cells.</strong> BLS suppresses wage estimates whose
          standard error exceeds confidentiality thresholds. Where a percentile or median is
          suppressed in the source data, our pages show &ldquo;N/A&rdquo; rather than guessing.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">When Not to Cite SalaryByCity</h2>
      <p>
        SalaryByCity is a research aggregator. For salary negotiation, financial planning, or
        legal proceedings, treat us as a starting point: confirm the figure against the original
        BLS table linked in our methodology, and consult a qualified financial planner, CPA, or
        career counselor for individual decisions. We do not provide personalized advice and our
        figures should not substitute for professional counsel.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Data Sources</h2>
      <p>
        All wage figures are from the{" "}
        <a
          href="https://www.bls.gov/oes/"
          rel="noopener noreferrer"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          U.S. Bureau of Labor Statistics OEWS program
        </a>
        . Cost-of-living indexes use the{" "}
        <a
          href="https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area"
          rel="noopener noreferrer"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          Bureau of Economic Analysis Regional Price Parities
        </a>
        . Inflation adjustments use the BLS{" "}
        <a
          href="https://www.bls.gov/cpi/"
          rel="noopener noreferrer"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          Consumer Price Index for All Urban Consumers (CPI-U)
        </a>
        . Occupational classifications follow the{" "}
        <a
          href="https://www.bls.gov/soc/"
          rel="noopener noreferrer"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          Standard Occupational Classification (SOC) system
        </a>
        .
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact</h2>
      <p>
        For corrections, methodology questions, or licensing inquiries, visit our{" "}
        <a href="/contact/" className="text-blue-600 hover:underline">contact page</a>. For our
        public methodology and review policies, see{" "}
        <a href="/methodology/" className="text-blue-600 hover:underline">/methodology/</a>,{" "}
        <a href="/editorial-policy/" className="text-blue-600 hover:underline">
          /editorial-policy/
        </a>
        , and{" "}
        <a href="/corrections-policy/" className="text-blue-600 hover:underline">
          /corrections-policy/
        </a>
        .
      </p>
    </article>
  );
}
