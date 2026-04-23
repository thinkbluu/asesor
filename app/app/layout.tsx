"use client"

import React from "react"
import { AppSidebar } from "@/components/app/app-sidebar"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30">
        <AppSidebar />
        <div className="lg:pl-64 transition-all duration-300">
          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
