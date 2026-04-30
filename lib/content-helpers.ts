/**
 * content-helpers.ts — salarybycity HCU 5-chunk patch (2026-04-28).
 *
 * Reusable formatters and slug-hash variant pickers shared across
 * salary-facts.ts, salary-commentary.ts, salary-cluster-insights.ts, and
 * page files.
 *
 * Pattern source: nameblooms canonical (lib/name-commentary.ts) →
 * caloriewize lib/content-helpers.ts → here.
 *
 * RATIONALE — slug-hash rotation:
 *   The same slug always renders the same variant across rebuilds (idempotent
 *   for indexing), but corpus-wide N variants are used → defeats template
 *   detection. Google sees N copies, not 1 with parameter-stuffing.
 */

/** Relative phrase: "X is N× more/less than Y" or null when ratio is too small to mention. */
export function ratioPhrase(myVal: number, theirVal: number, theirName: string): string | null {
  if (!myVal || !theirVal || theirVal <= 0) return null;
  const ratio = myVal / theirVal;
  if (ratio >= 1.5) return `about ${ratio.toFixed(1)}× more than ${theirName}`;
  if (ratio <= 0.67) return `about ${(1 / ratio).toFixed(1)}× less than ${theirName}`;
  return `about the same as ${theirName}`;
}

/** English article based on first letter. */
export function aOrAn(word: string): string {
  if (!word) return 'a';
  const first = word[0].toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

/**
 * Slug-hash variant selector. Same key always → same option, but corpus-wide
 * we cycle through all options. Defeats template detection because Google
 * sees N variants, not 1 with parameter-stuffing.
 *
 * @param key - slug or page key (deterministic input)
 * @param options - candidate variants
 * @param salt - optional salt to rotate variants per insight slot, so two
 *               adjacent slots on the same page don't collide
 */
export function pickVariant<T>(key: string, options: readonly T[], salt = 0): T {
  if (!options.length) throw new Error('pickVariant: empty options');
  let h = salt;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return options[Math.abs(h) % options.length];
}

/** Format integer counts with locale separators (e.g. 12345 → "12,345"). */
export function fmtCount(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}

/** Format USD: 84320 → "$84,320". Optional digits for cents. */
export function fmtUSD(n: number | null | undefined, digits = 0): string {
  if (n == null || !isFinite(n)) return '—';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

/** Format USD compactly: 84320 → "$84.3K", 124500 → "$124K", 1250000 → "$1.25M". */
export function fmtUSDCompact(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 100_000) return `$${Math.round(n / 1000)}K`;
  if (Math.abs(n) >= 10_000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US')}`;
}

/** Format a fraction as percentage: 0.123 → "12.3%". */
export function fmtPct(p: number | null | undefined, digits = 1): string {
  if (p == null || !isFinite(p)) return '—';
  return `${(p * 100).toFixed(digits)}%`;
}

/** Format ratio: 1.85 → "1.85×". */
export function fmtRatio(r: number | null | undefined, digits = 2): string {
  if (r == null || !isFinite(r)) return '—';
  return `${r.toFixed(digits)}×`;
}

/** Ordinal suffix: 1 → "1st", 2 → "2nd", 21 → "21st". */
export function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Round to N decimal places, returning a Number (not string). */
export function roundTo(n: number, digits = 1): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

/** Title-case a slug: "registered-nurses" → "Registered Nurses". */
export function titleCase(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Bucket a numeric value into a percentile band label.
 *   ≥0.95 → "top 5%"
 *   ≥0.90 → "top 10%"
 *   ≥0.75 → "top quartile"
 *   ≥0.50 → "above median"
 *   ≥0.25 → "below median"
 *   else  → "bottom quartile"
 */
export function percentileBand(p: number | null | undefined): string {
  if (p == null || !isFinite(p)) return 'unranked';
  if (p >= 0.95) return 'top 5%';
  if (p >= 0.90) return 'top 10%';
  if (p >= 0.75) return 'top quartile';
  if (p >= 0.50) return 'above median';
  if (p >= 0.25) return 'below median';
  return 'bottom quartile';
}
