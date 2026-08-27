import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the production Docker image
  output: "standalone",
  // Allows Next.js dev server to accept requests from your custom domain
  allowedDevOrigins: ["sunvolt.root2tech.com", "http://100.122.208.22:3000/"],
  // Product images may be hosted on external CDNs when added by URL
  // (Alibaba supplier listings, solarhousebd.com live links).
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sc04.alicdn.com",
        pathname: "/kf/**",
      },
      {
        protocol: "https",
        hostname: "solarhousebd.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
  // Ensure Server Actions work properly in standalone builds
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
