/**
 * SalaryPercentileBand — server-rendered SVG box-plot of BLS OEWS
 * p10/p25/p50/p75/p90 (+ optional mean) for one occupation × area row.
 *
 * Distinct from SalaryChart (which renders 5 horizontal absolute bars):
 * this view shows distribution *shape* — the IQR box (p25-p75) compresses
 * or stretches relative to the p10-p90 whisker, so the reader sees at a
 * glance whether pay is compressed near the median or polarised toward
 * one of the tails.
 *
 * Honest scope:
 *  - All values are BLS OEWS published percentiles for the same occupation
 *    × area row. No interpolation.
 *  - The "national anchor" dashed line is the same BLS row's national
 *    median for the occupation, not a synthesised target or a peer cohort
 *    average.
 *  - Mean marker (dot above the box) is shown only when BLS publishes
 *    an annual_mean for the row. Otherwise omitted.
 */

interface Props {
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  mean?: number | null;
  /** Optional national-level median for the same occupation, drawn as a dashed anchor. */
  nationalMedian?: number | null;
  /** Area label shown in figcaption (e.g. "United States" or "California"). */
  areaLabel?: string;
  /** Occupation title used in aria-label and figcaption. */
  occupationTitle?: string;
  /** Optional override caption — if omitted, an honest default is generated. */
  caption?: string;
  variant?: 'default' | 'compact';
  className?: string;
}

const SIZES = {
  default: { w: 720, h: 140, padT: 18, padR: 28, padB: 50, padL: 28 },
  compact: { w: 360, h: 96, padT: 12, padR: 18, padB: 36, padL: 18 },
} as const;

