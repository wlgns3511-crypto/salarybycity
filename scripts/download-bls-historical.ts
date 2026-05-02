/**
 * Download BLS OEWS annual XLSX bundles for years 2020-2023.
 * These are the *historical* snapshots (BLS replaces the time-series TSV at
 * download.bls.gov/pub/time.series/oe/oe.data.0.Current annually, so multi-year
 * data only lives in the per-year XLSX bundles at /oes/special-requests/).
 *
 * Files:
 *   oesm{YY}ma.zip   — Metro/MSA wage estimates (~37-39 MB each)
 *   oesm{YY}nat.zip  — National wage estimates (~270 KB each)
 *
 * Total ~155 MB across 8 files for 4 years.
 *
 * Usage: npx tsx scripts/download-bls-historical.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const DATA_DIR = path.join(__dirname, '..', 'data', 'bls-historical');
const BASE_URL = 'https://www.bls.gov/oes/special-requests';
const YEARS = [2020, 2021, 2022, 2023];

function downloadWithCurl(url: string, dest: string): number {
  // BLS rejects Node https; curl with the BLS-required identifying UA works.
  execSync(
    `curl -sL -H "User-Agent: salarybycity-data-update/1.0 (wlgns3511@gmail.com)" --max-time 300 -o "${dest}" "${url}"`,
    { timeout: 360000, stdio: ['ignore', 'inherit', 'inherit'] }
  );
  return fs.statSync(dest).size;
}

function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const targets: { url: string; filename: string }[] = [];
  for (const year of YEARS) {
    const yy = String(year).slice(2);
    targets.push({ url: `${BASE_URL}/oesm${yy}ma.zip`, filename: `oesm${yy}ma.zip` });
    targets.push({ url: `${BASE_URL}/oesm${yy}nat.zip`, filename: `oesm${yy}nat.zip` });
  }

  for (const { url, filename } of targets) {
    const dest = path.join(DATA_DIR, filename);
    if (fs.existsSync(dest)) {
      const size = fs.statSync(dest).size;
      if (size > 100_000) {
        console.log(`  SKIP ${filename} (${(size / 1024 / 1024).toFixed(1)} MB, exists)`);
        continue;
      }
    }
    console.log(`  Downloading ${filename}...`);
    try {
      const size = downloadWithCurl(url, dest);
      console.log(`  OK   ${filename} (${(size / 1024 / 1024).toFixed(1)} MB)`);
    } catch (err) {
      console.error(`  FAIL ${filename}: ${err}`);
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    }
  }

  // Unzip all
  console.log('\nUnzipping...');
  for (const { filename } of targets) {
    const zipPath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(zipPath)) continue;
    const dirName = filename.replace('.zip', '');
    const extractDir = path.join(DATA_DIR, dirName);
    if (fs.existsSync(extractDir)) {
      console.log(`  SKIP ${dirName}/ (already extracted)`);
      continue;
    }
    try {
      execSync(`unzip -q -o "${zipPath}" -d "${DATA_DIR}"`, { stdio: 'inherit' });
      console.log(`  OK   ${dirName}/`);
    } catch (err) {
      console.error(`  FAIL ${dirName}: ${err}`);
    }
  }

  console.log('\nDone. Run `npx tsx scripts/parse-bls-historical.ts` to load 2020-2023 into wages.');
}

main();
