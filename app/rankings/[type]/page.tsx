import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHighestPayingJobsNational, getHighestPayingJobsByState } from "@/lib/db";
import { formatSalary } from "@/lib/format";
import { itemListSchema, datasetSchema } from "@/lib/schema";

/* ── US state name ↔ slug mapping ── */

const US_STATES: Record<string, { name: string; code: string }> = {
  'alabama': { name: 'Alabama', code: 'AL' },
  'alaska': { name: 'Alaska', code: 'AK' },
  'arizona': { name: 'Arizona', code: 'AZ' },
  'arkansas': { name: 'Arkansas', code: 'AR' },
  'california': { name: 'California', code: 'CA' },
  'colorado': { name: 'Colorado', code: 'CO' },
  'connecticut': { name: 'Connecticut', code: 'CT' },
  'delaware': { name: 'Delaware', code: 'DE' },
  'florida': { name: 'Florida', code: 'FL' },
  'georgia': { name: 'Georgia', code: 'GA' },
  'hawaii': { name: 'Hawaii', code: 'HI' },
  'idaho': { name: 'Idaho', code: 'ID' },
  'illinois': { name: 'Illinois', code: 'IL' },
  'indiana': { name: 'Indiana', code: 'IN' },
  'iowa': { name: 'Iowa', code: 'IA' },
  'kansas': { name: 'Kansas', code: 'KS' },
  'kentucky': { name: 'Kentucky', code: 'KY' },
  'louisiana': { name: 'Louisiana', code: 'LA' },
  'maine': { name: 'Maine', code: 'ME' },
  'maryland': { name: 'Maryland', code: 'MD' },
  'massachusetts': { name: 'Massachusetts', code: 'MA' },
  'michigan': { name: 'Michigan', code: 'MI' },
  'minnesota': { name: 'Minnesota', code: 'MN' },
  'mississippi': { name: 'Mississippi', code: 'MS' },
  'missouri': { name: 'Missouri', code: 'MO' },
  'montana': { name: 'Montana', code: 'MT' },
  'nebraska': { name: 'Nebraska', code: 'NE' },
  'nevada': { name: 'Nevada', code: 'NV' },
  'new-hampshire': { name: 'New Hampshire', code: 'NH' },
  'new-jersey': { name: 'New Jersey', code: 'NJ' },
  'new-mexico': { name: 'New Mexico', code: 'NM' },
  'new-york': { name: 'New York', code: 'NY' },
  'north-carolina': { name: 'North Carolina', code: 'NC' },
  'north-dakota': { name: 'North Dakota', code: 'ND' },
  'ohio': { name: 'Ohio', code: 'OH' },
  'oklahoma': { name: 'Oklahoma', code: 'OK' },
  'oregon': { name: 'Oregon', code: 'OR' },
  'pennsylvania': { name: 'Pennsylvania', code: 'PA' },
  'rhode-island': { name: 'Rhode Island', code: 'RI' },
  'south-carolina': { name: 'South Carolina', code: 'SC' },
  'south-dakota': { name: 'South Dakota', code: 'SD' },
  'tennessee': { name: 'Tennessee', code: 'TN' },
  'texas': { name: 'Texas', code: 'TX' },
  'utah': { name: 'Utah', code: 'UT' },
  'vermont': { name: 'Vermont', code: 'VT' },
  'virginia': { name: 'Virginia', code: 'VA' },
  'washington': { name: 'Washington', code: 'WA' },
  'west-virginia': { name: 'West Virginia', code: 'WV' },
  'wisconsin': { name: 'Wisconsin', code: 'WI' },
  'wyoming': { name: 'Wyoming', code: 'WY' },
  'district-of-columbia': { name: 'District of Columbia', code: 'DC' },
  'puerto-rico': { name: 'Puerto Rico', code: 'PR' },
  'guam': { name: 'Guam', code: 'GU' },
  'virgin-islands': { name: 'Virgin Islands', code: 'VI' },
};

const STATE_SLUG_PREFIX = 'highest-paying-jobs-in-';

/* ── Static national rankings ── */

const RANKINGS: Record<string, { title: string; desc: string }> = {
  'highest-paying-jobs': { title: 'Highest Paying Jobs in the US', desc: 'Top occupations ranked by median annual salary.' },
};

/* ── Helpers ── */

