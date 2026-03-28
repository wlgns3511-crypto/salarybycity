import type { MetadataRoute } from "next";
import {
  getAllOccupations,
  getAllMetroAreas,
  getAllStateCodes,
  getWagePagesChunk,
  countAllWagePages,
  getTopComparisons,
} from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://salarybycity.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const occupations = getAllOccupations();
  const areas = getAllMetroAreas();
  const stateCodes = getAllStateCodes();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE_URL}/jobs`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/locations`, changeFrequency: "monthly", priority: 0.9 },
  ];

  const jobPages: MetadataRoute.Sitemap = occupations.map((occ) => ({
    url: `${SITE_URL}/jobs/${occ.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const locationPages: MetadataRoute.Sitemap = areas.map((area) => ({
    url: `${SITE_URL}/locations/${area.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Job x Location pages (the bulk — up to 300K)
  const total = countAllWagePages();
  const CHUNK_SIZE = 50000;
  const jobLocationPages: MetadataRoute.Sitemap = [];

  // For sitemap, limit to first 50K to keep sitemap reasonable
  // Next.js will auto-split if needed
  const chunk = getWagePagesChunk(0, Math.min(total, CHUNK_SIZE));
  for (const page of chunk) {
    jobLocationPages.push({
      url: `${SITE_URL}/jobs/${page.occ_slug}/${page.area_slug}`,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // Comparison pages (up to 8,256)
  const comparisons = getTopComparisons(8256);
  const comparisonPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/compare`, changeFrequency: "monthly", priority: 0.8 },
    ...comparisons.map((c) => ({
      url: `${SITE_URL}/compare/${c.slugA}-vs-${c.slugB}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  const statePages: MetadataRoute.Sitemap = stateCodes.map((code) => ({
    url: `${SITE_URL}/states/${code.toLowerCase()}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...jobPages, ...locationPages, ...statePages, ...jobLocationPages, ...comparisonPages];
}
