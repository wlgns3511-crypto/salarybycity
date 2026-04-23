import type { Occupation, WageData, WageWithArea } from './db';
import { formatSalary, getDataYear } from './format';

export interface FaqItem {
  question: string;
  answer: string;
}

export function generateAutoFaqs(
  occ: Occupation,
  nationalWage: WageData,
  topCities: WageWithArea[],
): FaqItem[] {
  return [];
}
