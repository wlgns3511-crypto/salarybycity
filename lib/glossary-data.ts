/**
 * Salary glossary — 50 entries.
 *
 * Each entry has a primary-source citation (BLS, IRS, DOL, FRB, etc.) and a
 * 2–4 sentence plain-English definition keyed to how the term actually appears
 * in U.S. wage data, tax code, or paychecks.
 *
 * Categories:
 *   - bls: BLS wage-statistics terminology (15 entries)
 *   - irs: U.S. federal income/payroll tax terms (10 entries)
 *   - flsa: Fair Labor Standards Act / DOL labor terms (10 entries)
 *   - comp: compensation-package terms (RSU, 401k, COL, RPP) (15 entries)
 *
 * No synthetic data. If a value (like a tax bracket cap) is cited, it pins
 * to a specific tax year and links the IRS publication.
 */

export type GlossaryCategory = 'bls' | 'irs' | 'flsa' | 'comp';

export type GlossarySource = {
  /** Canonical title of the source document. */
  title: string;
  /** URL to the source. Must be a primary government or regulator domain. */
  url: string;
  /** Year (or "N/A" for evergreen). */
  year?: number | string;
};

export type GlossaryEntry = {
  slug: string;
  term: string;
  /** Plural or alternative phrasings users might search for. */
  aliases?: string[];
  category: GlossaryCategory;
  /** 2–4 sentence definition. */
  definition: string;
  /** Worked example or concrete number, where useful. */
  example?: string;
  /** Common confusions to call out. */
  notMistake?: string;
  /** Cross-link to other glossary slugs that pair with this one. */
  seeAlso?: string[];
  /** 1+ primary sources. */
  sources: GlossarySource[];
};

