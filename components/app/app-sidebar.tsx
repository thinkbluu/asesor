"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  Package,
  PieChart,
  Megaphone,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Moon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useClerk, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Programări", href: "/app/programari", icon: Calendar },
  { name: "Clienți", href: "/app/clienti", icon: Users },
  { name: "Echipă", href: "/app/echipa", icon: UserCog },
  { name: "Stocuri", href: "/app/stocuri", icon: Package },
  { name: "Financiar", href: "/app/financiar", icon: PieChart },
  { name: "Marketing", href: "/app/marketing", icon: Megaphone },
]

const bottomNavigation = [
  { name: "Setări", href: "/app/setari", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const { signOut } = useClerk()
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  const firstName = user?.firstName ?? ""
  const lastName = user?.lastName ?? ""
  const email = user?.primaryEmailAddress?.emailAddress ?? ""
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || email
  const salonName = (user?.publicMetadata?.salon_name as string) || "Salonul meu"
  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : (email[0] ?? "?").toUpperCase()

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-md bg-sidebar p-2 text-sidebar-foreground lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <Link href="/app" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary">
                <span className="text-sm font-semibold text-sidebar-primary-foreground">A</span>
              </div>
              <span className="text-lg font-semibold">ASESOR</span>
            </Link>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary">
              <span className="text-sm font-semibold text-sidebar-primary-foreground">A</span>
            </div>
          )}
          <button
            type="button"
            className={cn("hidden lg:block", collapsed && "absolute -right-3 top-5")}
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-accent">
              <ChevronLeft
                className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
              />
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom navigation */}
        <div className="border-t border-sidebar-border px-2 py-4">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}

          <div className="mt-4 border-t border-sidebar-border pt-4">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2",
                collapsed && "justify-center"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
                <span className="text-sm font-medium">{initials}</span>
              </div>
              {!collapsed && (
                <div className="flex-1 truncate">
                  <p className="truncate text-sm font-medium">{salonName}</p>
                  <p className="truncate text-xs text-sidebar-foreground/60">{displayName}</p>
                </div>
              )}
            </div>
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className={cn(
                  "flex items-center gap-2 mt-2 px-3 py-2 rounded-lg transition-colors hover:bg-sidebar-accent w-full",
                  collapsed ? "justify-center" : "justify-between"
                )}
              >
                {!collapsed && (
                  <div className="flex items-center gap-2 text-sidebar-foreground/70">
                    <Moon className="h-4 w-4" />
                    <span className="text-sm">Mod întunecat</span>
                  </div>
                )}
                {collapsed && <Moon className="h-4 w-4 text-sidebar-foreground/70" />}
                {!collapsed && (
                  <div className={`relative h-5 w-9 rounded-full transition-colors ${resolvedTheme === "dark" ? "bg-accent" : "bg-sidebar-accent"}`}>
                    <div
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-sidebar-foreground transition-transform ${
                        resolvedTheme === "dark" ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                )}
              </button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className={cn(
                "mt-2 w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Deconectare</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
