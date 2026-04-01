import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getOccupationBySlug,
  getAllOccupations,
  getNationalWage,
  getTopPayingCities,
  getRelatedOccupations,
} from "@/lib/db";
import { formatSalary, getDataYear } from "@/lib/format";

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  // Pre-build top 50; rest served via ISR
  return getAllOccupations().slice(0, 50).map((occ) => ({ slug: occ.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const occ = getOccupationBySlug(slug);
  if (!occ) return {};
  const wage = getNationalWage(occ.soc_code);
  const year = getDataYear();
  return {
    title: `Salario de ${occ.title} - Datos Salariales ${year}`,
    description: `El salario mediano de ${occ.title} en EE.UU. es ${formatSalary(wage?.annual_median ?? null)}. Compare salarios en 400+ ciudades.`,
    alternates: {
      canonical: `/es/jobs/${slug}`,
      languages: { en: `/jobs/${slug}`, es: `/es/jobs/${slug}`, "x-default": `/jobs/${slug}` },
    },
    openGraph: { url: `/es/jobs/${slug}` },
  };
}

export default async function JobPageEs({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const occ = getOccupationBySlug(slug);
  if (!occ) notFound();

  const nationalWage = getNationalWage(occ.soc_code);
  const topCities = getTopPayingCities(occ.soc_code, 15);
  const related = getRelatedOccupations(occ.major_group, occ.soc_code, 8);
  const year = getDataYear();

  return (
    <>
      <nav className="text-sm text-slate-500 mb-4">
        <a href="/es/" className="hover:text-blue-600">Inicio</a>
        {" > "}
        <span>{occ.title}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">
        Salario de {occ.title} ({year})
      </h1>
      <p className="text-slate-500 mb-1">C&oacute;digo SOC: {occ.soc_code}</p>
      <p className="text-slate-500 mb-2">Categor&iacute;a: {occ.major_group_title}</p>
      <p className="text-xs text-slate-400 mb-6">
        <a href={`/jobs/${slug}`} className="text-blue-500 hover:underline">English version</a>
      </p>

      {nationalWage && (
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-slate-500">Salario Mediano</div>
              <div className="text-2xl font-bold text-blue-700">
                {formatSalary(nationalWage.annual_median)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Salario Promedio</div>
              <div className="text-2xl font-bold">
                {formatSalary(nationalWage.annual_mean)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Rango Salarial</div>
              <div className="text-lg font-semibold">
                {formatSalary(nationalWage.annual_p10)} - {formatSalary(nationalWage.annual_p90)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Total de Empleados</div>
              <div className="text-lg font-semibold">
                {nationalWage.employment?.toLocaleString("en-US") ?? "N/D"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribuci&oacute;n por percentil */}
      {nationalWage && (
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-3">Distribuci&oacute;n Salarial por Percentil</h2>
          <div className="grid grid-cols-5 gap-2 text-center text-sm">
            <div className="bg-slate-50 rounded p-2">
              <div className="text-xs text-slate-500">P10</div>
              <div className="font-bold">{formatSalary(nationalWage.annual_p10)}</div>
            </div>
            <div className="bg-slate-50 rounded p-2">
              <div className="text-xs text-slate-500">P25</div>
              <div className="font-bold">{formatSalary(nationalWage.annual_p25)}</div>
            </div>
            <div className="bg-blue-50 rounded p-2 border border-blue-200">
              <div className="text-xs text-blue-600">Mediana</div>
              <div className="font-bold text-blue-700">{formatSalary(nationalWage.annual_median)}</div>
            </div>
            <div className="bg-slate-50 rounded p-2">
              <div className="text-xs text-slate-500">P75</div>
              <div className="font-bold">{formatSalary(nationalWage.annual_p75)}</div>
            </div>
            <div className="bg-slate-50 rounded p-2">
              <div className="text-xs text-slate-500">P90</div>
              <div className="font-bold">{formatSalary(nationalWage.annual_p90)}</div>
            </div>
          </div>
        </section>
      )}

      {/* Ciudades con mayor salario */}
      {topCities.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">
            Ciudades con Mayor Salario para {occ.title}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Ciudad</th>
                  <th className="text-right px-3 py-2 font-medium">Salario Mediano</th>
                  <th className="text-right px-3 py-2 font-medium">Empleados</th>
                </tr>
              </thead>
              <tbody>
                {topCities.map((c, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-3 py-2">{c.area_title}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatSalary(c.annual_median)}</td>
                    <td className="px-3 py-2 text-right">{c.employment?.toLocaleString() ?? "N/D"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Ocupaciones relacionadas */}
      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">Ocupaciones Relacionadas</h2>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm">
            {related.map((r) => (
              <li key={r.soc_code}>
                <a href={`/es/jobs/${r.slug}`} className="text-blue-600 hover:underline">
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 p-4 bg-slate-50 rounded-lg">
        <h3 className="text-sm font-semibold text-slate-500 mb-2">Recursos Relacionados</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="https://costbycity.com" className="text-blue-600 hover:underline">Costo de Vida por Ciudad</a>
          <a href="https://calcpeek.com" className="text-blue-600 hover:underline">Calculadoras</a>
        </div>
      </section>
    </>
  );
}
