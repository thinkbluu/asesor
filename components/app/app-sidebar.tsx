"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
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
  ChevronRight,
  MoreHorizontal,
  Plus,
  Moon,
  Sun,
  Share2,
  User,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { signOutAction } from "@/lib/auth/actions"

type NavItem = {
  name: string
  href: string
  icon: LucideIcon
  soon?: boolean
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
    soon: true,
    subItems: [
      { name: "Campanii", tab: "campanii" },
      { name: "Automatizări", tab: "automatizari" },
      { name: "Promoții", tab: "promotii" },
    ],
  },
]

// Sub secțiunea mono «Salon» — ca în machetă, înainte de Pagina publică și Setări.
const salonNavigation: NavItem[] = [
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
      { name: "Loialitate", tab: "loialitate" },
      { name: "Recenzii Google", tab: "recenzii" },
      { name: "Abonament", tab: "abonament" },
      { name: "Echipă și acces", tab: "echipa" },
      { name: "Securitate", tab: "securitate" },
      { name: "Date și confidențialitate", tab: "date" },
      { name: "Permisiuni", tab: "permisiuni" },
    ],
  },
]

const STORAGE_KEY = "asesor-sidebar-collapsed"

type AppSidebarProps = {
  salonName: string
  userFullName: string
  role: string | null
}

