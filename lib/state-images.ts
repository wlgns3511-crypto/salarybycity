/**
 * State-image lookup. Reads the manifest produced by
 * scripts/process-state-images.ts at module load (build time on Mac, then
 * baked into the SSG output — no runtime fs cost on the VPS).
 *
 * Covers all 51 US states + DC. Each state's Wikipedia article exposes a
 * pageimage that is iconic for the place (state capitol, signature landscape,
 * or state seal); we fetch + re-encode and render above the fold.
 */
import manifest from '@/scripts/data/state-images-manifest.json';

export interface StateImage {
  slug: string;
  name: string;
  code: string;
  avifPath: string;
  jpgPath: string;
  finalWidth: number;
  finalHeight: number;
  commonsFileUrl: string;
  wikipediaUrl: string;
  wikipediaTitle: string;
  licenseShort: string;
  licenseUrl: string | null;
  artistText: string | null;
  artistHtml: string | null;
}

interface ManifestEntry {
  slug: string;
  name: string;
  code: string;
  avifPath?: string;
  jpgPath?: string;
  finalWidth?: number;
  finalHeight?: number;
  commonsFileUrl: string;
  wikipediaUrl: string;
  wikipediaTitle: string;
  licenseShort: string;
  licenseUrl: string | null;
  artistText: string | null;
  artistHtml: string | null;
}

const BY_SLUG: ReadonlyMap<string, StateImage> = (() => {
  const m = new Map<string, StateImage>();
  for (const raw of (manifest as ManifestEntry[])) {
    if (!raw.avifPath || !raw.jpgPath || !raw.finalWidth || !raw.finalHeight) continue;
    m.set(raw.slug, {
      slug: raw.slug,
      name: raw.name,
      code: raw.code,
      avifPath: raw.avifPath,
      jpgPath: raw.jpgPath,
      finalWidth: raw.finalWidth,
      finalHeight: raw.finalHeight,
      commonsFileUrl: raw.commonsFileUrl,
      wikipediaUrl: raw.wikipediaUrl,
      wikipediaTitle: raw.wikipediaTitle,
      licenseShort: raw.licenseShort,
      licenseUrl: raw.licenseUrl,
      artistText: raw.artistText,
      artistHtml: raw.artistHtml,
    });
  }
  return m;
})();

export function getStateImage(slug: string): StateImage | undefined {
  return BY_SLUG.get(slug);
}

export function hasStateImage(slug: string): boolean {
  return BY_SLUG.has(slug);
}
