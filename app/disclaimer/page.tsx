import type { Metadata } from "next";
import { BLS_DATA_YEAR, BLS_PUBLISHED, LEGAL_VINTAGES } from "@/lib/authorship";
import { AuthorBox } from "@/components/AuthorBox";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Disclaimer and limitations of liability for SalaryByCity. Wage data ≠ income guarantee; real wage ≠ take-home pay. Scope and limits of BLS OEWS, BEA RPP, Census ACS, and IRS SOI-derived content.",
  alternates: { canonical: "/disclaimer/" },
  openGraph: { url: "/disclaimer/" },
};

export default function DisclaimerPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Disclaimer</h1>
      <p className="text-sm text-slate-500 mb-8">
        Last updated: <time dateTime={LEGAL_VINTAGES.disclaimer}>March 25, 2026</time> · Current
        data vintage: BLS OEWS {BLS_DATA_YEAR} (released {BLS_PUBLISHED})
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">General Information</h2>
      <p>
        SalaryByCity publishes occupation × metro wage statistics derived from public-data
        agencies, including the <strong>U.S. Bureau of Labor Statistics (BLS) Occupational
        Employment and Wage Statistics (OEWS)</strong> program, the <strong>U.S. Bureau of Economic
        Analysis (BEA) Regional Price Parities (RPP)</strong> series, the <strong>U.S. Census
        Bureau's American Community Survey (ACS)</strong>, and the <strong>U.S. Internal Revenue
        Service Statistics of Income (IRS SOI)</strong> tables. The information is published for
        general informational and educational purposes only.
      </p>
      <p>
        While we strive to keep the information accurate and aligned with the underlying BLS OEWS,
        BEA RPP, Census ACS, and IRS SOI releases, we make no representations or warranties of any
        kind, express or implied, about the completeness, accuracy, reliability, suitability, or
        timeliness of the information for any particular purpose.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Wage data ≠ income guarantee</h2>
      <p>
        The salary figures on SalaryByCity are <strong>population-level statistics</strong> from
        BLS OEWS — they describe what nonfarm payroll workers in an occupation × area combination
        earned during a past reference period. <strong>They are not a guarantee or prediction of
        what any individual will earn.</strong> A BLS OEWS median for an occupation reflects the
        middle worker in that population; a p90 reflects the 90th percentile; a p10 reflects the
        10th percentile. These are descriptive of the population at the time of the BLS reference
        period — they are not promises, offers, or predictions of any specific individual's
        earnings.
      </p>
      <p>
        Individual compensation depends on many factors that BLS OEWS does not measure: years of
        experience, specific employer, sub-specialty, education, certification, equity component,
        sign-on bonus, performance, negotiation, and the local labor market at the time of an
        offer. Do not use BLS OEWS figures to predict your own offer, and do not rely on them as a
        guarantee of attainable compensation.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Real wage ≠ take-home pay</h2>
      <p>
        Our CostAdjustedWageTier classifier converts BLS OEWS nominal wages into <em>real</em>{' '}
        wages using BEA Regional Price Parities. <strong>"Real wage" measures purchasing power
        relative to a national price baseline — it is not take-home pay.</strong>
      </p>
      <p>
        Real wage in our sense reflects consumer-price differences across U.S. metros and states
        (rent, groceries, utilities, transportation, goods/services) as measured by BEA RPP. It
        does <em>not</em> deduct:
      </p>
      <ul>
        <li>Federal income tax (10–37% progressive, based on filing status and deductions).</li>
        <li>
          State income tax (zero in nine states; up to 13.3% in California; varies by state, filing
          status, deductions).
        </li>
        <li>Local income tax (e.g. New York City, Philadelphia, parts of Maryland).</li>
        <li>
          FICA: Social Security 6.2% up to the wage base ($176,100 in 2026) and Medicare 1.45% on
          all wages, plus the additional 0.9% Medicare surcharge over $200,000.
        </li>
        <li>
          State payroll programs (California SDI, New Jersey FLI, New York PFL, Washington PFML).
        </li>
        <li>
          Employer-side deductions: health insurance premiums, dental, vision, 401(k) contributions,
          HSA/FSA contributions.
        </li>
      </ul>
      <p>
        A BLS OEWS median or CostAdjustedWageTier real wage is therefore not your paycheck. For an
        approximation of take-home pay you must apply your federal, state, local, FICA, and
        employer-side benefit elections separately, using IRS Publication 15 or a reputable
        take-home calculator that handles your filing status. SalaryByCity does not provide
        take-home calculations and does not warrant any third-party calculator that does.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">BLS suppression and data limitations</h2>
      <p>
        BLS OEWS does not publish wage estimates for occupation × area cells with fewer than five
        reporting employers, or where publication would risk identifying an individual employer.
        When the underlying BLS OEWS median is suppressed, SalaryByCity surfaces an
        "insufficient-data" flag rather than filling the cell with a synthetic value. Users should
        not interpret an "insufficient-data" flag as meaning that no one in the occupation works
        in the area — only that BLS did not publish a wage estimate for that combination.
      </p>
      <p>
        BLS OEWS publishes annually each April, for the prior May reference period — meaning the
        most recent BLS OEWS data is approximately 12–18 months behind the current calendar date.
        BEA RPP is similarly published with an approximately 12-month lag. ACS and IRS SOI also
        carry release lags inherent to the federal statistical-release cycle. SalaryByCity always
        labels the underlying data vintage on every page; users should consult that label rather
        than assume figures are current to the calendar date.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Not Professional Advice</h2>
      <p>
        The content on SalaryByCity does not constitute professional advice of any kind, including
        but not limited to financial, legal, tax, immigration, medical, or career advice. Any
        reliance you place on the information is strictly at your own risk. Always consult with a
        qualified professional — a certified financial planner, licensed tax preparer, employment
        attorney, or career advisor — before making decisions based on the information found on
        this website. Salary, relocation, and career decisions are highly personal and depend on
        factors that population-level BLS OEWS, BEA RPP, ACS, and IRS SOI statistics cannot
        capture.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Data Accuracy</h2>
      <p>
        Data displayed on SalaryByCity is sourced from publicly available federal statistical
        releases — primarily BLS OEWS, BEA RPP, Census ACS, and IRS SOI — and from no other
        sources. While we make reasonable efforts to ensure each on-page figure matches the
        underlying release, data may contain errors at ingestion, be outdated relative to a newer
        federal release, or be subject to BLS-imposed suppression. Users should independently
        verify critical figures against the original BLS OEWS, BEA RPP, ACS, or IRS SOI table
        before making decisions based on them.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">CostAdjustedWageTier and percentile-spread bands</h2>
      <p>
        Our 5-band CostAdjustedWageTier classifier (TopReal, StrongReal, ModerateReal,
        BelowMedianReal, WeakReal) and our 4-band percentile-spread classifier (Compressed,
        Moderate, Wide, Extreme) are <strong>SalaryByCity's editorial heuristics</strong>, not BLS,
        BEA, Census, or IRS official ratings. The cutoffs are documented in our{' '}
        methodology guide. Different cutoff choices
        would produce different bands — users should treat the band labels as a reading aid and
        consult the underlying ratio and source figures for any decision that depends on the exact
        value.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Interpretation Strip — band-level reading aid only</h2>
      <p>
        The Interpretation Strip on every occupation, state, and salary-ranges page composes the
        CostAdjustedWageTier and percentile-spread bands into a deterministic 4-paragraph verdict.
        The verdict is composed by SalaryByCity editorial rules from BLS OEWS p10/p50/p90 and
        BEA RPP at build time. Same BLS OEWS and BEA RPP inputs always produce byte-identical
        strip output, so the verdict is auditable cell-by-cell against the underlying BLS OEWS
        and BEA RPP releases. The strip is a reading aid; it is not a substitute for
        independent verification against the source BLS OEWS or BEA RPP release. Where the
        underlying BLS OEWS cell is suppressed for reliability or confidentiality, the strip
        surfaces "insufficient BLS OEWS data for a real-wage verdict" rather than substituting a
        synthetic value. Where BEA RPP is unpublished for a metro, the strip falls back to BEA RPP
        at the state level or to RPP=100 (national average) and names the fallback level
        explicitly. The strip is never a recommendation to take or refuse a job, accept or reject
        an offer, or relocate; it is a calibrated explanation of the BLS OEWS and BEA RPP data
        the page already shows.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">External Links</h2>
      <p>
        This website may contain links to external websites, including BLS.gov, BEA.gov,
        Census.gov, and IRS.gov, that are not under our control. We have no responsibility for
        the content, privacy policies, or practices of any third-party websites — including the
        federal agency websites we link to as primary sources. Federal agency content is
        authoritative for any disagreement between an on-page SalaryByCity figure and the source
        release. The four agencies SalaryByCity ingests from — the U.S. Bureau of Labor
        Statistics (BLS OEWS), the U.S. Bureau of Economic Analysis (BEA RPP), the U.S. Census
        Bureau (ACS), and the U.S. Internal Revenue Service (IRS SOI) — are the canonical sources
        for any cell-level dispute; a SalaryByCity page rendering a number that does not match
        the named federal release is a correction-priority issue handled per the corrections
        policy. We do not represent that BLS OEWS, BEA RPP, ACS, or IRS SOI endorse, review, or
        certify any specific SalaryByCity page; the agencies publish the underlying tables and
        SalaryByCity compiles and presents them.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Advertising</h2>
      <p>
        SalaryByCity displays third-party advertisements through Google AdSense and other ad
        networks. These advertisements are provided by third parties and do not imply endorsement
        by SalaryByCity. We are not responsible for the content, pricing, or accuracy of any
        advertisements displayed on this website. Ad placement is automated and does not reflect
        editorial selection or partnership.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Limitation of Liability</h2>
      <p>
        In no event shall SalaryByCity, its owners, operators, editorial team, or contributors be
        liable for any direct, indirect, incidental, consequential, special, exemplary, or
        punitive damages — including lost income, lost employment opportunities, lost negotiation
        leverage, or relocation losses — arising from the use of this website or the information
        contained herein, even if advised of the possibility of such damages. Use of SalaryByCity
        is at your own risk; we provide no warranty of fitness for any particular career,
        negotiation, or relocation purpose.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Data vintage and BLS OEWS release timing</h2>
      <p>
        BLS OEWS is the U.S. Bureau of Labor Statistics' Occupational Employment and Wage
        Statistics program, released annually with a roughly 12–18 month lag from the survey
        reference period. BEA RPP is the U.S. Bureau of Economic Analysis' Regional Price
        Parities, released annually with a roughly 12-month lag. Census ACS is the U.S. Census
        Bureau's American Community Survey, released as 1-year and 5-year tables. IRS SOI is the
        Internal Revenue Service's Statistics of Income program. A SalaryByCity page reflects
        whichever BLS OEWS, BEA RPP, ACS, and IRS SOI vintages were the most recent at the time
        of the last data refresh; the methodology page names the exact BLS OEWS and BEA RPP
        vintages currently in use.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact</h2>
      <p>
        If you have concerns about any content on this website, please visit our{" "}
        <a href="/contact/" className="text-blue-700 hover:underline">Contact page</a>. Editorial
        standards and the corrections process are documented on the{' '}
        <a href="/editorial-policy/" className="text-blue-700 hover:underline">editorial policy</a> and{' '}
        <a href="/corrections-policy/" className="text-blue-700 hover:underline">corrections policy</a> pages.
      </p>

      <AuthorBox />
    </article>
  );
}
