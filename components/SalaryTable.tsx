import { formatSalary, formatHourly } from '@/lib/format';
import type { WageData } from '@/lib/db';

export function SalaryOverview({ wage, jobTitle }: { wage: WageData; jobTitle: string }) {
  const rows = [
    { label: '10th Percentile', annual: wage.annual_p10 },
    { label: '25th Percentile', annual: wage.annual_p25 },
    { label: 'Median', annual: wage.annual_median },
    { label: '75th Percentile', annual: wage.annual_p75 },
    { label: '90th Percentile', annual: wage.annual_p90 },
    { label: 'Mean (Average)', annual: wage.annual_mean },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="text-left p-3 font-semibold">Percentile</th>
            <th className="text-right p-3 font-semibold">Annual Salary</th>
            <th className="text-right p-3 font-semibold">Monthly</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-slate-200 hover:bg-slate-50">
              <td className="p-3">{row.label}</td>
              <td className="p-3 text-right font-medium">{formatSalary(row.annual)}</td>
              <td className="p-3 text-right text-slate-600">
                {row.annual ? formatSalary(Math.round(row.annual / 12)) : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SalaryBar({ wage }: { wage: WageData }) {
  if (!wage.annual_p10 || !wage.annual_p90 || !wage.annual_median) return null;

  const min = wage.annual_p10;
  const max = wage.annual_p90;
  const range = max - min;
  if (range <= 0) return null;

  const medianPos = ((wage.annual_median - min) / range) * 100;
  const p25Pos = wage.annual_p25 ? ((wage.annual_p25 - min) / range) * 100 : 0;
  const p75Pos = wage.annual_p75 ? ((wage.annual_p75 - min) / range) * 100 : 100;

  return (
    <div className="my-6">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{formatSalary(min)}</span>
        <span>{formatSalary(max)}</span>
      </div>
      <div className="relative h-8 bg-slate-200 rounded-full overflow-hidden">
        {/* P25-P75 range */}
        <div
          className="absolute h-full bg-blue-400"
          style={{ left: `${p25Pos}%`, width: `${p75Pos - p25Pos}%` }}
        />
        {/* Median marker */}
        <div
          className="absolute h-full w-1 bg-blue-800"
          style={{ left: `${medianPos}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>10th %ile</span>
        <span className="font-medium text-blue-800">Median: {formatSalary(wage.annual_median)}</span>
        <span>90th %ile</span>
      </div>
    </div>
  );
}

interface CityCompareRow {
  area_title: string;
  area_slug: string;
  annual_median: number | null;
}

export function CityComparisonTable({
  rows,
  jobSlug,
}: {
  rows: CityCompareRow[];
  jobSlug: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="text-left p-3 font-semibold">Metro Area</th>
            <th className="text-right p-3 font-semibold">Median Salary</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.area_slug} className="border-b border-slate-200 hover:bg-slate-50">
              <td className="p-3">
                <a
                  href={`/jobs/${jobSlug}/${row.area_slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {row.area_title}
                </a>
              </td>
              <td className="p-3 text-right font-medium">{formatSalary(row.annual_median)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface JobCompareRow {
  occ_title: string;
  occ_slug: string;
  annual_median: number | null;
}

export function JobComparisonTable({
  rows,
  areaSlug,
}: {
  rows: JobCompareRow[];
  areaSlug: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="text-left p-3 font-semibold">Occupation</th>
            <th className="text-right p-3 font-semibold">Median Salary</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.occ_slug} className="border-b border-slate-200 hover:bg-slate-50">
              <td className="p-3">
                <a
                  href={`/jobs/${row.occ_slug}/${areaSlug}`}
                  className="text-blue-600 hover:underline"
                >
                  {row.occ_title}
                </a>
              </td>
              <td className="p-3 text-right font-medium">{formatSalary(row.annual_median)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
