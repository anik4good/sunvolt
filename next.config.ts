import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the production Docker image
  output: "standalone",
  // Allows Next.js dev server to accept requests from your custom domain
  allowedDevOrigins: ["sunvolt.root2tech.com", "http://100.122.208.22:3000/"],
  // Product images may be hosted on the Alibaba CDN when added by URL.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sc04.alicdn.com",
        pathname: "/kf/**",
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