function parseStateRanking(type: string): { stateSlug: string; stateName: string; stateCode: string } | null {
  if (!type.startsWith(STATE_SLUG_PREFIX)) return null;
  const stateSlug = type.slice(STATE_SLUG_PREFIX.length);
  const entry = US_STATES[stateSlug];
  if (!entry) return null;
  return { stateSlug, stateName: entry.name, stateCode: entry.code };
}

/* ── Next.js page ── */

interface Props { params: Promise<{ type: string }> }

export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  // National rankings
  const params = Object.keys(RANKINGS).map((type) => ({ type }));

  // State-level rankings
  for (const stateSlug of Object.keys(US_STATES)) {
    params.push({ type: `${STATE_SLUG_PREFIX}${stateSlug}` });
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;

  // Check national ranking first
  const r = RANKINGS[type];
  if (r) {
    return {
      title: r.title,
      description: r.desc,
      alternates: { canonical: `/rankings/${type}/` },
      openGraph: { url: `/rankings/${type}/` },
    };
  }

  // Check state ranking
  const stateInfo = parseStateRanking(type);
  if (stateInfo) {
    const title = `Highest Paying Jobs in ${stateInfo.stateName} (2024)`;
    const desc = `Top occupations in ${stateInfo.stateName} ranked by median annual salary. See which jobs pay the most in ${stateInfo.stateCode}.`;
    return {
      title,
      description: desc,
      alternates: { canonical: `/rankings/${type}/` },
      openGraph: { url: `/rankings/${type}/` },
    };
  }

  return {};
}

export default async function RankingPage({ params }: Props) {
  const { type } = await params;

  // --- National ranking ---
  const r = RANKINGS[type];
  if (r) {
    const jobs = getHighestPayingJobsNational(50);
    const listItems = jobs.map(j => ({ name: j.occ_title, url: `/jobs/${j.occ_slug}/` }));

    return (
      <div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema(r.title, `/rankings/${type}`, listItems)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema(r.title, r.desc, `/rankings/${type}`)) }} />
        <nav className="text-sm text-slate-500 mb-4">
          <a href="/" className="hover:underline">Home</a> / <span className="text-slate-800">{r.title}</span>
        </nav>

        <h1 className="text-3xl font-bold mb-2">{r.title}</h1>
        <p className="text-slate-600 mb-6">{r.desc}</p>

        <RankingTable jobs={jobs} />

        <StateRankingLinks />
      </div>
    );
  }

  // --- State ranking ---
  const stateInfo = parseStateRanking(type);
  if (!stateInfo) notFound();

  const jobs = getHighestPayingJobsByState(stateInfo.stateCode, 50);
  if (jobs.length === 0) notFound();

  const title = `Highest Paying Jobs in ${stateInfo.stateName}`;
  const desc = `Top ${jobs.length} occupations in ${stateInfo.stateName} ranked by median annual salary.`;
  const listItems = jobs.map(j => ({ name: j.occ_title, url: `/jobs/${j.occ_slug}/` }));

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema(title, `/rankings/${type}`, listItems)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema(title, desc, `/rankings/${type}`)) }} />
      <nav className="text-sm text-slate-500 mb-4">
        <a href="/" className="hover:underline">Home</a>
        {' / '}
        <a href="/rankings/highest-paying-jobs/" className="hover:underline">Rankings</a>
        {' / '}
        <span className="text-slate-800">{stateInfo.stateName}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-slate-600 mb-6">{desc}</p>

      <RankingTable jobs={jobs} />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Compare With Other States</h2>
        <StateRankingLinks current={stateInfo.stateSlug} />
      </div>
    </div>
  );
}

/* ── Shared components ── */

function RankingTable({ jobs }: { jobs: { occ_slug: string; occ_title: string; annual_median: number | null }[] }) {
  return (
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
  );
}

function StateRankingLinks({ current }: { current?: string }) {
  const stateEntries = Object.entries(US_STATES)
    .filter(([slug]) => slug !== current)
    .sort((a, b) => a[1].name.localeCompare(b[1].name));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {stateEntries.map(([slug, { name }]) => (
        <a
          key={slug}
          href={`/rankings/${STATE_SLUG_PREFIX}${slug}`}
          className="text-sm text-blue-600 hover:underline py-1"
        >
          {name}
        </a>
      ))}
    </div>
  );
}
