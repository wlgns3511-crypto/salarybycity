import type { WageData } from './db';
import { formatSalary, getDataYear } from './format';

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
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
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
    dateModified: new Date().toISOString(),
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

export function datasetSchema(name: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url: `${SITE_URL}${url}`,
    creator: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    temporalCoverage: `2023/${new Date().getFullYear()}`,
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
