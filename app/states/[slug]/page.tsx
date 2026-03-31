import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllStateCodes, getAreasByState } from "@/lib/db";

interface Props { params: Promise<{ slug: string }> }

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return getAllStateCodes().map((s) => ({ slug: s.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const state = slug.toUpperCase();
  return {
    title: `Salaries in ${state} - All Metro Areas`,
    description: `Browse salary data for all metro areas in ${state}. Compare wages across cities.`,
  };
}

export default async function StatePage({ params }: Props) {
  const { slug } = await params;
  const state = slug.toUpperCase();
  const areas = getAreasByState(state);
  if (areas.length === 0) notFound();

  const states = getAllStateCodes();

  return (
    <div>
      <nav className="text-sm text-slate-500 mb-4">
        <a href="/" className="hover:underline">Home</a> / <a href="/locations" className="hover:underline">Locations</a> / <span className="text-slate-800">{state}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">Salaries in {state}</h1>
      <p className="text-slate-600 mb-6">{areas.length} metro areas</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {states.map((s) => (
          <a key={s} href={`/states/${s.toLowerCase()}`}
            className={`px-3 py-1 rounded-full text-sm border ${s === state ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:bg-blue-50'}`}>
            {s}
          </a>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-sm">
        {areas.map((a) => (
          <a key={a.area_code} href={`/locations/${a.slug}`}
            className="p-3 border border-slate-100 rounded-lg hover:bg-blue-50">
            {a.area_title}
          </a>
        ))}
      </div>
    </div>
  );
}
