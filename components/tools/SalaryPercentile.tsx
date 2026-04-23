"use client";
import { useState, useMemo } from "react";

interface Props {
  occupationTitle: string;
  medianSalary: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  nationalMedian?: number;
}

function fmt(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

function estimatePercentile(
  salary: number,
  p10: number,
  p25: number,
  median: number,
  p75: number,
  p90: number
): number {
  const points: [number, number][] = [
    [p10, 10],
    [p25, 25],
    [median, 50],
    [p75, 75],
    [p90, 90],
  ];

  if (salary <= p10) return Math.max(1, Math.round((salary / p10) * 10));
  if (salary >= p90) return Math.min(99, 90 + Math.round(((salary - p90) / (p90 * 0.5)) * 9));

  for (let i = 0; i < points.length - 1; i++) {
    const [valLow, pctLow] = points[i];
    const [valHigh, pctHigh] = points[i + 1];
    if (salary >= valLow && salary <= valHigh) {
      const ratio = (salary - valLow) / (valHigh - valLow);
      return Math.round(pctLow + ratio * (pctHigh - pctLow));
    }
  }
  return 50;
}

export function SalaryPercentile({
  occupationTitle,
  medianSalary,
  p10,
  p25,
  p75,
  p90,
  nationalMedian = 46310,
}: Props) {
  const [salary, setSalary] = useState(medianSalary);

  const result = useMemo(() => {
    const percentile = estimatePercentile(salary, p10, p25, medianSalary, p75, p90);
    const topPct = 100 - percentile;
    const diffMedian = ((salary - medianSalary) / medianSalary) * 100;
    const diffNational = ((salary - nationalMedian) / nationalMedian) * 100;
    return { percentile, topPct, diffMedian, diffNational };
  }, [salary, p10, p25, medianSalary, p75, p90, nationalMedian]);

  // Bar marker positions (percentage across the bar)
  const barMin = p10 * 0.8;
  const barMax = p90 * 1.2;
  const toPos = (val: number) =>
    Math.min(100, Math.max(0, ((val - barMin) / (barMax - barMin)) * 100));

  const markers = [
    { label: "P10", value: p10, pos: toPos(p10) },
    { label: "P25", value: p25, pos: toPos(p25) },
    { label: "Median", value: medianSalary, pos: toPos(medianSalary) },
    { label: "P75", value: p75, pos: toPos(p75) },
    { label: "P90", value: p90, pos: toPos(p90) },
  ];
  const userPos = toPos(salary);

  const verdictColor =
    result.percentile >= 75
      ? "text-green-700"
      : result.percentile >= 50
        ? "text-blue-700"
        : result.percentile >= 25
          ? "text-amber-700"
          : "text-red-700";

  return (
    <section className="my-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
      <h2 className="text-xl font-bold mb-1">Salary Percentile Calculator</h2>
      <p className="text-sm text-slate-500 mb-4">
        See where your salary ranks among {occupationTitle} professionals
      </p>

      {/* Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Enter your annual salary
        </label>
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-slate-600">$</span>
          <input
            type="number"
            min={20000}
            max={300000}
            step={1000}
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value) || 20000)}
            className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <input
          type="range"
          min={20000}
          max={300000}
          step={1000}
          value={salary}
          onChange={(e) => setSalary(Number(e.target.value))}
          className="w-full mt-3 accent-blue-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>$20K</span>
          <span>$300K</span>
        </div>
      </div>

      {/* Verdict */}
      <div className="bg-white rounded-lg p-4 mb-5 border border-slate-200">
        <p className={`text-lg font-bold ${verdictColor}`}>
          Your salary of {fmt(salary)} is in the{" "}
          <span className="underline decoration-2">
            {result.topPct <= 10
              ? `top ${result.topPct}%`
              : `${getOrdinal(result.percentile)} percentile`}
          </span>{" "}
          for {occupationTitle}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="text-sm">
            <span className="text-slate-500">vs occupation median </span>
            <span
              className={`font-semibold ${result.diffMedian >= 0 ? "text-green-700" : "text-red-600"}`}
            >
              {result.diffMedian >= 0 ? "+" : ""}
              {result.diffMedian.toFixed(1)}%
            </span>
            <span className="text-slate-400"> ({fmt(medianSalary)})</span>
          </div>
          <div className="text-sm">
            <span className="text-slate-500">vs national median </span>
            <span
              className={`font-semibold ${result.diffNational >= 0 ? "text-green-700" : "text-red-600"}`}
            >
              {result.diffNational >= 0 ? "+" : ""}
              {result.diffNational.toFixed(1)}%
            </span>
            <span className="text-slate-400"> ({fmt(nationalMedian)})</span>
          </div>
        </div>
      </div>

      {/* Percentile bar */}
      <div className="mb-2">
        <div className="text-sm font-medium text-slate-600 mb-2">
          Salary Distribution for {occupationTitle}
        </div>
        <div className="relative h-10 bg-gradient-to-r from-red-200 via-yellow-100 via-50% to-green-200 rounded-full overflow-visible">
          {/* Marker lines */}
          {markers.map((m) => (
            <div
              key={m.label}
              className="absolute top-0 h-full flex flex-col items-center"
              style={{ left: `${m.pos}%`, transform: "translateX(-50%)" }}
            >
              <div className="w-px h-full bg-slate-400/60" />
            </div>
          ))}

          {/* User position indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 z-10"
            style={{ left: `${userPos}%`, transform: `translateX(-50%) translateY(-50%)` }}
          >
            <div className="w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg" />
          </div>
        </div>

        {/* Labels below bar */}
        <div className="relative h-10 mt-1">
          {markers.map((m) => (
            <div
              key={m.label}
              className="absolute text-center"
              style={{ left: `${m.pos}%`, transform: "translateX(-50%)" }}
            >
              <div className="text-[10px] text-slate-500 font-medium">{m.label}</div>
              <div className="text-[10px] text-slate-400">{fmt(m.value)}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-2">
        Percentile estimated from BLS p10/p25/median/p75/p90 wage data.
        Actual distribution may vary by experience and location.
      </p>
    </section>
  );
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
