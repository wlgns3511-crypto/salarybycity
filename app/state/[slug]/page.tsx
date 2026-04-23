import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { US_STATES, getStateBySlug } from "@/lib/states-data";
import {
  getAreasByState,
  getStateTopOccupationsWithNational,
  getStateWageSummary,
  getNationalWageSummary,
} from "@/lib/db";
import { formatSalary, getDataYear } from "@/lib/format";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FAQ } from "@/components/FAQ";
import { AdSlot } from "@/components/AdSlot";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { StateRich } from '@/components/state/StateRich';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return US_STATES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) return {};
  const year = getDataYear();
  return {
    title: `${state.name} Salaries - Top Occupations & Wage Data (${year})`,
    description: `Explore salary data for ${state.name}. See the highest-paying occupations, compare state wages vs national averages, and browse metro areas. ${year} BLS OEWS data.`,
    alternates: { canonical: `/state/${slug}/` },
    openGraph: { url: `/state/${slug}/` },
  };
}

function generateStateFaqs(
  stateName: string,
  stateCode: string,
  summary: { avg_median_salary: number; top_median: number; total_employment: number; occ_count: number },
  nationalSummary: { avg_median_salary: number } | undefined,
  topJobs: { occ_title: string; annual_median: number | null; national_median: number | null }[],
  metroCount: number,
): { question: string; answer: string }[] {
  const year = getDataYear();
  const faqs: { question: string; answer: string }[] = [];

  // 1. Average salary
  faqs.push({
    question: `What is the average salary in ${stateName}?`,
    answer: `The average median salary across all occupations in ${stateName} is ${formatSalary(summary.avg_median_salary)} as of ${year} BLS data. This covers ${summary.occ_count.toLocaleString()} tracked occupations in the state.`,
  });

  // 2. Highest paying job
  if (topJobs.length > 0 && topJobs[0].annual_median) {
    faqs.push({
      question: `What is the highest paying job in ${stateName}?`,
      answer: `The highest paying occupation in ${stateName} is ${topJobs[0].occ_title} with a median annual salary of ${formatSalary(topJobs[0].annual_median)}.${topJobs[0].national_median ? ` The national median for this role is ${formatSalary(topJobs[0].national_median)}.` : ''}`,
    });
  }

  // 3. Comparison to national
  if (nationalSummary) {
    const diff = summary.avg_median_salary - nationalSummary.avg_median_salary;
    const pct = ((diff / nationalSummary.avg_median_salary) * 100).toFixed(1);
    faqs.push({
      question: `How do ${stateName} salaries compare to the national average?`,
      answer: `${stateName}'s average median salary of ${formatSalary(summary.avg_median_salary)} is ${diff >= 0 ? `${pct}% above` : `${Math.abs(Number(pct))}% below`} the national average of ${formatSalary(nationalSummary.avg_median_salary)}. ${diff >= 0 ? 'This ranks it among the higher-paying states.' : 'However, cost of living differences can offset this gap.'}`,
    });
  }

  // 4. Employment
  if (summary.total_employment) {
    faqs.push({
      question: `How many people are employed in ${stateName}?`,
      answer: `${stateName} has approximately ${summary.total_employment.toLocaleString()} employed workers across all tracked occupations according to ${year} BLS data. This spans ${summary.occ_count.toLocaleString()} distinct occupation categories.`,
    });
  }

  // 5. Metro areas
  if (metroCount > 0) {
    faqs.push({
      question: `How many metro areas are in ${stateName}?`,
      answer: `There are ${metroCount} metropolitan statistical areas in ${stateName} tracked by BLS wage data. Salaries can vary significantly between metro areas due to local industry mix, cost of living, and labor demand.`,
    });
  }

  return faqs.slice(0, 5);
}

