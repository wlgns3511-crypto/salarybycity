import type { Metadata } from "next";
import { getOccupationsByMajorGroup, getAllStateCodes, getHighestPayingJobsNational } from "@/lib/db";
import { getStateByCode } from "@/lib/states-data";
import { getDataYear } from "@/lib/format";
import { PopularEntities } from "@/components/upgrades/PopularEntities";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function Home() {
  const groups = getOccupationsByMajorGroup();
  const stateCodes = getAllStateCodes();
  const year = getDataYear();
  const topJobs = getHighestPayingJobsNational(12);

  return (
    <div>
      <section className="mb-12">
        <h1 className="text-3xl font-bold mb-3">
          US Salary Data by Occupation and City ({year})
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Explore salary and wage data for 800+ occupations across 400+ US
          metropolitan areas. Data sourced from the Bureau of Labor Statistics.
        </p>
      </section>

      <PopularEntities
        heading="Top Metro Areas for Jobs"
        subheading="Highest-paying occupations nationally"
        items={topJobs.map(j => ({
          name: j.occ_title,
          href: `/jobs/${j.occ_slug}/`,
          stat: `$${Math.round((j.annual_median ?? 0) / 1000)}K`,
        }))}
        viewAllHref="/jobs/"
        viewAllLabel="Browse all occupations →"
      />

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Browse by Occupation</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(groups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([group, occs]) => (
              <div key={group} className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-700 mb-2">{group}</h3>
                <ul className="space-y-1 text-sm">
                  {occs.map((occ) => (
                    <li key={occ.soc_code}>
                      <a
                        href={`/jobs/${occ.slug}/`}
                        className="text-slate-600 hover:text-blue-600 hover:underline"
                      >
                        {occ.title}
                      </a>
                    </li>
                  ))}
                  {occs.length > 5 && (
                    <li className="text-slate-400">
                      +{occs.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Browse by State</h2>
        <div className="flex flex-wrap gap-2">
          {stateCodes.map((code) => {
            const state = getStateByCode(code);
            if (!state) return null;
            return (
              <a
                key={code}
                href={`/state/${state.slug}/`}
                className="px-3 py-1 rounded-full text-sm border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-600"
              >
                {code}
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
