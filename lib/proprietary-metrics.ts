export interface SalaryProprietaryMetrics {
  wagePremiumScore: number;
  growthVelocityScore: number;
  purchasingPowerScore: number;
  overallGrade: string;
  commentary: string;
}

/**
 * Returns a deterministic commentary paragraph based on job details and slug-based hash
 * to rotate content variation and prevent duplicate content.
 */
function getDeterministicCommentary(
  jobTitle: string,
  overallScore: number,
  slug: string
): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 3;

  let key = 'MODERATE_BALANCED';
  if (overallScore >= 75) {
    key = 'HIGH_VALUE_GROWTH';
  } else if (overallScore < 50) {
    key = 'LOW_GROWTH_SENSITIVE';
  }

  const variations: Record<string, string[]> = {
    HIGH_VALUE_GROWTH: [
      `The career path of ${jobTitle} delivers exceptional value, characterized by strong wage premiums and robust growth velocity. Even when adjusted for regional cost of living, top metro areas offer outstanding purchasing power for professionals in this field.`,
      `A premium career trajectory with high baseline earnings and positive wage growth trends. The regional cost-of-living analysis indicates that choosing the right metro area can significantly maximize your real income ROI.`,
      `Outstanding income potential combined with favorable market dynamics for ${jobTitle}. Strong demand has driven steady wage increases, and high-power metro areas offer maximum real savings.`
    ],
    MODERATE_BALANCED: [
      `${jobTitle} presents a balanced career value profile. Median earnings are steady and align with national averages, though moderate growth velocity suggests a mature field where geographic choice is key to maximizing real income.`,
      `A reliable career path, ${jobTitle} offers standard income stability. While wage growth is moderate, high regional living costs in top-paying metros can impact real purchasing power, making careful geographic selection advisable.`,
      `Provides solid income foundations with standard growth prospects. Professionals in ${jobTitle} can secure competitive real salaries by targeting balanced metros with lower local inflation and reasonable housing burdens.`
    ],
    LOW_GROWTH_SENSITIVE: [
      `This occupation of ${jobTitle} carries a lower wage premium or negative growth velocity. High living costs in major cities can severely erode purchasing power, making it crucial to target low-cost-of-living metros to maintain real income.`,
      `A challenging career value profile for ${jobTitle} with slower wage growth or flat salary trends. To offset high metropolitan expenses, professionals should focus on states with favorable tax rates and lower local cpi indices.`,
      `Slow velocity and below-average premiums suggest limited near-term upward pressure on ${jobTitle} salaries. Maximizing take-home pay requires a strategic regional focus on low-cost states or secondary markets.`
    ]
  };

  const list = variations[key] || variations['MODERATE_BALANCED'];
  return list[index];
}

/**
 * Calculates proprietary career/salary metrics for SalaryByCity.
 */
export function calculateProprietaryMetrics(
  jobTitle: string,
  slug: string,
  annualMedian: number | null,
  velocityTier: string | null,
  cpiAdjustedAreaRatio: number | null
): SalaryProprietaryMetrics {
  // 1. Wage Premium Score (15-99) — relative to national household median (~75k)
  const median = annualMedian ?? 55000;
  let wagePremiumScore = Math.round((median / 120000) * 80);
  wagePremiumScore = Math.max(15, Math.min(99, wagePremiumScore));

  // 2. Growth Velocity Score (12-99)
  let growthVelocityScore = 50;
  const cleanVelocity = (velocityTier || '').toLowerCase().trim();
  if (cleanVelocity.includes('high') || cleanVelocity.includes('hyper')) {
    growthVelocityScore = 90;
  } else if (cleanVelocity.includes('moderate') || cleanVelocity.includes('healthy')) {
    growthVelocityScore = 65;
  } else if (cleanVelocity.includes('low') || cleanVelocity.includes('flat')) {
    growthVelocityScore = 35;
  } else if (cleanVelocity.includes('negative')) {
    growthVelocityScore = 18;
  }
  growthVelocityScore = Math.max(12, Math.min(99, growthVelocityScore));

  // 3. Purchasing Power Score (15-99) — relative to purchasing power index
  const ratio = cpiAdjustedAreaRatio ?? 1.0;
  let purchasingPowerScore = Math.round(ratio * 35 + 20);
  purchasingPowerScore = Math.max(15, Math.min(99, purchasingPowerScore));

  // 4. Overall Grade
  const composite = wagePremiumScore * 0.4 + growthVelocityScore * 0.3 + purchasingPowerScore * 0.3;

  let overallGrade = 'C';
  if (composite >= 90) overallGrade = 'A+';
  else if (composite >= 85) overallGrade = 'A';
  else if (composite >= 80) overallGrade = 'A-';
  else if (composite >= 75) overallGrade = 'B+';
  else if (composite >= 70) overallGrade = 'B';
  else if (composite >= 65) overallGrade = 'B-';
  else if (composite >= 60) overallGrade = 'C+';
  else if (composite >= 55) overallGrade = 'C';
  else if (composite >= 50) overallGrade = 'C-';
  else if (composite >= 40) overallGrade = 'D';
  else overallGrade = 'F';

  // 5. Commentary
  const commentary = getDeterministicCommentary(jobTitle, composite, slug);

  return {
    wagePremiumScore,
    growthVelocityScore,
    purchasingPowerScore,
    overallGrade,
    commentary,
  };
}
