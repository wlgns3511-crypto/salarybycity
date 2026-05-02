/**
 * Full glossary entry body — definition, example, "not a mistake" callout,
 * see-also cross-links, and sources. Renders the page content for /glossary/[slug]/.
 */
import Link from 'next/link';
import type { GlossaryEntry } from '@/lib/glossary-data';
import { GLOSSARY_BY_SLUG, GLOSSARY_CATEGORY_LABELS } from '@/lib/glossary-data';

const CATEGORY_TINT: Record<GlossaryEntry['category'], string> = {
  bls: 'border-blue-200 bg-blue-50',
  irs: 'border-emerald-200 bg-emerald-50',
  flsa: 'border-amber-200 bg-amber-50',
  comp: 'border-slate-200 bg-slate-50',
};

export function GlossaryEntryBody({ entry }: { entry: GlossaryEntry }) {
  const tint = CATEGORY_TINT[entry.category];
  const seeAlso = (entry.seeAlso ?? [])
    .map((slug) => GLOSSARY_BY_SLUG.get(slug))
    .filter((e): e is GlossaryEntry => Boolean(e));

  return (
    <article className="prose prose-slate max-w-none">
      <header className="not-prose mb-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          {GLOSSARY_CATEGORY_LABELS[entry.category].title}
        </p>
        <h1 className="text-2xl font-bold text-slate-900">{entry.term}</h1>
        {entry.aliases && entry.aliases.length > 0 && (
          <p className="mt-1 text-sm text-slate-600">
            Also called: <span className="italic">{entry.aliases.join(', ')}</span>
          </p>
        )}
      </header>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Definition</h2>
        <p className="text-slate-700">{entry.definition}</p>
      </section>

      {entry.example && (
        <section className={`not-prose my-4 rounded-md border p-3 text-sm ${tint}`}>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-700">Example</h3>
          <p className="text-slate-800">{entry.example}</p>
        </section>
      )}

      {entry.notMistake && (
        <section className="not-prose my-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-700">Not the same as…</h3>
          <p className="text-slate-800">{entry.notMistake}</p>
        </section>
      )}

      {seeAlso.length > 0 && (
        <section className="not-prose my-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">See also</h3>
          <ul className="flex flex-wrap gap-2">
            {seeAlso.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/glossary/${s.slug}/`}
                  className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:border-slate-400"
                >
                  {s.term}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="not-prose my-4 border-t border-slate-200 pt-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Sources</h3>
        <ol className="space-y-1 text-xs text-slate-700">
          {entry.sources.map((src, i) => (
            <li key={i}>
              <Link
                href={src.url}
                rel="nofollow noopener"
                target="_blank"
                className="underline decoration-slate-400 hover:decoration-slate-700"
              >
                {src.title}
              </Link>
              {src.year && <span className="text-slate-500"> · {src.year}</span>}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
