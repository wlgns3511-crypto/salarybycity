import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllGuides } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'Salary Guides — Tax, Benchmarks, Negotiation & Real Income',
  description: 'In-depth salary guides covering gross vs net by state, mean vs median, cost-adjusted purchasing power, career growth curves, and how to negotiate with market data.',
  alternates: { canonical: '/guide/' },
  openGraph: { title: 'Salary Guides', description: 'Authoritative guides on US salaries, take-home pay, and negotiation.', url: '/guide/' },
};

export default function GuidesIndex() {
  const guides = getAllGuides();

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'SalaryByCity Guides',
            url: 'https://salarybycity.com/guide/',
            numberOfItems: guides.length,
            itemListElement: guides.map((g, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: g.title,
              url: `https://salarybycity.com/guide/${g.slug}/`,
            })),
          }),
        }}
      />

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Salary Guides</h1>
        <p className="text-slate-600 max-w-3xl">
          Long-form, evidence-based guides on US salaries. Why $100K in NYC isn't $100K in Texas,
          how to read mean versus median honestly, the real purchasing-power ranking by metro,
          how salaries should grow over a career, and how to use market data in negotiation
          without it backfiring.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {guides.map((g) => (
          <Link
            key={g.slug}
            href={`/guide/${g.slug}/`}
            className="block rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 p-5 transition-colors"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">{g.category}</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">{g.title}</h2>
            <p className="text-sm text-slate-600">{g.description}</p>
          </Link>
        ))}
      </div>

      <section className="mt-12 p-6 rounded-xl bg-slate-50 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Look up real numbers</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/jobs/" className="text-blue-700 hover:underline font-medium">Browse occupations →</Link>
            <span className="text-slate-500"> BLS percentile data by job</span>
          </li>
          <li>
            <Link href="/locations/" className="text-blue-700 hover:underline font-medium">Salary by location →</Link>
            <span className="text-slate-500"> median pay across US metros</span>
          </li>
          <li>
            <Link href="/compare/" className="text-blue-700 hover:underline font-medium">Compare two roles →</Link>
            <span className="text-slate-500"> side-by-side comp analysis</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
