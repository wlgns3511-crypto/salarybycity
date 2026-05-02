import type { Metadata } from 'next';
import {
  GLOSSARY,
  GLOSSARY_BY_CATEGORY,
  GLOSSARY_CATEGORY_LABELS,
} from '@/lib/glossary-data';
import { GlossaryTermCard } from '@/components/glossary/GlossaryTermCard';

export const metadata: Metadata = {
  title: 'Salary Glossary — BLS, IRS, FLSA, and compensation terms',
  description:
    'Plain-English definitions for the salary terms that appear in BLS wage statistics, IRS tax rules, FLSA labor law, and compensation packages. 50 entries with primary-source citations.',
  alternates: { canonical: '/glossary/' },
  openGraph: { url: '/glossary/' },
};

const CATEGORY_ORDER = ['bls', 'irs', 'flsa', 'comp'] as const;

export default function GlossaryIndexPage() {
  const total = GLOSSARY.length;
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Salary glossary</h1>
        <p className="mt-2 text-slate-600">
          {total} salary terms grouped by where they originate — BLS wage statistics, IRS tax code,
          DOL/FLSA labor law, or standard compensation packages. Every entry cites its primary
          source so you can verify the underlying definition.
        </p>
      </header>

      {CATEGORY_ORDER.map((cat) => {
        const entries = GLOSSARY_BY_CATEGORY[cat];
        const meta = GLOSSARY_CATEGORY_LABELS[cat];
        return (
          <section key={cat} className="mb-10">
            <h2 className="mb-1 text-xl font-semibold text-slate-900">{meta.title}</h2>
            <p className="mb-4 text-sm text-slate-600">{meta.description}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <GlossaryTermCard key={entry.slug} entry={entry} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
