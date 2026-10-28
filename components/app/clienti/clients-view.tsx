"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Download, Plus, Search, Users } from "lucide-react"
import { TAG_COLORS, getInitials, formatDate } from "@/lib/clienti-format"
import type { ClientListItem } from "@/lib/mappers/clienti"
import type { ClientListPage } from "@/lib/data/clienti"
import { CLIENT_SOURCES, CLIENT_TAGS } from "@/lib/validation/clienti"
import {
  listClientsAction,
  createClientAction,
  importClientsAction,
} from "@/app/app/clienti/actions"
import { ImportClientsDialog } from "@/components/app/clienti/import-clients-dialog"
import { NewClientDialog } from "@/components/app/clienti/new-client-dialog"

const LAST_VISIT_OPTIONS = [
  { value: "toate", label: "Oricând" },
  { value: "7", label: "Ultimele 7 zile" },
  { value: "30", label: "Ultimele 30 de zile" },
  { value: "90", label: "Ultimele 90 de zile" },
] as const

const SORT_OPTIONS = [
  { value: "nume", label: "Nume" },
  { value: "ultima_vizita", label: "Ultima vizită" },
  { value: "vizite", label: "Nr. vizite" },
  { value: "total_cheltuit", label: "Total cheltuit" },
] as const

export function ClientsView({
  role,
  initialList,
  initialError,
}: {
  role: string
  initialList: ClientListPage
  initialError: string | null
}) {
  const [list, setList] = useState<ClientListPage>(initialList)
  const [error, setError] = useState<string | null>(initialError)
  const [search, setSearch] = useState("")
  const [tag, setTag] = useState<string>("toate")
  const [source, setSource] = useState<string>("toate")
  const [lastVisit, setLastVisit] = useState<string>("toate")
  const [sort, setSort] = useState<string>("nume")
  const [page, setPage] = useState(1)
  const [pending, startTransition] = useTransition()
  const [showNew, setShowNew] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const canCreate = role === "owner" || role === "manager" || role === "receptionist"
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize))

  const refetch = (next: { page?: number }) => {
    startTransition(async () => {
      const result = await listClientsAction({
        search,
        tag,
        source,
        lastVisit,
        sort,
        page: next.page ?? 1,
      })
      if (result.ok) {
        setList(result.data)
        setError(null)
      } else {
        setError(result.error)
      }
    })
  }

  const applyFilters = () => {
    setPage(1)
    refetch({ page: 1 })
  }

  const summary = useMemo(() => {
    const withVisits = list.items.filter((c) => c.totalVisits > 0).length
    return { shown: list.items.length, total: list.total, withVisits }
  }, [list])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Clienti</h1>
          <p className="text-sm text-muted-foreground">
            {summary.total} clienți înregistrați
          </p>
        </div>
        {canCreate && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Download className="h-4 w-4 mr-1.5" /> Importă CSV
            </Button>
            <Button size="sm" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Clientă nouă
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="client-search" className="sr-only">Caută</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="client-search"
                placeholder="Caută după nume sau telefon…"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>
          </div>
          <Select value={tag} onValueChange={(v) => { setTag(v); setPage(1); startTransition(async () => {
            const r = await listClientsAction({ search, tag: v, source, lastVisit, sort, page: 1 })
            if (r.ok) setList(r.data); else setError(r.error)
          }) }}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="toate">Toate etichetele</SelectItem>
              {CLIENT_TAGS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={(v) => { setSource(v); setPage(1); startTransition(async () => {
            const r = await listClientsAction({ search, tag, source: v, lastVisit, sort, page: 1 })
            if (r.ok) setList(r.data); else setError(r.error)
          }) }}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="toate">Toate sursele</SelectItem>
              {CLIENT_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={lastVisit} onValueChange={(v) => { setLastVisit(v); setPage(1); startTransition(async () => {
            const r = await listClientsAction({ search, tag, source, lastVisit: v, sort, page: 1 })
            if (r.ok) setList(r.data); else setError(r.error)
          }) }}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LAST_VISIT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => { setSort(v); startTransition(async () => {
            const r = await listClientsAction({ search, tag, source, lastVisit, sort: v, page: 1 })
            if (r.ok) setList(r.data); else setError(r.error)
          }) }}>
            <SelectTrigger className="w-[150px]" aria-label="Sortează"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}

      {/* List */}
      {list.items.length === 0 && !pending ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-foreground">Nicio clientă găsită</p>
            <p className="text-sm text-muted-foreground mt-1">
              {list.total === 0 ? "Adaugă prima clientă sau importă din CSV." : "Încearcă alt filtru."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {list.items.map((c) => <ClientRow key={c.id} c={c} />)}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {list.page} din {totalPages} ({list.total} clienți)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm" disabled={list.page <= 1 || pending}
              onClick={() => { const p = list.page - 1; setPage(p); refetch({ page: p }) }}
            >
              Anterioara
            </Button>
            <Button
              variant="outline" size="sm" disabled={list.page >= totalPages || pending}
              onClick={() => { const p = list.page + 1; setPage(p); refetch({ page: p }) }}
            >
              Următoarea
            </Button>
          </div>
        </div>
      )}

      <NewClientDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => { setShowNew(false); refetch({ page: 1 }) }}
      />
      <ImportClientsDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => { setShowImport(false); refetch({ page: 1 }) }}
      />
    </div>
  )
}

function ClientRow({ c }: { c: ClientListItem }) {
  return (
    <li>
      <Link
        href={`/app/clienti/${c.id}`}
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {getInitials(c.firstName, c.lastName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {c.lastName} {c.firstName}
            </p>
            {c.hasAllergies && (
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-600"
                title="Clienta are alergii înregistrate — vezi fișa protejată"
                aria-label="Are alergii înregistrate"
              >
                <AlertTriangle className="h-3 w-3" />
              </span>
            )}
            {c.tags.map((t) => (
              <Badge key={t} variant="outline" className={`text-[10px] px-1.5 ${TAG_COLORS[t] ?? ""}`}>
                {t}
              </Badge>
            ))}
          </div>
          <p className="truncate text-xs text-muted-foreground">{c.phone}</p>
        </div>
        <div className="hidden sm:block text-right text-xs text-muted-foreground shrink-0">
          <p>{c.totalVisits} vizite</p>
          <p>{c.lastVisitAt ? formatDate(c.lastVisitAt) : "fără vizite"}</p>
        </div>
        <div className="hidden md:block text-right text-xs shrink-0 w-24">
          <p className="font-medium text-foreground">
            {c.totalSpent.toLocaleString("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 })}
          </p>
          {c.balanceDue > 0 && <p className="text-red-600">restanță</p>}
        </div>
      </Link>
    </li>
  )
}
