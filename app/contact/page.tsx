import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the SalaryByCity team.",
};

export default function ContactPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Contact Us</h1>

      <p>
        We would love to hear from you. Whether you have a question about our data, a suggestion for improvement, or
        want to report an issue, feel free to reach out.
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Get in Touch</h2>
        <p className="mb-2">
          <strong>Email:</strong>{" "}
          <a href="mailto:contact@salarybycity.com" className="text-blue-600 hover:underline">
            contact@salarybycity.com
          </a>
        </p>
        <p className="text-sm text-slate-500 mt-4">
          We typically respond within 1-2 business days.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-3">Feedback</h2>
      <p>
        Your feedback helps us improve SalaryByCity for everyone. If you notice any data discrepancies or have ideas
        for new features, please let us know.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Data Corrections</h2>
      <p>
        All our data comes from the U.S. Bureau of Labor Statistics. If you believe there is an error in the data
        displayed on our site, please email us with the specific page URL and a description of the issue.
      </p>
    </article>
  );
}
