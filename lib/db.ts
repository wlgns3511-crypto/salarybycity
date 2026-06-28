import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'salary.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  }
  return _db;
}

// --- Types ---

export interface Occupation {
  soc_code: string;
  title: string;
  major_group: string;
  major_group_title: string;
  slug: string;
}

export interface Area {
  area_code: string;
  area_title: string;
  area_type: string;
  state: string;
  slug: string;
}

export interface WageData {
  soc_code: string;
  area_code: string;
  employment: number | null;
  annual_mean: number | null;
  annual_median: number | null;
  annual_p10: number | null;
  annual_p25: number | null;
  annual_p75: number | null;
  annual_p90: number | null;
  hourly_mean: number | null;
  hourly_median: number | null;
  year: number;
}

export interface WageWithArea extends WageData {
  area_title: string;
  area_slug: string;
}

export interface WageWithOccupation extends WageData {
  occ_title: string;
  occ_slug: string;
}

// --- Occupation queries ---

export function getAllOccupations(): Occupation[] {
  return getDb().prepare('SELECT * FROM occupations ORDER BY title').all() as Occupation[];
}

export function getOccupationBySlug(slug: string): Occupation | undefined {
  return getDb().prepare('SELECT * FROM occupations WHERE slug = ?').get(slug) as Occupation | undefined;
}

export function getOccupationsByMajorGroup(): Record<string, Occupation[]> {
  const all = getAllOccupations();
  const groups: Record<string, Occupation[]> = {};
  for (const occ of all) {
    const key = occ.major_group_title || 'Other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(occ);
  }
  return groups;
}

// --- Area queries ---

export function getAllMetroAreas(): Area[] {
  return getDb().prepare("SELECT * FROM areas WHERE area_type = 'M' ORDER BY area_title").all() as Area[];
}

export function getAllStates(): Area[] {
  return getDb().prepare("SELECT * FROM areas WHERE area_type = 'S' ORDER BY area_title").all() as Area[];
}

export function getAreaBySlug(slug: string): Area | undefined {
  return getDb().prepare('SELECT * FROM areas WHERE slug = ?').get(slug) as Area | undefined;
}

export function getNationalArea(): Area | undefined {
  return getDb().prepare("SELECT * FROM areas WHERE area_type = 'N' LIMIT 1").get() as Area | undefined;
}

// --- Wage queries ---

export function getWage(socCode: string, areaCode: string): WageData | undefined {
  return getDb().prepare(
    'SELECT * FROM wages WHERE soc_code = ? AND area_code = ? ORDER BY year DESC LIMIT 1'
  ).get(socCode, areaCode) as WageData | undefined;
}

export function getWagesByOccupation(socCode: string, limit = 50): WageWithArea[] {
  return getDb().prepare(`
    SELECT w.*, a.area_title, a.slug as area_slug
    FROM wages w
    JOIN areas a ON w.area_code = a.area_code
    WHERE w.soc_code = ? AND a.area_type = 'M' AND w.annual_median IS NOT NULL
    ORDER BY w.annual_median DESC
    LIMIT ?
  `).all(socCode, limit) as WageWithArea[];
}

