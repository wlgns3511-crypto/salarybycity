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
  const useCases = [
    {
      title: 'Compare one occupation',
      href: '/jobs/',
      description:
        'Start with a job title when you need median pay, percentile ranges, and the strongest metro markets for that occupation.',
      action: 'Browse occupations',
    },
    {
      title: 'Read a state labor market',
      href: '/state/',
      description:
        'Use state pages when you need broad wage context before narrowing into individual occupations or salary ranges.',
      action: 'Browse states',
    },
    {
      title: 'Adjust an offer for location',
      href: '/tools/col-calculator/',
      description:
        'Use the cost-of-living calculator after you have a salary number and need a purchasing-power comparison across metros.',
      action: 'Open COL calculator',
    },
  ];

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

      <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="mb-4 max-w-3xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            How to use SalaryByCity
          </p>
          <h2 className="text-2xl font-bold text-slate-950">
            Pick the salary question before picking the page
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            SalaryByCity is built around BLS occupation data first. Use occupation pages for job
            comparisons, state pages for market context, and the cost-of-living tool only when you
            need to translate a salary between locations.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {useCases.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              <p className="mt-3 text-sm font-medium text-blue-700">{item.action}</p>
            </a>
          ))}
        </div>
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
