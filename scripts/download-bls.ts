/**
 * Download BLS OEWS flat files for salary data.
 * Uses Python urllib (Node https gets 403 from BLS).
 *
 * Usage: npx tsx scripts/download-bls.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const DATA_DIR = path.join(__dirname, '..', 'data', 'bls-raw');
const BASE_URL = 'https://download.bls.gov/pub/time.series/oe';

const FILES_TO_DOWNLOAD = [
  'oe.data.0.Current',
  'oe.area',
  'oe.occupation',
  'oe.datatype',
  'oe.industry',
];

function downloadWithPython(url: string, dest: string): void {
  const script = `
import urllib.request, sys
req = urllib.request.Request('${url}',
    headers={'User-Agent': 'salary-data/1.0 (research project)'})
resp = urllib.request.urlopen(req, timeout=120)
data = resp.read()
with open('${dest}', 'wb') as f:
    f.write(data)
print(len(data))
`;
  const result = execSync(`python3 -c "${script.replace(/\n/g, ';')}"`, {
    timeout: 180000,
    encoding: 'utf-8',
  }).trim();
  return;
}

function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  for (const filename of FILES_TO_DOWNLOAD) {
    const url = `${BASE_URL}/${filename}`;
    const dest = path.join(DATA_DIR, filename);

    if (fs.existsSync(dest)) {
      const stats = fs.statSync(dest);
      const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
      if (ageHours < 24 && stats.size > 100) {
        console.log(`  SKIP ${filename} (${(stats.size / 1024 / 1024).toFixed(1)} MB, ${ageHours.toFixed(1)}h ago)`);
        continue;
      }
    }

    console.log(`  Downloading ${filename}...`);
    try {
      downloadWithPython(url, dest);
      const size = fs.statSync(dest).size;
      console.log(`  OK ${filename} (${(size / 1024 / 1024).toFixed(1)} MB)`);
    } catch (err) {
      console.error(`  FAIL ${filename}: ${err}`);
    }
  }

  console.log('\nDone. Run `npx tsx scripts/parse-bls.ts` to build the database.');
}

main();
