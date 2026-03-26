import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAreaBySlug,
  getAllMetroAreas,
  getTopPayingJobs,
  getWagesByArea,
} from "@/lib/db";
import { formatSalary, shortAreaName, getDataYear } from "@/lib/format";
import { JobComparisonTable } from "@/components/SalaryTable";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { breadcrumbSchema } from "@/lib/schema";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const areas = getAllMetroAreas();
  return areas.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) return {};
  const year = getDataYear();
  const cityName = shortAreaName(area.area_title);

  return {
    title: `Salaries in ${cityName} - ${year} Wage Data`,
    description: `Explore salary data for all occupations in ${cityName}. Find the highest paying jobs and compare wages.`,
    alternates: { canonical: `/locations/${slug}` },
  };
}

export default async function LocationDetailPage({ params }: Props) {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) notFound();

  const topJobs = getTopPayingJobs(area.area_code, 20);
  // Top 20 already shown above, no need for duplicate large table
  const cityName = shortAreaName(area.area_title);
  const year = getDataYear();

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Locations", url: "/locations" },
    { name: cityName, url: `/locations/${slug}` },
  ];

  return (
    <div>
      <Breadcrumb
        items={breadcrumbs.map((b) => ({ label: b.name, href: b.url }))}
      />

      <h1 className="text-3xl font-bold mb-2">Salaries in {cityName}</h1>
      <p className="text-slate-500 mb-2">{area.area_title}</p>
      <p className="text-slate-600 mb-6">
        {year} wage data from Bureau of Labor Statistics
      </p>

      {topJobs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">
            Top 20 Highest Paying Jobs in {cityName}
          </h2>
          <JobComparisonTable rows={topJobs} areaSlug={slug} />
        </section>
      )}

      <AdSlot id="location-mid" />


      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema(breadcrumbs)),
        }}
      />
    </div>
  );
}
