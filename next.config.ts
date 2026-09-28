import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Admin image uploads are stored in Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
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
