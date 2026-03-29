import type { Metadata } from "next";
import { getOccupationsByMajorGroup } from "@/lib/db";
import { getDataYear } from "@/lib/format";

export const metadata: Metadata = {
  title: "SalaryByCity - Datos de Salarios por Ocupaci&oacute;n y Ciudad en EE.UU.",
  description: "Explore datos salariales para m&aacute;s de 800 ocupaciones en 400+ &aacute;reas metropolitanas de EE.UU. Datos del Bureau of Labor Statistics.",
  alternates: {
    canonical: "/es/",
    languages: { en: "/", es: "/es/", "x-default": "/" },
  },
};

export default function HomeEs() {
  const groups = getOccupationsByMajorGroup();
  const year = getDataYear();

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Datos de Salarios en EE.UU. por Ocupaci&oacute;n ({year})
      </h1>
      <p className="text-slate-600 mb-2">
        Explore datos salariales para m&aacute;s de 800 ocupaciones en 400+ &aacute;reas metropolitanas.
        Datos del Bureau of Labor Statistics.
      </p>
      <p className="text-xs text-slate-400 mb-8">
        <a href="/" className="text-blue-500 hover:underline">English version</a>
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Buscar por Ocupaci&oacute;n</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(groups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([group, occs]) => (
              <div key={group} className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-700 mb-2">{group}</h3>
                <ul className="space-y-1 text-sm">
                  {occs.slice(0, 8).map((occ) => (
                    <li key={occ.soc_code}>
                      <a href={`/es/jobs/${occ.slug}`} className="text-blue-600 hover:underline">
                        {occ.title}
                      </a>
                    </li>
                  ))}
                  {occs.length > 8 && (
                    <li className="text-slate-400 text-xs">y {occs.length - 8} m&aacute;s...</li>
                  )}
                </ul>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
