import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { US_STATES, getStateBySlug } from '@/lib/states-data';
import {
  getAllStateCodes,
  getStateTopOccupationsWithNational,
  getStateWageSummary,
  getNationalWageSummary,
} from '@/lib/db';
import { formatSalary, getDataYear } from '@/lib/format';
import { faqSchema } from '@/lib/schema';
import { AuthorBox } from '@/components/AuthorBox';
import { DataSourceBadge } from '@/components/DataSourceBadge';
import { CrossSiteLinks } from '@/components/CrossSiteLinks';
import { FeedbackButton } from '@/components/FeedbackButton';
import { FreshnessTag } from '@/components/FreshnessTag';
import { EditorNote } from '@/components/EditorNote';
import { AdSlot } from '@/components/AdSlot';
import { pickVariant } from '@/lib/content-helpers';

export const dynamicParams = false;
export const revalidate = 86400;

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  // Mirror /state/[slug]/page.tsx — only emit states with BLS metro data.
  const codesWithData = new Set(getAllStateCodes());
  return US_STATES.filter((s) => codesWithData.has(s.code)).map((s) => ({ slug: s.slug }));
}

const SITE_URL = 'https://salarybycity.com';

function pctDiff(a: number | null, b: number | null): string | null {
  if (a == null || b == null || b === 0) return null;
  const pct = ((a - b) / b) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) return {};
  const year = getDataYear();
  const top = getStateTopOccupationsWithNational(state.code, 20);
  const topJob = top[0];

  const title = pickVariant(slug, [
    `${state.name} Salary Ranges — p10 to p90 for the Top 20 Jobs (${year})`,
    `${state.name} Pay Distribution: 10th, 25th, Median, 75th, 90th Percentile`,
    `Salary Percentiles in ${state.name} — From Entry Floor to Top-Decile Pay`,
    `${state.name} Wage Ranges (${year}) — Top 20 Occupations by Percentile`,
  ], 9);

  const description = topJob
    ? pickVariant(slug, [
        `Full salary distribution for the top 20 occupations in ${state.name}: 10th, 25th, 50th, 75th, and 90th percentile wages. ${topJob.occ_title} ranges from ${formatSalary(topJob.annual_p10)} (p10) to ${formatSalary(topJob.annual_p90)} (p90). BLS OEWS data.`,
        `${state.name} pay percentiles per BLS: ${topJob.occ_title} spans ${formatSalary(topJob.annual_p10)} to ${formatSalary(topJob.annual_p90)} from p10 to p90. The full top-20 occupation table breaks down p10/p25/p50/p75/p90 for each role.`,
        `Browse ${state.name}'s top-20 occupations by salary percentile. The lead role, ${topJob.occ_title}, runs ${formatSalary(topJob.annual_p10)}–${formatSalary(topJob.annual_p90)} between bottom and top deciles. ${year} BLS OEWS.`,
      ], 10)
    : `Salary range data for ${state.name}. ${year} BLS OEWS percentile breakdowns.`;

  return {
    title,
    description,
    alternates: { canonical: `/state/${slug}/salary-ranges/` },
    openGraph: { url: `/state/${slug}/salary-ranges/` },
  };
}

