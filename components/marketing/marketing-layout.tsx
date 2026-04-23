import React from "react"
import { TopBar } from "@/components/marketing/top-bar"
import { SiteFooter } from "@/components/marketing/site-footer"

interface MarketingLayoutProps {
  children: React.ReactNode
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="pt-14">
        {children}
      </div>
      <SiteFooter />
    </div>
  )
}
