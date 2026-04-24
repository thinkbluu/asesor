"use client"

import { useSearchParams } from "next/navigation"
import { OverviewTab } from "@/components/app/booking/overview-tab"
import { BrandingTab } from "@/components/app/booking/branding-tab"
import { PreviewTab } from "@/components/app/booking/preview-tab"

export default function BookingPage() {
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") ?? "overview"

  if (tab === "branding") return <BrandingTab />
  if (tab === "preview") return <PreviewTab />
  return <OverviewTab />
}
