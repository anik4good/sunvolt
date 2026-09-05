import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the production Docker image
  output: "standalone",
  // Allows Next.js dev server to accept requests from your custom domain
  allowedDevOrigins: ["sunvolt.root2tech.com", "http://100.122.208.22:3000/"],
  // Product images may be hosted on any external CDN when added by URL.
  // Only the single admin can set product image URLs (product form /
  // API), so the optimizer's usual "malicious URL" concern doesn't
  // apply — and supplier CDNs keep multiplying hostnames (Alibaba
  // alone uses sc04.alicdn.com/kf/…, s.alicdn.com/@sc04/kf/…, …).
  // HTTPS-only; local /api/media/... paths are unaffected by this.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Ensure Server Actions work properly in standalone builds.
  // 10 MB lets a maximal (5 MB cap) uncompressed image reach the upload
  // action's own validation — client-side compression in
  // lib/compress-image.ts normally keeps uploads far below this.
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
