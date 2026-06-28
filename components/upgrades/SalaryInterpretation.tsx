/**
 * SalaryInterpretation — composite verdict box that surfaces the three-lever
 * Salary Interpretation reading on /jobs/[slug]/ and /state/[slug]/.
 *
 * Composes (already imported by the parent page):
 *   - CostAdjustedWageTier  (BLS OEWS × BEA RPP)
 *   - WageGrowthVelocityBand (BLS OEWS YoY pair)
 *   - OccupationDensityScore (BLS OEWS cross-area employment)
 *
 * The component is presentational — all the band-picking, percentile rank,
 * decision-framing, and 4-paragraph branching happens in
 * lib/salary-interpretation.ts. The component renders the verdict line,
 * tones the box per decision, and lays out the four paragraphs in the same
 * "What it means / inside the occupation / vs other areas / acting on it"
 * frame readers see on the rest of the site.
 */

import type { SalaryInterpretation as SalaryInterpretationData } from '@/lib/salary-interpretation';

interface Props {
  data: SalaryInterpretationData;
}

const DECISION_LABEL: Record<SalaryInterpretationData['decision'], string> = {
  'relocate-up': 'Relocate-up framing',
  'stay-grow': 'Stay-and-grow framing',
  'lateral-shift': 'Lateral-shift framing',
  'data-incomplete': 'Data-incomplete — broaden the read',
};

export function SalaryInterpretation({ data }: Props) {
  return (
    <section
      data-upgrade="composite-verdict"
      aria-label="Salary interpretation composite verdict"
      className={`my-6 rounded-xl border p-5 md:p-6 ring-1 ${data.tone.bg} ${data.tone.ring}`}
    >
      <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${data.tone.text}`}>
        Composite verdict — BLS OEWS × BEA RPP · 3 levers
      </div>
      <p className="text-lg md:text-xl font-bold text-slate-900 leading-snug mb-2">
        {data.verdict}
      </p>
      <p className={`text-xs font-semibold mb-4 ${data.tone.text}`}>
        {DECISION_LABEL[data.decision]}
      </p>
      <div className="space-y-3 text-sm md:text-[15px] text-slate-700 leading-relaxed">
        <p>
          <strong className="text-slate-900">Cost-adjusted reading. </strong>
          {data.paragraphs.costAdjusted}
        </p>
        <p>
          <strong className="text-slate-900">Growth trajectory. </strong>
          {data.paragraphs.growth}
        </p>
        <p>
          <strong className="text-slate-900">Market thickness. </strong>
          {data.paragraphs.density}
        </p>
        <p>
          <strong className="text-slate-900">Acting on the composite. </strong>
          {data.paragraphs.decisionFraming}
        </p>
      </div>
    </section>
  );
}
