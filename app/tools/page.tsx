import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Salary tools — COL calculator, salary comparisons',
  description:
    'Free salary tools: cost-of-living calculator (BEA Regional Price Parities), occupation salary lookup, and metro-by-metro pay comparisons.',
  alternates: { canonical: '/tools/' },
  openGraph: { url: '/tools/' },
};

const TOOLS = [
  {
    href: '/tools/col-calculator/',
    title: 'Cost-of-living calculator',
    description:
      'Convert a salary in one metro area to its purchasing-power equivalent in another. Uses BEA 2024 Regional Price Parities for 50 major MSAs + every state.',
    badge: 'BEA RPP',
  },
];

export default function ToolsIndexPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Salary tools</h1>
      <p className="mt-2 text-slate-600">
        Calculators that pair government wage data (BLS OEWS) with cost-of-living indices (BEA RPP)
        and inflation series (BLS CPI-U).
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="block rounded-lg border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-800 ring-1 ring-blue-200">
                {t.badge}
              </span>
            </div>
            <p className="text-sm text-slate-600">{t.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
