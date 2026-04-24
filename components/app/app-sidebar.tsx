"use client"

import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
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
  ChevronDown,
  Menu,
  Moon,
  Share2,
  type LucideIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { useState, useEffect } from "react"
import { useClerk, useUser } from "@clerk/nextjs"

type NavItem = {
  name: string
  href: string
  icon: LucideIcon
  subItems?: { name: string; tab: string }[]
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  {
    name: "Programări",
    href: "/app/programari",
    icon: Calendar,
    subItems: [
      { name: "Zi", tab: "day" },
      { name: "Săptămână", tab: "week" },
      { name: "Lună", tab: "month" },
      { name: "Listă", tab: "list" },
    ],
  },
  { name: "Clienți", href: "/app/clienti", icon: Users },
  { name: "Echipă", href: "/app/echipa", icon: UserCog },
  {
    name: "Stocuri",
    href: "/app/stocuri",
    icon: Package,
    subItems: [
      { name: "Produse", tab: "produse" },
      { name: "Mișcări stoc", tab: "miscari" },
    ],
  },
  {
    name: "Financiar",
    href: "/app/financiar",
    icon: PieChart,
    subItems: [
      { name: "Dashboard", tab: "dashboard" },
      { name: "Tranzacții", tab: "tranzactii" },
      { name: "Cheltuieli", tab: "cheltuieli" },
      { name: "Rapoarte", tab: "rapoarte" },
      { name: "Închidere zi", tab: "inchidere" },
    ],
  },
  {
    name: "Marketing",
    href: "/app/marketing",
    icon: Megaphone,
    subItems: [
      { name: "Campanii", tab: "campanii" },
      { name: "Automatizări", tab: "automatizari" },
      { name: "Promoții", tab: "promotii" },
    ],
  },
  {
    name: "Pagina publică",
    href: "/app/booking",
    icon: Share2,
    subItems: [
      { name: "Vizualizare", tab: "overview" },
      { name: "Personalizare", tab: "branding" },
      { name: "Previzualizare", tab: "preview" },
    ],
  },
]

const bottomNavigation: NavItem[] = [
  {
    name: "Setări",
    href: "/app/setari",
    icon: Settings,
    subItems: [
      { name: "Profil salon", tab: "profil" },
      { name: "Program de lucru", tab: "program" },
      { name: "Servicii", tab: "servicii" },
      { name: "Politici", tab: "politici" },
      { name: "Notificări", tab: "notificari" },
      { name: "Abonament", tab: "abonament" },
      { name: "Permisiuni", tab: "permisiuni" },
    ],
  },
]

const STORAGE_KEY = "asesor-sidebar-expanded"

export function AppSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({})
  const { resolvedTheme, setTheme } = useTheme()
  const { signOut } = useClerk()
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === "object") setExpandedMap(parsed)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedMap))
    } catch {
      /* ignore */
    }
  }, [expandedMap, mounted])

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  const toggleExpanded = (href: string, isInSection: boolean) => {
    // Active section is always open per spec — chevron click is a no-op.
    if (isInSection) return
    setExpandedMap((prev) => (prev[href] ? {} : { [href]: true }))
  }

  const firstName = user?.firstName ?? ""
  const lastName = user?.lastName ?? ""
  const email = user?.primaryEmailAddress?.emailAddress ?? ""
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || email
  const salonName = (user?.publicMetadata?.salon_name as string) || "Salonul meu"
  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : (email[0] ?? "?").toUpperCase()

  const activeTabParam = searchParams.get("tab")

  const renderNavItem = (item: NavItem) => {
    const hasSub = !!item.subItems?.length
    const isExactActive = pathname === item.href
    // "In section" = pathname starts with href, but Dashboard ("/app") must not match everything.
    const isInSection =
      item.href === "/app"
        ? pathname === "/app"
        : pathname === item.href || pathname.startsWith(item.href + "/")
    const isOpen = !collapsed && hasSub && (expandedMap[item.href] === true || isInSection)

    return (
      <Collapsible key={item.name} open={isOpen}>
        <div
          className={cn(
            "flex items-center rounded-lg transition-colors",
            isExactActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 text-sm font-medium py-2.5",
              collapsed ? "w-full justify-center px-0" : hasSub ? "flex-1 pl-3" : "flex-1 px-3",
            )}
            title={collapsed ? item.name : undefined}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.name}</span>}
          </Link>
          {hasSub && !collapsed && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleExpanded(item.href, isInSection)
              }}
              className={cn(
                "flex items-center justify-center px-2 py-2 mr-1 rounded-md transition-colors",
                isInSection
                  ? "cursor-default opacity-70"
                  : "hover:bg-sidebar-accent/50",
              )}
              aria-label={isOpen ? `Colapsează ${item.name}` : `Extinde ${item.name}`}
              aria-expanded={isOpen}
              disabled={isInSection}
            >
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
              />
            </button>
          )}
        </div>
        {hasSub && !collapsed && (
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-none">
            <div className="mt-1 space-y-0.5">
              {item.subItems!.map((sub, idx) => {
                const isFirst = idx === 0
                // Highlight exact tab match, OR the default (first) sub-item when no ?tab is set
                // and we're inside this section.
                const subActive =
                  isInSection &&
                  (activeTabParam === sub.tab || (!activeTabParam && isFirst))
                return (
                  <Link
                    key={sub.tab}
                    href={`${item.href}?tab=${sub.tab}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block text-sm py-1.5 pl-10 pr-3 rounded-lg transition-colors",
                      subActive
                        ? "bg-sidebar-primary/20 text-sidebar-primary-foreground font-medium"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {sub.name}
                  </Link>
                )
              })}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    )
  }

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
          {navigation.map(renderNavItem)}
        </nav>

        {/* Bottom navigation */}
        <div className="border-t border-sidebar-border px-2 py-4">
          {bottomNavigation.map(renderNavItem)}

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
