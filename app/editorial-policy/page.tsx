import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description: "Editorial standards and source-labeling policy for SalaryByCity.",
  alternates: { canonical: "/editorial-policy/" },
  openGraph: { url: "/editorial-policy/" },
};

export default function EditorialPolicyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
      <h1>Editorial Policy</h1>
      <p>
        SalaryByCity publishes occupation and metro salary pages from Bureau of Labor Statistics
        wage releases. We label the data vintage directly and do not rename older source data with
        a newer year.
      </p>
      <h2>How we review pages</h2>
      <p>
        We review metadata, visible freshness labels, and source references together so the page
        title, description, and on-page source vintage stay aligned.
      </p>
    </article>
  );
}
