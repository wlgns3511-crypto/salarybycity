import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { CrossSiteLinks } from "@/components/CrossSiteLinks";
import { breadcrumbSchema, datasetSchema } from "@/lib/schema";
import { BLS_PUBLISHED, BLS_DATA_YEAR } from "@/lib/authorship";
import {
  getAllListTypes,
  getListProfile,
  getListNarrative,
  type ListType,
} from "@/lib/salary-cluster-insights";
import { fmtUSD, fmtCount } from "@/lib/content-helpers";

interface Props {
  params: Promise<{ type: string }>;
}

export const dynamicParams = false;
export const revalidate = 86400;

export async function generateStaticParams() {
  return getAllListTypes().map((type) => ({ type }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const profile = getListProfile(type as ListType);
  if (!profile) return {};
  return {
    title: profile.metaTitle,
    description: profile.metaDescription,
    alternates: { canonical: `/jobs/list/${profile.slug}/` },
    openGraph: { url: `/jobs/list/${profile.slug}/` },
  };
}

export default async function JobsListTypePage({ params }: Props) {
  const { type } = await params;
  const profile = getListProfile(type as ListType);
  if (!profile) notFound();

  const rows = profile.query();
  if (rows.length === 0) notFound();

  const narrative = getListNarrative(profile.type, rows);

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Occupations", url: "/jobs/" },
    { name: "Lists", url: "/jobs/list/" },
    { name: profile.title, url: `/jobs/list/${profile.slug}/` },
  ];

  return (
    <div>
      <Breadcrumb items={breadcrumbs.map((b) => ({ label: b.name, href: b.url }))} />

      <h1 className="text-3xl font-bold mb-2">{profile.title}</h1>
      <p className="text-slate-600 mb-6 leading-relaxed">{profile.intro}</p>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold mb-3 text-slate-900">{narrative.headline}</h2>
        <p className="text-slate-700 leading-relaxed mb-3">{narrative.context}</p>
        <p className="text-slate-700 leading-relaxed">{narrative.implication}</p>
      </section>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="text-left py-3 px-3 font-semibold">#</th>
              <th className="text-left py-3 px-3 font-semibold">Occupation</th>
              <th className="text-right py-3 px-3 font-semibold">Median Pay</th>
              <th className="text-right py-3 px-3 font-semibold hidden md:table-cell">p10</th>
              <th className="text-right py-3 px-3 font-semibold hidden md:table-cell">p90</th>
              <th className="text-right py-3 px-3 font-semibold">Employment</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.occ_slug} className="border-t border-slate-200 hover:bg-blue-50/40">
                <td className="py-2 px-3 text-slate-500 tabular-nums">{i + 1}</td>
                <td className="py-2 px-3">
                  <a
                    href={`/jobs/${row.occ_slug}/`}
                    className="text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    {row.occ_title}
                  </a>
                </td>
                <td className="py-2 px-3 text-right tabular-nums font-semibold">{fmtUSD(row.annual_median)}</td>
                <td className="py-2 px-3 text-right tabular-nums hidden md:table-cell text-slate-600">{fmtUSD(row.annual_p10)}</td>
                <td className="py-2 px-3 text-right tabular-nums hidden md:table-cell text-slate-600">{fmtUSD(row.annual_p90)}</td>
                <td className="py-2 px-3 text-right tabular-nums text-slate-600">{fmtCount(row.employment)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdSlot id="jobs-list-mid" />

      <p className="text-xs text-slate-500 mt-4">
        Data source: U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics (OEWS), 2024 release. Median, 10th-percentile, and 90th-percentile annual pay are reported nationally.
      </p>

      <CrossSiteLinks current="SalaryData" />

      <DataSourceBadge sources={[
        { name: "BLS", url: "https://www.bls.gov/oes/" },
        { name: "O*NET", url: "https://www.onetonline.org" },
      ]} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema(breadcrumbs)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ...datasetSchema(
              `${profile.title} — BLS OEWS Wage Profile (${BLS_DATA_YEAR})`,
              `${profile.intro} Aggregated from BLS OEWS national wage tables (median, 10th-percentile, 90th-percentile, employment count) for the ${rows.length} occupations in this list, anchored to the OEWS ${BLS_DATA_YEAR} release.`,
              `/jobs/list/${profile.slug}/`,
              [
                'annual_median',
                'annual_p10',
                'annual_p90',
                'employment',
                'cluster_aggregate_median',
                'list_size',
              ],
            ),
            dateModified: BLS_PUBLISHED,
          }),
        }}
      />
    </div>
  );
}
