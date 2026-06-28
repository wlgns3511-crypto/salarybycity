/**
 * Process raw Wikimedia state images → optimized AVIF + JPEG fallback.
 *
 * Reads scripts/data/state-images-manifest.json, downloads each imageUrl,
 * pipes through sharp:
 *   - resize to MAX_DIM (preserve aspect, withoutEnlargement)
 *   - emit  public/state-images/{slug}.avif  (effort 4, quality 50)
 *   - emit  public/state-images/{slug}.jpg   (mozjpeg, quality 78)
 *
 * Cloned from costbycity/scripts/process-city-images.ts.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'scripts/data/state-images-manifest.json');
const OUT_DIR = path.join(ROOT, 'public/state-images');
const MAX_DIM = 1280;
const UA = 'salarybycity/1.0 (https://salarybycity.com; wlgns3511@gmail.com)';

interface Entry {
  slug: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  avifPath?: string;
  jpgPath?: string;
  finalWidth?: number;
  finalHeight?: number;
  avifBytes?: number;
  jpgBytes?: number;
  [k: string]: unknown;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function downloadBuffer(url: string, attempt = 1): Promise<Buffer> {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (r.status === 429 || r.status === 503) {
    if (attempt > 4) throw new Error(`HTTP ${r.status} after 4 retries`);
    const retryAfter = Number(r.headers.get('retry-after')) || (2 ** attempt);
    await sleep(retryAfter * 1000);
    return downloadBuffer(url, attempt + 1);
  }
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

async function processOne(entry: Entry): Promise<Entry> {
  const avifPathAbs = path.join(OUT_DIR, `${entry.slug}.avif`);
  const jpgPathAbs = path.join(OUT_DIR, `${entry.slug}.jpg`);
  if (fs.existsSync(avifPathAbs) && fs.existsSync(jpgPathAbs) && entry.finalWidth && entry.finalHeight) {
    const avifStat = fs.statSync(avifPathAbs);
    const jpgStat = fs.statSync(jpgPathAbs);
    return {
      ...entry,
      avifPath: `/state-images/${entry.slug}.avif`,
      jpgPath: `/state-images/${entry.slug}.jpg`,
      avifBytes: avifStat.size,
      jpgBytes: jpgStat.size,
    };
  }
  await sleep(400);
  const buf = await downloadBuffer(entry.imageUrl);

  const pipeline = sharp(buf)
    .rotate()
    .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true });

  const meta = await pipeline.clone().toBuffer({ resolveWithObject: true });
  const finalWidth = meta.info.width;
  const finalHeight = meta.info.height;

  await pipeline.clone().avif({ quality: 50, effort: 4 }).toFile(avifPathAbs);
  await pipeline.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(jpgPathAbs);

  const avifStat = fs.statSync(avifPathAbs);
  const jpgStat = fs.statSync(jpgPathAbs);
  return {
    ...entry,
    avifPath: `/state-images/${entry.slug}.avif`,
    jpgPath: `/state-images/${entry.slug}.jpg`,
    finalWidth,
    finalHeight,
    avifBytes: avifStat.size,
    jpgBytes: jpgStat.size,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const entries = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as Entry[];

  const out: Entry[] = [];
  let avifTotal = 0;
  let jpgTotal = 0;
  for (const e of entries) {
    process.stdout.write(`  ${e.slug.padEnd(28)} `);
    try {
      const processed = await processOne(e);
      out.push(processed);
      avifTotal += processed.avifBytes ?? 0;
      jpgTotal += processed.jpgBytes ?? 0;
      process.stdout.write(`AVIF ${((processed.avifBytes ?? 0) / 1024).toFixed(1)}KB · JPG ${((processed.jpgBytes ?? 0) / 1024).toFixed(1)}KB\n`);
    } catch (err) {
      process.stdout.write(`ERR ${(err as Error).message}\n`);
    }
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(out, null, 2));
  console.log(`\nProcessed ${out.length}/${entries.length} images`);
  console.log(`AVIF total ${(avifTotal / 1024 / 1024).toFixed(2)} MB · JPG total ${(jpgTotal / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(e => { console.error(e); process.exit(1); });