function buildFaqs(
  stateName: string,
  jobs: ReturnType<typeof getStateTopOccupationsWithNational>,
  natSummary: ReturnType<typeof getNationalWageSummary>,
): { question: string; answer: string }[] {
  if (jobs.length === 0) return [];
  const top = jobs[0];
  const mid = jobs[Math.floor(jobs.length / 2)];

  const faqs: { question: string; answer: string }[] = [
    {
      question: `What do salary percentiles mean in ${stateName}?`,
      answer: `Percentile values show where workers in a given occupation fall in the wage distribution. The 10th percentile (p10) is the wage below which 10% of workers earn; p50 is the median; p90 is the wage exceeded by only the top 10%. The p90/p10 ratio is a common measure of within-job pay inequality — a higher ratio means the same job title pays very differently depending on experience, employer, and specialization.`,
    },
    {
      question: `What's the full salary range for ${top.occ_title} in ${stateName}?`,
      answer: `In ${stateName}, ${top.occ_title} salaries range from ${formatSalary(top.annual_p10)} at the 10th percentile to ${formatSalary(top.annual_p90)} at the 90th percentile, with a median of ${formatSalary(top.annual_median)}. The middle 50% (p25–p75) earn ${formatSalary(top.annual_p25)}–${formatSalary(top.annual_p75)}. ${top.national_median ? `The national median for this role is ${formatSalary(top.national_median)}.` : ''}`,
    },
    {
      question: `Why is the p90 (top 10%) wage higher than the median salary most reports quote?`,
      answer: `Most salary articles cite the median (p50), which is the middle worker. The p90 shows what a high performer — senior title, large employer, dense metro, specialized skills — typically earns in that occupation. For career planning in ${stateName}, comparing p50 to p90 inside a single occupation is often more useful than comparing two different job titles at the median.`,
    },
    {
      question: `How wide is the pay distribution for ${mid.occ_title} in ${stateName}?`,
      answer: `${mid.occ_title} pays ${formatSalary(mid.annual_p10)} at the 10th percentile and ${formatSalary(mid.annual_p90)} at the 90th percentile in ${stateName} — a ${
        mid.annual_p10 && mid.annual_p90 ? `${(mid.annual_p90 / mid.annual_p10).toFixed(1)}× spread` : 'wide spread'
      } between entry and top-tier earners. The middle 50% of workers (p25–p75) earn ${formatSalary(mid.annual_p25)}–${formatSalary(mid.annual_p75)}.`,
    },
    {
      question: `How do ${stateName} salary percentiles compare to the nation?`,
      answer: `Across the top 20 occupations shown here, ${stateName}'s medians${
        natSummary ? ` average against a national mean of ${formatSalary(natSummary.avg_median_salary)}` : ''
      }. States with above-national p50 values usually have even larger advantages at p90 — high-cost, high-productivity metros stretch the top of the distribution more than the median.`,
    },
    {
      question: `What does a high p90/p10 ratio tell me about an occupation?`,
      answer: `A ratio above ~3× means the same job title pays very differently depending on employer, credentials, or seniority. These are typically occupations where specialization (surgical subspecialty, senior engineering, partner-track legal, senior executive) commands premium pay. Occupations with ratios closer to 2× are more standardized — public-sector and union roles often look like this.`,
    },
    {
      question: `Is this data reliable for salary negotiation in ${stateName}?`,
      answer: `Yes, with caveats. BLS OEWS data is the largest free U.S. wage dataset, covering nonfarm payroll employment with a roughly 12–18 month lag. Use the p75 and p90 as realistic ceilings for specialized or senior roles in the occupation, and use p25 as a floor for experienced workers (below that is usually entry-level). The state-wide figure averages across metros — a Bay Area or NYC metro will exceed the state p90 for many roles.`,
    },
  ];
  return faqs;
}

