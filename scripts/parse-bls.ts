/**
 * Parse BLS OEWS flat files into SQLite database.
 *
 * Usage: npx tsx scripts/parse-bls.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

const DATA_DIR = path.join(__dirname, '..', 'data', 'bls-raw');
const DB_PATH = path.join(__dirname, '..', 'data', 'salary.db');

function readTSV(filename: string): Record<string, string>[] {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}. Run download-bls.ts first.`);
  }
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split('\t').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split('\t').map(v => v.trim());
    const record: Record<string, string> = {};
    headers.forEach((h, i) => { record[h] = values[i] || ''; });
    return record;
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[,()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractState(areaTitle: string): string {
  // "San Jose-Sunnyvale-Santa Clara, CA" → "CA"
  const match = areaTitle.match(/,\s*([A-Z]{2})\s*$/);
  if (match) return match[1];
  // Multi-state: "New York-Newark-Jersey City, NY-NJ-PA"
  const multiMatch = areaTitle.match(/,\s*([A-Z]{2}(?:-[A-Z]{2})*)\s*$/);
  if (multiMatch) return multiMatch[1].split('-')[0]; // Take first state
  return '';
}

function parseWageValue(val: string): number | null {
  if (!val || val === '*' || val === '#' || val === '**') return null;
  const num = parseFloat(val.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

function main() {
  console.log('Parsing BLS data into SQLite...\n');

  // Remove old DB
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = OFF');

  // Create tables
  db.exec(`
    CREATE TABLE occupations (
      soc_code TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      major_group TEXT,
      major_group_title TEXT,
      slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE areas (
      area_code TEXT PRIMARY KEY,
      area_title TEXT NOT NULL,
      area_type TEXT NOT NULL,
      state TEXT,
      slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE wages (
      soc_code TEXT NOT NULL,
      area_code TEXT NOT NULL,
      employment INTEGER,
      annual_mean INTEGER,
      annual_median INTEGER,
      annual_p10 INTEGER,
      annual_p25 INTEGER,
      annual_p75 INTEGER,
      annual_p90 INTEGER,
      hourly_mean REAL,
      hourly_median REAL,
      year INTEGER NOT NULL,
      PRIMARY KEY (soc_code, area_code, year)
    );

    CREATE INDEX idx_wages_area ON wages(area_code);
    CREATE INDEX idx_wages_soc ON wages(soc_code);
    CREATE INDEX idx_occupations_slug ON occupations(slug);
    CREATE INDEX idx_areas_slug ON areas(slug);
  `);

  // 1. Parse occupations
  console.log('Parsing occupations...');
  const occupations = readTSV('oe.occupation');
  const insertOcc = db.prepare(
    'INSERT OR IGNORE INTO occupations (soc_code, title, major_group, major_group_title, slug) VALUES (?, ?, ?, ?, ?)'
  );

  // Build major group lookup
  const majorGroups: Record<string, string> = {};
  for (const occ of occupations) {
    const code = occ['occupation_code'];
    if (code && code.endsWith('0000')) {
      majorGroups[code.substring(0, 2)] = occ['occupation_name'] || '';
    }
  }

  const insertOccTx = db.transaction(() => {
    let count = 0;
    for (const occ of occupations) {
      const code = occ['occupation_code'];
      const name = occ['occupation_name'];
      if (!code || !name) continue;
      // Skip broad groups (xx-0000, xx-x000) — keep detailed only
      if (code.endsWith('0000')) continue;

      const majorPrefix = code.substring(0, 2);
      const majorGroupCode = `${majorPrefix}-0000`;
      const majorGroupTitle = majorGroups[majorPrefix] || '';

      insertOcc.run(code, name, majorGroupCode, majorGroupTitle, slugify(name));
      count++;
    }
    console.log(`  Inserted ${count} occupations`);
  });
  insertOccTx();

  // 2. Parse areas
  console.log('Parsing areas...');
  const areas = readTSV('oe.area');
  const insertArea = db.prepare(
    'INSERT OR IGNORE INTO areas (area_code, area_title, area_type, state, slug) VALUES (?, ?, ?, ?, ?)'
  );

  const slugCounts: Record<string, number> = {};

  const insertAreaTx = db.transaction(() => {
    let count = 0;
    for (const area of areas) {
      const code = area['area_code'];
      const title = area['area_title'] || area['areaname'];
      const type = area['area_type'] || area['areatype_code'];
      if (!code || !title) continue;
      // Only Metro areas + States + National
      if (!['M', 'S', 'N'].includes(type)) continue;

      const state = extractState(title);
      let slug = slugify(title);

      // Handle duplicate slugs
      if (slugCounts[slug]) {
        slugCounts[slug]++;
        slug = `${slug}-${slugCounts[slug]}`;
      } else {
        slugCounts[slug] = 1;
      }

      insertArea.run(code, title, type, state, slug);
      count++;
    }
    console.log(`  Inserted ${count} areas`);
  });
  insertAreaTx();

  // 3. Parse wage data
  console.log('Parsing wage data (this may take a moment)...');
  const data = readTSV('oe.data.0.Current');

  // Group by series prefix (everything except datatype code)
  type WageRow = {
    soc_code: string;
    area_code: string;
    year: number;
    employment: number | null;
    annual_mean: number | null;
    annual_median: number | null;
    annual_p10: number | null;
    annual_p25: number | null;
    annual_p75: number | null;
    annual_p90: number | null;
    hourly_mean: number | null;
    hourly_median: number | null;
  };

  // Parse series IDs: OEUM0041940000000151252 + 13
  // Format: OE U M 0041940 000000 151252 13
  //         0  2 3 4       11     17     23
  const wageMap = new Map<string, WageRow>();

  for (const row of data) {
    const seriesId = row['series_id'];
    if (!seriesId || seriesId.length < 25) continue;

    const areaType = seriesId[3];
    // Only process Metro (M), State (S), and National (N)
    if (!['M', 'S', 'N'].includes(areaType)) continue;

    const areaCode = seriesId.substring(4, 11);
    const industryCode = seriesId.substring(11, 17);
    // Only cross-industry data
    if (industryCode !== '000000') continue;

    const socCodeRaw = seriesId.substring(17, 23);
    const datatype = seriesId.substring(23, 25);
    const year = parseInt(row['year'] || '0');
    const value = parseWageValue(row['value']);

    // Format SOC code: 151252 → 15-1252
    const socCode = `${socCodeRaw.substring(0, 2)}-${socCodeRaw.substring(2)}`;

    const key = `${socCode}|${areaCode}|${year}`;
    if (!wageMap.has(key)) {
      wageMap.set(key, {
        soc_code: socCode,
        area_code: areaCode,
        year,
        employment: null,
        annual_mean: null,
        annual_median: null,
        annual_p10: null,
        annual_p25: null,
        annual_p75: null,
        annual_p90: null,
        hourly_mean: null,
        hourly_median: null,
      });
    }

    const w = wageMap.get(key)!;
    switch (datatype) {
      case '01': w.employment = value ? Math.round(value) : null; break;
      case '03': w.hourly_mean = value; break;
      case '04': w.annual_mean = value ? Math.round(value) : null; break;
      case '08': w.hourly_median = value; break;
      case '11': w.annual_p10 = value ? Math.round(value) : null; break;
      case '12': w.annual_p25 = value ? Math.round(value) : null; break;
      case '13': w.annual_median = value ? Math.round(value) : null; break;
      case '14': w.annual_p75 = value ? Math.round(value) : null; break;
      case '15': w.annual_p90 = value ? Math.round(value) : null; break;
    }
  }

  const insertWage = db.prepare(`
    INSERT OR IGNORE INTO wages
    (soc_code, area_code, employment, annual_mean, annual_median,
     annual_p10, annual_p25, annual_p75, annual_p90,
     hourly_mean, hourly_median, year)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWageTx = db.transaction(() => {
    let count = 0;
    for (const w of wageMap.values()) {
      // Only insert if we have at least median salary data
      if (w.annual_median === null && w.annual_mean === null) continue;

      insertWage.run(
        w.soc_code, w.area_code, w.employment,
        w.annual_mean, w.annual_median,
        w.annual_p10, w.annual_p25, w.annual_p75, w.annual_p90,
        w.hourly_mean, w.hourly_median, w.year
      );
      count++;
    }
    console.log(`  Inserted ${count} wage records`);
  });
  insertWageTx();

  // Print summary
  const occCount = db.prepare('SELECT COUNT(*) as c FROM occupations').get() as { c: number };
  const areaCount = db.prepare('SELECT COUNT(*) as c FROM areas').get() as { c: number };
  const wageCount = db.prepare('SELECT COUNT(*) as c FROM wages').get() as { c: number };
  const metroWages = db.prepare("SELECT COUNT(*) as c FROM wages w JOIN areas a ON w.area_code = a.area_code WHERE a.area_type = 'M'").get() as { c: number };

  console.log('\n=== Database Summary ===');
  console.log(`  Occupations: ${occCount.c}`);
  console.log(`  Areas: ${areaCount.c}`);
  console.log(`  Total wage records: ${wageCount.c}`);
  console.log(`  Metro wage records: ${metroWages.c}`);
  console.log(`  DB size: ${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(1)} MB`);
  console.log(`\n  Potential pages (occupation x metro): ${metroWages.c}`);

  db.close();
}

main();
