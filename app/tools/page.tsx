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

const RELATED_SURFACES = [
  {
    href: '/jobs/',
    title: 'Find the base salary first',
    description:
      'Look up the occupation page before using the calculator so the starting salary is grounded in BLS wage data.',
  },
  {
    href: '/state/',
    title: 'Check state context',
    description:
      'Use state pages when you need broad market context before narrowing to a metro comparison.',
  },
  {
    href: '/methodology/',
    title: 'Read the data method',
    description:
      'Review how SalaryByCity handles BLS OEWS wages, BEA RPP cost indexes, and publication lags.',
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

      <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-xl font-bold text-slate-950 mb-3">
          Use the calculator with salary context
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          The cost-of-living tool is most useful after you have a real salary number to test.
          Pair it with occupation and state pages so you can compare both market pay and local
          purchasing power.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {RELATED_SURFACES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
            >
              <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