export default async function StateDetailPage({ params }: Props) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();

  const year = getDataYear();
  const summary = getStateWageSummary(state.code);
  const nationalSummary = getNationalWageSummary();
  const topJobs = getStateTopOccupationsWithNational(state.code, 20);
  const metros = getAreasByState(state.code);

  if (!summary || summary.occ_count === 0) notFound();

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "States", url: "/state/" },
    { name: state.name, url: `/state/${slug}/` },
  ];

  const faqs = generateStateFaqs(
    state.name,
    state.code,
    summary,
    nationalSummary,
    topJobs,
    metros.length,
  );

  const natAvg = nationalSummary?.avg_median_salary ?? 0;
  const diff = natAvg ? summary.avg_median_salary - natAvg : 0;
  const diffPct = natAvg ? ((diff / natAvg) * 100).toFixed(1) : "0";

  return (
    <div>
      <Breadcrumb items={breadcrumbs.map((b) => ({ label: b.name, href: b.url }))} />

      <h1 className="text-3xl font-bold mb-2">Salaries in {state.name}</h1>
      <p className="text-slate-600 mb-6">
        {year} wage data for {summary.occ_count.toLocaleString()} occupations across {state.name} ({state.code}), powered by BLS OEWS.
      </p>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="text-sm text-slate-500">Avg Median Salary</div>
          <div className="text-2xl font-bold text-blue-700">{formatSalary(summary.avg_median_salary)}</div>
          {natAvg > 0 && (
            <div className={`text-xs mt-1 ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {diff >= 0 ? '+' : ''}{diffPct}% vs national
            </div>
          )}
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
          <div className="text-sm text-slate-500">Highest Salary</div>
          <div className="text-2xl font-bold text-slate-800">{formatSalary(summary.top_median)}</div>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
          <div className="text-sm text-slate-500">Total Employment</div>
          <div className="text-2xl font-bold text-slate-800">{summary.total_employment.toLocaleString()}</div>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
          <div className="text-sm text-slate-500">Occupations</div>
          <div className="text-2xl font-bold text-slate-800">{summary.occ_count.toLocaleString()}</div>
        </div>
      </div>

      {/* Top occupations with national comparison */}
      {topJobs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Top 20 Highest Paying Jobs in {state.name}</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold">#</th>
                  <th className="text-left p-3 font-semibold">Occupation</th>
                  <th className="text-right p-3 font-semibold">{state.code} Median</th>
                  <th className="text-right p-3 font-semibold hidden sm:table-cell">National Median</th>
                  <th className="text-right p-3 font-semibold hidden sm:table-cell">vs National</th>
                </tr>
              </thead>
              <tbody>
                {topJobs.map((job, i) => {
                  const jobDiff = job.annual_median && job.national_median
                    ? job.annual_median - job.national_median
                    : null;
                  const jobDiffPct = job.national_median && jobDiff !== null
                    ? ((jobDiff / job.national_median) * 100).toFixed(1)
                    : null;
                  return (
                    <tr key={job.soc_code} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-3 text-slate-400">{i + 1}</td>
                      <td className="p-3">
                        <a href={`/jobs/${job.occ_slug}/`} className="text-blue-600 hover:underline">
                          {job.occ_title}
                        </a>
                      </td>
                      <td className="p-3 text-right font-medium">{formatSalary(job.annual_median)}</td>
                      <td className="p-3 text-right text-slate-600 hidden sm:table-cell">
                        {formatSalary(job.national_median)}
                      </td>
                      <td className="p-3 text-right hidden sm:table-cell">
                        {jobDiffPct !== null && (
                          <span className={Number(jobDiffPct) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {Number(jobDiffPct) >= 0 ? '+' : ''}{jobDiffPct}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AdSlot id="state-mid" />

      {/* Salary ranges cross-link (HCU depth expansion) */}
      <section className="mb-8">
        <a
          href={`/state/${slug}/salary-ranges/`}
          className="block rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 hover:border-blue-400 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Deeper breakdown
              </div>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {state.name} Salary Ranges — p10 to p90 Percentiles
              </h3>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                Top 20 occupations with 10th / 25th / 50th / 75th / 90th percentile wages — the full
                pay distribution instead of a single median number.
              </p>
            </div>
            <span className="text-blue-700 font-semibold shrink-0">View ranges &rarr;</span>
          </div>
        </a>
      </section>

      {/* Metro areas in this state */}
      {metros.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Metro Areas in {state.name}</h2>
          <p className="text-slate-600 text-sm mb-4">
            {metros.length} metropolitan areas with BLS wage data. Click any metro to see detailed salary breakdowns by occupation.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {metros.map((area) => (
              <a
                key={area.area_code}
                href={`/locations/${area.slug}/`}
                className="p-3 border border-slate-100 rounded-lg hover:bg-blue-50"
              >
                {area.area_title}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Context section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">About {state.name} Salary Data</h2>
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700 leading-relaxed space-y-3">
          <p>
            Wages in {state.name} reflect the state&rsquo;s industry mix, cost of living, and labor market conditions.
            The BLS Occupational Employment and Wage Statistics (OEWS) survey covers nonfarm payroll employment
            and provides annual salary estimates at the state level.
          </p>
          <p>
            The {formatSalary(summary.avg_median_salary)} average median across {summary.occ_count.toLocaleString()} occupations
            {natAvg > 0 && (
              <> is {diff >= 0 ? 'above' : 'below'} the national average of {formatSalary(natAvg)}</>
            )}.
            However, nominal wages alone do not capture purchasing power &mdash; pair this data with
            local cost-of-living indexes for a complete picture.
          </p>
          <p className="text-sm text-slate-500">
            BLS data typically lags by 12&ndash;18 months. {state.name}&rsquo;s {year} figures reflect the
            most recent complete OEWS release and do not include self-employed, farm, or military workers.
          </p>
        </div>
      </section>

      {/* Browse other states */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">Browse Other States</h2>
        <div className="flex flex-wrap gap-2">
          {US_STATES.filter((s) => s.slug !== slug).map((s) => (
            <a
              key={s.code}
              href={`/state/${s.slug}/`}
              className="px-3 py-1 rounded-full text-sm border border-slate-200 hover:bg-blue-50"
            >
              {s.name}
            </a>
          ))}
        </div>
      </section>

      <FAQ items={faqs} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }}
      />

      <StateRich slug={slug} state={state} />

    </div>
  );
}
