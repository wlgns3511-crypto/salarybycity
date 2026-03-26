import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_NAME = "SalaryByCity";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://salarybycity.com";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - US Salary & Wage Data by Occupation and City`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Explore salary data for 800+ occupations across 400+ US metro areas. Compare wages, see percentile ranges, and find the highest-paying cities for your career.",
  metadataBase: new URL(SITE_URL),
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-7T3FHVSS7T" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-7T3FHVSS7T');` }} />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5724806562146685"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.className} antialiased bg-white text-slate-900 min-h-screen flex flex-col`}>
        <header className="border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-blue-700">
              {SITE_NAME}
            </a>
            <nav className="flex gap-6 text-sm">
              <a href="/jobs" className="hover:text-blue-600">Occupations</a>
              <a href="/locations" className="hover:text-blue-600">Locations</a>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">{children}</main>
        <footer className="border-t border-slate-200 mt-16">
          <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-slate-500">
            <p>
              Data from the U.S. Bureau of Labor Statistics, Occupational
              Employment and Wage Statistics (OEWS) program.
            </p>
            <p className="mt-2">
              <a href="/about" className="hover:text-blue-600">About</a>
              {" | "}
              <a href="/privacy" className="hover:text-blue-600">Privacy</a>
              {" | "}
              <a href="/terms" className="hover:text-blue-600">Terms</a>
              {" | "}
              <a href="/contact" className="hover:text-blue-600">Contact</a>
            </p>
            <p className="mt-1">
              &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
