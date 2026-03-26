/**
 * Salary analysis: career insights from BLS wage data
 */

interface WageData {
  annual_median: number | null;
  annual_mean: number | null;
  annual_p10: number | null;
  annual_p25: number | null;
  annual_p75: number | null;
  annual_p90: number | null;
  hourly_median: number | null;
  employment: number | null;
}

export interface SalaryAnalysis {
  summary: string;
  payLevel: string;
  salaryRange: string;
  growthPotential: string;
  insights: string[];
  costOfLivingNote: string;
}

function fmtSal(v: number | null): string {
  if (!v) return "N/A";
  return `$${v.toLocaleString("en-US")}`;
}

export function analyzeSalary(
  jobTitle: string,
  cityName: string,
  wage: WageData,
  nationalWage: WageData | null
): SalaryAnalysis {
  const median = wage.annual_median || 0;
  const mean = wage.annual_mean || 0;
  const p10 = wage.annual_p10 || 0;
  const p90 = wage.annual_p90 || 0;
  const natMedian = nationalWage?.annual_median || 0;
  const employment = wage.employment || 0;

  // Pay level
  let payLevel = "moderate";
  if (median >= 100000) payLevel = "high-paying";
  else if (median >= 75000) payLevel = "above-average";
  else if (median >= 50000) payLevel = "moderate";
  else if (median >= 35000) payLevel = "below-average";
  else payLevel = "entry-level";

  // Salary range description
  const range = p90 > 0 && p10 > 0
    ? `The salary range for ${jobTitle}s in ${cityName} spans from ${fmtSal(p10)} (entry-level) to ${fmtSal(p90)} (top earners). The middle 50% earn between ${fmtSal(wage.annual_p25)} and ${fmtSal(wage.annual_p75)}.`
    : `The median salary for ${jobTitle}s in ${cityName} is ${fmtSal(wage.annual_median)}.`;

  // Growth potential (gap between entry and top)
  const growthMultiple = p10 > 0 && p90 > 0 ? p90 / p10 : 0;
  let growthPotential = "";
  if (growthMultiple >= 3) {
    growthPotential = `There is significant earning potential — top earners make ${growthMultiple.toFixed(1)}x more than entry-level. Experience, specialization, and certifications can dramatically increase your pay.`;
  } else if (growthMultiple >= 2) {
    growthPotential = `Experienced ${jobTitle}s can expect to roughly double their starting salary over their career. Specialization and leadership roles offer the best path to higher earnings.`;
  } else if (growthMultiple > 0) {
    growthPotential = `The salary range is relatively narrow, meaning pay is more standardized. Advancing to management or related fields may offer better earning potential.`;
  }

  // Insights
  const insights: string[] = [];

  // vs national
  if (natMedian > 0 && median > 0) {
    const diff = median - natMedian;
    const pctDiff = ((diff / natMedian) * 100).toFixed(0);
    if (diff > 0) {
      insights.push(`${jobTitle}s in ${cityName} earn ${fmtSal(diff)} more (${pctDiff}%) than the national median of ${fmtSal(natMedian)}.`);
    } else if (diff < 0) {
      insights.push(`${jobTitle}s in ${cityName} earn ${fmtSal(Math.abs(diff))} less (${Math.abs(Number(pctDiff))}%) than the national median of ${fmtSal(natMedian)}.`);
    } else {
      insights.push(`${jobTitle} pay in ${cityName} matches the national median.`);
    }
  }

  // Mean vs Median skew
  if (mean > 0 && median > 0) {
    if (mean > median * 1.15) {
      insights.push(`The average salary (${fmtSal(mean)}) is notably higher than the median — this means top earners pull the average up. A small number of highly paid ${jobTitle}s skew the data.`);
    } else if (median > mean * 1.1) {
      insights.push(`The median salary exceeds the average, suggesting most ${jobTitle}s in ${cityName} earn above the mean.`);
    }
  }

  // Employment
  if (employment > 5000) {
    insights.push(`With ${employment.toLocaleString()} ${jobTitle}s employed in ${cityName}, there is a strong job market and likely good career opportunities.`);
  } else if (employment > 1000) {
    insights.push(`About ${employment.toLocaleString()} ${jobTitle}s work in ${cityName}, indicating a healthy local job market.`);
  } else if (employment > 0) {
    insights.push(`Only ${employment.toLocaleString()} ${jobTitle}s work in ${cityName}. Consider nearby metro areas for more opportunities.`);
  }

  // Hourly rate context
  if (wage.hourly_median) {
    insights.push(`The hourly rate is $${wage.hourly_median.toFixed(2)}, which assumes a standard 40-hour work week and 2,080 hours per year.`);
  }

  // Cost of living note
  let costOfLivingNote = "";
  if (natMedian > 0 && median > natMedian * 1.3) {
    costOfLivingNote = `While ${cityName} offers higher pay, remember that cost of living may also be higher. A ${fmtSal(median)} salary here may not go as far as ${fmtSal(natMedian)} in a lower-cost area. Consider housing, taxes, and commute costs.`;
  } else if (natMedian > 0 && median < natMedian * 0.85) {
    costOfLivingNote = `Although ${cityName} pays below the national average, the cost of living may also be lower. Your purchasing power could be comparable to higher-salary cities. Check local housing costs before deciding.`;
  } else {
    costOfLivingNote = `When evaluating this salary, factor in ${cityName}'s cost of living. Housing, transportation, and taxes vary significantly between cities and can impact how far your paycheck goes.`;
  }

  // Summary
  const summaryParts: string[] = [];
  summaryParts.push(`${jobTitle} is a ${payLevel} occupation in ${cityName}, with a median annual salary of ${fmtSal(wage.annual_median)}.`);
  if (insights.length > 0) summaryParts.push(insights[0]);
  if (growthPotential) summaryParts.push(growthPotential.split('.')[0] + '.');

  return {
    summary: summaryParts.join(" "),
    payLevel,
    salaryRange: range,
    growthPotential,
    insights,
    costOfLivingNote,
  };
}
