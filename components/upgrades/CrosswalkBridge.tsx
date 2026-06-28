/**
 * Phase 7 P5 — Internal cross-walk bridge (§8.3 portfolio matrix, state row).
 *
 * Surfaces 5 portfolio siblings keyed by the same {state-slug} join — the
 * verified DataPeek matrix cohort already shipped on licensewize 2026-05-20.
 * All 5 confirmed 200 on PROD across the 50-state + DC keep-set.
 *
 * salarybycity's /state/[slug]/ uses bare kebab-case state slugs
 * (district-of-columbia, north-carolina, ...) which match every sibling's
 * /state/{slug}/ convention per playbook v2.3 §8.3.1 — no slug-strip
 * transformation needed.
 *
 * Footprint discipline (Trap #118): anchor copy keeps each link's intent
 * honestly different (wage burden vs net pay vs SALT vs med cost vs biz
 * tax stack). Order is fixed.
 */

interface SiblingLink {
  href: string;
  label: string;
  blurb: string;
}

export function CrosswalkBridge({
  stateName,
  stateSlug,
}: {
  stateName: string;
  stateSlug: string;
}) {
  const siblings: SiblingLink[] = [
    {
      href: `https://wagepeek.com/state/${stateSlug}/`,
      label: `${stateName} real wage burden`,
      blurb: 'BLS OEWS nominal × BEA RPP — what the headline wage actually buys.',
    },
    {
      href: `https://netpaypeek.com/state/${stateSlug}/`,
      label: `${stateName} net pay after taxes`,
      blurb: 'State + federal withholding turned into take-home dollars.',
    },
    {
      href: `https://taxdeductionpeek.com/state/${stateSlug}/`,
      label: `${stateName} SALT + TCJA deductions`,
      blurb: 'State-and-local tax cap projection on this state’s incomes.',
    },
    {
      href: `https://medcostpeek.com/state/${stateSlug}/`,
      label: `${stateName} medical cost benchmarks`,
      blurb: 'Provider-side cost context — healthcare occupations dominate top deciles.',
    },
    {
      href: `https://biztaxwize.com/state/${stateSlug}/`,
      label: `${stateName} business tax stack`,
      blurb: 'For self-employed earners: state business tax + filing thresholds.',
    },
  ];

  return (
    <aside className="my-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-bold text-slate-800 mb-2">
        Cross-walk {stateName} on the wider DataPeek network
      </h3>
      <p className="text-xs text-slate-600 mb-3">
        Same {stateName} join key, different lens — each sibling decodes a
        distinct dimension that salarybycity does not cover.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {siblings.map((sib) => (
          <li key={sib.href} className="rounded-md bg-white border border-slate-100 p-2.5">
            <a
              href={sib.href}
              rel="external noopener"
              className="text-sm font-medium text-indigo-700 hover:underline"
            >
              {sib.label} →
            </a>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{sib.blurb}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
