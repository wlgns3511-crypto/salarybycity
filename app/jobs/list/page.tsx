import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getAllListTypes, getListIndexNarrative } from "@/lib/salary-cluster-insights";

export const dynamicParams = false;
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Curated Salary Rankings — Highest-Paying, Six-Figure, STEM, and More",
  description:
    "Curated lists of US occupations by pay, employment, and pay-distribution profile. BLS OEWS 2024 data. Highest-paying, six-figure, STEM, healthcare, entry-level, specialist, and more.",
  alternates: { canonical: "/jobs/list/" },
  openGraph: { url: "/jobs/list/" },
};

export default function JobsListIndexPage() {
  const narrative = getListIndexNarrative();
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Occupations", url: "/jobs/" },
    { name: "Lists", url: "/jobs/list/" },
  ];

  return (
    <div>
      <Breadcrumb items={breadcrumbs.map((b) => ({ label: b.name, href: b.url }))} />

      <h1 className="text-3xl font-bold mb-2">Curated Salary Rankings</h1>
      <p className="text-slate-600 mb-8">{narrative.intro}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {narrative.cards.map((card) => (
          <a
            key={card.type}
            href={`/jobs/list/${card.type}/`}
            className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition"
          >
            <h2 className="text-lg font-semibold text-blue-700 mb-1">{card.title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{card.description}</p>
          </a>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-8">
        Data source: U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics (OEWS), 2024 release.
      </p>
    </div>
  );
}
