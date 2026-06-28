import type { Metadata } from "next";
import { BLS_DATA_YEAR, BLS_PUBLISHED, DB_UPDATED, METHODOLOGY_REVIEWED } from "@/lib/authorship";
import { AuthorBox } from "@/components/AuthorBox";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "SalaryByCity's editorial standards: which upstream sources we use (BLS OEWS, Census ACS, BEA RPP, IRS SOI), how we label data vintage, how we handle BLS suppression, and how we review every page before publication.",
  alternates: { canonical: "/editorial-policy/" },
  openGraph: { url: "/editorial-policy/" },
};

export default function EditorialPolicyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
      <h1>Editorial Policy</h1>
      <p className="text-sm text-slate-500">
        Last reviewed <time dateTime={METHODOLOGY_REVIEWED}>{METHODOLOGY_REVIEWED}</time> · Data snapshot{' '}
        <time dateTime={DB_UPDATED}>{DB_UPDATED}</time>
      </p>

      <h2>Who publishes SalaryByCity</h2>
      <p>
        SalaryByCity is operated by the <strong>SalaryByCity Editorial Team</strong> within the
        DataPeek Research Network. We publish occupation × metro wage pages, salary range
        breakdowns, and cost-adjusted real-wage analyses built on four primary upstream sources.
        Each page lists the BLS OEWS, BEA RPP, Census ACS, and IRS SOI tables it cites in the
        AuthorBox at the bottom of the page; editorial review is conducted by the SalaryByCity
        Editorial Team against the standards described below before a page is published.
      </p>

      <h2>Upstream data sources we cite</h2>
      <p>
        Every salary figure on this site traces back to one of four upstream public-data
        authorities. We name the source on every page (occupation, metro, state, ranges), in the
        Dataset JSON-LD, and in the AuthorBox at the bottom of the page.
      </p>
      <ul>
        <li>
          <strong>U.S. Bureau of Labor Statistics — Occupational Employment and Wage Statistics
          (BLS OEWS).</strong> Primary wage source. ~830 occupations × ~595 metro/nonmetro areas;
          annual release in April for the prior May reference period. Current vintage:{' '}
          <strong>May {BLS_DATA_YEAR} (released {BLS_PUBLISHED})</strong>. The OEWS program covers
          nonfarm wage and salary workers in the United States and publishes mean and percentile
          wages at the occupation × area level. We surface the BLS p10/p25/p50/p75/p90 percentile
          distribution verbatim and never alter the underlying values.
        </li>
        <li>
          <strong>U.S. Census Bureau — American Community Survey (ACS).</strong> Cross-reference for
          household income context and metro-area demographics. We pull from ACS 1-year and 5-year
          tables where relevant for state-aggregate context, and label any ACS-derived figure
          explicitly as ACS rather than OEWS.
        </li>
        <li>
          <strong>U.S. Bureau of Economic Analysis — Regional Price Parities (BEA RPP).</strong>{' '}
          Cost-of-living index used to convert nominal BLS OEWS wages into real (purchasing-power)
          wages. RPP is published annually at both metro and state level with US = 100 as the
          national reference. Our CostAdjustedWageTier classifier uses BEA RPP for the
          cost-adjustment step.
        </li>
        <li>
          <strong>U.S. Internal Revenue Service — Statistics of Income (IRS SOI).</strong>{' '}
          Cross-reference for individual income tax statistics by state and ZIP. Used to corroborate
          BLS OEWS wage figures at the state-aggregate level and to surface effective state tax
          differentials in our gross-vs-net analyses.
        </li>
      </ul>
      <p>
        We do not publish wage figures from private salary-aggregation sites (Glassdoor, Levels.fyi,
        Salary.com, Indeed) on SalaryByCity. Those sites collect self-reported, unaudited data with
        survivorship bias; we publish only from public-data agencies whose methodology and sample
        design are documented. Private sources may be referenced in editorial commentary but never
        used to compute a salary figure displayed on a data page.
      </p>

      <h2>Data vintage labeling</h2>
      <p>
        Every salary page carries a visible data-year and "BLS OEWS [year]" attribution. We do not
        rename older BLS data with a newer year, and we do not display the current calendar year on
        a page that derives from an older OEWS release. The Dataset JSON-LD's <code>temporalCoverage</code>{' '}
        and <code>dateModified</code> fields reflect the actual BLS reference period and our last
        review date, not a synthetic refresh date. Our current published vintage is BLS OEWS{' '}
        {BLS_DATA_YEAR} (released {BLS_PUBLISHED}); the methodology page documents how we ingest
        each annual release.
      </p>

      <h2>How we handle BLS suppression</h2>
      <p>
        BLS does not publish wage estimates for occupation × area cells with fewer than five
        reporting employers, or where publication would risk identifying an individual employer.
        When the underlying BLS OEWS median is suppressed, SalaryByCity returns <em>tier=null</em>{' '}
        with <em>confidence='insufficient-data'</em> on the relevant page rather than fabricating a
        synthetic value, interpolating from neighboring metros, or filling the cell from a private
        data source. The page surfaces an explicit "BLS suppressed this combination" caveat. We do
        not silently fill suppressed cells with national medians.
      </p>

      <h2>The CostAdjustedWageTier 5-band classifier</h2>
      <p>
        Our deterministic CostAdjustedWageTier classifier combines BLS OEWS nominal annual median
        wages with BEA Regional Price Parities to rank each occupation × metro by real purchasing
        power relative to the national real median for the same occupation. The five bands
        (TopReal, StrongReal, ModerateReal, BelowMedianReal, WeakReal) and their cutoffs are
        documented in our methodology guide. The
        cutoffs are SalaryByCity's heuristic, not a BLS or BEA official rating, and we disclose
        this on every page that surfaces the tier.
      </p>

      <h2>How we review pages</h2>
      <p>
        Before any page is published, the editorial team reviews:
      </p>
      <ol>
        <li>
          <strong>Source attribution.</strong> Every wage figure on the page can be traced to a
          named BLS OEWS, BEA RPP, Census ACS, or IRS SOI release. No salary figure is shown
          without a labeled source.
        </li>
        <li>
          <strong>Vintage alignment.</strong> The page title, metadata description, on-page
          freshness label, and Dataset JSON-LD <code>temporalCoverage</code> all reflect the same
          BLS OEWS reference period.
        </li>
        <li>
          <strong>Suppression honesty.</strong> Suppressed cells are flagged with a caveat, never
          back-filled from synthetic sources.
        </li>
        <li>
          <strong>Methodology surface.</strong> Any derived metric (CostAdjustedWageTier,
          percentile-spread band, real-wage ratio) is linked to its methodology explainer.
        </li>
        <li>
          <strong>Schema integrity.</strong> Dataset JSON-LD <code>creator</code> points to the
          upstream data agency (BLS OEWS), <code>publisher</code> points to DataPeek Research
          Network, <code>sourceOrganization</code> enumerates all four upstream sources, and{' '}
          <code>reviewedBy</code> points to the SalaryByCity Editorial Team.
        </li>
      </ol>

      <h2>Updates and re-reviews</h2>
      <p>
        Pages are re-reviewed when the underlying BLS OEWS, BEA RPP, Census ACS, or IRS SOI release
        is updated. BLS OEWS publishes annually each April; BEA RPP publishes annually with a ~12
        month lag from BEA; Census ACS publishes 1-year tables annually and 5-year tables annually
        with a longer rolling window. When we re-ingest an annual BLS OEWS or BEA RPP release, the
        previous vintage is replaced atomically across all derived pages, and the{' '}
        <code>dateModified</code> in Dataset JSON-LD is updated to the new BLS OEWS or BEA RPP
        release date — not the current calendar date.
      </p>

      <h2>What we do not publish</h2>
      <p>
        SalaryByCity is informational. We do not publish individual job offers, take-home pay
        calculators that handle filing-status or HSA/401(k) elections, or career advice for
        individual workers. We surface population-level wage data from BLS OEWS, BEA RPP, ACS, and
        IRS SOI and explain how to read it. Specific employment, compensation, or career decisions
        require a qualified professional — see the <a href="/disclaimer/">disclaimer</a> for the
        full scope-of-content statement.
      </p>

      <h2>Interpretation Strip — deterministic editorial composition</h2>
      <p>
        The Interpretation Strip on the hero of every occupation, state, and salary-ranges page
        is a 1-line verdict plus 4 paragraphs (band meaning, occupation-internal meaning, area
        comparison, reader action) composed deterministically from the CostAdjustedWageTier
        (5-band BLS OEWS × BEA RPP real-wage tier) and the percentile-spread band (4-band BLS
        OEWS p90/p10 ladder). The strip is composed by editorial rules embedded in source code at
        build time. Same BLS OEWS and BEA RPP inputs always produce byte-identical output, so the
        strip is auditable cell-by-cell against the BLS OEWS and BEA RPP releases. The
        deterministic composition rule is part of editorial policy: the strip's prose is fixed by
        the (CostAdjustedWageTier × percentile-spread band) pair and the BLS OEWS / BEA RPP
        inputs, which preserves the cell-level audit trail from BLS OEWS and BEA RPP to the
        visible verdict.
      </p>

      <h2>BLS OEWS suppression and BEA RPP fallback policy</h2>
      <p>
        Where BLS OEWS suppresses a published cell for reliability or confidentiality (fewer than
        ~5 reporting employers or relative standard error above the published threshold), the
        page surfaces the suppression honestly and falls back through the documented chain: BLS
        OEWS metro estimate → BLS OEWS state estimate → BLS OEWS national OES file. Where BEA RPP
        is unpublished for a metro, the page falls back BEA RPP metro → BEA RPP state → BEA RPP
        national (=100) and surfaces the fallback level explicitly under the CostAdjustedWageTier
        badge. We do not fabricate, interpolate, or "estimate" a suppressed BLS OEWS or BEA RPP
        value; both the BLS OEWS suppression policy and the BEA RPP fallback policy are
        documented in dedicated guides for reader inspection.
      </p>

      <h2>Corrections</h2>
      <p>
        If a salary figure or label conflicts with the BLS OEWS, BEA RPP, ACS, or IRS SOI source it
        cites, please report it via our <a href="/contact/">contact page</a>. Verified issues are
        corrected on-page and in structured-data together — see our{' '}
        <a href="/corrections-policy/">corrections policy</a> for the full process and timeline.
      </p>

      <AuthorBox />
    </article>
  );
}
