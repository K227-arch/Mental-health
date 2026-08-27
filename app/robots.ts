import type { MetadataRoute } from "next";

const siteUrl = "https://www.selfcare.ug";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private/authenticated areas and API endpoints out of the index.
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/counsellor",
          "/counsellor/",
          "/admin",
          "/admin/",
          "/settings",
          "/auth/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
