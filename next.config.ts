import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  experimental: {
    // Cache the RSC payload for dynamic routes during client-side back-nav
    // so dashboard ↔ contacts ↔ campaigns revisits don't re-execute the page
    // server component within the stale window.
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