function fmtUsd(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k`;
  return `$${n.toLocaleString('en-US')}`;
}

export function SalaryPercentileBand({
  p10,
  p25,
  median,
  p75,
  p90,
  mean,
  nationalMedian,
  areaLabel,
  occupationTitle,
  caption,
  variant = 'default',
  className = '',
}: Props) {
  // Honest guard — if any of the five core percentiles is missing/zero we
  // can't honestly render the band. Show nothing rather than fabricating.
  if (!p10 || !p25 || !median || !p75 || !p90) return null;
  if (p90 <= p10) return null;

  const { w, h, padT, padR, padB, padL } = SIZES[variant];
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const cy = padT + plotH / 2;
  const boxH = variant === 'compact' ? 18 : 26;

  // x-scale anchored to p10..p90 (the published BLS range), with 4% padding
  // either side so labels at the extremes don't clip.
  const xMin = p10;
  const xMax = p90;
  const range = xMax - xMin;
  const xPad = range * 0.04;
  const domainLo = xMin - xPad;
  const domainHi = xMax + xPad;
  const xScale = (v: number) => padL + ((v - domainLo) / (domainHi - domainLo)) * plotW;

  // IQR ratio — narrower IQR / wider whisker means most workers cluster near
  // the median. Used for the figcaption phrasing only; no classifier label
  // here (avoid double-classifying — SalaryChart already does the P90/P10
  // tier strip in its own panel).
  const iqrShare = ((p75 - p25) / (p90 - p10)) * 100;

  const boxX1 = xScale(p25);
  const boxX2 = xScale(p75);
  const medianX = xScale(median);
  const whiskerX1 = xScale(p10);
  const whiskerX2 = xScale(p90);
  const meanX = mean != null ? xScale(mean) : null;
  const anchorX = nationalMedian != null ? xScale(nationalMedian) : null;

  const ariaLabel = `Salary percentile band${occupationTitle ? ` for ${occupationTitle}` : ''}${areaLabel ? ` in ${areaLabel}` : ''}. BLS OEWS p10 ${fmtUsd(p10)}, p25 ${fmtUsd(p25)}, median ${fmtUsd(median)}, p75 ${fmtUsd(p75)}, p90 ${fmtUsd(p90)}.`;

  return (
    <figure className={`my-4 ${className}`}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={ariaLabel}
        className="w-full h-auto bg-blue-50/30 rounded-lg border border-blue-200"
      >
        <title>{ariaLabel}</title>

        {/* Horizontal track */}
        <line
          x1={padL}
          x2={w - padR}
          y1={cy}
          y2={cy}
          stroke="#cbd5e1"
          strokeWidth={1}
        />

        {/* Whisker: p10..p90 */}
        <line
          x1={whiskerX1}
          x2={whiskerX2}
          y1={cy}
          y2={cy}
          stroke="#475569"
          strokeWidth={2}
        />
        {/* Whisker end caps */}
        <line x1={whiskerX1} x2={whiskerX1} y1={cy - 10} y2={cy + 10} stroke="#475569" strokeWidth={2} />
        <line x1={whiskerX2} x2={whiskerX2} y1={cy - 10} y2={cy + 10} stroke="#475569" strokeWidth={2} />

        {/* IQR box: p25..p75 */}
        <rect
          x={boxX1}
          y={cy - boxH / 2}
          width={Math.max(2, boxX2 - boxX1)}
          height={boxH}
          fill="rgba(59, 130, 246, 0.20)"
          stroke="#2563eb"
          strokeWidth={1.5}
        />

        {/* Median tick inside the box */}
        <line
          x1={medianX}
          x2={medianX}
          y1={cy - boxH / 2}
          y2={cy + boxH / 2}
          stroke="#1d4ed8"
          strokeWidth={2.5}
        />

        {/* Mean marker (small dot above box) — drawn only when BLS publishes mean */}
        {meanX != null && (
          <g>
            <circle cx={meanX} cy={cy - boxH / 2 - 7} r={3.5} fill="#0f172a" stroke="#ffffff" strokeWidth={1} />
            <text
              x={meanX}
              y={cy - boxH / 2 - 13}
              fontSize={9}
              fill="#0f172a"
              textAnchor="middle"
            >
              mean
            </text>
          </g>
        )}

        {/* National anchor (dashed vertical) — only if drawn within the visible range */}
        {anchorX != null && anchorX >= padL && anchorX <= w - padR && (
          <g>
            <line
              x1={anchorX}
              x2={anchorX}
              y1={padT}
              y2={padT + plotH}
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <text
              x={anchorX}
              y={padT + 8}
              fontSize={9}
              fill="#64748b"
              textAnchor="middle"
            >
              US median
            </text>
          </g>
        )}

        {/* Tick labels — p10, median, p90 only (avoid clutter) */}
        <g>
          <text x={whiskerX1} y={cy + boxH / 2 + 16} fontSize={10} fill="#475569" textAnchor="middle">
            P10 {fmtUsd(p10)}
          </text>
          <text x={medianX} y={cy + boxH / 2 + 16} fontSize={10} fontWeight="700" fill="#1d4ed8" textAnchor="middle">
            P50 {fmtUsd(median)}
          </text>
          <text x={whiskerX2} y={cy + boxH / 2 + 16} fontSize={10} fill="#475569" textAnchor="middle">
            P90 {fmtUsd(p90)}
          </text>
        </g>

        {/* Subtle p25/p75 labels above the box */}
        <text x={boxX1} y={cy - boxH / 2 - 4} fontSize={9} fill="#1e40af" textAnchor="middle">
          {fmtUsd(p25)}
        </text>
        <text x={boxX2} y={cy - boxH / 2 - 4} fontSize={9} fill="#1e40af" textAnchor="middle">
          {fmtUsd(p75)}
        </text>
      </svg>
      <figcaption className="text-xs text-slate-600 mt-2 leading-relaxed">
        {caption ??
          `BLS OEWS percentile band${occupationTitle ? ` — ${occupationTitle}` : ''}${areaLabel ? `, ${areaLabel}` : ''}. The blue box is the middle-50% of workers (P25 ${fmtUsd(p25)} → P75 ${fmtUsd(p75)}); the grey whisker extends to P10 ${fmtUsd(p10)} and P90 ${fmtUsd(p90)}. The dark tick is the published median ${fmtUsd(median)}. The IQR (middle-50%) covers ${iqrShare.toFixed(0)}% of the P10-P90 range — a narrower box means most workers cluster near the median${anchorX != null ? '; the dashed line shows the same occupation\'s national median for comparison' : ''}.`}
      </figcaption>
    </figure>
  );
}
