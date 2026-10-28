import type { MetadataRoute } from "next"
import { SITE } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/app/*", "/booking/manage", "/booking/manage/*", "/feedback", "/feedback/*", "/invite", "/invite/*", "/auth", "/auth/*"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
