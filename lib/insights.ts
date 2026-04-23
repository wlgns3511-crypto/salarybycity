interface Insight {
  text: string;
  sentiment?: "positive" | "negative" | "neutral";
}

interface TopJob {
  occ_title: string;
  annual_median: number | null;
  employment: number | null;
}

const NATIONAL_MEDIAN_SALARY = 48060;

export function getLocationInsights(
  areaTitle: string,
  topJobs: TopJob[],
  year: number,
): Insight[] {
  const insights: Insight[] = [];

  if (topJobs.length === 0) return insights;

  // 1. Top-paying job headline
  const top = topJobs[0];
  if (top.annual_median) {
    const multiple = (top.annual_median / NATIONAL_MEDIAN_SALARY).toFixed(1);
    insights.push({
      text: `The highest-paying occupation in ${areaTitle} is ${top.occ_title} at $${top.annual_median.toLocaleString()}/yr — ${multiple}x the national median wage of $${NATIONAL_MEDIAN_SALARY.toLocaleString()}.`,
      sentiment: top.annual_median > NATIONAL_MEDIAN_SALARY * 1.5 ? "positive" : "neutral",
    });
  }

  // 2. Median of top jobs vs national median
  const medians = topJobs
    .map((j) => j.annual_median)
    .filter((m): m is number => m !== null);
  if (medians.length >= 3) {
    const avg = Math.round(medians.reduce((a, b) => a + b, 0) / medians.length);
    const pctAbove = ((avg / NATIONAL_MEDIAN_SALARY - 1) * 100).toFixed(0);
    const direction = avg >= NATIONAL_MEDIAN_SALARY ? "above" : "below";
    insights.push({
      text: `Across the top ${medians.length} occupations, the average median salary is $${avg.toLocaleString()}/yr — ${Math.abs(Number(pctAbove))}% ${direction} the US median of $${NATIONAL_MEDIAN_SALARY.toLocaleString()}.`,
      sentiment: avg >= NATIONAL_MEDIAN_SALARY ? "positive" : "negative",
    });
  }

  // 3. Top 3 jobs list
  const top3 = topJobs.slice(0, 3).filter((j) => j.annual_median);
  if (top3.length === 3) {
    insights.push({
      text: `Top 3 earners: ${top3.map((j) => `${j.occ_title} ($${j.annual_median!.toLocaleString()})`).join(", ")}. These roles set the local pay ceiling for ${year}.`,
      sentiment: "neutral",
    });
  }

  // 4. Employment concentration
  const totalEmp = topJobs
    .map((j) => j.employment)
    .filter((e): e is number => e !== null)
    .reduce((a, b) => a + b, 0);
  if (totalEmp > 0) {
    const largest = topJobs
      .filter((j) => j.employment !== null)
      .sort((a, b) => (b.employment ?? 0) - (a.employment ?? 0))[0];
    if (largest && largest.employment) {
      const share = ((largest.employment / totalEmp) * 100).toFixed(0);
      insights.push({
        text: `${largest.occ_title} employs the most workers among top-paying jobs (${largest.employment.toLocaleString()} positions, ${share}% of the listed total). A large employment base signals strong local demand for the role.`,
        sentiment: "neutral",
      });
    }
  }

  // 5. Pay floor check
  const lowest = topJobs[topJobs.length - 1];
  if (lowest.annual_median) {
    const sentiment: Insight["sentiment"] =
      lowest.annual_median >= NATIONAL_MEDIAN_SALARY ? "positive" : "negative";
    insights.push({
      text: `Even the lowest-ranked job on this list (${lowest.occ_title}) pays $${lowest.annual_median.toLocaleString()}/yr, which is ${lowest.annual_median >= NATIONAL_MEDIAN_SALARY ? "still above" : "below"} the national median. ${lowest.annual_median >= NATIONAL_MEDIAN_SALARY ? "This suggests a generally high-wage metro." : "Higher-paying roles may require specialized credentials."}`,
      sentiment,
    });
  }

  return insights;
}

