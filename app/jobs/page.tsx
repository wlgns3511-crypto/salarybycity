import { getAllOccupations, getOccupationsByMajorGroup } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Occupations - Salary Data",
  description:
    "Browse salary data for 800+ occupations in the United States. Find average and median salaries by job title.",
  alternates: { canonical: "/jobs/" },
};

export default function JobsPage() {
  const groups = getOccupationsByMajorGroup();
  const total = getAllOccupations().length;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">All Occupations</h1>
      <p className="text-slate-600 mb-8">
        Salary data for {total} occupations across the United States.
      </p>

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
