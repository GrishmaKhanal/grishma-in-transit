import type { NextConfig } from "next";

// Sent with every response. A full script CSP is left out on purpose: Next.js's inline
// bootstrap scripts would need nonces, which turns every page dynamic. These are the
// ones that cost nothing and close the common holes.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000" }, // HTTPS only, 2 years
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" }, // no clickjacking via iframes
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // AVIF first (about 20% smaller than WebP), WebP for browsers without it.
  images: { formats: ["image/avif", "image/webp"] },
  experimental: {
    // Admin image uploads go through a Server Action; 4 MB image + multipart overhead.
    serverActions: { bodySizeLimit: "4200kb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/projects", destination: "/work", permanent: true },
      { source: "/projects/:slug", destination: "/work", permanent: true },
      { source: "/notes", destination: "/blog", permanent: true },
      { source: "/writing", destination: "/blog", permanent: true },
      { source: "/feed.xml", destination: "/blog/rss.xml", permanent: true },
    ];
  },
};

export default nextConfig;
