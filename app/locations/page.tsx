import { getAllMetroAreas, getAllStates } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Locations - Salary Data by Metro Area",
  description:
    "Browse salary data for 400+ US metropolitan areas. Find the highest paying cities and compare wages across locations.",
  alternates: { canonical: "/locations/" },
};

export default function LocationsPage() {
  const metros = getAllMetroAreas();
  const states = getAllStates();

  // Group metros by state
  const byState: Record<string, typeof metros> = {};
  for (const m of metros) {
    const st = m.state || "Other";
    if (!byState[st]) byState[st] = [];
    byState[st].push(m);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">All Locations</h1>
      <p className="text-slate-600 mb-8">
        Salary data for {metros.length} metropolitan areas across the United
        States.
      </p>

      {Object.entries(byState)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([state, areas]) => (
          <section key={state} className="mb-6">
            <h2 className="text-lg font-semibold mb-2">
              <a href={`/states/${state.toLowerCase()}`} className="text-blue-800 hover:text-blue-600 hover:underline">
                {state}
              </a>
            </h2>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              {areas.map((area) => (
                <a
                  key={area.area_code}
                  href={`/locations/${area.slug}`}
                  className="py-1 text-slate-700 hover:text-blue-600 hover:underline"
                >
                  {area.area_title}
                </a>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
