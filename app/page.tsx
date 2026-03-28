import { getOccupationsByMajorGroup, getAllMetroAreas, getAllStateCodes } from "@/lib/db";
import { getDataYear } from "@/lib/format";

export default function Home() {
  const groups = getOccupationsByMajorGroup();
  const areas = getAllMetroAreas();
  const stateCodes = getAllStateCodes();
  const year = getDataYear();

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

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Browse by Occupation</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(groups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([group, occs]) => (
              <div key={group} className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-700 mb-2">{group}</h3>
                <ul className="space-y-1 text-sm">
                  {occs.slice(0, 5).map((occ) => (
                    <li key={occ.soc_code}>
                      <a
                        href={`/jobs/${occ.slug}`}
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
          {stateCodes.map((code) => (
            <a
              key={code}
              href={`/states/${code.toLowerCase()}`}
              className="px-3 py-1 rounded-full text-sm border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-600"
            >
              {code}
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Browse by Location</h2>
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 text-sm">
          {areas.slice(0, 100).map((area) => (
            <div key={area.area_code} className="mb-1">
              <a
                href={`/locations/${area.slug}`}
                className="text-slate-600 hover:text-blue-600 hover:underline"
              >
                {area.area_title}
              </a>
            </div>
          ))}
        </div>
        {areas.length > 100 && (
          <a href="/locations" className="inline-block mt-4 text-blue-600 hover:underline">
            View all {areas.length} metro areas &rarr;
          </a>
        )}
      </section>
    </div>
  );
}