export function getWagesByArea(areaCode: string, limit = 50): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON w.soc_code = o.soc_code
    WHERE w.area_code = ? AND w.annual_median IS NOT NULL
    ORDER BY w.annual_median DESC
    LIMIT ?
  `).all(areaCode, limit) as WageWithOccupation[];
}

export function getNationalWage(socCode: string): WageData | undefined {
  return getDb().prepare(`
    SELECT w.* FROM wages w
    JOIN areas a ON w.area_code = a.area_code
    WHERE w.soc_code = ? AND a.area_type = 'N'
    ORDER BY year DESC LIMIT 1
  `).get(socCode) as WageData | undefined;
}

/**
 * All available years of wage data for one occupation × area.
 * Used by SalaryTrendChart to render a multi-year nominal+real line.
 */
export function getWagesAcrossYears(socCode: string, areaCode: string): WageData[] {
  return getDb().prepare(`
    SELECT * FROM wages
    WHERE soc_code = ? AND area_code = ? AND annual_median IS NOT NULL
    ORDER BY year ASC
  `).all(socCode, areaCode) as WageData[];
}

/**
 * National wage trend across all years.
 */
export function getNationalWagesAcrossYears(socCode: string): WageData[] {
  return getDb().prepare(`
    SELECT w.* FROM wages w
    JOIN areas a ON w.area_code = a.area_code
    WHERE w.soc_code = ? AND a.area_type = 'N' AND w.annual_median IS NOT NULL
    ORDER BY w.year ASC
  `).all(socCode) as WageData[];
}

// --- Counts for sitemap ---

export function countAllWagePages(): number {
  const row = getDb().prepare(`
    SELECT COUNT(*) as c FROM wages w
    JOIN areas a ON w.area_code = a.area_code
    JOIN occupations o ON w.soc_code = o.soc_code
    WHERE a.area_type = 'M' AND w.annual_median IS NOT NULL
  `).get() as { c: number };
  return row.c;
}

export function getWagePagesChunk(offset: number, limit: number): { occ_slug: string; area_slug: string }[] {
  return getDb().prepare(`
    SELECT o.slug as occ_slug, a.slug as area_slug
    FROM wages w
    JOIN areas a ON w.area_code = a.area_code
    JOIN occupations o ON w.soc_code = o.soc_code
    WHERE a.area_type = 'M' AND w.annual_median IS NOT NULL
    ORDER BY o.slug, a.slug
    LIMIT ? OFFSET ?
  `).all(limit, offset) as { occ_slug: string; area_slug: string }[];
}

// --- State queries ---

export function getAllStateCodes(): string[] {
  return (getDb().prepare("SELECT DISTINCT state FROM areas WHERE area_type = 'M' AND state != '' ORDER BY state").all() as { state: string }[]).map(r => r.state);
}

export function getAreasByState(state: string): Area[] {
  return getDb().prepare("SELECT * FROM areas WHERE state = ? AND area_type = 'M' ORDER BY area_title").all(state) as Area[];
}

export function getHighestPayingJobsNational(limit = 20): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON w.soc_code = o.soc_code
    JOIN areas a ON w.area_code = a.area_code
    WHERE a.area_type = 'N' AND w.annual_median IS NOT NULL
    ORDER BY w.annual_median DESC LIMIT ?
  `).all(limit) as WageWithOccupation[];
}

export function getHighestPayingJobsByState(stateCode: string, limit = 50): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON w.soc_code = o.soc_code
    JOIN areas a ON w.area_code = a.area_code
    WHERE a.area_type = 'S' AND a.state = ? AND w.annual_median IS NOT NULL
    ORDER BY w.annual_median DESC LIMIT ?
  `).all(stateCode, limit) as WageWithOccupation[];
}

export function getJobsByMajorGroup(majorGroup: string): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON w.soc_code = o.soc_code
    JOIN areas a ON w.area_code = a.area_code
    WHERE a.area_type = 'N' AND o.major_group = ? AND w.annual_median IS NOT NULL
    ORDER BY w.annual_median DESC
  `).all(majorGroup) as WageWithOccupation[];
}

export function getMajorGroups(): { major_group: string; major_group_title: string; count: number }[] {
  return getDb().prepare(`
    SELECT major_group, major_group_title, COUNT(*) as count
    FROM occupations GROUP BY major_group ORDER BY major_group_title
  `).all() as { major_group: string; major_group_title: string; count: number }[];
}

// --- Related data for pages ---

export function getRelatedOccupations(majorGroup: string, excludeSoc: string, limit = 5): Occupation[] {
  return getDb().prepare(`
    SELECT * FROM occupations
    WHERE major_group = ? AND soc_code != ?
    ORDER BY title LIMIT ?
  `).all(majorGroup, excludeSoc, limit) as Occupation[];
}

/**
 * Related careers ranked by national-wage proximity within the same major group.
 * Returns occupations whose national median is closest to the source occupation's
 * national median (above + below) — so a $130k Software Developer surfaces other
 * $100k–$160k roles in Computer & Mathematical, not stat-clerk roles.
 */
export interface RelatedCareer {
  soc_code: string;
  title: string;
  slug: string;
  major_group: string;
  national_median: number;
  delta_pct: number;
}

