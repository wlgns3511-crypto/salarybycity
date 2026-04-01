import type { Metadata } from "next";
import { searchOccupations, getHighestPayingJobsNational, getMajorGroups } from "@/lib/db";
import { formatSalary, getDataYear } from "@/lib/format";

export const metadata: Metadata = {
  title: "Search Salary Data — Occupation Wages & Pay by City",
  description: "Search salary data for 800+ occupations. Find median wages, salary ranges, and highest-paying cities.",
  alternates: { canonical: "/search" },
  openGraph: { url: "/search/" },
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? searchOccupations(query, 40) : [];
  const topJobs = !query ? getHighestPayingJobsNational(10) : [];
  const majorGroups = !query ? getMajorGroups() : [];
  const year = getDataYear();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Search Salary Data</h1>
      <p className="text-slate-500 mb-6">Find wage data for 800+ occupations across 400+ US metro areas ({year})</p>

      <form method="get" action="/search" className="mb-8">
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search occupations (e.g. Software Developer, Nurse, Teacher...)"
            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-violet-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {query && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-slate-700">
            {results.length > 0
              ? `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`
              : `No results found for "${query}"`}
          </h2>
          {results.length > 0 ? (
            <div className="grid gap-3">
              {results.map((occ) => (
                <a
                  key={occ.slug}
                  href={`/jobs/${occ.slug}`}
                  className="block p-4 border border-slate-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-all"
                >
                  <div className="font-semibold text-slate-900 mb-1">{occ.title}</div>
                  <div className="text-xs text-slate-400">{occ.major_group_title} &bull; SOC {occ.soc_code}</div>
                </a>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-lg text-center text-slate-500">
              <p>Try a different occupation title or browse categories below.</p>
            </div>
          )}
        </div>
      )}

      {!query && (
        <div>
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 text-slate-700">Highest Paying Occupations (National)</h2>
            <div className="grid gap-2">
              {topJobs.map((j) => (
                <a key={j.occ_slug} href={`/jobs/${j.occ_slug}`} className="p-3 border border-slate-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-all flex justify-between items-center">
                  <span className="font-medium text-slate-900">{j.occ_title}</span>
                  <span className="text-xs text-violet-600 font-medium ml-2 flex-shrink-0">{formatSalary(j.annual_median)}/yr</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3 text-slate-700">Browse by Occupation Category</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {majorGroups.map((g) => (
                <a key={g.major_group} href={`/category/${g.major_group}`} className="p-3 border border-slate-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-all flex justify-between items-center">
                  <span className="font-medium text-slate-900 text-sm">{g.major_group_title}</span>
                  <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{g.count} jobs</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
