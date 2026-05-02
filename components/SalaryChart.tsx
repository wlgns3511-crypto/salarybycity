interface SalaryChartProps {
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
}

type SpreadTier = {
  label: string;
  className: string;
  description: string;
};

function classifySpread(p90: number, p10: number): SpreadTier {
  if (p10 <= 0) return { label: 'unknown', className: 'bg-slate-100 text-slate-700', description: 'P10 not reported.' };
  const ratio = p90 / p10;
  if (ratio < 2.0) {
    return {
      label: 'Very compressed',
      className: 'bg-emerald-100 text-emerald-800',
      description: 'Pay differences across this occupation are unusually narrow — most workers earn within ~2× of one another.',
    };
  }
  if (ratio < 2.6) {
    return {
      label: 'Compressed',
      className: 'bg-emerald-50 text-emerald-700',
      description: 'Pay differences are tighter than typical — top earners make about 2–2.5× the bottom decile.',
    };
  }
  if (ratio < 3.4) {
    return {
      label: 'Typical spread',
      className: 'bg-slate-100 text-slate-700',
      description: 'Pay distribution is roughly in line with the cross-occupation U.S. average (P90/P10 ≈ 3.0).',
    };
  }
  if (ratio < 4.5) {
    return {
      label: 'Wide spread',
      className: 'bg-amber-100 text-amber-800',
      description: 'Top earners make 3.4–4.5× the bottom decile — a large gap that usually reflects experience, certification, or sub-specialty divergence.',
    };
  }
  return {
    label: 'Very wide spread',
    className: 'bg-rose-100 text-rose-800',
    description: 'Top earners make more than 4.5× the bottom decile — outsized spread typically driven by partnership tracks, performance pay, or high-sub-specialty premiums.',
  };
}

export function SalaryChart({ p10, p25, median, p75, p90 }: SalaryChartProps) {
  const max = p90 || 1;
  const bars = [
    { label: 'P10', value: p10, color: '#94a3b8' },
    { label: 'P25', value: p25, color: '#64748b' },
    { label: 'Median', value: median, color: '#3b82f6' },
    { label: 'P75', value: p75, color: '#2563eb' },
    { label: 'P90', value: p90, color: '#1d4ed8' },
  ];

  const spread = classifySpread(p90, p10);
  const ratio = p10 > 0 ? p90 / p10 : null;

  return (
    <div className="space-y-2 my-4">
      <h3 className="text-sm font-semibold text-slate-600">Salary Distribution</h3>
      {bars.map((b) => (
        <div key={b.label} className="flex items-center gap-2 text-xs">
          <span className="w-14 text-right text-slate-500">{b.label}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-2 text-white font-medium"
              style={{ width: `${(b.value / max) * 100}%`, backgroundColor: b.color, minWidth: '2rem' }}
            >
              ${(b.value / 1000).toFixed(0)}k
            </div>
          </div>
        </div>
      ))}

      {ratio !== null && (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${spread.className}`}>
              {spread.label}
            </span>
            <span className="text-slate-600">
              P90/P10 = <span className="font-semibold text-slate-900">{ratio.toFixed(2)}×</span>
            </span>
            <span className="text-slate-500">
              · Top-decile earners make about ${Math.round(p90 / Math.max(p10, 1))} for every $1 the bottom-decile earns
            </span>
          </div>
          <p className="mt-2 text-slate-700">{spread.description}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Source: BLS OEWS percentile wages. The P90/P10 ratio is a standard inequality measure within an occupation.
          </p>
        </div>
      )}
    </div>
  );
}