// --- Job/Occupation Insights (for jobs/[slug] page) ---

interface NationalWage {
  employment: number | null;
  annual_mean: number | null;
  annual_median: number | null;
  annual_p10: number | null;
  annual_p25: number | null;
  annual_p75: number | null;
  annual_p90: number | null;
  hourly_mean: number | null;
  hourly_median: number | null;
}

interface CityWage {
  area_title: string;
  annual_median: number | null;
  employment: number | null;
}

export function getJobInsights(
  jobTitle: string,
  wage: NationalWage,
  topCities: CityWage[],
): Insight[] {
  const insights: Insight[] = [];
  const median = wage.annual_median;
  if (!median) return insights;

  // 1. National median vs all-occupation median
  const diff = ((median - NATIONAL_MEDIAN_SALARY) / NATIONAL_MEDIAN_SALARY) * 100;
  insights.push({
    text: `The median ${jobTitle} salary is $${median.toLocaleString()}/yr — ${Math.abs(Math.round(diff))}% ${diff >= 0 ? "above" : "below"} the all-occupation US median of $${NATIONAL_MEDIAN_SALARY.toLocaleString()}.`,
    sentiment: diff >= 10 ? "positive" : diff <= -10 ? "negative" : "neutral",
  });

  // 2. Salary spread (P10 to P90)
  if (wage.annual_p10 && wage.annual_p90) {
    const spread = wage.annual_p90 - wage.annual_p10;
    const spreadRatio = (spread / median * 100).toFixed(0);
    insights.push({
      text: `Salary range spans $${wage.annual_p10.toLocaleString()} (10th percentile) to $${wage.annual_p90.toLocaleString()} (90th percentile) — a $${spread.toLocaleString()} spread. Experience and location can shift pay by ${spreadRatio}% of the median.`,
      sentiment: "neutral",
    });
  }

  // 3. Mean vs median skew
  if (wage.annual_mean && median) {
    const skew = wage.annual_mean - median;
    if (Math.abs(skew) > median * 0.05) {
      insights.push({
        text: `The average salary ($${wage.annual_mean.toLocaleString()}) is ${skew > 0 ? "higher" : "lower"} than the median by $${Math.abs(skew).toLocaleString()}, suggesting the pay distribution is ${skew > 0 ? "right-skewed — a few high earners pull the average up" : "left-skewed — a cluster of lower salaries pulls the average down"}.`,
        sentiment: skew > 0 ? "positive" : "negative",
      });
    }
  }

  // 4. Top-paying metro
  if (topCities.length >= 3) {
    const top = topCities[0];
    if (top.annual_median) {
      const premium = Math.round(((top.annual_median - median) / median) * 100);
      insights.push({
        text: `${top.area_title.split(",")[0]} pays the most for ${jobTitle}s at $${top.annual_median.toLocaleString()}/yr — ${premium}% above the national median. Geographic premiums can offset higher local living costs.`,
        sentiment: "positive",
      });
    }
  }

  // 5. Employment size
  if (wage.employment) {
    let sizeLabel: string;
    let sentiment: Insight["sentiment"];
    if (wage.employment >= 500000) {
      sizeLabel = "a large and well-established occupation";
      sentiment = "positive";
    } else if (wage.employment >= 100000) {
      sizeLabel = "a mid-size occupation with solid demand";
      sentiment = "neutral";
    } else if (wage.employment >= 10000) {
      sizeLabel = "a specialized occupation";
      sentiment = "neutral";
    } else {
      sizeLabel = "a niche occupation with limited openings";
      sentiment = "negative";
    }
    insights.push({
      text: `With ${wage.employment.toLocaleString()} workers employed nationally, ${jobTitle} is ${sizeLabel}. Larger employment bases generally mean more job openings and geographic flexibility.`,
      sentiment,
    });
  }

  return insights.slice(0, 5);
}
