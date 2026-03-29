import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for SalaryByCity.",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: March 25, 2026</p>

      <p>
        SalaryByCity (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website salarybycity.com. This
        page informs you of our policies regarding the collection, use, and disclosure of personal information when
        you use our website.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Information We Collect</h2>
      <p>
        We do not require you to create an account or provide personal information to use our website. However, we
        may automatically collect certain information when you visit, including your IP address, browser type,
        operating system, referring URLs, and pages viewed. This information is collected through server logs and
        analytics tools.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Cookies and Tracking Technologies</h2>
      <p>
        Our website uses cookies and similar tracking technologies to improve your browsing experience and to analyze
        site traffic. Cookies are small data files stored on your device. You can instruct your browser to refuse all
        cookies or to indicate when a cookie is being sent. However, some features of the site may not function
        properly without cookies.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Google AdSense</h2>
      <p>
        We use Google AdSense to display advertisements on our website. Google AdSense may use cookies and web
        beacons to serve ads based on your prior visits to our website or other websites on the internet. Google uses
        the DoubleClick cookie to enable it and its partners to serve ads based on your visit to our site and/or
        other sites on the internet. You may opt out of personalized advertising by visiting{" "}
        <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
          Google Ads Settings
        </a>.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Third-Party Services</h2>
      <p>
        We may use third-party services such as Google Analytics to monitor and analyze web traffic. These services
        may collect information sent by your browser as part of a web page request, such as cookies or your IP
        address. Their use of this information is governed by their respective privacy policies.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Data Security</h2>
      <p>
        We take reasonable measures to protect the information collected through our website. However, no method of
        transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute
        security.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Children&apos;s Privacy</h2>
      <p>
        Our website is not directed at children under the age of 13. We do not knowingly collect personal information
        from children under 13. If you are a parent or guardian and believe your child has provided us with personal
        information, please contact us so we can take appropriate action.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Changes to This Policy</h2>
      <p>
        We may update this privacy policy from time to time. Any changes will be posted on this page with an updated
        revision date. We encourage you to review this policy periodically.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact Us</h2>
      <p>
        If you have any questions about this privacy policy, please visit our{" "}
        <a href="/contact" className="text-blue-600 hover:underline">Contact page</a>.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Part of DataPeek Facts Network</h2>
      <p>
        SalaryByCity is part of the{" "}
        <a href="https://datapeekfacts.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
          DataPeek Facts
        </a>{" "}
        network of free US data tools. For general inquiries about our data network, privacy practices, or partnership
        opportunities, please contact the DataPeek Facts team at{" "}
        <a href="mailto:datapeekfacts@gmail.com" className="text-blue-600 hover:underline">
          datapeekfacts@gmail.com
        </a>
        . You can also visit the{" "}
        <a href="https://datapeekfacts.com/privacy/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
          DataPeek Facts Privacy Policy
        </a>{" "}
        for network-wide privacy information.
      </p>
    </article>
  );
}
