/**
 * CPI-U helpers for nominal-to-real wage deflation.
 *
 * Source: BLS series CUUR0000SA0 (Consumer Price Index for All Urban Consumers,
 * U.S. city average, all items, not seasonally adjusted). This is the standard
 * series for converting nominal wages into constant-dollar real wages.
 *
 * Two snapshots are stored:
 *   - annual:  M13 annual average for each year (most stable, used for charts)
 *   - may:     M05 monthly value (matches OEWS reference month for higher fidelity)
 *
 * See: https://www.bls.gov/cpi/factsheets/cpi-urban-wage-clerical-and-clerical-workers.htm
 */
import cpiData from './generated/cpi-u.json';

type CpiSnapshot = {
  _meta: { series: string; title: string; source: string; sourceUrl: string };
  annual: Record<string, number>;
  may: Record<string, number>;
};

const CPI = cpiData as CpiSnapshot;

export type CpiBasis = 'annual' | 'may';

export function getCpiForYear(year: number, basis: CpiBasis = 'annual'): number | null {
  const v = CPI[basis][String(year)];
  return typeof v === 'number' ? v : null;
}

/**
 * Deflate a nominal salary in `fromYear` into the purchasing power of `toYear`.
 *
 * realInToYear = nominalInFromYear × CPI[toYear] / CPI[fromYear]
 *
 * @example deflateToYear(50000, 2020, 2024) → ~$60,612 (2020 purchasing power
 * required ~$60.6k of 2024 dollars)
 */
export function deflateToYear(
  nominal: number,
  fromYear: number,
  toYear: number,
  basis: CpiBasis = 'annual'
): number | null {
  const fromCpi = getCpiForYear(fromYear, basis);
  const toCpi = getCpiForYear(toYear, basis);
  if (fromCpi == null || toCpi == null || fromCpi <= 0) return null;
  return Math.round((nominal * toCpi) / fromCpi);
}

/**
 * Convert a series of nominal wages (each tagged with their reference year)
 * into a constant-dollar real-wage series referenced to `baseYear`.
 *
 * Used for the SalaryTrendChart real-vs-nominal dual line.
 */
export function deflateSeries(
  series: { year: number; nominal: number }[],
  baseYear: number,
  basis: CpiBasis = 'annual'
): { year: number; nominal: number; real: number | null }[] {
  return series.map(({ year, nominal }) => ({
    year,
    nominal,
    real: deflateToYear(nominal, year, baseYear, basis),
  }));
}

/**
 * Year-over-year inflation rate using CPI-U annual averages.
 * Returns a percentage (e.g. 4.7 for 2021→2022).
 */
export function annualInflationRate(year: number): number | null {
  const cur = getCpiForYear(year, 'annual');
  const prev = getCpiForYear(year - 1, 'annual');
  if (cur == null || prev == null) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

export function getCpiMeta() {
  return CPI._meta;
}

export function getAvailableYears(basis: CpiBasis = 'annual'): number[] {
  return Object.keys(CPI[basis]).map(Number).sort((a, b) => a - b);
}
