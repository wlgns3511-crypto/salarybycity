import type { WageData } from './db';
import { formatSalary, getDataYear } from './format';
import { DB_UPDATED, PUBLISHER, EDITORIAL_TEAM, SOURCE_AUTHORITIES } from './authorship';

const SITE_NAME = 'SalaryByCity';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://salarybycity.com';

export function occupationSchema(title: string, wage: WageData, areaTitle?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OccupationalExperienceRequirements',
    name: title,
    ...(areaTitle && {
      occupationLocation: {
        '@type': 'City',
        name: areaTitle,
      },
    }),
    estimatedSalary: {
      '@type': 'MonetaryAmountDistribution',
      name: 'base',
      currency: 'USD',
      duration: 'P1Y',
      percentile10: wage.annual_p10 ?? undefined,
      percentile25: wage.annual_p25 ?? undefined,
      median: wage.annual_median ?? undefined,
      percentile75: wage.annual_p75 ?? undefined,
      percentile90: wage.annual_p90 ?? undefined,
    },
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function webPageSchema(title: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: `${SITE_URL}${url}`,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...(DB_UPDATED ? { dateModified: DB_UPDATED } : {}),
  };
}

export function itemListSchema(name: string, url: string, items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: `${SITE_URL}${url}`,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: `${SITE_URL}${item.url}`,
    })),
  };
}

export function datasetSchema(
  name: string,
  description: string,
  url: string,
  variableMeasured?: string[] | object[],
) {
  // schema.org/Dataset.creator = entity that CREATED the underlying data.
  // Phase 7 P4 (Trap #108) — composite dataset must credit ALL upstream
  // creators in creator[], not just the first. BLS OEWS / Census ACS /
  // BEA RPP / IRS SOI are 4 distinct .gov publishers; each contributed
  // a data slice that the composite read depends on. SITE_NAME / PUBLISHER
  // stays in publisher; EDITORIAL_TEAM in reviewedBy.
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url: `${SITE_URL}${url}`,
    creator: SOURCE_AUTHORITIES.map(s => ({ '@type': 'Organization', name: s.name, url: s.url })),
    publisher: { '@type': 'Organization', name: PUBLISHER.name, url: PUBLISHER.url },
    sourceOrganization: SOURCE_AUTHORITIES.map(s => ({ '@type': 'Organization', name: s.name, url: s.url })),
    reviewedBy: { '@type': 'Organization', name: EDITORIAL_TEAM.name, url: EDITORIAL_TEAM.url },
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    temporalCoverage: `${getDataYear()}/${getDataYear()}`,
    ...(variableMeasured && variableMeasured.length > 0 ? { variableMeasured } : {}),
    distribution: { '@type': 'DataDownload', encodingFormat: 'text/html', contentUrl: `${SITE_URL}${url}` },
    isAccessibleForFree: true,
  };
}

export function articleSchema(post: { title: string; description: string; slug: string; urlPath?: string; publishedAt: string; updatedAt?: string; category?: string }) {
  // slug is treated as a full path fragment (e.g. "guide/my-guide")
  const articlePath = post.urlPath ?? (post.slug.includes('/') ? `/${post.slug.replace(/^\/+|\/+$/g, '')}/` : `/blog/${post.slug}/`);
  const url = `${SITE_URL}${articlePath}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { '@type': 'Organization', name: 'SalaryByCity Editorial Team', url: `${SITE_URL}/about/` },
    publisher: { '@type': 'Organization', name: PUBLISHER.name, url: PUBLISHER.url },
    mainEntityOfPage: url,
    ...(post.category && { articleSection: post.category }),
  };
}

function pluralize(title: string): string {
  if (title.endsWith('s') || title.endsWith('ers') || title.endsWith('ors')) return title;
  return title + 's';
}

export function generateFAQs(
  jobTitle: string,
  areaTitle: string,
  wage: WageData
): { question: string; answer: string }[] {
  const year = getDataYear();
  const plural = pluralize(jobTitle);
  const faqs: { question: string; answer: string }[] = [];

  if (wage.annual_median) {
    faqs.push({
      question: `What is the average ${jobTitle} salary in ${areaTitle}?`,
      answer: `The median annual salary for a ${jobTitle} in ${areaTitle} is ${formatSalary(wage.annual_median)} as of ${year}. The average (mean) salary is ${formatSalary(wage.annual_mean)}.`,
    });
  }

  if (wage.annual_p10 && wage.annual_p90) {
    faqs.push({
      question: `What is the salary range for ${plural} in ${areaTitle}?`,
      answer: `${jobTitle} salaries in ${areaTitle} range from ${formatSalary(wage.annual_p10)} (10th percentile) to ${formatSalary(wage.annual_p90)} (90th percentile). The middle 50% earn between ${formatSalary(wage.annual_p25)} and ${formatSalary(wage.annual_p75)}.`,
    });
  }

  if (wage.employment) {
    faqs.push({
      question: `How many ${plural} work in ${areaTitle}?`,
      answer: `There are approximately ${wage.employment.toLocaleString('en-US')} ${plural} employed in the ${areaTitle} metropolitan area.`,
    });
  }

  if (wage.hourly_median) {
    faqs.push({
      question: `What is the hourly rate for a ${jobTitle} in ${areaTitle}?`,
      answer: `The median hourly wage for a ${jobTitle} in ${areaTitle} is $${wage.hourly_median.toFixed(2)}.`,
    });
  }

  return faqs;
}
