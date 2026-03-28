import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Using standalone mode for Cloudflare/Vercel deployment
  // SSG pages are pre-rendered at build time via generateStaticParams
  trailingSlash: true,
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/**": ["./data/**"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
