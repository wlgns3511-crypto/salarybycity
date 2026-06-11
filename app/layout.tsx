import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UpgradeAnalytics } from "@/components/upgrades/UpgradeAnalytics";
import RelatedSites from "@/components/RelatedSites";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const SITE_NAME = "SalaryByCity";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://salarybycity.com";

export const metadata: Metadata = {
  title: {
    // Bing CTR harvest (2026-06-11): home carries ~89% of the site's Bing
    // impressions (1,437/6mo @ pos 6.6, 2.1% CTR) and the query class is
    // comparison-intent ("salary comparison by city", "BLS salary data").
    // Answer-first compare verb + the real source (BLS OEWS) replaces the
    // brand-first generic. 58c.
    default: `Compare Salaries by City & Occupation (BLS) | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Explore salary data for 800+ occupations across 400+ US metro areas. Compare wages, see percentile ranges, and find the highest-paying cities for your career.",
  metadataBase: new URL(SITE_URL),
  // HCU 2026-04-25 — /es/ killed (zero clicks ever, 5-locale relic).
  alternates: {
    languages: {
      en: `${SITE_URL}/`,
      "x-default": `${SITE_URL}/`,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  other: { "google-adsense-account": "ca-pub-5724806562146685" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemaGraph = [
    {
      "@type": "WebSite",
      name: "SalaryByCity",
      url: SITE_URL,
      description: "Explore salary data for 800+ occupations across 400+ US metro areas. Compare wages, see percentile ranges, and find the highest-paying cities for your career.",
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/search/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: "SalaryByCity",
      url: SITE_URL,
      description: "Salary data and methodology for U.S. occupations and metro areas.",
              "parentOrganization": {
                "@type": "Organization",
                "name": "DataPeek Research Network",
                "url": "https://datapeekfacts.com"
              }
            },
  ];

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-BS7CD7RF8N" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-BS7CD7RF8N');` }} />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5724806562146685"
          crossOrigin="anonymous"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": schemaGraph,
        }) }} />
      </head>
      <body className={`${inter.className} antialiased bg-white text-slate-900 min-h-screen flex flex-col`}>
        <UpgradeAnalytics />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-600 focus:border focus:rounded">Skip to content</a>
        <header className="border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-blue-700">
              {SITE_NAME}
            </a>
            <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <a href="/jobs/" className="hover:text-blue-600">Occupations</a>
              <a href="/state/" className="hover:text-blue-600">States</a>
              <a href="/tools/col-calculator/" className="hover:text-blue-600">COL calculator</a>
              <a href="/glossary/" className="hover:text-blue-600">Glossary</a>
            </nav>
          </div>
        </header>
        <main id="main-content" className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">{children}</main>
        <footer className="border-t border-slate-200 mt-16">
          <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-slate-500">
            <p>
              Built with public data from the U.S. Bureau of Labor Statistics, Occupational
              Employment and Wage Statistics (OEWS) program.
            </p>
            <p className="mt-2">
              <a href="/about/" className="hover:text-blue-600">About</a>
              {" | "}
              <a href="/methodology/" className="hover:text-blue-600">Methodology</a>
              {" | "}
              <a href="/privacy/" className="hover:text-blue-600">Privacy</a>
              {" | "}
              <a href="/terms/" className="hover:text-blue-600">Terms</a>
              {" | "}
              <a href="/disclaimer/" className="hover:text-blue-600">Disclaimer</a>
              {" | "}
              <a href="/editorial-policy/" className="hover:text-blue-600">Editorial Policy</a>
              {" | "}
              <a href="/corrections-policy/" className="hover:text-blue-600">Corrections</a>
              {" | "}
              <a href="/contact/" className="hover:text-blue-600">Contact</a>
            </p>
            <RelatedSites currentSite="SalaryByCity" accentClass="hover:text-blue-600" label="Keep Exploring" />
            <p className="mt-3 text-xs italic text-slate-400">Helping job seekers and employers benchmark salaries across the country.</p>
            <p className="mt-1">
              &copy; {new Date().getFullYear()} {SITE_NAME} &mdash; Free public data tool.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
