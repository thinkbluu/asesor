"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggleSimple } from "@/components/theme-toggle-simple"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Funcționalități", url: "/functionalitati" },
  { name: "Prețuri", url: "/preturi" },
  { name: "Pentru cine", url: "/pentru-cine" },
  { name: "Contact", url: "/contact" },
]

export function TopBar() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState(pathname)

  useEffect(() => {
    setActiveTab(pathname)
  }, [pathname])

  return (
    <div className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <img
            src="/asesor-logo.png"
            alt="ASESOR"
            className="h-8 w-8 rounded-full bg-white object-cover ring-1 ring-black/10 shrink-0"
          />
          <span className="text-lg font-semibold tracking-tight">ASESOR</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 bg-muted/50 backdrop-blur-sm px-1 py-1 rounded-full border border-border/50">
          {navItems.map((item) => {
            const isActive = activeTab === item.url
            return (
              <Link
                key={item.name}
                href={item.url}
                onClick={() => setActiveTab(item.url)}
                className={cn(
                  "relative px-4 py-1.5 text-xs font-medium rounded-full transition-colors",
                  "text-muted-foreground hover:text-foreground",
                  isActive && "text-foreground"
                )}
              >
                {item.name}
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-background rounded-full border border-border shadow-sm -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 35 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggleSimple />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex text-xs h-8">
            <Link href="/login">Autentificare</Link>
          </Button>
          <Button size="sm" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs h-8">
            <Link href="/register">Începe gratuit</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