export const GLOSSARY: GlossaryEntry[] = [
  // === BLS — 15 ===
  {
    slug: 'oews',
    term: 'OEWS (Occupational Employment and Wage Statistics)',
    aliases: ['OES survey', 'Occupational Employment Statistics'],
    category: 'bls',
    definition:
      'The BLS Occupational Employment and Wage Statistics program is the primary federal survey of employer-reported wages, covering ~1.1 million establishments over a rolling three-year cycle. Released every May, it is the source we cite for occupation × area median, mean, and percentile pay.',
    example:
      'May 2024 OEWS reports a national median wage of $48,060 across all occupations and ~151.8 million wage and salary jobs.',
    notMistake:
      'OEWS is establishment-based — it excludes self-employed workers, agricultural production workers, and most household-employed workers. Self-employment is captured separately in the BLS Current Population Survey.',
    seeAlso: ['median-wage', 'mean-wage', 'soc-code', 'bls-msa'],
    sources: [
      { title: 'BLS OEWS Overview', url: 'https://www.bls.gov/oes/oes_emp.htm', year: 2024 },
    ],
  },
  {
    slug: 'median-wage',
    term: 'Median annual wage',
    aliases: ['median salary', '50th percentile wage'],
    category: 'bls',
    definition:
      'The 50th percentile of annual wages — half of workers in the occupation earn less, half earn more. BLS reports it as a more representative typical-pay figure than the mean, which is pulled upward by very high earners.',
    example:
      'In May 2024, the median wage for software developers (SOC 15-1252) was $133,080 nationally; the mean was $144,570 — a $11,490 gap that reflects high-earning outliers.',
    notMistake:
      'Median ≠ average. Half of workers earn below the median by definition, so it is not a "starting" or "minimum" pay floor.',
    seeAlso: ['mean-wage', 'percentile-wage', 'oews'],
    sources: [
      { title: 'BLS OEWS Technical Notes', url: 'https://www.bls.gov/oes/oes_tec.htm', year: 2024 },
    ],
  },
  {
    slug: 'mean-wage',
    term: 'Mean annual wage',
    aliases: ['average wage', 'arithmetic mean wage'],
    category: 'bls',
    definition:
      'The arithmetic average of annual wages: total wages paid in the occupation divided by employment. BLS publishes both annual and hourly mean wages alongside median and percentile values.',
    example:
      'May 2024 OEWS national mean wage across all occupations: $65,470. Median: $48,060. The $17,410 gap reflects the right-skewed distribution.',
    notMistake:
      'Means are sensitive to outliers; a small number of very high earners can shift the mean upward. Median is generally a better summary for "typical" pay.',
    seeAlso: ['median-wage', 'oews'],
    sources: [
      { title: 'BLS OEWS Technical Notes', url: 'https://www.bls.gov/oes/oes_tec.htm', year: 2024 },
    ],
  },
  {
    slug: 'percentile-wage',
    term: 'Wage percentiles (P10, P25, P75, P90)',
    aliases: ['10th percentile', '90th percentile', 'wage distribution'],
    category: 'bls',
    definition:
      'BLS publishes wages at the 10th, 25th, 50th (median), 75th, and 90th percentile for each occupation × area. P10 is what the bottom-paid 10% earn at most; P90 is what the top 10% earn at least. The P90/P10 ratio is a common inequality measure.',
    example:
      'For software developers nationally in May 2024: P10 = $84,020, P25 = $107,030, P50 = $133,080, P75 = $172,740, P90 = $208,620+ (top-coded).',
    notMistake:
      'BLS top-codes wages at $115/hour or $239,200/year — anything above is reported as that ceiling, marked with "#" in raw files.',
    seeAlso: ['top-coded-wage', 'median-wage'],
    sources: [
      { title: 'BLS OEWS Methodology', url: 'https://www.bls.gov/oes/current/methods_statement.pdf', year: 2024 },
    ],
  },
  {
    slug: 'soc-code',
    term: 'SOC code (Standard Occupational Classification)',
    aliases: ['occupation code', 'SOC'],
    category: 'bls',
    definition:
      'A 6-digit code maintained by the U.S. Office of Management and Budget that classifies every occupation reported in federal statistics. The current system is SOC 2018, used by BLS OEWS since the May 2019 reference period.',
    example:
      '15-1252 = Software Developers; 11-3012 = Administrative Services Managers; 29-1141 = Registered Nurses. The first 2 digits are the major group, next 4 are increasingly specific.',
    notMistake:
      'SOC codes change between revisions (2010 → 2018), so historical comparisons across the SOC 2010/2018 boundary need crosswalk tables. We use 2018 throughout.',
    seeAlso: ['oews', 'bls-msa'],
    sources: [
      { title: 'BLS Standard Occupational Classification', url: 'https://www.bls.gov/soc/', year: 2018 },
    ],
  },
  {
    slug: 'bls-msa',
    term: 'MSA (Metropolitan Statistical Area)',
    aliases: ['metro area', 'CBSA'],
    category: 'bls',
    definition:
      'An OMB-defined geographic area with at least one urbanized core of 50,000+ population, used by BLS to publish metro-level wages. Boundaries are revised after each decennial census.',
    example:
      'New York-Newark-Jersey City, NY-NJ-PA (CBSA 35620) had 9.7 million wage and salary jobs in May 2024. San Jose-Sunnyvale-Santa Clara, CA (41940) is a single-county MSA with the highest median software-developer wage in the country.',
    notMistake:
      'BLS OEWS and BEA RPP can use slightly different MSA vintages — boundaries don\'t always match year-over-year. We crosswalk where they diverge (e.g. Cincinnati 17460 ↔ 17140).',
    seeAlso: ['oews', 'rpp'],
    sources: [
      { title: 'OMB Bulletin No. 23-01: MSA Delineations', url: 'https://www.whitehouse.gov/wp-content/uploads/2023/07/OMB-Bulletin-23-01.pdf', year: 2023 },
    ],
  },
  {
    slug: 'employment',
    term: 'Total employment (TOT_EMP)',
    aliases: ['headcount', 'job count'],
    category: 'bls',
    definition:
      'The number of wage and salary jobs in an occupation × area, as reported by employers in the OEWS survey. Counts jobs, not people — a worker holding two jobs is counted twice.',
    example:
      'In May 2024 there were 1,654,440 software developers nationally. The Manhattan-area MSA (NYC) reports about 119,610 of them.',
    notMistake:
      'Self-employed, gig workers, and agricultural production workers are not counted. The OEWS estimate excludes these populations entirely.',
    seeAlso: ['oews'],
    sources: [
      { title: 'BLS OEWS FAQ', url: 'https://www.bls.gov/oes/oes_ques.htm', year: 2024 },
    ],
  },
  {
    slug: 'top-coded-wage',
    term: 'Top-coded wage',
    aliases: ['#', 'high-cap wage', 'truncated wage'],
    category: 'bls',
    definition:
      'BLS censors any reported wage above $115.00/hour or $239,200/year — they are listed as "#" in raw OEWS files and excluded from mean wage calculations. This is to protect respondent confidentiality.',
    example:
      'For "Top Executives" (SOC 11-1000) in May 2024, the P90 hourly wage is reported as "#" — meaning at least 10% of top executives earn more than $115/hour, but BLS does not publish the exact figure.',
    notMistake:
      'A "#" does not mean the data is missing — it means the value exists but is censored above a known threshold.',
    seeAlso: ['percentile-wage'],
    sources: [
      { title: 'BLS OEWS Methodology', url: 'https://www.bls.gov/oes/current/methods_statement.pdf', year: 2024 },
    ],
  },
  {
    slug: 'cps',
    term: 'CPS (Current Population Survey)',
    aliases: ['household survey'],
    category: 'bls',
    definition:
      'A monthly household survey jointly run by BLS and the Census Bureau, capturing self-reported employment, earnings, and demographics. Source of the unemployment rate. Complements OEWS, which is establishment-based.',
    example:
      'CPS counts roughly 60,000 households monthly. It captures self-employed workers and the agricultural sector, both of which OEWS excludes.',
    notMistake:
      'CPS earnings are self-reported and weekly; OEWS wages are employer-reported and annualized. The two surveys can diverge, especially for occupations with high self-employment.',
    seeAlso: ['oews', 'unemployment-rate'],
    sources: [
      { title: 'BLS Current Population Survey', url: 'https://www.bls.gov/cps/', year: 2024 },
    ],
  },
  {
    slug: 'unemployment-rate',
    term: 'Unemployment rate (U-3)',
    category: 'bls',
    definition:
      'The percentage of the civilian labor force without a job and actively looking for work. The headline U-3 figure is published monthly by BLS from the CPS. Six alternate measures (U-1 through U-6) capture different definitions of underutilization.',
    example:
      'U.S. unemployment rate in March 2026 was 4.0%. U-6 — which adds discouraged workers and involuntary part-timers — typically runs 3–4 percentage points higher than U-3.',
    notMistake:
      'U-3 excludes people who stopped looking for work (discouraged workers) and those working part-time who want full-time. Use U-6 if you want the broader measure.',
    seeAlso: ['cps'],
    sources: [
      { title: 'BLS Alternative Measures of Labor Underutilization', url: 'https://www.bls.gov/lns/lnsdataquery.htm', year: 2026 },
    ],
  },
  {
    slug: 'cpi-u',
    term: 'CPI-U (Consumer Price Index for All Urban Consumers)',
    aliases: ['CPI', 'inflation'],
    category: 'bls',
    definition:
      'BLS\'s primary measure of inflation, tracking the price change of a fixed basket of goods/services for urban consumers (~93% of the U.S. population). Used to deflate nominal wages into real (inflation-adjusted) wages.',
    example:
      'CPI-U series CUUR0000SA0. Annual average 2020 = 258.811; 2024 = 313.689. So $1 of 2020 purchasing power required $1.21 in 2024.',
    notMistake:
      'CPI-U is not the only inflation measure — PCE (used by the Federal Reserve) typically runs 0.3–0.5 pp lower because of methodology differences. Use CPI-U for wage comparisons.',
    seeAlso: ['real-wage', 'nominal-wage'],
    sources: [
      { title: 'BLS CPI Home', url: 'https://www.bls.gov/cpi/', year: 2024 },
    ],
  },
  {
    slug: 'real-wage',
    term: 'Real wage',
    aliases: ['inflation-adjusted wage', 'constant-dollar wage'],
    category: 'bls',
    definition:
      'A nominal wage divided by a price index (typically CPI-U) and rebased to a reference year. Real wages reveal whether pay is keeping up with inflation. A flat or declining real wage means lost purchasing power even if the dollar number rises.',
    example:
      'A $100,000 salary in 2020 dollars equals about $121,200 in 2024 dollars (CPI-U 313.689 / 258.811). If your 2024 nominal salary is $115,000, you have lost ~5% real purchasing power.',
    notMistake:
      'Reporting a "5% raise" without checking real-wage change can mask a pay cut during high-inflation years. 2022 nominal wages rose ~5% nationally but real wages fell.',
    seeAlso: ['cpi-u', 'nominal-wage'],
    sources: [
      { title: 'BLS Real Earnings Summary', url: 'https://www.bls.gov/news.release/realer.toc.htm', year: 2024 },
    ],
  },
  {
    slug: 'nominal-wage',
    term: 'Nominal wage',
    category: 'bls',
    definition:
      'The wage as reported in current-year dollars, with no inflation adjustment. All BLS OEWS published wages are nominal — comparing 2020 OEWS to 2024 OEWS without deflating overstates real growth.',
    example:
      'OEWS reports $48,060 median wage in May 2024 and $41,950 in May 2020 — a 14.6% nominal increase. After CPI-U deflation, real wage growth over those four years was about 0.6%.',
    seeAlso: ['real-wage', 'cpi-u'],
    sources: [
      { title: 'BLS OEWS Tables', url: 'https://www.bls.gov/oes/tables.htm', year: 2024 },
    ],
  },
  {
    slug: 'wage-prse',
    term: 'PRSE (Percent Relative Standard Error)',
    aliases: ['relative standard error', 'PRSE'],
    category: 'bls',
    definition:
      'BLS reports a relative standard error (as a percentage) alongside each wage estimate, indicating sampling uncertainty. PRSE > 30% generally means the estimate should be used with caution; > 50% means BLS suppresses the estimate entirely.',
    example:
      'A reported median of $80,000 with PRSE of 5% gives a 95% CI of roughly $72,000–$88,000. PRSE of 25% on the same number widens the CI to $40,000–$120,000.',
    notMistake:
      'A high PRSE doesn\'t mean the wage is wrong — it means the sample for that occupation × area was small. Larger MSAs and common occupations always have lower PRSE.',
    seeAlso: ['oews'],
    sources: [
      { title: 'BLS OEWS Reliability Information', url: 'https://www.bls.gov/oes/current/reliability.htm', year: 2024 },
    ],
  },
  {
    slug: 'jobs-1000',
    term: 'Employment per 1,000 jobs (JOBS_1000)',
    aliases: ['concentration', 'employment density'],
    category: 'bls',
    definition:
      'OEWS publishes how many of every 1,000 jobs in an area belong to a given occupation. Useful for spotting industry concentration without needing absolute counts.',
    example:
      'In San Jose, software developers are 67.7 of every 1,000 jobs vs. 10.9 nationally — a 6.2× concentration that reflects the metro\'s tech specialization.',
    seeAlso: ['location-quotient', 'oews'],
    sources: [
      { title: 'BLS OEWS Tables', url: 'https://www.bls.gov/oes/tables.htm', year: 2024 },
    ],
  },

  // === IRS — 10 ===
  {
    slug: 'fica',
    term: 'FICA (Social Security + Medicare payroll tax)',
    aliases: ['payroll tax', 'OASDI', 'Medicare tax'],
    category: 'irs',
    definition:
      'The combined federal payroll tax: Social Security (OASDI) at 6.2% on wages up to the annual wage base, plus Medicare at 1.45% on all wages. Employers match both. Self-employed workers owe both halves (15.3%) via SECA.',
    example:
      '2026 Social Security wage base = $176,100 (per SSA, projected). At a $200,000 W-2 salary you owe FICA on the first $176,100 (Soc Sec) plus 1.45% on the full $200,000 (Medicare) plus an additional 0.9% Medicare surtax on wages over $200,000.',
    notMistake:
      'FICA caps are per-job for OASDI but per-individual for the additional Medicare tax. Two employers can each withhold full OASDI; you reconcile the overpayment on Form 1040.',
    seeAlso: ['additional-medicare-tax', 'seca'],
    sources: [
      { title: 'IRS Publication 15: Employer\'s Tax Guide', url: 'https://www.irs.gov/publications/p15', year: 2026 },
      { title: 'SSA Contribution and Benefit Base', url: 'https://www.ssa.gov/oact/cola/cbb.html', year: 2026 },
    ],
  },
  {
    slug: 'agi',
    term: 'AGI (Adjusted Gross Income)',
    category: 'irs',
    definition:
      'Total income minus "above-the-line" deductions (e.g. traditional IRA contributions, HSA contributions, student loan interest, half of self-employment tax). AGI is the figure most other tax thresholds key off.',
    example:
      'A $150,000 W-2 wage earner with a $7,000 traditional IRA contribution and $4,150 HSA contribution has AGI of $138,850.',
    notMistake:
      'AGI is not the same as taxable income — taxable income subtracts the standard or itemized deduction (and QBI deduction) from AGI. Most income limits (Roth IRA phase-out, child tax credit, EITC) are AGI- or MAGI-based.',
    seeAlso: ['magi', 'taxable-income'],
    sources: [
      { title: 'IRS Form 1040 Instructions', url: 'https://www.irs.gov/forms-pubs/about-form-1040', year: 2025 },
    ],
  },
  {
    slug: 'magi',
    term: 'MAGI (Modified Adjusted Gross Income)',
    category: 'irs',
    definition:
      'AGI plus certain add-backs (foreign earned income exclusion, tax-exempt interest, untaxed Social Security benefits). The exact add-backs differ by tax provision — Roth IRA limits use one definition, IRMAA uses another, ACA subsidies use a third.',
    example:
      '2025 Roth IRA contribution phaseout starts at MAGI $150,000 (single) and ends at $165,000. A high earner taking the foreign earned income exclusion might still trigger the phaseout because the exclusion is added back for Roth-MAGI.',
    notMistake:
      'There is no single "MAGI" — always check which provision\'s definition applies. Tax software handles this automatically; manual planning needs care.',
    seeAlso: ['agi', 'roth-ira'],
    sources: [
      { title: 'IRS Publication 590-A', url: 'https://www.irs.gov/publications/p590a', year: 2025 },
    ],
  },
  {
    slug: 'taxable-income',
    term: 'Taxable income',
    category: 'irs',
    definition:
      'AGI minus the standard deduction (or itemized deductions) and the QBI deduction. The figure to which marginal tax brackets apply.',
    example:
      '2025 single filer with $100,000 AGI taking the $15,000 standard deduction has taxable income of $85,000. Tax = $11,580 (using 2025 single brackets) before any credits.',
    seeAlso: ['agi', 'standard-deduction', 'marginal-tax-rate'],
    sources: [
      { title: 'IRS Form 1040 Instructions', url: 'https://www.irs.gov/forms-pubs/about-form-1040', year: 2025 },
    ],
  },
  {
    slug: 'standard-deduction',
    term: 'Standard deduction',
    category: 'irs',
    definition:
      'A flat reduction to AGI that anyone can claim instead of itemizing. The 2017 Tax Cuts and Jobs Act roughly doubled it; the elevated levels are scheduled to sunset after the 2025 tax year unless extended.',
    example:
      '2025 standard deduction: $15,000 single, $30,000 MFJ, $22,500 HoH. About 88% of returns claim the standard deduction post-TCJA.',
    seeAlso: ['itemized-deductions', 'agi'],
    sources: [
      { title: 'IRS Rev. Proc. 2024-40 (2025 inflation adjustments)', url: 'https://www.irs.gov/pub/irs-drop/rp-24-40.pdf', year: 2025 },
    ],
  },
  {
    slug: 'marginal-tax-rate',
    term: 'Marginal tax rate',
    aliases: ['marginal bracket', 'top bracket'],
    category: 'irs',
    definition:
      'The federal income tax rate applied to the next dollar of taxable income. The U.S. has seven brackets — 10, 12, 22, 24, 32, 35, 37%. Only the income within each bracket is taxed at that rate (it is not a cliff).',
    example:
      '2025 single-filer 24% bracket runs from $103,350 to $197,300 of taxable income. Earning $150,000 puts you "in the 24% bracket" but the effective tax rate on the full $150k is closer to 17%.',
    notMistake:
      'A raise that pushes you into a higher bracket never reduces take-home pay — only the marginal income above the threshold is taxed at the higher rate.',
    seeAlso: ['effective-tax-rate', 'taxable-income'],
    sources: [
      { title: 'IRS Tax Brackets (2025)', url: 'https://www.irs.gov/pub/irs-drop/rp-24-40.pdf', year: 2025 },
    ],
  },
  {
    slug: 'effective-tax-rate',
    term: 'Effective tax rate',
    category: 'irs',
    definition:
      'Total federal income tax owed divided by total taxable income (or AGI). Always lower than the marginal rate because the lower brackets are taxed at lower rates.',
    example:
      'A 2025 single filer with $150,000 taxable income has marginal rate 24% but effective rate of 19.7% on taxable income (or about 16.7% if computed on the $165,000 gross before standard deduction).',
    seeAlso: ['marginal-tax-rate'],
    sources: [
      { title: 'IRS Statistics of Income', url: 'https://www.irs.gov/statistics/soi-tax-stats-individual-statistical-tables', year: 2024 },
    ],
  },
  {
    slug: 'fit',
    term: 'FIT (Federal Income Tax withholding)',
    aliases: ['federal withholding'],
    category: 'irs',
    definition:
      'The portion of each paycheck the employer remits to the IRS toward the employee\'s estimated annual tax bill. Computed from Form W-4 inputs using IRS Publication 15-T tables.',
    example:
      'A single filer with no W-4 adjustments earning $5,000 biweekly has FIT of about $700 per check (2025 brackets, percentage method). Under-withholding triggers a balance due; over-withholding produces the familiar refund.',
    notMistake:
      'FIT is an estimate, not a final tax. The actual tax owed is reconciled on Form 1040 — refunds are returned overpayments, not bonus income.',
    seeAlso: ['marginal-tax-rate'],
    sources: [
      { title: 'IRS Publication 15-T', url: 'https://www.irs.gov/publications/p15t', year: 2025 },
    ],
  },
  {
    slug: 'additional-medicare-tax',
    term: 'Additional Medicare Tax',
    aliases: ['0.9% Medicare surtax'],
    category: 'irs',
    definition:
      'A 0.9% tax on wages above $200,000 (single) / $250,000 (MFJ), enacted by the ACA in 2013. Employers must withhold the surtax automatically once an individual employee\'s wages exceed $200k regardless of filing status.',
    example:
      'A single filer earning $300,000 owes Additional Medicare Tax of (300,000 - 200,000) × 0.009 = $900. A married couple where each spouse earns $150,000 owes nothing — combined $300k still under the $250k MFJ threshold for the year-end reconciliation.',
    seeAlso: ['fica'],
    sources: [
      { title: 'IRS Topic No. 560', url: 'https://www.irs.gov/taxtopics/tc560', year: 2024 },
    ],
  },
  {
    slug: 'seca',
    term: 'SECA (Self-Employment Contributions Act tax)',
    aliases: ['self-employment tax'],
    category: 'irs',
    definition:
      'The self-employed equivalent of FICA. Self-employed workers pay both the employee and employer halves: 12.4% Social Security (up to the wage base) + 2.9% Medicare = 15.3% combined. Half is deductible above-the-line on Schedule SE.',
    example:
      'A freelancer with $100,000 net Schedule C income owes SECA = (100,000 × 0.9235) × 0.153 ≈ $14,130. Half of this ($7,065) reduces AGI as an adjustment.',
    seeAlso: ['fica', 'agi'],
    sources: [
      { title: 'IRS Schedule SE Instructions', url: 'https://www.irs.gov/forms-pubs/about-schedule-se-form-1040', year: 2025 },
    ],
  },

  // === FLSA / DOL — 10 ===
  {
    slug: 'minimum-wage',
    term: 'Federal minimum wage',
    category: 'flsa',
    definition:
      'The lowest hourly rate non-exempt employees may legally be paid under the Fair Labor Standards Act. The federal floor has been $7.25/hour since July 2009. State and local minimums often exceed it; the higher rate applies.',
    example:
      'As of 2026, 30 states + DC have minimums above $7.25, ranging from $9.50 (Montana) to $17.50 (DC). California is $16.50 statewide, with some cities (e.g., West Hollywood) at $19.65+.',
    notMistake:
      'Tipped employees have a separate federal floor of $2.13/hour cash wage, but only if tips bring total compensation to at least $7.25/hour. Many states reject the tip credit entirely.',
    seeAlso: ['flsa', 'tipped-minimum-wage'],
    sources: [
      { title: 'DOL Wage and Hour Division', url: 'https://www.dol.gov/agencies/whd/minimum-wage', year: 2026 },
    ],
  },
  {
    slug: 'overtime',
    term: 'Overtime (FLSA time-and-a-half)',
    aliases: ['1.5x pay', 'overtime pay'],
    category: 'flsa',
    definition:
      'Non-exempt employees must be paid at least 1.5× their regular rate for hours worked beyond 40 in a single workweek. Daily overtime (>8 hours/day) is not federally required but is mandated by California and a few other states.',
    example:
      'A non-exempt worker earning $25/hour who works 45 hours owes overtime on 5 hours: 5 × $37.50 = $187.50 OT pay on top of $1,000 regular pay. Total = $1,187.50 for the week.',
    notMistake:
      'Salary alone does not exempt a worker from overtime. They must also pass the FLSA duties test for executive, administrative, or professional roles.',
    seeAlso: ['exempt-employee', 'flsa'],
    sources: [
      { title: 'DOL FLSA Overtime Pay', url: 'https://www.dol.gov/agencies/whd/overtime', year: 2024 },
    ],
  },
  {
    slug: 'flsa',
    term: 'FLSA (Fair Labor Standards Act)',
    category: 'flsa',
    definition:
      'The 1938 federal law that establishes minimum wage, overtime pay, recordkeeping, and youth employment standards. Enforced by the DOL Wage and Hour Division.',
    seeAlso: ['minimum-wage', 'overtime', 'exempt-employee'],
    sources: [
      { title: 'DOL FLSA', url: 'https://www.dol.gov/agencies/whd/flsa', year: 2024 },
    ],
  },
  {
    slug: 'exempt-employee',
    term: 'Exempt employee',
    aliases: ['salaried exempt', 'white-collar exemption'],
    category: 'flsa',
    definition:
      'A worker not entitled to FLSA overtime because they pass the salary test (paid on a salary basis at or above a DOL threshold) and the duties test (executive, administrative, professional, or outside sales). All other workers are non-exempt.',
    example:
      'The DOL salary threshold was $43,888/year as of July 1, 2024 and was scheduled to rise to $58,656 on January 1, 2025. A federal court vacated the increase in November 2024; the threshold remains at the September 2019 level of $35,568 pending further rulemaking.',
    notMistake:
      'Title alone (e.g. "manager") doesn\'t make a worker exempt — the duties test asks what the worker actually does day to day.',
    seeAlso: ['overtime', 'flsa'],
    sources: [
      { title: 'DOL Fact Sheet #17A', url: 'https://www.dol.gov/agencies/whd/fact-sheets/17a-overtime', year: 2024 },
    ],
  },
  {
    slug: 'tipped-minimum-wage',
    term: 'Tipped minimum wage',
    aliases: ['tip credit', '$2.13 wage'],
    category: 'flsa',
    definition:
      'Under FLSA, employers may pay tipped employees a $2.13/hour cash wage if tips bring total hourly earnings to at least the federal minimum ($7.25). The difference is the "tip credit." Seven states (CA, NV, OR, WA, MN, MT, AK) ban the tip credit entirely; tipped workers there get full state minimum.',
    seeAlso: ['minimum-wage', 'flsa'],
    sources: [
      { title: 'DOL Fact Sheet #15', url: 'https://www.dol.gov/agencies/whd/fact-sheets/15-tipped-employees-flsa', year: 2024 },
    ],
  },
  {
    slug: 'workweek',
    term: 'Workweek',
    category: 'flsa',
    definition:
      'A fixed, recurring 168-hour period (7 consecutive 24-hour days) used to calculate FLSA overtime. The employer chooses when it starts but cannot redefine it to avoid overtime.',
    notMistake:
      'Averaging hours across two workweeks to avoid OT is illegal under FLSA. Each workweek stands alone.',
    seeAlso: ['overtime', 'flsa'],
    sources: [
      { title: 'DOL Fact Sheet #23', url: 'https://www.dol.gov/agencies/whd/fact-sheets/23-flsa-overtime-pay', year: 2024 },
    ],
  },
  {
    slug: 'regular-rate',
    term: 'Regular rate of pay',
    category: 'flsa',
    definition:
      'The hourly equivalent used to compute FLSA overtime — total compensation in a workweek divided by total hours worked, with certain inclusions (non-discretionary bonuses, shift differentials) and exclusions (gifts, true discretionary bonuses).',
    example:
      'A worker earning $20/hour plus a $200 production bonus over 50 hours: regular rate = (1,000 + 200) / 50 = $24/hour. Overtime premium on 10 OT hours = 10 × $24 × 0.5 = $120 extra.',
    seeAlso: ['overtime', 'flsa'],
    sources: [
      { title: 'DOL Fact Sheet #56A', url: 'https://www.dol.gov/agencies/whd/fact-sheets/56a-regular-rate', year: 2024 },
    ],
  },
  {
    slug: 'classification',
    term: 'Worker classification (W-2 vs 1099)',
    aliases: ['independent contractor', 'employee'],
    category: 'flsa',
    definition:
      'A worker is either an "employee" (covered by FLSA, FICA, unemployment) or an "independent contractor" (not). The IRS uses a 3-factor common-law test (behavioral, financial, relationship); DOL uses a six-factor economic-reality test for FLSA.',
    notMistake:
      'Calling a worker a "1099 contractor" doesn\'t make them one — misclassification is a major DOL enforcement target. Penalties include back wages, FICA, FUTA, and state UI taxes.',
    seeAlso: ['flsa'],
    sources: [
      { title: 'DOL Worker Classification', url: 'https://www.dol.gov/agencies/whd/flsa/misclassification', year: 2024 },
      { title: 'IRS Independent Contractor Defined', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/independent-contractor-defined', year: 2024 },
    ],
  },
  {
    slug: 'pay-frequency',
    term: 'Pay frequency',
    aliases: ['biweekly vs semimonthly', 'pay period'],
    category: 'flsa',
    definition:
      'How often wages are paid. FLSA requires "prompt" payment but does not specify frequency; states do. Common cycles: weekly (52 paychecks/yr), biweekly (26), semimonthly (24), monthly (12).',
    example:
      'A $90,000 salary biweekly = $3,461.54/check. Semimonthly = $3,750/check. The employee earns the same annually; the cash-flow timing differs.',
    seeAlso: ['flsa'],
    sources: [
      { title: 'BLS Length of Pay Periods', url: 'https://www.bls.gov/ces/publications/lengthofpayperiods.htm', year: 2024 },
    ],
  },
  {
    slug: 'pto',
    term: 'PTO (Paid Time Off)',
    aliases: ['vacation', 'paid leave'],
    category: 'flsa',
    definition:
      'Employer-provided time off with pay — vacation, personal, or combined PTO. Federal law does not require any paid leave; private-sector PTO is contractual. Employers must follow whatever PTO policy they publish.',
    example:
      'BLS NCS 2024: civilian workers averaged 11 days of paid vacation after 1 year of service, rising to 20 days after 20 years. Roughly 79% of private-industry workers had access to paid vacation.',
    notMistake:
      'Federal law also does not require paid sick leave or paid parental leave (the FMLA mandates only unpaid leave). State and local laws fill many of these gaps.',
    seeAlso: ['flsa'],
    sources: [
      { title: 'BLS National Compensation Survey: Leave Benefits', url: 'https://www.bls.gov/ncs/ebs/benefits/2024/employee-benefits-in-the-united-states-march-2024.pdf', year: 2024 },
    ],
  },

  // === Compensation — 15 ===
  {
    slug: 'base-salary',
    term: 'Base salary',
    aliases: ['fixed pay', 'annual salary'],
    category: 'comp',
    definition:
      'The fixed annual pay an employee earns before bonuses, equity, overtime, or benefits. The single most quoted compensation number — and the most commonly under-reported relative to total comp.',
    example:
      'A software engineer with a $180k base + $30k bonus + $80k RSU vest + $20k 401k match has total comp of $310k but reports "base salary $180k" on most job applications.',
    seeAlso: ['total-comp', 'rsu', 'bonus'],
    sources: [
      { title: 'BLS Wage Definitions', url: 'https://www.bls.gov/ncs/ebs/glossary.htm', year: 2024 },
    ],
  },
  {
    slug: 'total-comp',
    term: 'Total compensation (TC)',
    aliases: ['total comp', 'TC', 'package'],
    category: 'comp',
    definition:
      'The full annual value of base salary + cash bonus + equity vesting + retirement match + perks. Standard in tech offer comparison; less common outside tech because non-cash benefits are harder to value.',
    example:
      'TC = base ($150k) + target bonus ($15k) + RSU vest year-2 ($60k) + 401k match ($7,500) + ESPP discount ($5k) = $237,500.',
    notMistake:
      'TC numbers vary widely by year because new-grad RSU grants concentrate vesting in years 1–2 ("front-loading"). Always compare apples to apples — same vesting year.',
    seeAlso: ['base-salary', 'rsu', 'bonus', '401k-match'],
    sources: [
      { title: 'BLS Employer Costs for Employee Compensation', url: 'https://www.bls.gov/news.release/ecec.toc.htm', year: 2024 },
    ],
  },
  {
    slug: 'bonus',
    term: 'Bonus (target / signing / spot)',
    category: 'comp',
    definition:
      'Variable cash compensation tied to performance, signing, or one-off recognition. Target annual bonus is usually quoted as a percentage of base; signing bonuses are paid up front (often with a clawback if you leave within 12–24 months).',
    example:
      '$200k base × 20% target bonus = $40k expected if performance is on plan. A $50k signing bonus paid month 1 typically vests over 24 months on a pro-rated repayment schedule.',
    seeAlso: ['base-salary', 'total-comp'],
    sources: [
      { title: 'BLS NCS: Incentive Pay Plans', url: 'https://www.bls.gov/ncs/ebs/benefits/2024/employee-benefits-in-the-united-states-march-2024.pdf', year: 2024 },
    ],
  },
  {
    slug: 'rsu',
    term: 'RSU (Restricted Stock Unit)',
    category: 'comp',
    definition:
      'A grant of company shares that vests on a schedule (commonly 4 years with a 1-year cliff). Income tax is owed at vest on the FMV of vested shares; the employer withholds shares to cover payroll tax.',
    example:
      '$400k RSU grant over 4 years = $100k/year at constant share price. If stock doubles, year-3 vest is $200k taxable income that year. If stock halves, vest is $50k.',
    notMistake:
      'RSUs are not restricted stock (RSAs) — RSAs vest into actual shares immediately and use an 83(b) election; RSUs cannot use 83(b).',
    seeAlso: ['iso', 'nso', 'total-comp'],
    sources: [
      { title: 'IRS Topic 427: Stock Options', url: 'https://www.irs.gov/taxtopics/tc427', year: 2024 },
    ],
  },
  {
    slug: 'iso',
    term: 'ISO (Incentive Stock Option)',
    aliases: ['incentive stock option'],
    category: 'comp',
    definition:
      'An employer stock option that, if held long enough, produces long-term capital gains rather than ordinary income at exercise. Exercise can trigger AMT (alternative minimum tax) on the bargain element.',
    example:
      'Strike $10, FMV at exercise $50, sale price $100 (held 2 years from grant + 1 year from exercise) → $90/share LTCG. AMT preference at exercise = ($50 - $10) × shares.',
    seeAlso: ['nso', 'rsu', 'amt'],
    sources: [
      { title: 'IRS Form 3921 / Publication 525', url: 'https://www.irs.gov/forms-pubs/about-form-3921', year: 2024 },
    ],
  },
  {
    slug: 'nso',
    term: 'NSO/NQSO (Non-qualified Stock Option)',
    category: 'comp',
    definition:
      'A stock option taxed as ordinary income on the bargain element at exercise (FMV minus strike). FICA also applies. Most common at private-company hires that aren\'t early enough for ISO eligibility.',
    seeAlso: ['iso', 'rsu'],
    sources: [
      { title: 'IRS Publication 525', url: 'https://www.irs.gov/publications/p525', year: 2024 },
    ],
  },
  {
    slug: '401k-match',
    term: '401(k) employer match',
    aliases: ['retirement match', '401k match'],
    category: 'comp',
    definition:
      'Employer contribution to an employee\'s 401(k), typically structured as "X% match up to Y% of salary" or a "safe harbor" formula. Often subject to a vesting schedule (cliff or graded over 3–5 years).',
    example:
      '"100% match on first 4% of salary" with $150k salary = up to $6,000 employer contribution if employee defers ≥ 4%. 2025 employee deferral limit: $23,500 ($31,000 if age 50+).',
    notMistake:
      'The match counts toward the IRS 415(c) overall limit ($70,000 in 2025) but not the employee deferral limit. Mega-backdoor Roth strategies use this distinction.',
    seeAlso: ['401k-deferral', 'vesting'],
    sources: [
      { title: 'IRS Retirement Topics: Contribution Limits', url: 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-401k-and-profit-sharing-plan-contribution-limits', year: 2025 },
    ],
  },
  {
    slug: '401k-deferral',
    term: '401(k) employee deferral',
    aliases: ['salary deferral', 'pre-tax 401k contribution'],
    category: 'comp',
    definition:
      'The portion of salary an employee chooses to contribute pre-tax to a 401(k). 2025 limit: $23,500 for under-50 (with $7,500 catch-up at age 50+, $11,250 at age 60-63 under SECURE 2.0).',
    example:
      'Maxing out at age 35 with $200k salary: $23,500 deferral reduces 2025 federal taxable income by $23,500. Net pay decline ≈ $16,920 (assuming 28% combined federal+state marginal).',
    seeAlso: ['401k-match', 'roth-401k'],
    sources: [
      { title: 'IRS Notice 2024-80 (2025 retirement plan limits)', url: 'https://www.irs.gov/pub/irs-drop/n-24-80.pdf', year: 2025 },
    ],
  },
  {
    slug: 'roth-401k',
    term: 'Roth 401(k)',
    category: 'comp',
    definition:
      'A 401(k) contribution made post-tax: no upfront deduction, but qualified withdrawals (after age 59½ + 5-year rule) are tax-free. Contribution limit is shared with traditional ($23,500 in 2025).',
    notMistake:
      'Roth 401(k) is different from Roth IRA — the Roth 401(k) has no income limit. High earners blocked from Roth IRA can still fund Roth 401(k).',
    seeAlso: ['401k-deferral', 'roth-ira'],
    sources: [
      { title: 'IRS Roth 401(k) FAQs', url: 'https://www.irs.gov/retirement-plans/roth-comparison-chart', year: 2025 },
    ],
  },
  {
    slug: 'roth-ira',
    term: 'Roth IRA',
    category: 'comp',
    definition:
      'An individual retirement account funded with post-tax dollars; qualified withdrawals are tax-free. 2025 contribution limit $7,000 ($8,000 age 50+). Income phase-outs apply: $150k–$165k single, $236k–$246k MFJ.',
    seeAlso: ['roth-401k', 'magi'],
    sources: [
      { title: 'IRS Publication 590-A', url: 'https://www.irs.gov/publications/p590a', year: 2025 },
    ],
  },
  {
    slug: 'cola',
    term: 'COLA (Cost-of-Living Adjustment)',
    aliases: ['annual raise', 'cost of living raise'],
    category: 'comp',
    definition:
      'A pay increase intended to keep nominal compensation pace with inflation. Some employers tie the COLA to CPI-U; the federal government uses CPI-W for Social Security COLA. Many employers do not give automatic COLAs and instead bundle inflation into merit raises.',
    example:
      '2025 Social Security COLA was 2.5%, based on CPI-W from Q3 2023 → Q3 2024. A typical private-sector merit budget for 2025 was 3.5–4% (including both COLA and performance differentiation).',
    seeAlso: ['cpi-u', 'real-wage'],
    sources: [
      { title: 'SSA COLA Information', url: 'https://www.ssa.gov/cola/', year: 2025 },
      { title: 'BLS CPI-W', url: 'https://www.bls.gov/cpi/factsheets/cpi-urban-wage-clerical-and-clerical-workers.htm', year: 2025 },
    ],
  },
  {
    slug: 'rpp',
    term: 'RPP (Regional Price Parity)',
    aliases: ['regional cost of living'],
    category: 'comp',
    definition:
      'BEA\'s index of regional price levels relative to the national average (US=100). Higher RPP = costlier area. Use to convert nominal to real wages across geographies.',
    example:
      'San Jose MSA RPP ≈ 110.4; Birmingham AL MSA RPP ≈ 91.6. A $150k San Jose salary has the same purchasing power as ~$124k in Birmingham (150,000 × 91.6/110.4).',
    notMistake:
      'RPP is a single index — it does not break down housing vs. groceries. Housing differences specifically are far larger (NYC housing 2.5–3× Birmingham housing) than the RPP suggests.',
    seeAlso: ['real-wage', 'cola', 'cpi-u'],
    sources: [
      { title: 'BEA Regional Price Parities', url: 'https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area', year: 2024 },
    ],
  },
  {
    slug: 'vesting',
    term: 'Vesting',
    aliases: ['vest schedule', 'cliff'],
    category: 'comp',
    definition:
      'The schedule on which equity grants or employer 401(k) contributions become the employee\'s irrevocable property. Common: 4-year vest with 1-year cliff (25% on month 12, then monthly thereafter).',
    example:
      'A 4-year RSU grant of 4,000 shares with 1-year cliff: 0 shares vest months 1–11, 1,000 shares vest at month 12, then 1/48 (≈83 shares) per month for the remaining 36 months.',
    notMistake:
      'Cliff vesting means 100% forfeit if you leave before the cliff hits — even at month 11. Departure timing matters.',
    seeAlso: ['rsu', '401k-match'],
    sources: [
      { title: 'IRS Vesting Rules', url: 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-vesting', year: 2024 },
    ],
  },
  {
    slug: 'fringe-benefits',
    term: 'Fringe benefits',
    aliases: ['benefits', 'non-wage comp'],
    category: 'comp',
    definition:
      'Non-cash compensation: health insurance, retirement contributions, paid leave, life/disability insurance, transit, gym subsidies. BLS measures the employer cost of benefits as part of Total Compensation; for civilian workers in 2024 benefits averaged 31.0% of total compensation.',
    example:
      'Civilian worker total comp Q4 2024: $46.21/hour total = $32.07 wages + $14.14 benefits. Health insurance alone averaged $3.51/hour, retirement another $1.99.',
    seeAlso: ['total-comp', 'pto'],
    sources: [
      { title: 'BLS Employer Costs for Employee Compensation Q4 2024', url: 'https://www.bls.gov/news.release/ecec.t01.htm', year: 2024 },
    ],
  },
  {
    slug: 'compa-ratio',
    term: 'Compa-ratio',
    aliases: ['compensation ratio'],
    category: 'comp',
    definition:
      'An employee\'s pay divided by the midpoint of their salary band. Used in HR comp planning. <1.0 means below midpoint, >1.0 means above. Compa-ratios outside 0.85–1.15 typically trigger review.',
    example:
      'Salary band midpoint $120k. Employee earning $108k → compa-ratio 0.90. Employee earning $135k → 1.125.',
    notMistake:
      'Compa-ratio is calibrated to internal bands, not market data. A "high" 1.15 compa-ratio can still be below market if the band itself is dated.',
    seeAlso: ['base-salary'],
    sources: [
      { title: 'WorldatWork: Total Rewards Glossary', url: 'https://worldatwork.org/about/glossary', year: 2024 },
    ],
  },
];

export const GLOSSARY_BY_SLUG: Map<string, GlossaryEntry> = new Map(
  GLOSSARY.map((e) => [e.slug, e])
);

export const GLOSSARY_BY_CATEGORY: Record<GlossaryCategory, GlossaryEntry[]> = {
  bls: GLOSSARY.filter((e) => e.category === 'bls'),
  irs: GLOSSARY.filter((e) => e.category === 'irs'),
  flsa: GLOSSARY.filter((e) => e.category === 'flsa'),
  comp: GLOSSARY.filter((e) => e.category === 'comp'),
};

export const GLOSSARY_CATEGORY_LABELS: Record<GlossaryCategory, { title: string; description: string }> = {
  bls: {
    title: 'BLS wage statistics',
    description: 'Terms used in BLS Occupational Employment and Wage Statistics publications.',
  },
  irs: {
    title: 'Federal taxes',
    description: 'IRS tax terminology that affects what shows up on your paycheck and Form 1040.',
  },
  flsa: {
    title: 'Labor law (FLSA)',
    description: 'Department of Labor / Fair Labor Standards Act definitions covering minimum wage, overtime, and worker classification.',
  },
  comp: {
    title: 'Compensation packages',
    description: 'Real-world salary, equity, and retirement-benefit terms employees see in offer letters.',
  },
};