export function getRelatedByPay(
  socCode: string,
  majorGroup: string,
  limit = 6
): RelatedCareer[] {
  const sourceWage = getDb().prepare(`
    SELECT w.annual_median FROM wages w
    JOIN areas a ON w.area_code = a.area_code
    WHERE w.soc_code = ? AND a.area_type = 'N'
    ORDER BY w.year DESC LIMIT 1
  `).get(socCode) as { annual_median: number } | undefined;

  if (!sourceWage?.annual_median) return [];

  return getDb().prepare(`
    SELECT
      o.soc_code,
      o.title,
      o.slug,
      o.major_group,
      w.annual_median AS national_median,
      ROUND(((w.annual_median - ?) * 100.0 / ?), 1) AS delta_pct
    FROM occupations o
    JOIN wages w ON w.soc_code = o.soc_code
    JOIN areas a ON w.area_code = a.area_code
    WHERE o.major_group = ?
      AND o.soc_code != ?
      AND a.area_type = 'N'
      AND w.year = (SELECT MAX(year) FROM wages w2 JOIN areas a2 ON w2.area_code = a2.area_code WHERE w2.soc_code = o.soc_code AND a2.area_type = 'N')
      AND w.annual_median IS NOT NULL
    ORDER BY ABS(w.annual_median - ?) ASC
    LIMIT ?
  `).all(sourceWage.annual_median, sourceWage.annual_median, majorGroup, socCode, sourceWage.annual_median, limit) as RelatedCareer[];
}

/**
 * Cross-area employment distribution for an occupation — used by the
 * OccupationDensityScore lever to rank a metro inside the published
 * baseline of other metros for the same SOC.
 *
 * Returns one positive employment value per area_type='M' metro that
 * published an employment figure for this SOC. Suppressed cells (employment
 * NULL) are excluded — the caller computes percentile rank against the
 * published baseline only.
 */
export function getOccupationEmploymentDistribution(socCode: string): number[] {
  return (getDb().prepare(`
    SELECT w.employment AS e
    FROM wages w
    JOIN areas a ON w.area_code = a.area_code
    WHERE w.soc_code = ?
      AND a.area_type = 'M'
      AND w.employment IS NOT NULL
      AND w.employment > 0
  `).all(socCode) as { e: number }[]).map(r => r.e);
}

export function getTopPayingCities(socCode: string, limit = 10): WageWithArea[] {
  return getDb().prepare(`
    SELECT w.*, a.area_title, a.slug as area_slug
    FROM wages w
    JOIN areas a ON w.area_code = a.area_code
    WHERE w.soc_code = ? AND a.area_type = 'M' AND w.annual_median IS NOT NULL
    ORDER BY w.annual_median DESC
    LIMIT ?
  `).all(socCode, limit) as WageWithArea[];
}

export function getTopPayingJobs(areaCode: string, limit = 10): WageWithOccupation[] {
  return getDb().prepare(`
    SELECT w.*, o.title as occ_title, o.slug as occ_slug
    FROM wages w
    JOIN occupations o ON w.soc_code = o.soc_code
    WHERE w.area_code = ? AND w.annual_median IS NOT NULL
    ORDER BY w.annual_median DESC
    LIMIT ?
  `).all(areaCode, limit) as WageWithOccupation[];
}

export function getPopularJobs(limit = 10): Occupation[] {
  return getDb().prepare('SELECT * FROM occupations ORDER BY soc_code LIMIT ?').all(limit) as Occupation[];
}

export interface StateWageSummary {
  total_employment: number;
  avg_median_salary: number;
  top_median: number;
  bottom_median: number;
  occ_count: number;
}

export function getStateWageSummary(stateCode: string): StateWageSummary | undefined {
  // The OEWS extract on this site has no area_type='S' rows — state-level
  // figures must be aggregated from the metro (area_type='M') rows. We first
  // collapse to one row per occupation (averaging the per-metro medians and
  // summing employment), then aggregate across occupations so each occupation
  // contributes equally to top/bottom/avg state stats. (Repaired 2026-04-29.)
  return getDb().prepare(`
    WITH occ_state AS (
      SELECT w.soc_code,
        ROUND(AVG(w.annual_median)) AS state_median,
        SUM(w.employment) AS state_employment
      FROM wages w
      JOIN areas a ON w.area_code = a.area_code
      WHERE a.area_type = 'M' AND a.state = ? AND w.annual_median IS NOT NULL
      GROUP BY w.soc_code
    )
    SELECT
      SUM(state_employment) AS total_employment,
      ROUND(AVG(state_median)) AS avg_median_salary,
      MAX(state_median) AS top_median,
      MIN(state_median) AS bottom_median,
      COUNT(*) AS occ_count
    FROM occ_state
  `).get(stateCode) as StateWageSummary | undefined;
}

