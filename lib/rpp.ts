/**
 * Regional Price Parities (RPP) helpers.
 *
 * Source: Bureau of Economic Analysis, "Regional Price Parities by State and
 * Metropolitan Statistical Area, 2008–2024", released February 2025.
 * https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area
 *
 * RPP is BEA's index of price levels relative to the national average (US=100).
 *   Higher RPP = costlier area. e.g. SF MSA ≈ 124 means goods/services cost
 *   ~24% more than the national average; Birmingham AL ≈ 88 means ~12% less.
 *
 * Use real wage = nominal wage × 100 / RPP to compare salaries across areas.
 *
 * Data lives in lib/generated/rpp.json (frozen import — see Trap #59).
 */
import rppData from './generated/rpp.json';

export type RppEntry = {
  /** 2-letter state code (e.g. "CA"); "US" for national row. */
  state: string | null;
  /** State RPP for the row's state (null only if state column was empty). */
  stateRpp: number | null;
  /** MSA RPP if matched against BEA series; null for national row's metro. */
  msaRpp: number | null;
  /** Series-end year (currently 2024). */
  year: number;
};

const RPP = rppData as Record<string, RppEntry | { year: number; source: string; stateBaseline: string; note: string }>;

const META = (RPP._meta as { year: number; source: string; stateBaseline: string; note: string }) ?? {
  year: 2024,
  source: 'BEA Regional Price Parities',
  stateBaseline: 'US=100',
  note: '',
};

/**
 * Get RPP entry for an area_code from salary.db.
 * @param areaCode 7-digit DB area_code, e.g. "0035620" (NYC) or "0000000" (national)
 */
export function getRppForArea(areaCode: string): RppEntry | null {
  const entry = RPP[areaCode];
  if (!entry || 'source' in entry) return null;
  return entry;
}

/**
 * Pick the most specific RPP available: MSA if matched, else state, else national.
 */
export function getEffectiveRpp(areaCode: string): { value: number; level: 'msa' | 'state' | 'national' } {
  const e = getRppForArea(areaCode);
  if (e?.msaRpp != null) return { value: e.msaRpp, level: 'msa' };
  if (e?.stateRpp != null) return { value: e.stateRpp, level: 'state' };
  return { value: 100, level: 'national' };
}

/**
 * Get the state-level RPP for a 2-letter state code (e.g. "CA"). Returns null
 * if no MSA entry in that state is present in the dataset (which means we
 * never received the state's stateRpp value either, since stateRpp is stored
 * per-MSA row).
 */
export function getStateRpp(stateCode: string): number | null {
  const target = stateCode.toUpperCase();
  for (const key of Object.keys(RPP)) {
    if (key === '_meta') continue;
    const entry = RPP[key];
    if ('source' in entry) continue;
    if (entry.state === target && entry.stateRpp != null) return entry.stateRpp;
  }
  return null;
}

/**
 * Convert a nominal salary (in source area's nominal dollars) to real (US-baseline)
 * dollars by deflating with that area's RPP.
 *
 * realUSD = nominal × 100 / RPP
 *
 * Example: $100k in San Jose (RPP ≈ 132) → ~$76k real US dollars.
 */
export function nominalToReal(nominal: number, areaCode: string): number {
  const rpp = getEffectiveRpp(areaCode).value;
  if (rpp <= 0) return nominal;
  return Math.round((nominal * 100) / rpp);
}

/**
 * Adjust a salary offered in `sourceArea` to its purchasing-power equivalent
 * in `targetArea`. Used by the COL calculator.
 *
 * Step 1: nominal[source] → real[US] via source RPP
 * Step 2: real[US] → nominal[target] via target RPP
 *
 * Equivalent in one step: nominal[target] = nominal[source] × (RPP_target / RPP_source)
 */
export function adjustSalary(
  nominal: number,
  sourceAreaCode: string,
  targetAreaCode: string
): { equivalent: number; deltaPct: number; sourceRpp: number; targetRpp: number } {
  const sourceRpp = getEffectiveRpp(sourceAreaCode).value;
  const targetRpp = getEffectiveRpp(targetAreaCode).value;
  if (sourceRpp <= 0 || targetRpp <= 0) {
    return { equivalent: nominal, deltaPct: 0, sourceRpp, targetRpp };
  }
  const equivalent = Math.round((nominal * targetRpp) / sourceRpp);
  const deltaPct = Math.round(((equivalent - nominal) / nominal) * 1000) / 10;
  return { equivalent, deltaPct, sourceRpp, targetRpp };
}

export function getRppMeta() {
  return META;
}