export function AppSidebar({ salonName, userFullName, role }: AppSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [collapsed, setCollapsed] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  // Persist the collapsed choice; theme toggle renders only after mount to
  // avoid a hydration mismatch on the icon.
  useEffect(() => {
    setMounted(true)
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1")
    } catch {
      /* ignore */
    }
  }, [])

  const toggleCollapsed = (next: boolean) => {
    setCollapsed(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
    } catch {
      /* ignore */
    }
  }

  // Staff and receptionists don't get Financiar, Marketing or Setări.
  const isRestricted = role === "staff" || role === "receptionist"
  const visibleNavigation = isRestricted
    ? navigation.filter((item) => !["Financiar", "Marketing"].includes(item.name))
    : navigation
  const visibleSalonNavigation = isRestricted ? [] : salonNavigation

  const displayName = userFullName
  const userInitials = (displayName.trim()[0] ?? "?").toUpperCase()
  const salonInitials = salonName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  const activeTabParam = searchParams.get("tab")

  const isInSection = (item: NavItem) =>
    item.href === "/app"
      ? pathname === "/app"
      : pathname === item.href || pathname.startsWith(item.href + "/")

  const renderNavItem = (item: NavItem, { collapsed: isCollapsed }: { collapsed: boolean }) => {
    const hasSub = !!item.subItems?.length && !isCollapsed
    const sectionActive = isInSection(item)
    const isOpen = hasSub && sectionActive

    return (
      <div key={item.name}>
        <Link
          href={item.href}
          title={isCollapsed ? item.name : undefined}
          aria-current={sectionActive ? "page" : undefined}
          onClick={() => setMoreOpen(false)}
          className={cn(
            "flex items-center gap-2.5 rounded-[5px] text-[12.5px] leading-tight transition-colors",
            isCollapsed ? "justify-center p-2" : "px-2 py-[7px]",
            sectionActive
              ? "bg-[#1C1F21] text-white"
              : "text-[#A6AAAD] hover:bg-white/5 hover:text-white",
          )}
        >
          <item.icon className="size-4 shrink-0" aria-hidden="true" />
          {!isCollapsed && (
            <>
              <span className="truncate">{item.name}</span>
              {item.soon && <small className="ml-auto text-[10px] text-[#64686B]">în curând</small>}
            </>
          )}
        </Link>
        {isOpen && (
          <div className="mt-0.5 space-y-px">
            {item.subItems!.map((sub, idx) => {
              const isFirst = idx === 0
              const subActive =
                sectionActive &&
                (activeTabParam === sub.tab || (!activeTabParam && isFirst))
              return (
                <Link
                  key={sub.tab}
                  href={`${item.href}?tab=${sub.tab}`}
                  aria-current={subActive ? "page" : undefined}
                  className={cn(
                    "block rounded-[5px] py-[5px] pl-[30px] pr-2 text-[12px] leading-tight transition-colors",
                    subActive ? "bg-[#1C1F21] text-white" : "text-[#7E8285] hover:text-white",
                  )}
                >
                  {sub.name}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const themeToggle = (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex w-full items-center gap-2.5 rounded-[5px] px-2 py-[7px] text-[12.5px] text-[#A6AAAD] transition-colors hover:bg-white/5 hover:text-white"
      aria-label={resolvedTheme === "dark" ? "Comută pe mod deschis" : "Comută pe mod întunecat"}
    >
      {resolvedTheme === "dark" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
      <span>{resolvedTheme === "dark" ? "Mod deschis" : "Mod întunecat"}</span>
    </button>
  )

  const userMenuItems = (
    <>
      <DropdownMenuItem asChild>
        <Link href="/app/setari?tab=profil">
          <User className="size-4" aria-hidden="true" /> Profil
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/app/setari?tab=securitate">
          <ShieldCheck className="size-4" aria-hidden="true" /> Securitate
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <form action={signOutAction} className="w-full cursor-pointer">
          <button type="submit" className="flex w-full items-center gap-2">
            <LogOut className="size-4" aria-hidden="true" /> Deconectează-te
          </button>
        </form>
      </DropdownMenuItem>
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar (near-black în ambele teme, ca .app .side) ── */}
      <aside
        data-collapsed={collapsed}
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col bg-[#0B0C0D] text-[#A6AAAD] transition-[width] duration-200 lg:flex",
          collapsed ? "w-14" : "w-[212px]",
        )}
      >
        {/* Brand + comutator colaps */}
        <div className={cn("flex items-center gap-2.5 px-3 pb-1 pt-4", collapsed && "justify-center px-0")}>
          <Link href="/app" className="flex min-w-0 items-center gap-2.5" title={collapsed ? "ASESOR" : undefined}>
            <img
              src="/asesor-logo.png"
              alt=""
              aria-hidden="true"
              className="size-[26px] shrink-0 rounded-full object-cover ring-1 ring-white/20"
            />
            {!collapsed && (
              <span className="text-[12px] font-semibold tracking-[0.2em] text-white">ASESOR</span>
            )}
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={() => toggleCollapsed(true)}
              aria-label="Restrânge meniul"
              className="ml-auto rounded p-1 text-[#64686B] transition-colors hover:text-white"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Salon — nume + comutator temă */}
        <div className={cn("flex items-center gap-2 px-3 pb-1 pt-3", collapsed && "justify-center px-0")}>
          {collapsed ? (
            <span
              className="grid size-7 shrink-0 place-items-center rounded-full bg-[#1C1F21] text-[10px] font-semibold text-white"
              title={salonName}
            >
              {salonInitials || "?"}
            </span>
          ) : (
            <>
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#1C1F21] text-[10px] font-semibold text-white">
                {salonInitials || "?"}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-white" title={salonName}>
                {salonName}
              </span>
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                aria-label={resolvedTheme === "dark" ? "Comută pe mod deschis" : "Comută pe mod întunecat"}
                className="rounded p-1 text-[#64686B] transition-colors hover:text-white"
              >
                {mounted && resolvedTheme === "dark" ? <Sun className="size-3.5" aria-hidden="true" /> : <Moon className="size-3.5" aria-hidden="true" />}
              </button>
            </>
          )}
        </div>

        {/* Navigație */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pt-2" aria-label="Navigare principală">
          {visibleNavigation.map((item) => renderNavItem(item, { collapsed }))}
          {visibleSalonNavigation.length > 0 && (
            <>
              <div className="mono-label px-2 pb-1.5 pt-4 text-[#64686B]" role="presentation">
                Salon
              </div>
              {visibleSalonNavigation.map((item) => renderNavItem(item, { collapsed }))}
            </>
          )}
        </nav>

        {/* Utilizator */}
        <div className="border-t border-white/8 p-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[5px] p-1.5 text-left transition-colors hover:bg-white/5",
                collapsed && "justify-center",
              )}
              aria-label="Meniu utilizator"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#1C1F21] text-[11px] font-semibold text-white">
                {userInitials}
              </span>
              {!collapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-white">{displayName}</span>
                  <span className="block truncate text-[11px] text-[#7E8285]">
                    {role === "owner" ? "Proprietar" : role === "manager" ? "Manager" : role === "receptionist" ? "Recepție" : "Specialist"}
                  </span>
                </span>
              )}
              {!collapsed && <ChevronRight className="size-3.5 shrink-0 text-[#64686B]" aria-hidden="true" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-52">
              {userMenuItems}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Comutator expand când e restrâns */}
        {collapsed && (
          <button
            type="button"
            onClick={() => toggleCollapsed(false)}
            aria-label="Extinde meniul"
            className="absolute -right-3 top-6 grid size-6 place-items-center rounded-full bg-[#1C1F21] text-white shadow"
          >
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </aside>

      {/* ── Mobile: bară de tab-uri jos ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-stretch border-t border-white/8 bg-[#0B0C0D] pb-[env(safe-area-inset-bottom)] text-[#A6AAAD] lg:hidden"
        aria-label="Navigare mobilă"
      >
        <MobileTab href="/app/programari" icon={Calendar} label="Programări" active={pathname.startsWith("/app/programari")} />
        <MobileTab href="/app/clienti" icon={Users} label="Clienți" active={pathname.startsWith("/app/clienti")} />
        {role !== "staff" ? (
          <div className="grid flex-1 place-items-center">
            <Link
              href="/app/programari?nou=1"
              aria-label="Programare nouă"
              className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow"
            >
              <Plus className="size-5" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <MobileTab href="/app" icon={LayoutDashboard} label="Dashboard" active={pathname === "/app"} />
        )}
        <MobileTab href="/app/echipa" icon={UserCog} label="Echipă" active={pathname.startsWith("/app/echipa")} />

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors hover:text-white">
            <MoreHorizontal className="size-5" aria-hidden="true" />
            Mai mult
          </SheetTrigger>
          <SheetContent side="right" className="w-72 border-white/10 bg-[#0B0C0D] text-[#A6AAAD] p-0">
            <SheetHeader className="border-b border-white/8 px-4 py-3 text-left">
              <SheetTitle className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.2em] text-white">
                <img src="/asesor-logo.png" alt="" aria-hidden="true" className="size-[22px] rounded-full object-cover ring-1 ring-white/20" />
                ASESOR
              </SheetTitle>
            </SheetHeader>
            <div className="flex h-[calc(100%-3.25rem)] flex-col overflow-y-auto px-2.5 py-3">
              <div className="space-y-0.5">
                {visibleNavigation.map((item) => renderNavItem(item, { collapsed: false }))}
                {visibleSalonNavigation.length > 0 && (
                  <>
                    <div className="mono-label px-2 pb-1.5 pt-4 text-[#64686B]" role="presentation">
                      Salon
                    </div>
                    {visibleSalonNavigation.map((item) => renderNavItem(item, { collapsed: false }))}
                  </>
                )}
              </div>
              <div className="mt-auto space-y-0.5 border-t border-white/8 pt-3">
                {themeToggle}
                <Link
                  href="/app/setari?tab=profil"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2.5 rounded-[5px] px-2 py-[7px] text-[12.5px] text-[#A6AAAD] transition-colors hover:bg-white/5 hover:text-white"
                >
                  <User className="size-4" aria-hidden="true" /> Profil
                </Link>
                <Link
                  href="/app/setari?tab=securitate"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2.5 rounded-[5px] px-2 py-[7px] text-[12.5px] text-[#A6AAAD] transition-colors hover:bg-white/5 hover:text-white"
                >
                  <ShieldCheck className="size-4" aria-hidden="true" /> Securitate
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-[5px] px-2 py-[7px] text-[12.5px] text-[#A6AAAD] transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <LogOut className="size-4" aria-hidden="true" /> Deconectează-te
                  </button>
                </form>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  )
}

function MobileTab({
  href, icon: Icon, label, active,
}: {
  href: string
  icon: LucideIcon
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
        active ? "text-white" : "hover:text-white",
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
      {label}
    </Link>
  )
}
