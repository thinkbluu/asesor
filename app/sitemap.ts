import type { MetadataRoute } from "next"
import { SITE } from "@/lib/site"

// Marketing + legal pages only. App, booking-manage, feedback, invite and
// auth routes are disallowed in robots.ts and must never appear here.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url
  const routes: { path: string; priority: number; changeFrequency: "monthly" | "yearly" }[] = [
    { path: "", priority: 1, changeFrequency: "monthly" },
    { path: "/functionalitati", priority: 0.9, changeFrequency: "monthly" },
    { path: "/preturi", priority: 0.9, changeFrequency: "monthly" },
    { path: "/pentru-cine", priority: 0.8, changeFrequency: "monthly" },
    { path: "/despre", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/dpa", priority: 0.3, changeFrequency: "yearly" },
    { path: "/cookies", priority: 0.2, changeFrequency: "yearly" },
    { path: "/subprocessors", priority: 0.2, changeFrequency: "yearly" },
  ]

  return routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
