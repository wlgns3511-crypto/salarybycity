/**
 * Network-wide publisher and per-site editorial team metadata for Schema.org.
 *
 * Vintage 4-layer split (Phase 6 v6.2 — caloriewize-style "single DB_UPDATED
 * sitewide" anti-pattern fix):
 *
 *   1. DB_UPDATED            - dataset refresh/review date for the current
 *                              SalaryByCity data snapshot.
 *   2. BLS_PUBLISHED / YEAR  - BLS OEWS publication date and reference
 *                              period. Drives Dataset.dateModified in JSON-LD.
 *   3. METHODOLOGY_REVIEWED  - when /methodology/ was last reviewed (separate
 *                              from data refresh; methodology changes rarely).
 *   4. LEGAL_VINTAGES        - privacy/terms/disclaimer per-page last-updated.
 *                              Per-document, not sitewide.
 *
 * BLS publishes annual OEWS estimates in April for the prior May reference
 * period (e.g. May 2024 wages to April 2025 release).
 */

export const DB_UPDATED = '2026-04-19';
export const BLS_DATA_YEAR = 2024;
export const BLS_PUBLISHED = '2025-04-03';
export const METHODOLOGY_REVIEWED = '2026-03-12';

export const LEGAL_VINTAGES = {
  privacy: '2026-02-08',
  terms: '2026-02-08',
  disclaimer: '2026-03-25',
} as const;

export const PUBLISHER = {
  name: 'DataPeek Research Network',
  url: 'https://datapeekfacts.com',
  description: 'A public-data network aggregating government and public datasets across US housing, tax, healthcare, and other civic domains.',
};

export const EDITORIAL_TEAM = {
  name: 'SalaryByCity Editorial Team',
  url: 'https://datapeekfacts.com/editorial-policy/',
  parentOrganization: PUBLISHER,
};

// Reviewer schema for Dataset/Article entities.
export const REVIEWER_ORG = {
  '@type': 'Organization',
  name: EDITORIAL_TEAM.name,
  url: EDITORIAL_TEAM.url,
  parentOrganization: { '@type': 'Organization', name: PUBLISHER.name, url: PUBLISHER.url },
};

/**
 * SOURCE_AUTHORITIES - primary upstream data sources cited by SalaryByCity.
 * salarybycity is YMYL-financial (wage data drives compensation, negotiation,
 * relocation decisions) → v6.2 E4.1 mandates 3+ Organization in reviewedBy.
 *
 * Used as JSON-LD `reviewedBy` array on Dataset/WebPage entities and surfaced
 * visually in the AuthorBox so readers can trace any wage figure back to its
 * BLS / BEA / Census / IRS upstream table without leaving our methodology page.
 */
export const SOURCE_AUTHORITIES = [
  {
    '@type': 'Organization',
    name: 'U.S. Bureau of Labor Statistics — OEWS',
    url: 'https://www.bls.gov/oes/',
    description:
      'Primary source. Occupational Employment and Wage Statistics program — annual wage estimates for ~830 occupations across all 50 states, DC, and ~595 metro/nonmetro areas.',
  },
  {
    '@type': 'Organization',
    name: 'U.S. Census Bureau — American Community Survey',
    url: 'https://www.census.gov/programs-surveys/acs',
    description:
      'Cross-reference for household income context and metro-area demographics. ACS 1-year and 5-year tables.',
  },
  {
    '@type': 'Organization',
    name: 'U.S. Bureau of Economic Analysis — Regional Price Parities',
    url: 'https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area',
    description:
      'Cost-of-living adjustment underlying our /tools/col-calculator/. State and metro-area RPP indexes.',
  },
  {
    '@type': 'Organization',
    name: 'U.S. Internal Revenue Service — Statistics of Income',
    url: 'https://www.irs.gov/statistics/soi-tax-stats-individual-income-tax-statistics',
    description:
      'Cross-reference for individual income tax statistics by state and ZIP, used to corroborate BLS wage figures.',
  },
] as const;
