import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About SalaryByCity",
  description: "Learn about SalaryByCity, our mission, and data sources.",
  alternates: { canonical: "/about/" },
  openGraph: { url: "/about/" },
};

export default function AboutPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">About SalaryByCity</h1>

      <p>
        SalaryByCity is a free resource that helps job seekers, HR professionals, and researchers explore salary and
        wage data across the United States. We make it easy to compare compensation for 800+ occupations across 400+
        metropolitan areas, all in one place.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Our Mission</h2>
      <p>
        We believe salary transparency empowers better career decisions. Our goal is to provide accurate, accessible,
        and up-to-date wage information so everyone can understand what jobs pay in different parts of the country.
        Whether you are negotiating a raise, considering a relocation, or researching labor market trends, SalaryByCity
        is here to help.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Data Sources</h2>
      <p>
        All salary data on this site comes from the <strong>U.S. Bureau of Labor Statistics (BLS)</strong>,
        specifically the Occupational Employment and Wage Statistics (OEWS) program. The OEWS program surveys
        approximately 1.1 million business establishments each year to produce employment and wage estimates for over
        800 occupations. We update our data as new releases become available to ensure accuracy.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact Us</h2>
      <p>
        Have questions or feedback? Visit our <a href="/contact" className="text-blue-600 hover:underline">Contact page</a> to get in touch.
      </p>
    </article>
  );
}
