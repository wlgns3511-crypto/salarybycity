/**
 * Compact glossary listing card — shows term, category badge, and 1-line snippet.
 * Used on /glossary/ index and category landing pages.
 */
import Link from 'next/link';
import type { GlossaryEntry } from '@/lib/glossary-data';
import { GLOSSARY_CATEGORY_LABELS } from '@/lib/glossary-data';

const CATEGORY_BADGE: Record<GlossaryEntry['category'], { className: string; label: string }> = {
  bls: { className: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200', label: 'BLS' },
  irs: { className: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200', label: 'IRS' },
  flsa: { className: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200', label: 'FLSA' },
  comp: { className: 'bg-slate-100 text-slate-800 ring-1 ring-slate-300', label: 'Comp' },
};

function snippet(s: string, max = 140): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return cut.slice(0, lastSpace > 80 ? lastSpace : max) + '…';
}

export function GlossaryTermCard({ entry }: { entry: GlossaryEntry }) {
  const badge = CATEGORY_BADGE[entry.category];
  return (
    <Link
      href={`/glossary/${entry.slug}/`}
      className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{entry.term}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-slate-600">{snippet(entry.definition)}</p>
      <p className="mt-2 text-[11px] text-slate-500">
        {GLOSSARY_CATEGORY_LABELS[entry.category].title}
      </p>
    </Link>
  );
}
