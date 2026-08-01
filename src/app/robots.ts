import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://betweenussupport.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/circle", "/profile", "/admin", "/onboarding"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
