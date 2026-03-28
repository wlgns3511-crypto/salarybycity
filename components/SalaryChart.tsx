interface SalaryChartProps {
  p10: number; p25: number; median: number; p75: number; p90: number;
}

export function SalaryChart({ p10, p25, median, p75, p90 }: SalaryChartProps) {
  const max = p90 || 1;
  const bars = [
    { label: "P10", value: p10, color: "#94a3b8" },
    { label: "P25", value: p25, color: "#64748b" },
    { label: "Median", value: median, color: "#3b82f6" },
    { label: "P75", value: p75, color: "#2563eb" },
    { label: "P90", value: p90, color: "#1d4ed8" },
  ];

  return (
    <div className="space-y-2 my-4">
      <h3 className="text-sm font-semibold text-slate-600">Salary Distribution</h3>
      {bars.map((b) => (
        <div key={b.label} className="flex items-center gap-2 text-xs">
          <span className="w-14 text-right text-slate-500">{b.label}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-2 text-white font-medium"
              style={{ width: `${(b.value / max) * 100}%`, backgroundColor: b.color, minWidth: "2rem" }}
            >
              ${(b.value / 1000).toFixed(0)}k
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
