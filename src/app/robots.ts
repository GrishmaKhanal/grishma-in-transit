import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";

// The admin path is intentionally NOT listed here (that would advertise it);
// it is protected by auth and sends `X-Robots-Tag: noindex` instead.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: abs("/sitemap.xml"),
  };
}
