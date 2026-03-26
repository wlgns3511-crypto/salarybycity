/**
 * Cross-site reference utilities.
 * Copy this file to each site's lib/ directory.
 * Reads crossref.json for inter-site data analysis.
 */

import fs from 'fs';
import path from 'path';

interface MetroData {
  name?: string;
  state?: string;
  cost_index?: number | null;
  median_income?: number | null;
  median_rent?: number | null;
  median_home_value?: number | null;
  avg_salary?: number | null;
  top_salary?: number | null;
  total_employment?: number | null;
}

interface StateData {
  name?: string;
  avg_income?: number | null;
  avg_rent?: number | null;
  avg_home_value?: number | null;
  population?: number | null;
  college_count?: number | null;
  avg_grad_earnings?: number | null;
  avg_tuition?: number | null;
}

interface CrossRef {
  metros: Record<string, MetroData>;
  states: Record<string, StateData>;
  meta: { us_avg_income: number; us_avg_rent: number; us_avg_home_value: number; us_avg_cost_index: number };
}

let _cache: CrossRef | null = null;

function loadCrossRef(): CrossRef {
  if (_cache) return _cache;
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'crossref.json'), 'utf-8');
    _cache = JSON.parse(raw);
    return _cache!;
  } catch {
    return { metros: {}, states: {}, meta: { us_avg_income: 75149, us_avg_rent: 1163, us_avg_home_value: 281900, us_avg_cost_index: 100 } };
  }
}

function fmtDollar(v: number | null | undefined): string {
  return v ? `$${v.toLocaleString('en-US')}` : 'N/A';
}

/**
 * Generate cross-site insights for a metro area.
 * Used by salarybycity, costbycity, guidebycity.
 */
export function getCrossRefInsights(metroSlug: string, currentSite: string): string[] {
  const cr = loadCrossRef();
  const metro = cr.metros[metroSlug];
  if (!metro) return [];

  const insights: string[] = [];
  const name = metro.name || metroSlug;

  if (currentSite !== 'salary' && metro.avg_salary) {
    insights.push(`According to SalaryByCity data, the average salary across all occupations in ${name} is ${fmtDollar(metro.avg_salary)}. <a href="https://salarybycity.com/locations/${metroSlug}/" class="text-blue-600 hover:underline">See detailed salary data →</a>`);
  }

  if (currentSite !== 'cost' && metro.cost_index) {
    const diff = metro.cost_index - 100;
    const label = diff > 0 ? `${diff.toFixed(1)}% above` : `${Math.abs(diff).toFixed(1)}% below`;
    insights.push(`The cost of living in ${name} is ${label} the national average (index: ${metro.cost_index.toFixed(1)}). <a href="https://costbycity.com/cities/${metroSlug}/" class="text-emerald-600 hover:underline">See full cost breakdown →</a>`);
  }

  if (currentSite === 'salary' && metro.cost_index && metro.avg_salary) {
    const costFactor = metro.cost_index / 100;
    const adjustedSalary = Math.round(metro.avg_salary / costFactor);
    insights.push(`After adjusting for local cost of living, the purchasing power of ${name} salaries is equivalent to ${fmtDollar(adjustedSalary)} in an average-cost US city.`);
  }

  if (currentSite === 'cost' && metro.avg_salary && metro.median_rent) {
    const rentToIncome = (metro.median_rent * 12) / metro.avg_salary;
    insights.push(`With an average salary of ${fmtDollar(metro.avg_salary)} and median rent of ${fmtDollar(metro.median_rent)}/mo, housing takes about ${(rentToIncome * 100).toFixed(0)}% of income in ${name}.`);
  }

  return insights;
}

/**
 * Generate cross-site insights for a state.
 * Used by zippeek, degreewize.
 */
export function getStateCrossRef(stateSlug: string, currentSite: string): string[] {
  const cr = loadCrossRef();
  const state = cr.states[stateSlug];
  if (!state) return [];

  const insights: string[] = [];
  const name = state.name || stateSlug;

  if (currentSite !== 'degree' && state.college_count) {
    insights.push(`${name} has ${state.college_count} colleges and universities. Average tuition: ${fmtDollar(state.avg_tuition)}, average post-graduation earnings: ${fmtDollar(state.avg_grad_earnings)}. <a href="https://degreewize.com/states/${stateSlug}/" class="text-blue-600 hover:underline">Explore colleges →</a>`);
  }

  if (state.avg_income && state.avg_rent) {
    const rentBurden = (state.avg_rent * 12) / state.avg_income;
    if (currentSite === 'zippeek') {
      insights.push(`Statewide average: income ${fmtDollar(state.avg_income)}, rent ${fmtDollar(state.avg_rent)}/mo (${(rentBurden * 100).toFixed(0)}% of income). <a href="https://costbycity.com" class="text-emerald-600 hover:underline">Compare city costs →</a>`);
    }
  }

  if (currentSite === 'degree' && state.avg_income) {
    insights.push(`The statewide average income in ${name} is ${fmtDollar(state.avg_income)}. Graduates earning above this are outperforming the local market. <a href="https://salarybycity.com" class="text-blue-600 hover:underline">See salary data →</a>`);
  }

  return insights;
}
