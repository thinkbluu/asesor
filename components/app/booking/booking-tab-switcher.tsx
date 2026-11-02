"use client"

import { useSearchParams } from "next/navigation"
import { OverviewTab } from "@/components/app/booking/overview-tab"
import { BrandingTab } from "@/components/app/booking/branding-tab"
import { PreviewTab } from "@/components/app/booking/preview-tab"
import type { SetariBranding } from "@/lib/mappers/setari"

interface Props {
  branding: SetariBranding
}

export function BookingTabSwitcher({ branding }: Props) {
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") ?? "overview"

  if (tab === "branding") return <BrandingTab initial={branding} />
  if (tab === "preview") return <PreviewTab />
  return <OverviewTab />
}
