/**
 * Wikimedia Commons image fetcher for salarybycity (51 US states + DC).
 *
 * Cloned from costbycity/scripts/fetch-city-images.ts — same shape, applied
 * at state-level instead of metro-level. The Wikipedia article for each US
 * state (e.g. "California", "Texas") reliably exposes a pageimage that is
 * iconic for the state (state capitol, signature landscape, or state seal).
 *
 * Skip rule: only retain permissively-licensed images — CC-BY*, CC-BY-SA*,
 * CC0, PD/PDM, copyrighted-free-use, FAL, GFDL, GPL, No Restrictions.
 *
 * Resume-aware. Polite: 200ms gap, descriptive UA per Wikimedia policy.
 */
import fs from 'fs';
import path from 'path';
import { US_STATES } from '../lib/states-data';

const UA = 'salarybycity/1.0 (https://salarybycity.com; wlgns3511@gmail.com)';
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'scripts/data');
const OUT_JSON = path.join(OUT_DIR, 'state-images-manifest.json');

const PERMISSIVE_LICENSES = /^(cc[\s-]?by([\s-]?sa)?(-\d(\.\d)?)?(-[a-z]{2})?|cc0|public[\s-]?domain|pdm|pd|copyrighted[\s-]?free[\s-]?use|fal|free[\s-]?art[\s-]?license|gfdl(\s+\d(\.\d)?)?|gpl(\s*v?\d(\.\d)?)?(\+|-or-later)?|no[\s-]?restrictions|no[\s-]?known[\s-]?restrictions)$/i;
const PHOTO_MIME = /^image\/(jpeg|png|webp|tiff)$/i;

// Manual Wikipedia title overrides for slugs where the bare state name's
// lead image is a flag SVG (rejected by PHOTO_MIME), so we redirect to a
// landmark page whose lead image is an actual photograph.
//
// Standard pattern: try "{Name} State Capitol" first (every US state has
// one and the lead image is the capitol building photo). Specific overrides
// where the capitol article either has no pageimage or a non-photo MIME:
//   - hawaii: state capitol → modernist building, weak entity identity;
//     use "Hawaii" → Diamond Head photo
//   - alaska: use "Anchorage, Alaska" (state capitol article doesn't exist
//     as standalone with photo)
//   - dc: bare WP article is "Washington, D.C."
//   - guam / puerto-rico / virgin-islands: territories use their bare name.
const MANUAL_TITLES: Record<string, string[]> = {
  'district-of-columbia': ['United States Capitol', 'Washington, D.C.'],
  'guam': ['Tumon', 'Hagåtña', 'Andersen Air Force Base'],
  'puerto-rico': ['Old San Juan', 'El Morro'],
  'virgin-islands': ['Charlotte Amalie, U.S. Virgin Islands', 'Magens Bay'],
};

// State capitol article titles — used as the primary candidate before the
// bare state name, because the bare state article's lead image is invariably
// the state flag SVG (rejected). Capitol articles all use a JPG lead photo.
const STATE_CAPITOL_TITLES: Record<string, string> = {
  alabama: 'Alabama State Capitol',
  alaska: 'Alaska State Capitol',
  arizona: 'Arizona State Capitol',
  arkansas: 'Arkansas State Capitol',
  california: 'California State Capitol',
  colorado: 'Colorado State Capitol',
  connecticut: 'Connecticut State Capitol',
  delaware: 'Delaware Legislative Hall',
  florida: 'Florida State Capitol',
  georgia: 'Georgia State Capitol',
  hawaii: 'Hawaii State Capitol',
  idaho: 'Idaho State Capitol',
  illinois: 'Illinois State Capitol',
  indiana: 'Indiana Statehouse',
  iowa: 'Iowa State Capitol',
  kansas: 'Kansas State Capitol',
  kentucky: 'Kentucky State Capitol',
  louisiana: 'Louisiana State Capitol',
  maine: 'Maine State House',
  maryland: 'Maryland State House',
  massachusetts: 'Massachusetts State House',
  michigan: 'Michigan State Capitol',
  minnesota: 'Minnesota State Capitol',
  mississippi: 'Mississippi State Capitol',
  missouri: 'Missouri State Capitol',
  montana: 'Montana State Capitol',
  nebraska: 'Nebraska State Capitol',
  nevada: 'Nevada State Capitol',
  'new-hampshire': 'New Hampshire State House',
  'new-jersey': 'New Jersey State House',
  'new-mexico': 'New Mexico State Capitol',
  'new-york': 'New York State Capitol',
  'north-carolina': 'North Carolina State Capitol',
  'north-dakota': 'North Dakota State Capitol',
  ohio: 'Ohio Statehouse',
  oklahoma: 'Oklahoma State Capitol',
  oregon: 'Oregon State Capitol',
  pennsylvania: 'Pennsylvania State Capitol',
  'rhode-island': 'Rhode Island State House',
  'south-carolina': 'South Carolina State House',
  'south-dakota': 'South Dakota State Capitol',
  tennessee: 'Tennessee State Capitol',
  texas: 'Texas State Capitol',
  utah: 'Utah State Capitol',
  vermont: 'Vermont State House',
  virginia: 'Virginia State Capitol',
  washington: 'Washington State Capitol',
  'west-virginia': 'West Virginia State Capitol',
  wisconsin: 'Wisconsin State Capitol',
  wyoming: 'Wyoming State Capitol',
};

