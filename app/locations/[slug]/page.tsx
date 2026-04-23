import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAreaBySlug,
  getAllMetroAreas,
  getTopPayingJobs,
  getWagesByArea,
} from "@/lib/db";
import { formatSalary, shortAreaName, getDataYear } from "@/lib/format";
import { JobComparisonTable } from "@/components/SalaryTable";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { breadcrumbSchema } from "@/lib/schema";
import { AnswerHero } from "@/components/upgrades/AnswerHero";
import { TrustBlock } from "@/components/upgrades/TrustBlock";
import { InsightBlock } from "@/components/upgrades/InsightBlock";
import { DecisionNext } from "@/components/upgrades/DecisionNext";
import { getLocationInsights } from "@/lib/insights";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  // Pre-build top areas; rest served via ISR
  const areas = getAllMetroAreas();
  return areas.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) return {};
  const year = getDataYear();
  const cityName = shortAreaName(area.area_title);

  return {
    title: `Salaries in ${cityName} - ${year} Wage Data`,
    description: `Explore salary data for all occupations in ${cityName}. Find the highest paying jobs and compare wages.`,
    alternates: { canonical: `/locations/${slug}/` },
    openGraph: { url: `/locations/${slug}/` },
  };
}

export default async function LocationDetailPage({ params }: Props) {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) notFound();

  const topJobs = getTopPayingJobs(area.area_code, 20);
  // Top 20 already shown above, no need for duplicate large table
  const cityName = shortAreaName(area.area_title);
  const year = getDataYear();

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Locations", url: "/locations/" },
    { name: cityName, url: `/locations/${slug}/` },
  ];

  return (
    <div>
      <Breadcrumb
        items={breadcrumbs.map((b) => ({ label: b.name, href: b.url }))}
      />

      <AnswerHero
        title={`Salaries in ${cityName}`}
        subtitle={area.area_title}
        tagline={`Live ${year} wage data from the US Bureau of Labor Statistics for ${cityName}, covering all occupations and percentile bands. Use it to benchmark a job offer, plan a relocation, or estimate household income before fixed costs.`}
        badges={[
          { label: `BLS ${year}`, tone: "indigo" as const },
          ...(topJobs.length > 0 ? [{ label: `${topJobs.length} occupations`, tone: "slate" as const }] : []),
        ]}
        alternatives={[]}
      />

      <TrustBlock
        sources={[
          {
            name: "BLS OEWS",
            url: "https://www.bls.gov/oes/",
          },
          {
            name: "BLS Area Definitions",
            url: "https://www.bls.gov/oes/current/msa_def.htm",
          },
          {
            name: "Census ACS Income",
            url: "https://www.census.gov/topics/income-poverty/income.html",
          },
          {
            name: "BEA Personal Income",
            url: "https://www.bea.gov/data/income-saving/personal-income-by-state",
          },
          {
            name: "IRS SOI Tax Stats",
            url: "https://www.irs.gov/statistics/soi-tax-stats-individual-income-tax-statistics",
          },
        ]}
        updated={`BLS OEWS ${year}, reviewed April 2026`}
      />

      <InsightBlock entityName={cityName} insights={getLocationInsights(cityName, topJobs, year)} />

      {topJobs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">
            Top 20 Highest Paying Jobs in {cityName}
          </h2>
          <JobComparisonTable rows={topJobs} areaSlug={slug} />
        </section>
      )}

      {/* Why this matters — US household income context */}
      <section className="mb-8" data-upgrade="why-it-matters">
        <h2 className="text-xl font-bold mb-3">
          Why salary data for {cityName} matters
        </h2>
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700 leading-relaxed space-y-3">
          <p>
            Pay alone doesn&apos;t tell you whether a city is affordable. The
            same {formatSalary(80000)} salary buys very different lifestyles in
            San Francisco, Cleveland, or Austin. The right question for {cityName}
            is &ldquo;what does this pay actually let me afford here&rdquo;
            &mdash; which means pairing wage data with local cost of living,
            housing prices, and state &amp; local tax burden.
          </p>
          <p>
            BLS publishes the Occupational Employment and Wage Statistics (OEWS)
            every year, broken down by metro area and occupation code (SOC). The
            10th, 25th, 50th (median), 75th, and 90th percentile bands tell you
            where you sit relative to others in the same job &mdash; the median
            is usually a more honest benchmark than the mean, which gets pulled
            up by very high earners.
          </p>
          <p>
            For relocation decisions, also factor in the federal SALT deduction
            cap of $10,000 (IRS Publication 530), which can hit hard in
            high-tax metros. A nominal raise that pushes you across a state
            border may shrink less than the headline number suggests.
          </p>
          <p className="text-sm text-slate-500">
            BLS data lags by roughly 12&ndash;18 months. {cityName}&apos;s {year}
            figures reflect the most recent complete OEWS release, not real-time
            market wages.
          </p>
        </div>
      </section>

      <DecisionNext
        cards={[
          {
            title: `Cost of living in ${cityName}`,
            blurb: `See whether the salary numbers above actually go far in this metro \u2014 housing, groceries, utilities, and transportation.`,
            href: `https://costbycity.com`,
            cta: `Open CostByCity`,
            tone: "indigo" as const,
          },
          {
            title: `Take-home pay calculator`,
            blurb: `Convert these gross BLS figures into net pay after federal, state, and FICA withholding.`,
            href: `https://netpaypeek.com`,
            cta: `Open NetPayPeek`,
            tone: "emerald" as const,
          },
          {
            title: `Property tax in this metro`,
            blurb: `Median property tax bills affect the housing line of any salary-vs-cost decision.`,
            href: `https://propertytaxpeek.com`,
            cta: `Open PropertyTaxPeek`,
            tone: "amber" as const,
          },
        ]}
      />

      <AdSlot id="location-mid" />


      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema(breadcrumbs)),
        }}
      />
    </div>
  );
}
