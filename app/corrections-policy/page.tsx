import type { Metadata } from "next";
import { BLS_DATA_YEAR, BLS_PUBLISHED, DB_UPDATED } from "@/lib/authorship";
import { AuthorBox } from "@/components/AuthorBox";

export const metadata: Metadata = {
  title: "Corrections Policy",
  description:
    "How SalaryByCity reviews and applies corrections to BLS OEWS, BEA RPP, Census ACS, and IRS SOI-derived salary pages. Reader-reported issues, schema updates, and the timeline for verified corrections.",
  alternates: { canonical: "/corrections-policy/" },
  openGraph: { url: "/corrections-policy/" },
};

export default function CorrectionsPolicyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
      <h1>Corrections Policy</h1>
      <p className="text-sm text-slate-500">
        Data snapshot <time dateTime={DB_UPDATED}>{DB_UPDATED}</time> · BLS OEWS vintage{' '}
        {BLS_DATA_YEAR} (released {BLS_PUBLISHED})
      </p>

      <h2>Scope of corrections we handle</h2>
      <p>
        SalaryByCity publishes wage and cost-adjusted-wage data derived from four U.S. federal
        statistical agencies: <strong>BLS OEWS</strong> (Occupational Employment and Wage
        Statistics), <strong>BEA RPP</strong> (Regional Price Parities), <strong>Census ACS</strong>{' '}
        (American Community Survey), and <strong>IRS SOI</strong> (Statistics of Income). A
        correctable issue on SalaryByCity is one of the following:
      </p>
      <ul>
        <li>
          A wage figure on a SalaryByCity page does not match the BLS OEWS, BEA RPP, ACS, or IRS
          SOI source it cites.
        </li>
        <li>
          A data-vintage label is misaligned (e.g. page metadata claims BLS OEWS {BLS_DATA_YEAR}{' '}
          but the table renders values from a prior release).
        </li>
        <li>
          A CostAdjustedWageTier band, percentile-spread band, or real-wage ratio is computed
          incorrectly from BLS OEWS and BEA RPP inputs.
        </li>
        <li>
          A Dataset JSON-LD field misattributes the data <code>creator</code>, <code>publisher</code>,
          or <code>sourceOrganization</code>.
        </li>
        <li>
          A BLS-suppressed cell is filled with a non-suppressed value rather than flagged as
          insufficient-data.
        </li>
      </ul>

      <h2>What is not a correction</h2>
      <p>
        SalaryByCity does not adjust the BLS OEWS, BEA RPP, ACS, or IRS SOI underlying figures.
        Disagreements with the underlying federal release belong to BLS, BEA, Census, or IRS
        respectively, and are handled through their official correction channels — not through
        SalaryByCity. Examples of reports we cannot act on:
      </p>
      <ul>
        <li>
          "The BLS OEWS median is too low for my occupation in my metro" — BLS OEWS is the source
          of record. We do not adjust BLS figures based on individual experience or private
          aggregator data.
        </li>
        <li>
          "Glassdoor / Levels.fyi / Salary.com shows a different number" — we do not use private
          salary aggregators for SalaryByCity data pages (see <a href="/editorial-policy/">editorial policy</a>).
        </li>
        <li>
          "The BEA RPP for my metro feels wrong" — RPP is published by BEA at the MSA level using a
          documented methodology. We publish RPP as-released and do not adjust it.
        </li>
        <li>
          "I think the data is too old" — BLS OEWS is published annually with a 12–18 month lag.
          BEA RPP is published annually with a similar lag. These lags are inherent to the federal
          statistical release cycle and are not a SalaryByCity correction.
        </li>
      </ul>

      <h2>How to report a correction</h2>
      <p>
        Send the following through our <a href="/contact/">contact page</a>:
      </p>
      <ol>
        <li>The exact URL of the SalaryByCity page where you see the issue.</li>
        <li>
          The specific figure or label that appears incorrect (e.g. "the p90 for Software
          Developers in Seattle is shown as $X, but BLS OEWS {BLS_DATA_YEAR} release shows $Y").
        </li>
        <li>
          The upstream source you are comparing against — a BLS OEWS table URL, BEA RPP table URL,
          Census ACS table URL, or IRS SOI table URL. We can verify only against named federal
          sources.
        </li>
        <li>
          (Optional) A screenshot or paste of the SalaryByCity page section, so we can match it
          even if the page has been re-published.
        </li>
      </ol>

      <h2>How we process verified corrections</h2>
      <p>
        Each reported issue is reviewed by the SalaryByCity Editorial Team within 7 business days.
        Our process:
      </p>
      <ol>
        <li>
          <strong>Verify against the named source.</strong> We pull the BLS OEWS, BEA RPP, ACS, or
          IRS SOI release the page cites and compare the reported figure cell-by-cell.
        </li>
        <li>
          <strong>If verified, fix the underlying data and trigger a rebuild.</strong> SalaryByCity
          is a static-generated site; verified corrections require re-ingesting the upstream source
          and rebuilding the affected pages. The on-page figure, the page metadata, the Dataset
          JSON-LD, and the visible freshness label are updated together — never one without the
          others.
        </li>
        <li>
          <strong>Update the data snapshot timestamp.</strong> The site-wide DB_UPDATED constant is
          advanced to reflect the correction date; per-page Dataset <code>dateModified</code> is
          also advanced so structured-data consumers see the change.
        </li>
        <li>
          <strong>Cross-check related derived metrics.</strong> If the corrected value changes a
          CostAdjustedWageTier band, percentile-spread band, or real-wage ratio on any other page,
          we recompute and rebuild those pages atomically.
        </li>
      </ol>

      <h2>Schema and structured-data corrections</h2>
      <p>
        Corrections to Dataset JSON-LD attribution (e.g. <code>creator</code>,{' '}
        <code>publisher</code>, <code>sourceOrganization</code>, <code>reviewedBy</code>) are
        handled the same way as data corrections: we update the schema helper, rebuild all affected
        pages so the new structured data is rendered, and re-deploy. We do not silently change
        structured data without also updating the visible source attribution on the page; the two
        layers must stay aligned. Per schema.org/Dataset semantics, <code>creator</code> names the
        upstream agency that created the underlying data (BLS OEWS for wage rows, BEA for RPP rows,
        Census ACS for demographic rows, IRS SOI for tax-corroboration rows), <code>publisher</code>{' '}
        names SalaryByCity as the platform that compiled and published, and <code>reviewedBy</code>{' '}
        names the SalaryByCity Editorial Team. <code>sourceOrganization</code> enumerates every
        upstream agency the page composites (BLS OEWS, BEA RPP, Census ACS, IRS SOI in the standard
        order); a missing or out-of-order entry is a correction-priority issue and gets fixed
        through the rebuild flow described above.
      </p>

      <h2>Vintage refresh ≠ correction</h2>
      <p>
        A normal annual update — re-ingesting the next BLS OEWS release, the next BEA RPP release,
        the next ACS table, or the next IRS SOI table — is a <em>refresh</em>, not a correction.
        Refreshes are handled on the federal release cycle and announced via the methodology page,
        not the corrections page. We do not retroactively re-label a page from the prior vintage as
        "corrected" when we ingest a new BLS OEWS release.
      </p>

      <h2>What gets a public note</h2>
      <p>
        If a correction materially changes a figure that was visible to readers (more than a small
        rounding difference, or a wage figure that crosses a CostAdjustedWageTier band boundary),
        we note the correction inline on the page. Minor structural corrections (schema attribution
        fixes, freshness-label alignment, suppression-flag accuracy) are applied silently — they do
        not change the wage figure a reader saw.
      </p>

      <h2>Interpretation Strip and derived-metric corrections</h2>
      <p>
        The Interpretation Strip on the hero of every occupation, state, and salary-ranges page
        composes two upstream classifiers — the CostAdjustedWageTier (5-band real-wage tier from
        BLS OEWS nominal median deflated by BEA Regional Price Parity) and the percentile-spread
        band (4-band ladder from BLS OEWS p10/p90). Corrections affecting either input are
        propagated through the strip the same way as any BLS OEWS or BEA RPP figure: we
        recompute the band, regenerate the deterministic 4-paragraph prose, and rebuild every page
        where the strip surfaces. If a corrected BLS OEWS p10 changes the p90/p10 ratio enough to
        cross a band boundary (Compressed ↔ Moderate ↔ Wide ↔ Extreme), the strip's verdict line
        and paragraph 2 (occupation-internal meaning) change with it. If a corrected BEA RPP value
        moves the real-wage ratio across a CostAdjustedWageTier cutoff (TopReal ↔ StrongReal ↔
        ModerateReal ↔ BelowMedianReal ↔ WeakReal), paragraphs 1, 3, and 4 are regenerated. The
        strip is deterministic: same BLS OEWS and BEA RPP inputs always produce byte-identical
        output, so corrections are auditable cell-by-cell against the federal release.
      </p>

      <h2>Fallback-chain corrections (BEA RPP and BLS OEWS suppression)</h2>
      <p>
        Two specific correction patterns are common because they touch the metro → state →
        national fallback chain on both sides of the math:
      </p>
      <ul>
        <li>
          <strong>BEA RPP fallback level mismatch.</strong> A page that should show metro-level
          BEA RPP but instead shows state-level RPP (or vice versa) because the wrong BEA vintage
          was ingested. Verify against the latest BEA RPP release at bea.gov/data/prices-inflation,
          confirm which metros are published, and rebuild the affected occupation × area pages so
          the CostAdjustedWageTier methodology block names the correct BEA RPP level. The
          companion guide on the BEA RPP fallback chain documents the policy in full.
        </li>
        <li>
          <strong>BLS OEWS suppression handling.</strong> A page that shows a BLS OEWS suppressed
          cell as a numeric value rather than flagging the suppression honestly. Verify against the
          latest BLS OEWS release at bls.gov/oes — every cell BLS publishes carries a reliability
          annotation (the "*" footnote indicates suppression). If a SalaryByCity page renders a
          number for a BLS-suppressed cell, we treat that as a correction-priority issue and
          replace with the documented fallback-chain notice rather than a fabricated value.
        </li>
      </ul>

      <h2>What we will not change on reader report</h2>
      <p>
        Three classes of report are out of scope for the corrections process and are routed back
        to the relevant federal agency:
      </p>
      <ul>
        <li>
          Disagreements with the underlying BLS OEWS, BEA RPP, Census ACS, or IRS SOI figure as
          released. The federal release is the source of record; we do not adjust the federal
          value. Report the issue directly to BLS (bls.gov/oes), BEA (bea.gov), Census
          (census.gov/acs), or IRS (irs.gov/statistics).
        </li>
        <li>
          Disagreements with the CostAdjustedWageTier cutoffs (1.30 / 1.10 / 0.95 / 0.80) or the
          percentile-spread cutoffs (3.0× / 4.0× / 6.0×). Those are SalaryByCity heuristics
          documented in the methodology page; we will revise them if a methodology revision is
          warranted but not silently per-page.
        </li>
        <li>
          Disagreements about which BLS OEWS or BEA RPP vintage we ingested. We always ingest the
          most recent released vintage and name it in the page footer; pre-publishing a not-yet-
          released vintage is not a correction we can make.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        Report corrections through our <a href="/contact/">contact page</a>. Editorial policy is
        documented separately on the <a href="/editorial-policy/">editorial policy page</a>.
        Methodology, including the BLS OEWS suppression policy, the BEA RPP fallback chain, and
        the CostAdjustedWageTier classifier cutoffs, is on the{' '}
        <a href="/methodology/">methodology page</a>.
      </p>

      <AuthorBox />
    </article>
  );
}
