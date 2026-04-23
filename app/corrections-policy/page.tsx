import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corrections Policy",
  description: "How SalaryByCity reviews and applies corrections.",
  alternates: { canonical: "/corrections-policy/" },
  openGraph: { url: "/corrections-policy/" },
};

export default function CorrectionsPolicyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
      <h1>Corrections Policy</h1>
      <p>
        If you spot a salary figure or label that conflicts with the source release, send the URL
        and source reference through the contact page. Verified issues are corrected on-page and in
        structured data together.
      </p>
    </article>
  );
}
