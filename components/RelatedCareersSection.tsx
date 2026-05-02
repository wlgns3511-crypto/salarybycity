/**
 * Related careers ranked by national-wage proximity within the same major group.
 * Used at the bottom of /jobs/[slug]/ pages.
 */
import Link from 'next/link';
import type { RelatedCareer } from '@/lib/db';

interface RelatedCareersSectionProps {
  source: { title: string; nationalMedian: number };
  related: RelatedCareer[];
  majorGroupTitle?: string;
}

function formatUsd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function deltaTone(deltaPct: number) {
  if (Math.abs(deltaPct) < 3) return 'text-slate-600';
  if (deltaPct >= 0) return 'text-emerald-700';
  return 'text-rose-700';
}

export function RelatedCareersSection({ source, related, majorGroupTitle }: RelatedCareersSectionProps) {
  if (related.length === 0) return null;
  return (
    <section className="my-6">
      <h2 className="mb-1 text-xl font-bold text-slate-900">Adjacent careers with similar pay</h2>
      <p className="mb-3 text-sm text-slate-600">
        Roles in {majorGroupTitle ? <>the <strong>{majorGroupTitle}</strong> group</> : 'the same occupational group'}
        {' '}whose national median wage is closest to <strong>{source.title}</strong> ({formatUsd(source.nationalMedian)}).
        {' '}Pay deltas are nominal vs. {source.title}.
      </p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {related.map((r) => (
          <li key={r.soc_code}>
            <Link
              href={`/jobs/${r.slug}/`}
              className="flex items-baseline justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:border-slate-300"
            >
              <span className="font-medium text-slate-800">{r.title}</span>
              <span className="shrink-0 text-right">
                <span className="text-slate-700">{formatUsd(r.national_median)}</span>
                <span className={`ml-2 text-xs ${deltaTone(r.delta_pct)}`}>
                  {r.delta_pct >= 0 ? '+' : ''}{r.delta_pct}%
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-slate-500">
        Source: BLS OEWS national median wage, May 2024. Ranking by absolute wage delta.
      </p>
    </section>
  );
}
