"use client"

import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Package, Search, Plus, AlertTriangle, ArrowUpCircle,
  ArrowDownCircle, Edit2, Trash2, Copy, X, ShoppingCart, Link2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ProductView, MovementView, StockStatus, MovementType } from "@/lib/mappers/stocuri"
import { stockStatus, suggestedOrderQuantity, MOVEMENT_LABELS } from "@/lib/mappers/stocuri"
import type { UserMovementType } from "@/lib/validation/stocuri"
import {
  createProductAction,
  updateProductAction,
  deactivateProductAction,
  createMovementAction,
  setProductServiceLinksAction,
} from "@/app/app/stocuri/actions"

// Stocuri view (P8 part 1). Props-driven; the server page decides what the
// current role may see and do:
//   * owner/manager: full CRUD + cost_price + all movement types
//   * receptionist: movements receptie/pierdere/retur only
//   * staff: read-only

type StockRole = "owner" | "manager" | "receptionist" | "staff"

interface ServiceOption {
  id: string
  name: string
}

interface ProductFormState {
  id: string | null
  name: string
  brand: string
  category: string
  sku: string
  unit: string
  minStock: string
  costPrice: string
  retailPrice: string
  supplierName: string
  supplierPhone: string
  supplierEmail: string
  notes: string
  active: boolean
  links: { serviceId: string; quantityPerUse: string }[]
}

const EMPTY_PRODUCT: ProductFormState = {
  id: null, name: "", brand: "", category: "", sku: "", unit: "buc",
  minStock: "0", costPrice: "", retailPrice: "", supplierName: "",
  supplierPhone: "", supplierEmail: "", notes: "", active: true, links: [],
}

