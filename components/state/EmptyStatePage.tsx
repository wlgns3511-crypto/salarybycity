import type { StateInfo } from "@/lib/states-data";
import type { StateWageSummary, WageWithOccupation } from "@/lib/db";
import { formatSalary, getDataYear } from "@/lib/format";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AuthorBox } from "@/components/AuthorBox";
import { breadcrumbSchema } from "@/lib/schema";

interface Props {
  state: StateInfo;
  nationalSummary: StateWageSummary | undefined;
  topNationalJobs: WageWithOccupation[];
  nearbyStates: StateInfo[];
}

export function EmptyStatePage({ state, nationalSummary, topNationalJobs, nearbyStates }: Props) {
  const year = getDataYear();
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "States", url: "/state/" },
    { name: state.name, url: `/state/${state.slug}/` },
  ];

  return (
    <div>
      <Breadcrumb items={breadcrumbs.map((b) => ({ label: b.name, href: b.url }))} />

      <h1 className="text-3xl font-bold mb-2">Salaries in {state.name}</h1>
      <p className="text-slate-600 mb-6">
        National wage context for occupations relevant to {state.name} workers, drawn from {year} BLS OEWS data.
      </p>

      <section className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          State-level metro wage data for {state.name} is not currently published
        </h2>
        <p className="text-slate-700 leading-relaxed text-sm mb-2">
          The BLS Occupational Employment and Wage Statistics (OEWS) program publishes
          metropolitan-area wage estimates for the United States, but the public OEWS extract this
          site uses does not include metro-level wage rows for {state.name}. Smaller, less
          urbanized states are sometimes reported only at the national or regional level.
        </p>
        <p className="text-slate-700 leading-relaxed text-sm">
          We do not synthesize or estimate state-level wages from incomplete data. Below is the
          national wage context that applies to {state.name} workers, plus pointers to states with
          full metro coverage.
        </p>
      </section>

      {nationalSummary && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">National Wage Context ({year})</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="text-sm text-slate-500">Avg Median Salary (US)</div>
              <div className="text-2xl font-bold text-blue-700">
                {formatSalary(nationalSummary.avg_median_salary)}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
              <div className="text-sm text-slate-500">Highest National Median</div>
              <div className="text-2xl font-bold text-slate-800">
                {formatSalary(nationalSummary.top_median)}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
              <div className="text-sm text-slate-500">National Employment</div>
              <div className="text-2xl font-bold text-slate-800">
                {nationalSummary.total_employment.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
              <div className="text-sm text-slate-500">Tracked Occupations</div>
              <div className="text-2xl font-bold text-slate-800">
                {nationalSummary.occ_count.toLocaleString()}
              </div>
            </div>
          </div>
        </section>
      )}

      {topNationalJobs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Top 10 Highest-Paying Occupations Nationally</h2>
          <p className="text-slate-600 text-sm mb-4">
            These national medians are the closest reference points for {state.name} workers in
            these fields. Local wages can differ; treat these figures as US-wide benchmarks.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold">#</th>
                  <th className="text-left p-3 font-semibold">Occupation</th>
                  <th className="text-right p-3 font-semibold">National Median</th>
                </tr>
              </thead>
              <tbody>
                {topNationalJobs.slice(0, 10).map((job, i) => (
                  <tr key={job.soc_code} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-3 text-slate-400">{i + 1}</td>
                    <td className="p-3">
                      <a href={`/jobs/${job.occ_slug}/`} className="text-blue-600 hover:underline">
                        {job.occ_title}
                      </a>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatSalary(job.annual_median)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {nearbyStates.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">States with Full Metro Wage Coverage</h2>
          <p className="text-slate-600 text-sm mb-4">
            For workers comparing wages near {state.name}, the following states have BLS metro
            data published and may serve as reasonable regional reference points.
          </p>
          <div className="flex flex-wrap gap-2">
            {nearbyStates.map((s) => (
              <a
                key={s.code}
                href={`/state/${s.slug}/`}
                className="px-3 py-1 rounded-full text-sm border border-slate-200 hover:bg-blue-50"
              >
                {s.name}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">Where to Find {state.name} Wage Data</h2>
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700 leading-relaxed space-y-3 text-sm">
          <p>
            BLS publishes nationwide tables that include {state.name} workers in occupation totals
            even when state-level wage breakdowns are not separately released. The most direct
            primary sources are:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <a
                href="https://www.bls.gov/oes/current/oessrcst.htm"
                rel="noopener noreferrer"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                BLS OEWS state cross-industry tables
              </a>{" "}
              — official state estimates when published.
            </li>
            <li>
              <a
                href="https://www.bls.gov/regions/"
                rel="noopener noreferrer"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                BLS regional offices
              </a>{" "}
              — supplementary releases for smaller states.
            </li>
            <li>
              <a
                href="https://data.bls.gov/oes/"
                rel="noopener noreferrer"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                BLS OEWS data tool
              </a>{" "}
              — query specific occupations × locations.
            </li>
          </ul>
        </div>
      </section>

      <AuthorBox />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(breadcrumbs)) }}
      />
    </div>
  );
}
