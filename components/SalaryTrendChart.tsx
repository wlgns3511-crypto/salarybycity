/**
 * Multi-year nominal vs. real wage chart, server-rendered as inline SVG.
 *
 * No client JS, no recharts — Trap #34/#36 safe (RSC string-color hazard avoided
 * by hard-coding hex values inline). Renders for any series of (year, nominal,
 * real) points; auto-scales the y-axis.
 */

export interface TrendPoint {
  year: number;
  nominal: number;
  real: number | null;
}

interface SalaryTrendChartProps {
  series: TrendPoint[];
  /** Year used as the real-wage base (constant dollars). */
  baseYear: number;
  /** Title text rendered above the chart. */
  title: string;
  /** Optional caption shown below the chart. */
  caption?: string;
}

const W = 640;
const H = 280;
const PAD = { top: 32, right: 16, bottom: 36, left: 64 };

function formatK(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(n / 1000)}k`;
}

export function SalaryTrendChart({ series, baseYear, title, caption }: SalaryTrendChartProps) {
  if (series.length < 2) {
    return (
      <div className="my-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Not enough multi-year data to plot a trend ({series.length} year{series.length === 1 ? '' : 's'}).
      </div>
    );
  }

  const years = series.map((d) => d.year);
  const allValues = series.flatMap((d) => [d.nominal, d.real ?? d.nominal]);
  const yMin = Math.min(...allValues);
  const yMax = Math.max(...allValues);
  const yPad = (yMax - yMin) * 0.12;
  const yLo = Math.max(0, yMin - yPad);
  const yHi = yMax + yPad;
  const xMin = Math.min(...years);
  const xMax = Math.max(...years);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xScale = (year: number) => PAD.left + ((year - xMin) / Math.max(1, xMax - xMin)) * innerW;
  const yScale = (val: number) => PAD.top + (1 - (val - yLo) / Math.max(1, yHi - yLo)) * innerH;

  const nominalPath = series.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.year)},${yScale(d.nominal)}`).join(' ');
  const realPoints = series.filter((d) => d.real != null) as Array<TrendPoint & { real: number }>;
  const realPath = realPoints.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.year)},${yScale(d.real)}`).join(' ');

  // y-axis tick marks: 5 evenly spaced
  const yTicks: number[] = [];
  for (let i = 0; i <= 4; i++) {
    yTicks.push(yLo + ((yHi - yLo) * i) / 4);
  }

  // Compute headline figures for the caption
  const first = series[0];
  const last = series[series.length - 1];
  const nominalChangePct = first.nominal > 0
    ? Math.round(((last.nominal - first.nominal) / first.nominal) * 1000) / 10
    : null;
  const firstReal = first.real ?? first.nominal;
  const lastReal = last.real ?? last.nominal;
  const realChangePct = firstReal > 0
    ? Math.round(((lastReal - firstReal) / firstReal) * 1000) / 10
    : null;

  return (
    <figure className="my-4">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4" style={{ backgroundColor: '#1d4ed8' }} />
              <span className="text-slate-700">Nominal</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4" style={{ backgroundColor: '#10b981' }} />
              <span className="text-slate-700">Real ({baseYear} $)</span>
            </span>
          </div>
        </div>
        <svg
          role="img"
          aria-label={title}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxHeight: 280 }}
        >
          {/* y-axis grid + labels */}
          {yTicks.map((t, i) => (
            <g key={`y${i}`}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yScale(t)}
                y2={yScale(t)}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={yScale(t) + 4} textAnchor="end" fontSize={11} fill="#64748b">
                {formatK(t)}
              </text>
            </g>
          ))}
          {/* x-axis labels */}
          {series.map((d) => (
            <text
              key={`x${d.year}`}
              x={xScale(d.year)}
              y={H - PAD.bottom + 18}
              textAnchor="middle"
              fontSize={11}
              fill="#475569"
            >
              {d.year}
            </text>
          ))}
          {/* nominal line */}
          <path d={nominalPath} fill="none" stroke="#1d4ed8" strokeWidth={2.5} />
          {series.map((d) => (
            <circle key={`np${d.year}`} cx={xScale(d.year)} cy={yScale(d.nominal)} r={4} fill="#1d4ed8" />
          ))}
          {/* real line */}
          {realPath && (
            <>
              <path d={realPath} fill="none" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" />
              {realPoints.map((d) => (
                <circle key={`rp${d.year}`} cx={xScale(d.year)} cy={yScale(d.real)} r={3.5} fill="#10b981" />
              ))}
            </>
          )}
          {/* axes */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#cbd5e1" />
          <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#cbd5e1" />
        </svg>
      </div>
      <figcaption className="mt-2 text-xs leading-relaxed text-slate-600">
        {caption ?? (
          <>
            Nominal median wage moved from {formatK(first.nominal)} ({first.year}) to {formatK(last.nominal)} ({last.year}) —
            {nominalChangePct != null && <> a {nominalChangePct >= 0 ? '+' : ''}{nominalChangePct}% nominal change.</>}
            {realChangePct != null && (
              <> Adjusted to {baseYear} dollars (CPI-U), the real change was {realChangePct >= 0 ? '+' : ''}{realChangePct}%.</>
            )}
            {' '}Source: BLS OEWS percentile wages × CPI-U series CUUR0000SA0.
          </>
        )}
      </figcaption>
    </figure>
  );
}