export default async function SalaryRangesPage({ params }: Props) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();

  const year = getDataYear();
  const jobs = getStateTopOccupationsWithNational(state.code, 20);
  const stateSummary = getStateWageSummary(state.code);
  const natSummary = getNationalWageSummary();
  if (!jobs.length || !stateSummary) notFound();

  // highest paying occupation for hero highlight
  const top = jobs[0];

  const faqs = buildFaqs(state.name, jobs, natSummary);

  const nearby = US_STATES.filter((s) => s.slug !== slug).slice(0, 4);
  const otherIdx = US_STATES.findIndex((s) => s.slug === slug);
  const nearbyList = otherIdx >= 0
    ? [
        US_STATES[(otherIdx - 2 + US_STATES.length) % US_STATES.length],
        US_STATES[(otherIdx - 1 + US_STATES.length) % US_STATES.length],
        US_STATES[(otherIdx + 1) % US_STATES.length],
        US_STATES[(otherIdx + 2) % US_STATES.length],
      ].filter((s) => s.slug !== slug)
    : nearby;

  const bcJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'States', item: `${SITE_URL}/state/` },
      { '@type': 'ListItem', position: 3, name: state.name, item: `${SITE_URL}/state/${slug}/` },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'Salary Ranges',
        item: `${SITE_URL}/state/${slug}/salary-ranges/`,
      },
    ],
  };
  const faqJsonLd = faqSchema(faqs);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcJsonLd) }} />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-4">
        <Link href="/" className="hover:text-blue-700">Home</Link>
        <span className="mx-2">&rsaquo;</span>
        <Link href="/state/" className="hover:text-blue-700">States</Link>
        <span className="mx-2">&rsaquo;</span>
        <Link href={`/state/${slug}/`} className="hover:text-blue-700">{state.name}</Link>
        <span className="mx-2">&rsaquo;</span>
        <span className="text-slate-700">Salary Ranges</span>
      </nav>

      {/* Hero — slug-hashed across 51 states for diversification */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {pickVariant(slug, [
            `${state.name} Salary Ranges — 10th to 90th Percentile (${year})`,
            `${state.name} Pay Distribution by Percentile (${year})`,
            `Salary Percentiles in ${state.name}: From Entry Floor to Top Decile`,
            `${state.name} Wage Ranges — p10, Median, p90 for the Top 20 Jobs`,
          ], 11)}
        </h1>
        <p className="text-slate-600 max-w-3xl">
          {pickVariant(slug, [
            `The full pay distribution for the top 20 highest-paying occupations in ${state.name}. See p10, p25, p50 (median), p75, and p90 wages — the spread that a single median number hides.`,
            `Top 20 occupations in ${state.name} broken out by 10th, 25th, 50th, 75th, and 90th percentile pay. The percentile range tells you where entry, median, and senior-tier earnings actually fall.`,
            `For each of the top 20 ${state.name} occupations: bottom-decile (p10), median (p50), and top-decile (p90) wages alongside the interquartile range (p25–p75). One median number does not capture how much variance lives inside a single job title.`,
          ], 12)}
        </p>
      </header>

      <EditorNote
        note={pickVariant(slug, [
          `A median salary is one number. The real decision range is p25 to p75 — and for high performers, p90. In ${state.name}, ${top.occ_title} spans from ${formatSalary(top.annual_p10)} (p10) to ${formatSalary(top.annual_p90)} (p90). Use the ends of that range to calibrate offers, not just the middle.`,
          `When you compare an offer against a single "median" number, you lose half the picture. ${state.name}'s top role (${top.occ_title}) ranges from ${formatSalary(top.annual_p10)} at p10 to ${formatSalary(top.annual_p90)} at p90 — that's the band an offer should be calibrated against.`,
          `Pay-percentile data is more honest than a headline median. ${top.occ_title} workers in ${state.name} earn anywhere from ${formatSalary(top.annual_p10)} to ${formatSalary(top.annual_p90)} depending on experience and employer. The table below shows the same breakdown for the next 19 occupations.`,
        ], 13)}
      />

      {/* Spotlight: top 3 occupations' ranges */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Three Highest-Paying Occupations — Full Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {jobs.slice(0, 3).map((j) => (
            <div
              key={j.soc_code}
              className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-5"
            >
              <div className="text-xs text-slate-500 uppercase tracking-wide">Occupation</div>
              <div className="text-sm font-semibold text-slate-800 leading-snug">{j.occ_title}</div>
              <div className="mt-3 border-t border-blue-100 pt-3">
                <div className="text-xs text-slate-500">Median ({state.code})</div>
                <div className="text-2xl font-bold text-blue-700">{formatSalary(j.annual_median)}</div>
                {j.national_median && (
                  <div className="text-xs text-slate-500 mt-1">
                    National: {formatSalary(j.national_median)}
                    {pctDiff(j.annual_median, j.national_median) && (
                      <span
                        className={`ml-1 font-medium ${
                          (j.annual_median ?? 0) >= j.national_median ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {pctDiff(j.annual_median, j.national_median)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                <div className="flex justify-between"><span>p10</span><span>{formatSalary(j.annual_p10)}</span></div>
                <div className="flex justify-between"><span>p25</span><span>{formatSalary(j.annual_p25)}</span></div>
                <div className="flex justify-between font-semibold text-slate-800"><span>p50</span><span>{formatSalary(j.annual_median)}</span></div>
                <div className="flex justify-between"><span>p75</span><span>{formatSalary(j.annual_p75)}</span></div>
                <div className="flex justify-between"><span>p90</span><span>{formatSalary(j.annual_p90)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AdSlot id="4455667788" />

      {/* Full distribution table */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Top 20 Occupations — Percentile Table</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead className="bg-gray-50 text-gray-600 font-semibold">
              <tr>
                <th className="px-3 py-3 text-left">Occupation</th>
                <th className="px-3 py-3 text-right">p10</th>
                <th className="px-3 py-3 text-right">p25</th>
                <th className="px-3 py-3 text-right">Median (p50)</th>
                <th className="px-3 py-3 text-right">p75</th>
                <th className="px-3 py-3 text-right">p90</th>
                <th className="px-3 py-3 text-right hidden sm:table-cell">vs US</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((j) => {
                const diff = pctDiff(j.annual_median, j.national_median);
                const positive = (j.annual_median ?? 0) >= (j.national_median ?? 0);
                return (
                  <tr key={j.soc_code} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <a href={`/jobs/${j.occ_slug}/`} className="text-blue-700 hover:underline font-medium">
                        {j.occ_title}
                      </a>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">{formatSalary(j.annual_p10)}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{formatSalary(j.annual_p25)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-blue-700">
                      {formatSalary(j.annual_median)}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">{formatSalary(j.annual_p75)}</td>
                    <td className="px-3 py-3 text-right font-medium text-slate-800">
                      {formatSalary(j.annual_p90)}
                    </td>
                    <td className="px-3 py-3 text-right hidden sm:table-cell">
                      {diff ? (
                        <span className={positive ? 'text-emerald-700' : 'text-rose-700'}>{diff}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          p10 = entry / bottom 10%. p90 = top 10%. BLS OEWS {year}, state-wide aggregate. Metro figures
          for high-cost cities typically exceed the state p90 for these roles.
        </p>
      </section>

      {/* Spread analysis */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Within-Job Pay Inequality (p90 ÷ p10)</h2>
        <p className="text-sm text-slate-600 mb-4">
          The p90/p10 ratio measures how much the <em>same job title</em> pays differently across
          experience, employer, and specialization. Ratios above ~3× signal high reward for
          specialization.
        </p>
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Occupation</th>
                <th className="px-3 py-2 text-right">p10</th>
                <th className="px-3 py-2 text-right">p90</th>
                <th className="px-3 py-2 text-right">p90 / p10</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs
                .filter((j) => j.annual_p10 && j.annual_p90)
                .sort((a, b) => (b.annual_p90! / b.annual_p10!) - (a.annual_p90! / a.annual_p10!))
                .slice(0, 12)
                .map((j) => {
                  const ratio = (j.annual_p90! / j.annual_p10!).toFixed(2);
                  return (
                    <tr key={j.soc_code} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-700">{j.occ_title}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{formatSalary(j.annual_p10)}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{formatSalary(j.annual_p90)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">{ratio}×</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <AdSlot id="4455667789" />

      {/* How to use — slug-hashed heading */}
      <section className="mb-10 p-6 rounded-xl bg-slate-50 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-3">
          {pickVariant(slug, [
            'How to Use These Ranges',
            'Reading the Percentile Distribution',
            'Calibrating Offers Against the Range',
            'Practical Use of p10, p50, and p90',
          ], 14)}
        </h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
          <li>
            <strong>For offer calibration:</strong> match your target role to its p25 (entry-level floor), p50 (median), and p75 (senior/experienced target). Negotiate toward p75 once you have ~5+ years and a recent in-demand skill.
          </li>
          <li>
            <strong>For career switches:</strong> compare p90 across occupations, not p50. A role with a lower median but a higher p90 signals better upside for specialists.
          </li>
          <li>
            <strong>For metro adjustments:</strong> add 10–30% on top of the state p75 for high-cost metros (SF Bay, NYC, DC, Boston, Seattle). Subtract 5–15% for rural-weighted areas.
          </li>
          <li>
            <strong>For mid-career planning:</strong> use the p75 as a realistic 5-year target, p90 as a 10+ year stretch goal that usually requires specialization, leadership, or entrepreneurship.
          </li>
          <li>
            <strong>Cross-check with cost of living.</strong> A p75 in a high-cost state can have less purchasing power than p50 in a mid-cost state — the raw salary number alone does not settle the comparison.
          </li>
        </ol>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="rounded-lg border border-slate-200 bg-white p-4 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="cursor-pointer font-semibold text-slate-900 flex items-center justify-between gap-2">
                <span>{f.question}</span>
                <span className="text-blue-600 text-sm">+</span>
              </summary>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Nearby states */}
      {nearbyList.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Compare Salary Ranges in Other States</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {nearbyList.map((ns) => (
              <Link
                key={ns.slug}
                href={`/state/${ns.slug}/salary-ranges/`}
                className="bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 p-4 rounded-xl text-sm transition-colors"
              >
                <div className="font-medium text-gray-800 hover:text-blue-600">{ns.name}</div>
                <div className="text-xs text-gray-500 mt-1">View p10–p90 ranges →</div>
              </Link>
            ))}
          </div>
          <div className="mt-3 flex gap-4 flex-wrap">
            <Link href={`/state/${slug}/`} className="text-sm text-blue-700 hover:underline">
              ← Back to {state.name} salary overview
            </Link>
          </div>
        </section>
      )}

      <FreshnessTag source={`BLS OEWS ${year}`} />

      <FeedbackButton pageId={`${slug}-salary-ranges`} />

      <DataSourceBadge
        sources={[
          {
            name: 'BLS OEWS',
            url: 'https://www.bls.gov/oes/',
          },
        ]}
      />

      <CrossSiteLinks current="SalaryByCity" />

      <AuthorBox />
    </div>
  );
}