export function getNationalWageSummary(): StateWageSummary | undefined {
  return getDb().prepare(`
    SELECT
      SUM(w.employment) as total_employment,
      ROUND(AVG(w.annual_median)) as avg_median_salary,
      MAX(w.annual_median) as top_median,
      MIN(w.annual_median) as bottom_median,
      COUNT(*) as occ_count
    FROM wages w
    JOIN areas a ON w.area_code = a.area_code
    WHERE a.area_type = 'N' AND w.annual_median IS NOT NULL
  `).get() as StateWageSummary | undefined;
}

export function getStateTopOccupationsWithNational(stateCode: string, limit = 20): (WageWithOccupation & { national_median: number | null })[] {
  // Aggregates the per-metro wage rows within a state into one row per occupation
  // (averaged percentiles, summed employment, year = max year), then attaches
  // the national median per SOC. The previous implementation queried
  // area_type='S' which is empty in this dataset. (Repaired 2026-04-29.)
  return getDb().prepare(`
    WITH occ_state AS (
      SELECT
        w.soc_code,
        ? AS area_code,
        SUM(w.employment) AS employment,
        ROUND(AVG(w.annual_mean)) AS annual_mean,
        ROUND(AVG(w.annual_median)) AS annual_median,
        ROUND(AVG(w.annual_p10)) AS annual_p10,
        ROUND(AVG(w.annual_p25)) AS annual_p25,
        ROUND(AVG(w.annual_p75)) AS annual_p75,
        ROUND(AVG(w.annual_p90)) AS annual_p90,
        ROUND(AVG(w.hourly_mean), 2) AS hourly_mean,
        ROUND(AVG(w.hourly_median), 2) AS hourly_median,
        MAX(w.year) AS year
      FROM wages w
      JOIN areas a ON w.area_code = a.area_code
      WHERE a.area_type = 'M' AND a.state = ? AND w.annual_median IS NOT NULL
      GROUP BY w.soc_code
    )
    SELECT
      os.soc_code, os.area_code, os.employment, os.annual_mean, os.annual_median,
      os.annual_p10, os.annual_p25, os.annual_p75, os.annual_p90,
      os.hourly_mean, os.hourly_median, os.year,
      o.title AS occ_title,
      o.slug AS occ_slug,
      (SELECT w2.annual_median FROM wages w2 JOIN areas a2 ON w2.area_code = a2.area_code
       WHERE a2.area_type = 'N' AND w2.soc_code = os.soc_code
       ORDER BY w2.year DESC LIMIT 1) AS national_median
    FROM occ_state os
    JOIN occupations o ON os.soc_code = o.soc_code
    ORDER BY os.annual_median DESC
    LIMIT ?
  `).all(stateCode, stateCode, limit) as (WageWithOccupation & { national_median: number | null })[];
}

export function searchOccupations(query: string, limit = 30): Occupation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getDb().prepare(`
    SELECT * FROM occupations WHERE LOWER(title) LIKE ? OR LOWER(slug) LIKE ?
    ORDER BY title LIMIT ?
  `).all('%' + q + '%', '%' + q + '%', limit) as Occupation[];
}

// --- Comparison queries ---

export interface Comparison {
  slugA: string;
  slugB: string;
  titleA: string;
  titleB: string;
  popularity_score: number;
}

export function getAllComparisons(): Comparison[] {
  return getDb().prepare("SELECT slugA, slugB, titleA, titleB, popularity_score FROM comparisons ORDER BY popularity_score DESC").all() as Comparison[];
}

export function getTopComparisons(limit = 5000): Comparison[] {
  return getDb().prepare("SELECT slugA, slugB, titleA, titleB, popularity_score FROM comparisons ORDER BY popularity_score DESC LIMIT ?").all(limit) as Comparison[];
}

export function getComparisonBySlugs(slugA: string, slugB: string): Comparison | undefined {
  const row = getDb().prepare("SELECT * FROM comparisons WHERE (slugA = ? AND slugB = ?) OR (slugA = ? AND slugB = ?)").get(slugA, slugB, slugB, slugA) as Comparison | undefined;
  if (row) return row;

  // Fallback: dynamically build comparison if both occupations exist
  const occA = getOccupationBySlug(slugA);
  const occB = getOccupationBySlug(slugB);
  if (!occA || !occB) return undefined;
  return { slugA: occA.slug, slugB: occB.slug, titleA: occA.title, titleB: occB.title, popularity_score: 0 };
}