interface State { slug: string; name: string; code: string }
interface ManifestEntry {
  slug: string;
  name: string;
  code: string;
  wikipediaTitle: string;
  wikipediaUrl: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  mime: string;
  commonsFileTitle: string;
  commonsFileUrl: string;
  licenseShort: string;
  licenseUrl: string | null;
  artistHtml: string | null;
  artistText: string | null;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function api<T = unknown>(host: string, params: Record<string, string>): Promise<T> {
  const u = new URL(`https://${host}/w/api.php`);
  u.searchParams.set('format', 'json');
  u.searchParams.set('formatversion', '2');
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${u}`);
  return r.json() as Promise<T>;
}

function stripHtml(s: string | undefined | null): string | null {
  if (!s) return null;
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || null;
}

function titleCandidates(slug: string, name: string): string[] {
  if (MANUAL_TITLES[slug]) return MANUAL_TITLES[slug];
  const capitol = STATE_CAPITOL_TITLES[slug];
  const candidates: string[] = [];
  if (capitol) candidates.push(capitol);
  candidates.push(name, `${name} (U.S. state)`, `${name}, United States`);
  return candidates;
}

async function lookupState(state: State): Promise<ManifestEntry | null> {
  for (const title of titleCandidates(state.slug, state.name)) {
    type PageImagesResp = {
      query?: {
        pages?: Array<{
          pageid?: number;
          title: string;
          missing?: boolean;
          original?: { source: string; width: number; height: number };
          pageimage?: string;
        }>;
      };
    };
    const r1 = await api<PageImagesResp>('en.wikipedia.org', {
      action: 'query',
      prop: 'pageimages',
      piprop: 'original|name',
      titles: title,
      redirects: '1',
    });
    const page = r1.query?.pages?.[0];
    if (!page || page.missing || !page.original || !page.pageimage) continue;

    const mime = page.original.source.match(/\.(jpe?g|png|webp|tiff?)(?:$|\?)/i);
    if (!mime) continue;

    type ImageInfoResp = {
      query?: {
        pages?: Array<{
          title: string;
          imagerepository?: string;
          imageinfo?: Array<{
            url?: string;
            descriptionurl?: string;
            mime?: string;
            extmetadata?: Record<string, { value?: string } | undefined>;
          }>;
        }>;
      };
    };
    await sleep(200);
    const r2 = await api<ImageInfoResp>('en.wikipedia.org', {
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      titles: `File:${page.pageimage}`,
    });
    const fpage = r2.query?.pages?.[0];
    const info = fpage?.imageinfo?.[0];
    if (!info || !info.mime || !PHOTO_MIME.test(info.mime)) {
      console.error(`  skip ${state.slug}: non-photo mime ${info?.mime}`);
      continue;
    }
    const meta = info.extmetadata ?? {};
    const licenseShort = stripHtml(meta.LicenseShortName?.value) ?? '';
    const licenseKey = stripHtml(meta.License?.value) ?? licenseShort;
    if (!PERMISSIVE_LICENSES.test(licenseKey)) {
      console.error(`  skip ${state.slug}: non-permissive "${licenseKey}"`);
      continue;
    }
    const artistHtml = meta.Artist?.value ?? null;
    return {
      slug: state.slug,
      name: state.name,
      code: state.code,
      wikipediaTitle: page.title,
      wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      imageUrl: page.original.source,
      imageWidth: page.original.width,
      imageHeight: page.original.height,
      mime: info.mime,
      commonsFileTitle: fpage!.title,
      commonsFileUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(fpage!.title.replace(/ /g, '_'))}`,
      licenseShort,
      licenseUrl: stripHtml(meta.LicenseUrl?.value),
      artistHtml,
      artistText: stripHtml(artistHtml),
    };
  }
  return null;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let existing: ManifestEntry[] = [];
  try { existing = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8')); } catch { /* first run */ }
  const haveSlugs = new Set(existing.filter(e => e.imageUrl).map(e => e.slug));
  const todo = US_STATES.filter(s => !haveSlugs.has(s.slug));
  console.log(`Resolving images: ${todo.length} new of ${US_STATES.length} total (${haveSlugs.size} already present)…`);

  const out: ManifestEntry[] = existing.filter(e => e.imageUrl);
  const missing: string[] = [];
  for (const s of todo) {
    process.stdout.write(`  ${s.slug.padEnd(28)} `);
    try {
      const e = await lookupState(s);
      if (e) {
        out.push(e);
        process.stdout.write(`OK  ${e.imageWidth}x${e.imageHeight}  ${e.licenseShort}\n`);
      } else {
        missing.push(s.slug);
        process.stdout.write('MISS\n');
      }
    } catch (err) {
      missing.push(s.slug);
      process.stdout.write(`ERR ${(err as Error).message}\n`);
    }
    await sleep(200);
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${out.length}/${US_STATES.length} entries to ${path.relative(ROOT, OUT_JSON)}`);
  if (missing.length) console.log(`Missing (${missing.length}): ${missing.join(', ')}`);
}

main().catch(e => { console.error(e); process.exit(1); });
