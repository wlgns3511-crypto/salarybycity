import type { Metadata } from "next";
import { US_STATES } from "@/lib/states-data";
import { getStateWageSummary } from "@/lib/db";
import { formatSalary, getDataYear } from "@/lib/format";
import { Breadcrumb } from "@/components/Breadcrumb";
import { breadcrumbSchema } from "@/lib/schema";

export const dynamicParams = false;
export const revalidate = 86400;

const year = getDataYear();

export const metadata: Metadata = {
  title: `Salary by State - ${year} US Wage Data for All 50 States`,
  description: `Compare average salaries across all 50 US states and DC. See top-paying occupations, employment figures, and wage comparisons powered by ${year} BLS data.`,
  alternates: { canonical: "/state/" },
  openGraph: { url: "/state/" },
};

export default function StateIndexPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "States", url: "/state/" },
  ];

  const statesWithData = US_STATES.map((s) => {
    const summary = getStateWageSummary(s.code);
    return { ...s, summary };
  }).filter((s) => s.summary && s.summary.occ_count > 0);

  return (
    <div>
      <Breadcrumb items={breadcrumbs.map((b) => ({ label: b.name, href: b.url }))} />

      <h1 className="text-3xl font-bold mb-2">Salary by State</h1>
      <p className="text-slate-600 mb-8">
        Compare wages across all {statesWithData.length} US states and territories. Data from the {year} Bureau of Labor Statistics Occupational Employment and Wage Statistics (OEWS) program.
      </p>

      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="text-left p-3 font-semibold">State</th>
              <th className="text-right p-3 font-semibold">Avg Median Salary</th>
              <th className="text-right p-3 font-semibold">Top Salary</th>
              <th className="text-right p-3 font-semibold hidden sm:table-cell">Occupations</th>
            </tr>
          </thead>
          <tbody>
            {statesWithData
              .sort((a, b) => (b.summary!.avg_median_salary ?? 0) - (a.summary!.avg_median_salary ?? 0))
              .map((s) => (
                <tr key={s.code} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-3">
                    <a href={`/state/${s.slug}/`} className="text-blue-600 hover:underline font-medium">
                      {s.name}
                    </a>
                    <span className="text-slate-400 ml-1 text-xs">{s.code}</span>
                  </td>
                  <td className="p-3 text-right font-medium">
                    {formatSalary(s.summary!.avg_median_salary)}
                  </td>
                  <td className="p-3 text-right">
                    {formatSalary(s.summary!.top_median)}
                  </td>
                  <td className="p-3 text-right hidden sm:table-cell text-slate-600">
                    {s.summary!.occ_count.toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">Browse by Region</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {statesWithData
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((s) => (
              <a
                key={s.code}
                href={`/state/${s.slug}/`}
                className="p-3 border border-slate-100 rounded-lg hover:bg-blue-50 flex justify-between items-center"
              >
                <span className="font-medium">{s.name}</span>
                <span className="text-sm text-slate-500">{formatSalary(s.summary!.avg_median_salary)}</span>
              </a>
            ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(breadcrumbs)) }}
      />
    </div>
  );
}
