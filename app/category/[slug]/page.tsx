import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMajorGroups, getJobsByMajorGroup } from "@/lib/db";
import { formatSalary } from "@/lib/format";

interface Props { params: Promise<{ slug: string }> }

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return getMajorGroups().map((g) => ({ slug: slugify(g.major_group_title) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const groups = getMajorGroups();
  const group = groups.find(g => slugify(g.major_group_title) === slug);
  if (!group) return {};
  return {
    title: `${group.major_group_title} Salaries`,
    description: `Salary data for ${group.major_group_title} occupations. Compare wages across ${group.count} jobs.`,
    alternates: { canonical: `/category/${slug}` },
    openGraph: { url: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const groups = getMajorGroups();
  const group = groups.find(g => slugify(g.major_group_title) === slug);
  if (!group) notFound();

  const jobs = getJobsByMajorGroup(group.major_group);

  return (
    <div>
      <nav className="text-sm text-slate-500 mb-4">
        <a href="/" className="hover:underline">Home</a> / <a href="/jobs" className="hover:underline">Occupations</a> / <span className="text-slate-800">{group.major_group_title}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{group.major_group_title} Salaries</h1>
      <p className="text-slate-600 mb-6">{jobs.length} occupations ranked by median salary</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {groups.map((g) => (
          <a key={g.major_group} href={`/category/${slugify(g.major_group_title)}`}
            className={`px-3 py-1 rounded-full text-xs border ${slugify(g.major_group_title) === slug ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:bg-blue-50'}`}>
            {g.major_group_title}
          </a>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        {jobs.map((j, i) => (
          <a key={j.occ_slug} href={`/jobs/${j.occ_slug}`}
            className="flex justify-between items-center p-3 hover:bg-blue-50 border-b border-slate-100">
            <span className="text-sm"><span className="text-slate-400 mr-2">{i + 1}.</span>{j.occ_title}</span>
            <span className="text-sm font-semibold text-blue-600">{formatSalary(j.annual_median)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
