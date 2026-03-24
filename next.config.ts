import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Using standalone mode for Cloudflare/Vercel deployment
  // SSG pages are pre-rendered at build time via generateStaticParams
  trailingSlash: true,
};

export default nextConfig;
