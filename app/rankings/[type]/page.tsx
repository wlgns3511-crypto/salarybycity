import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHighestPayingJobsNational } from "@/lib/db";
import { formatSalary } from "@/lib/format";

const RANKINGS: Record<string, { title: string; desc: string }> = {
  'highest-paying-jobs': { title: 'Highest Paying Jobs in the US', desc: 'Top occupations ranked by median annual salary.' },
};

interface Props { params: Promise<{ type: string }> }

export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return Object.keys(RANKINGS).map((type) => ({ type }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const r = RANKINGS[type];
  if (!r) return {};
  return { title: r.title, description: r.desc };
}

export default async function RankingPage({ params }: Props) {
  const { type } = await params;
  const r = RANKINGS[type];
  if (!r) notFound();

  const jobs = getHighestPayingJobsNational(50);

  return (
    <div>
      <nav className="text-sm text-slate-500 mb-4">
        <a href="/" className="hover:underline">Home</a> / <span className="text-slate-800">{r.title}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{r.title}</h1>
      <p className="text-slate-600 mb-6">{r.desc}</p>

      <div className="border rounded-lg overflow-hidden">
        <div className="flex justify-between p-3 bg-slate-100 text-sm font-semibold">
          <span>Occupation</span>
          <span>Median Salary</span>
        </div>
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
