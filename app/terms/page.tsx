import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for SalaryByCity.",
};

export default function TermsPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: March 25, 2026</p>

      <p>
        Welcome to SalaryByCity. By accessing or using our website at salarybycity.com, you agree to be bound by these
        Terms of Service. If you do not agree to these terms, please do not use our website.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Use of the Website</h2>
      <p>
        SalaryByCity provides salary data, wage statistics, and occupation comparisons for informational and educational
        purposes only. You may use the website for personal, non-commercial purposes. The information provided should
        not be the sole basis for employment or compensation decisions.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Accuracy of Information</h2>
      <p>
        While we strive to provide accurate and up-to-date information, we make no warranties or representations
        regarding the completeness, accuracy, or reliability of any content on this website. The data presented is
        sourced from publicly available datasets, including the U.S. Bureau of Labor Statistics. Users should
        independently verify any information before making decisions based on it.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Intellectual Property</h2>
      <p>
        The content, design, and layout of this website are the property of SalaryByCity and are protected by copyright
        and other intellectual property laws. You may not reproduce, distribute, or create derivative works from any
        content on this website without our prior written consent.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Third-Party Links and Advertising</h2>
      <p>
        Our website may contain links to third-party websites and display advertisements served by third-party ad
        networks, including Google AdSense. We are not responsible for the content, privacy practices, or terms of
        any third-party websites. Your interactions with third-party advertisers are solely between you and the
        advertiser.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, SalaryByCity shall not be liable for any indirect, incidental, special,
        consequential, or punitive damages arising out of or related to your use of the website. This includes, but
        is not limited to, damages for loss of profits, data, or other intangible losses.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Changes to These Terms</h2>
      <p>
        We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon
        posting on this page. Your continued use of the website after changes are posted constitutes your acceptance
        of the revised terms.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact Us</h2>
      <p>
        If you have any questions about these Terms of Service, please visit our{" "}
        <a href="/contact" className="text-blue-600 hover:underline">contact page</a>.
      </p>
    </article>
  );
}