const STATUS_META: Record<StockStatus, { label: string; className: string }> = {
  ok: { label: "În stoc", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  low: { label: "Stoc minim", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  out: { label: "Epuizat", className: "bg-red-500/15 text-red-500 border-red-500/30" },
}

const MOVEMENT_BADGE: Record<MovementType, string> = {
  receptie: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  consum: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  ajustare: "bg-slate-500/15 text-slate-600 border-slate-500/30",
  pierdere: "bg-red-500/15 text-red-500 border-red-500/30",
  retur: "bg-amber-500/15 text-amber-600 border-amber-500/30",
}

const lei = (v: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 2 }).format(v)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

export function StocuriView(props: {
  role: StockRole
  products: ProductView[]
  movements: MovementView[]
  services: ServiceOption[]
  loadError: string | null
}) {
  const { role, products, movements, services, loadError } = props
  const canManage = role === "owner" || role === "manager"
  const canAddMovements = role === "owner" || role === "manager" || role === "receptionist"
  const movementTypes: UserMovementType[] =
    role === "owner" || role === "manager"
      ? ["receptie", "ajustare", "pierdere", "retur"]
      : ["receptie", "pierdere", "retur"]

  const [tab, setTab] = useState<"produse" | "miscari" | "de-comandat">("produse")
  const [search, setSearch] = useState("")
  const [pending, startTransition] = useTransition()

  const [productDialog, setProductDialog] = useState<ProductFormState | null>(null)
  const [movementDialog, setMovementDialog] = useState<{ type: UserMovementType; productId: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductView | null>(null)

  const productNameById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      [p.name, p.brand, p.category, p.sku, p.supplierName]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    )
  }, [products, search])

  const lowStock = useMemo(
    () => products.filter((p) => p.active && stockStatus(p.stock, p.minStock) !== "ok"),
    [products],
  )

  const bySupplier = useMemo(() => {
    const map = new Map<string, ProductView[]>()
    for (const p of lowStock) {
      const key = p.supplierName?.trim() || "Fără furnizor"
      const list = map.get(key) ?? []
      list.push(p)
      map.set(key, list)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "ro"))
  }, [lowStock])

  function buildOrderText(supplier: string, items: ProductView[]): string {
    const lines = items.map(
      (p) => `• ${p.name}${p.brand ? ` (${p.brand})` : ""} — ${suggestedOrderQuantity(p.stock, p.minStock)} ${p.unit}`,
    )
    return `Bună ziua, aș dori să comand:\n${lines.join("\n")}\nMulțumesc!`
  }

  function copyOrder(supplier: string, items: ProductView[]) {
    const text = buildOrderText(supplier, items)
    navigator.clipboard.writeText(text).then(
      () => toast.success("Textul comenzii a fost copiat."),
      () => toast.error("Copierea a eșuat."),
    )
  }

  function saveProduct(form: ProductFormState) {
    const payload = {
      name: form.name,
      brand: form.brand,
      category: form.category,
      sku: form.sku,
      unit: form.unit,
      minStock: form.minStock === "" ? 0 : Number(form.minStock),
      costPrice: form.costPrice === "" ? undefined : Number(form.costPrice),
      retailPrice: form.retailPrice === "" ? undefined : Number(form.retailPrice),
      supplierName: form.supplierName,
      supplierPhone: form.supplierPhone,
      supplierEmail: form.supplierEmail,
      notes: form.notes,
      active: form.active,
    }
    startTransition(async () => {
      const res = form.id
        ? await updateProductAction({ id: form.id, ...payload })
        : await createProductAction(payload)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      const productId = form.id ?? res.data?.id ?? null
      if (productId) {
        const links = form.links
          .filter((l) => l.serviceId && Number(l.quantityPerUse) > 0)
          .map((l) => ({ serviceId: l.serviceId, quantityPerUse: Number(l.quantityPerUse) }))
        const linkRes = await setProductServiceLinksAction({ productId, links })
        if (!linkRes.ok) toast.error(linkRes.error)
      }
      toast.success(form.id ? "Produs actualizat." : "Produs adăugat.")
      setProductDialog(null)
    })
  }

  function submitMovement(type: UserMovementType, productId: string, fields: Record<string, string>) {
    startTransition(async () => {
      const res = await createMovementAction({
        type,
        productId,
        quantity: fields.quantity === "" ? undefined : Number(fields.quantity),
        countedStock: fields.countedStock === "" ? undefined : Number(fields.countedStock),
        invoiceNumber: fields.invoiceNumber ?? "",
        note: fields.note ?? "",
      })
      if (res.ok) {
        toast.success("Mișcare înregistrată.")
        setMovementDialog(null)
      } else {
        toast.error(res.error)
      }
    })
  }

  function deactivate(p: ProductView) {
    startTransition(async () => {
      const res = await deactivateProductAction({ id: p.id })
      if (res.ok) toast.success(`"${p.name}" a fost dezactivat.`)
      else toast.error(res.error)
      setDeleteTarget(null)
    })
  }

  if (loadError) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">
          {loadError}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stocuri</h1>
          <p className="text-sm text-muted-foreground">
            {canManage ? "Gestionează produsele și mișcările de stoc." : canAddMovements ? "Înregistrează mișcări de stoc." : "Vizualizare stoc (doar citire)."}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setProductDialog({ ...EMPTY_PRODUCT })} disabled={pending}>
            <Plus className="mr-2 size-4" /> Produs nou
          </Button>
        )}
      </div>

      <div className="mb-4 flex gap-1 rounded-lg border bg-muted/40 p-1 text-sm">
        {(
          [
            ["produse", "Produse", products.length],
            ["miscari", "Mișcări", movements.length],
            ["de-comandat", "De comandat", lowStock.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 font-medium transition-colors",
              tab === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label} <span className="text-xs text-muted-foreground">({count})</span>
          </button>
        ))}
      </div>

      {tab === "produse" && (
        <ProductsTab
          canManage={canManage}
          items={filtered}
          search={search}
          onSearch={setSearch}
          pending={pending}
          onEdit={(p) =>
            setProductDialog({
              id: p.id, name: p.name, brand: p.brand ?? "", category: p.category ?? "",
              sku: p.sku ?? "", unit: p.unit, minStock: String(p.minStock),
              costPrice: p.costPrice != null ? String(p.costPrice) : "",
              retailPrice: p.retailPrice != null ? String(p.retailPrice) : "",
              supplierName: p.supplierName ?? "", supplierPhone: p.supplierPhone ?? "",
              supplierEmail: p.supplierEmail ?? "", notes: p.notes ?? "", active: p.active,
              links: p.linkedServices.map((l) => ({ serviceId: l.serviceId, quantityPerUse: String(l.quantityPerUse) })),
            })
          }
          onMovement={(productId, type) => setMovementDialog({ productId, type })}
          onDelete={setDeleteTarget}
        />
      )}

      {tab === "miscari" && (
        <MovementsTab movements={movements} productNameById={productNameById} />
      )}

      {tab === "de-comandat" && (
        <OrderTab groups={bySupplier} onCopy={copyOrder} />
      )}

      {/* Product form (owner/manager) */}
      <Dialog open={productDialog !== null} onOpenChange={(open) => !open && setProductDialog(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {productDialog && (
            <ProductForm
              form={productDialog}
              services={services}
              canSeeCost={canManage}
              pending={pending}
              onChange={setProductDialog}
              onSubmit={saveProduct}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Movement dialog */}
      <Dialog open={movementDialog !== null} onOpenChange={(open) => !open && setMovementDialog(null)}>
        <DialogContent className="max-w-md">
          {movementDialog && (
            <MovementForm
              type={movementDialog.type}
              product={productNameById.get(movementDialog.productId)}
              types={movementTypes}
              pending={pending}
              onTypeChange={(type) => setMovementDialog({ ...movementDialog, type })}
              onSubmit={submitMovement}
              onCancel={() => setMovementDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate confirm */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dezactivezi produsul?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget && `"${deleteTarget.name}" va fi dezactivat. Istoricul mișcărilor rămâne intact.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Anulează</Button>
            <Button variant="destructive" disabled={pending} onClick={() => deleteTarget && deactivate(deleteTarget)}>
              Dezactivează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ------------------------------------------------------------
// Tabs
// ------------------------------------------------------------

function ProductsTab(props: {
  canManage: boolean
  items: ProductView[]
  search: string
  onSearch: (v: string) => void
  pending: boolean
  onEdit: (p: ProductView) => void
  onMovement: (productId: string, type: UserMovementType) => void
  onDelete: (p: ProductView) => void
}) {
  const { canManage, items, search, onSearch, pending, onEdit, onMovement, onDelete } = props
  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Caută produs, brand, furnizor…" className="pl-9" />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produs</TableHead>
              <TableHead>Stoc</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right">Achiziție</TableHead>}
              <TableHead className="text-right">Vânzare</TableHead>
              <TableHead>Furnizor</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="py-10 text-center text-sm text-muted-foreground">
                  Niciun produs{search ? " pentru căutarea curentă" : ""}.
                </TableCell>
              </TableRow>
            )}
            {items.map((p) => {
              const status = stockStatus(p.stock, p.minStock)
              return (
                <TableRow key={p.id} className={cn(!p.active && "opacity-50")}>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {[p.brand, p.category, p.sku].filter(Boolean).join(" · ") || "—"}
                      {p.linkedServices.length > 0 && (
                        <span className="ml-1 inline-flex items-center gap-0.5 text-blue-600">
                          <Link2 className="size-3" />
                          {p.linkedServices.length} serv.
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {p.stock} {p.unit}
                    <div className="text-xs text-muted-foreground">min: {p.minStock}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_META[status].className}>
                      {STATUS_META[status].label}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right tabular-nums">
                      {p.costPrice != null ? lei(p.costPrice) : "—"}
                    </TableCell>
                  )}
                  <TableCell className="text-right tabular-nums">
                    {p.retailPrice != null ? lei(p.retailPrice) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{p.supplierName || "—"}</TableCell>
                  <TableCell>
                    {canManage ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Editează" disabled={pending} onClick={() => onEdit(p)}>
                          <Edit2 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Dezactivează" disabled={pending} onClick={() => onDelete(p)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="block text-right text-xs text-muted-foreground">doar citire</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function MovementsTab(props: {
  movements: MovementView[]
  productNameById: Map<string, ProductView>
}) {
  const { movements, productNameById } = props
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tip</TableHead>
            <TableHead>Produs</TableHead>
            <TableHead className="text-right">Cantitate</TableHead>
            <TableHead>Detalii</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                Nicio mișcare înregistrată.
              </TableCell>
            </TableRow>
          )}
          {movements.map((m) => {
            const product = productNameById.get(m.productId)
            return (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap text-sm">{fmtDate(m.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={MOVEMENT_BADGE[m.type]}>
                    {MOVEMENT_LABELS[m.type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{product?.name || m.productName || "Produs șters"}</TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  <span className={cn("inline-flex items-center gap-1", m.quantity >= 0 ? "text-emerald-600" : "text-red-500")}>
                    {m.quantity >= 0 ? <ArrowUpCircle className="size-3.5" /> : <ArrowDownCircle className="size-3.5" />}
                    {m.quantity > 0 ? "+" : ""}{m.quantity} {m.unit}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {m.invoiceNumber && <div>Factură: {m.invoiceNumber}</div>}
                  {m.note && <div>{m.note}</div>}
                  {m.appointmentId && (
                    <a
                      href={`/app/programari?date=${m.appointmentStartAt ? m.appointmentStartAt.slice(0, 10) : ""}`}
                      className="text-blue-600 hover:underline"
                    >
                      Vezi programarea
                    </a>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function OrderTab(props: {
  groups: [string, ProductView[]][]
  onCopy: (supplier: string, items: ProductView[]) => void
}) {
  const { groups, onCopy } = props
  if (groups.length === 0) {
    return (
      <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
        Totul este în stoc. Nimic de comandat.
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {groups.map(([supplier, items]) => (
        <div key={supplier} className="rounded-lg border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-muted-foreground" />
              <span className="font-medium">{supplier}</span>
              <span className="text-xs text-muted-foreground">({items.length} produse)</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => onCopy(supplier, items)}>
              <Copy className="mr-2 size-3.5" /> Copiază comanda
            </Button>
          </div>
          <ul className="divide-y">
            {items.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span className="font-medium">{p.name}</span>
                  {p.brand && <span className="text-muted-foreground"> · {p.brand}</span>}
                </div>
                <div className="text-right">
                  <span className="tabular-nums">{suggestedOrderQuantity(p.stock, p.minStock)} {p.unit}</span>
                  <div className="text-xs text-muted-foreground">stoc: {p.stock} / min: {p.minStock}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

// ------------------------------------------------------------
// Forms
// ------------------------------------------------------------

function ProductForm(props: {
  form: ProductFormState
  services: ServiceOption[]
  canSeeCost: boolean
  pending: boolean
  onChange: (f: ProductFormState) => void
  onSubmit: (f: ProductFormState) => void
}) {
  const { form, services, canSeeCost, pending, onChange, onSubmit } = props
  const set = (patch: Partial<ProductFormState>) => onChange({ ...form, ...patch })
  const linkedIds = new Set(form.links.map((l) => l.serviceId))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle>{form.id ? "Editează produsul" : "Produs nou"}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="p-name">Nume *</Label>
          <Input id="p-name" value={form.name} onChange={(e) => set({ name: e.target.value })} required maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-brand">Brand</Label>
          <Input id="p-brand" value={form.brand} onChange={(e) => set({ brand: e.target.value })} maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-cat">Categorie</Label>
          <Input id="p-cat" value={form.category} onChange={(e) => set({ category: e.target.value })} maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-sku">Cod (SKU)</Label>
          <Input id="p-sku" value={form.sku} onChange={(e) => set({ sku: e.target.value })} maxLength={60} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-unit">Unitate *</Label>
          <Input id="p-unit" value={form.unit} onChange={(e) => set({ unit: e.target.value })} required maxLength={20} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-min">Stoc minim</Label>
          <Input id="p-min" type="number" min="0" step="0.001" value={form.minStock} onChange={(e) => set({ minStock: e.target.value })} />
        </div>
        {canSeeCost && (
          <div className="space-y-1.5">
            <Label htmlFor="p-cost">Preț achiziție (RON)</Label>
            <Input id="p-cost" type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => set({ costPrice: e.target.value })} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="p-retail">Preț vânzare (RON)</Label>
          <Input id="p-retail" type="number" min="0" step="0.01" value={form.retailPrice} onChange={(e) => set({ retailPrice: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-sup">Furnizor</Label>
          <Input id="p-sup" value={form.supplierName} onChange={(e) => set({ supplierName: e.target.value })} maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-phone">Telefon furnizor</Label>
          <Input id="p-phone" value={form.supplierPhone} onChange={(e) => set({ supplierPhone: e.target.value })} maxLength={40} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-email">Email furnizor</Label>
          <Input id="p-email" type="email" value={form.supplierEmail} onChange={(e) => set({ supplierEmail: e.target.value })} maxLength={120} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="p-notes">Note</Label>
          <Textarea id="p-notes" value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} maxLength={1000} />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Switch id="p-active" checked={form.active} onCheckedChange={(v) => set({ active: v })} />
          <Label htmlFor="p-active">Activ</Label>
        </div>
      </div>

      {/* Service links: quantity per use */}
      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Produs folosit în servicii</span>
          <Select
            value=""
            onValueChange={(serviceId) =>
              set({ links: [...form.links, { serviceId, quantityPerUse: "1" }] })
            }
          >
            <SelectTrigger className="w-56"><SelectValue placeholder="Adaugă serviciu…" /></SelectTrigger>
            <SelectContent>
              {services.filter((s) => !linkedIds.has(s.id)).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {form.links.length === 0 && (
          <p className="text-xs text-muted-foreground">
            La finalizarea unei programări cu aceste servicii, stocul scade automat.
          </p>
        )}
        {form.links.map((link, i) => (
          <div key={link.serviceId} className="flex items-center gap-2 text-sm">
            <span className="flex-1 truncate">{services.find((s) => s.id === link.serviceId)?.name ?? "—"}</span>
            <Input
              type="number" min="0.001" step="0.001" className="w-24"
              value={link.quantityPerUse}
              onChange={(e) => {
                const links = [...form.links]
                links[i] = { ...links[i], quantityPerUse: e.target.value }
                set({ links })
              }}
            />
            <Button
              type="button" variant="ghost" size="icon" className="size-8"
              onClick={() => set({ links: form.links.filter((_, j) => j !== i) })}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Se salvează…" : form.id ? "Salvează" : "Adaugă produsul"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function MovementForm(props: {
  type: UserMovementType
  product: ProductView | undefined
  types: UserMovementType[]
  pending: boolean
  onTypeChange: (t: UserMovementType) => void
  onSubmit: (type: UserMovementType, productId: string, fields: Record<string, string>) => void
  onCancel: () => void
}) {
  const { type, product, types, pending, onTypeChange, onSubmit, onCancel } = props
  const [quantity, setQuantity] = useState("")
  const [countedStock, setCountedStock] = useState(product ? String(product.stock) : "")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [note, setNote] = useState("")

  if (!product) return null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(type, product.id, { quantity, countedStock, invoiceNumber, note })
      }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Package className="size-4" /> {MOVEMENT_LABELS[type]}
        </DialogTitle>
      </DialogHeader>

      <div className="rounded-lg border p-3 text-sm">
        <div className="font-medium">{product.name}</div>
        <div className="text-muted-foreground">
          Stoc curent: {product.stock} {product.unit} · min: {product.minStock}
        </div>
      </div>

      {types.length > 1 && (
        <div className="space-y-1.5">
          <Label>Tip mișcare</Label>
          <Select value={type} onValueChange={(v) => onTypeChange(v as UserMovementType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {types.map((t) => (
                <SelectItem key={t} value={t}>{MOVEMENT_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === "receptie" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="m-qty">Cantitate primită *</Label>
            <Input id="m-qty" type="number" min="0" step="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-inv">Număr factură</Label>
            <Input id="m-inv" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} maxLength={60} />
          </div>
        </div>
      )}

      {type === "ajustare" && (
        <div className="space-y-1.5">
          <Label htmlFor="m-counted">Cantitate countată (inventar) *</Label>
          <Input id="m-counted" type="number" min="0" step="0.001" value={countedStock} onChange={(e) => setCountedStock(e.target.value)} required autoFocus />
          <p className="text-xs text-muted-foreground">
            Diferența față de stocul curent se salvează automat ca mișcare semnată.
          </p>
        </div>
      )}

      {(type === "pierdere" || type === "retur") && (
        <div className="space-y-1.5">
          <Label htmlFor="m-qty-out">Cantitate *</Label>
          <Input id="m-qty-out" type="number" min="0" step="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} required autoFocus />
          <p className="text-xs text-muted-foreground">
            {type === "pierdere" ? "Stocul scade." : "Marfă returnată furnizorului — stocul scade."}
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="m-note">Notă</Label>
        <Input id="m-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </div>

      <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700">
        <AlertTriangle className="size-3.5 shrink-0" />
        Stocul se modifică doar prin mișcări — istoricul rămâne complet.
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          Anulează
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Se salvează…" : "Înregistrează"}
        </Button>
      </div>
    </form>
  )
}
