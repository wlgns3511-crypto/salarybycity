import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'salary.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
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
