import { getAllOccupations, getOccupationsByMajorGroup } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Occupations - Salary Data",
  description:
    "Browse salary data for 800+ occupations in the United States. Find average and median salaries by job title.",
  alternates: { canonical: "/jobs/" },
  openGraph: { url: "/jobs/" },
};

export default function JobsPage() {
  const groups = getOccupationsByMajorGroup();
  const total = getAllOccupations().length;
  const compareNotes = [
    {
      title: 'Median first',
      body: 'Use median annual pay as the cleanest benchmark for a typical worker before looking at the mean.',
    },
    {
      title: 'Percentiles next',
      body: 'Use salary ranges to separate entry-level, experienced, and high-end pay instead of relying on one average.',
    },
    {
      title: 'Location last',
      body: 'After choosing an occupation, compare metro and state pages because local demand can move pay materially.',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">All Occupations</h1>
      <p className="text-slate-600 mb-8">
        Salary data for {total} occupations across the United States.
      </p>

      <section className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-xl font-bold text-slate-950 mb-3">How to compare occupations</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {compareNotes.map((note) => (
            <div key={note.title} className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">{note.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{note.body}</p>
            </div>
          ))}
        </div>
      </section>

      {Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([group, occs]) => (
          <section key={group} className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-blue-800">
              {group}
            </h2>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              {occs.map((occ) => (
                <a
                  key={occ.soc_code}
                  href={`/jobs/${occ.slug}`}
                  className="py-1 text-slate-700 hover:text-blue-600 hover:underline"
                >
                  {occ.title}
                </a>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
