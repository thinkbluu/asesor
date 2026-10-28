"use client"

import { useState, useMemo } from "react"
import { Toaster, toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  GripVertical,
  Globe,
  X,
  Scissors,
  Sparkles,
  Hand,
  Eye,
  Flower,
  Waves,
  Star,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SetariCategory, SetariService } from "@/lib/mappers/setari"
import {
  upsertSetariServiceAction,
  deleteSetariServiceAction,
  upsertSetariCategoryAction,
  deleteSetariCategoryAction,
} from "@/app/app/setari/actions"

// ── Types ─────────────────────────────────────────────────────────────

interface Props {
  categories: SetariCategory[]
  services: SetariService[]
  staff: { id: string; name: string }[]
  products: { id: string; name: string }[]
}

// ── Constants ─────────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  Scissors,
  Sparkles,
  Hand,
  Eye,
  Flower,
  Waves,
  Star,
  MoreHorizontal,
}

const COLOR_OPTIONS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#6b7280", // gray
]

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180]

// ── Empty modal state ─────────────────────────────────────────────────

const emptyService = (): SetariService => ({
  id: "",
  name: "",
  categoryId: null,
  duration: 60,
  price: 0,
  description: "",
  products: [],
  staff: [],
  color: COLOR_OPTIONS[0],
  onlineBooking: true,
  active: true,
})

const emptyCategory = (): SetariCategory => ({
  id: "",
  name: "",
  icon: "Star",
  color: COLOR_OPTIONS[0],
})

// ── Component ─────────────────────────────────────────────────────────
// Iconițele și culorile (categorie + serviciu) sunt UI-only — schema nu are
// coloane pentru ele; se salvează doar datele cu coloane (docs/data-pattern.md).

export function SettingsServicii({ categories: initialCategories, services: initialServices, staff, products }: Props) {
  const [services, setServices] = useState<SetariService[]>(initialServices)
  const [categories, setCategories] = useState<SetariCategory[]>(initialCategories)
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("all")
  const [saving, setSaving] = useState(false)

  // Service modal
  const [serviceModal, setServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<SetariService>(emptyService())
  const [isNewService, setIsNewService] = useState(true)

  // Category modal
  const [catModal, setCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<SetariCategory>(emptyCategory())
  const [isNewCat, setIsNewCat] = useState(true)

  // Filtered services
  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
      const matchCat = filterCat === "all" || s.categoryId === filterCat
      return matchSearch && matchCat
    })
  }, [services, search, filterCat])

  // Group by category (services without a category go under „Fără categorie")
  const grouped = useMemo(() => {
    const map: Record<string, SetariService[]> = {}
    for (const cat of categories) {
      const items = filtered.filter((s) => s.categoryId === cat.id)
      if (items.length > 0) map[cat.id] = items
    }
    const orphans = filtered.filter((s) => !s.categoryId || !categories.some((c) => c.id === s.categoryId))
    if (orphans.length > 0) map["none"] = orphans
    return map
  }, [filtered, categories])

  // ── Service modal handlers ─────────────────────────────────────────

  const openNewService = () => {
    setEditingService({ ...emptyService(), categoryId: categories[0]?.id ?? null })
    setIsNewService(true)
    setServiceModal(true)
  }

  const openEditService = (s: SetariService) => {
    setEditingService({ ...s, products: s.products.map((p) => ({ ...p })), staff: [...s.staff] })
    setIsNewService(false)
    setServiceModal(true)
  }

  const saveService = async () => {
    if (saving) return
    if (!editingService.name.trim() || editingService.price <= 0) return
    setSaving(true)
    try {
      const res = await upsertSetariServiceAction({
        id: editingService.id || undefined,
        categoryId: editingService.categoryId,
        name: editingService.name,
        description: editingService.description,
        durationMin: editingService.duration,
        bufferMin: 0,
        price: editingService.price,
        priceFrom: false,
        onlineBookable: editingService.onlineBooking,
        active: editingService.active,
        staffIds: editingService.staff,
        products: editingService.products
          .filter((p) => p.productId)
          .map((p) => ({ productId: p.productId, quantityPerUse: Number(p.quantity) || 1 })),
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      const savedService: SetariService = { ...editingService, id: res.data.id }
      if (isNewService) {
        setServices((prev) => [...prev, savedService])
      } else {
        setServices((prev) => prev.map((s) => (s.id === savedService.id ? savedService : s)))
      }
      toast.success(isNewService ? "Serviciu adăugat." : "Serviciu salvat.")
      setServiceModal(false)
    } catch {
      toast.error("Conexiune eșuată. Încearcă din nou.")
    } finally {
      setSaving(false)
    }
  }

  const deleteService = async (id: string) => {
    const res = await deleteSetariServiceAction({ id })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    setServices((prev) => prev.filter((s) => s.id !== id))
    toast.success("Serviciu șters.")
  }

  const toggleActive = async (id: string) => {
    const svc = services.find((s) => s.id === id)
    if (!svc) return
    const next = !svc.active
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: next } : s)))
    const res = await upsertSetariServiceAction({
      id: svc.id,
      categoryId: svc.categoryId,
      name: svc.name,
      description: svc.description,
      durationMin: svc.duration,
      bufferMin: 0,
      price: svc.price,
      priceFrom: false,
      onlineBookable: svc.onlineBooking,
      active: next,
      staffIds: svc.staff,
      products: svc.products.map((p) => ({ productId: p.productId, quantityPerUse: Number(p.quantity) || 1 })),
    })
    if (!res.ok) {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: !next } : s)))
      toast.error(res.error)
    }
  }

  // ── Category modal handlers ────────────────────────────────────────

  const openNewCat = () => {
    setEditingCat(emptyCategory())
    setIsNewCat(true)
    setCatModal(true)
  }

  const openEditCat = (c: SetariCategory) => {
    setEditingCat({ ...c })
    setIsNewCat(false)
    setCatModal(true)
  }

  const saveCat = async () => {
    if (saving) return
    if (!editingCat.name.trim()) return
    setSaving(true)
    try {
      const res = await upsertSetariCategoryAction({
        id: editingCat.id || undefined,
        name: editingCat.name,
        icon: editingCat.icon,
        color: editingCat.color,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      if (isNewCat) {
        setCategories((prev) => [...prev, { ...editingCat, id: res.data.id }])
      } else {
        setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? { ...editingCat, id: res.data.id } : c)))
      }
      toast.success(isNewCat ? "Categorie adăugată." : "Categorie salvată.")
      setCatModal(false)
    } catch {
      toast.error("Conexiune eșuată. Încearcă din nou.")
    } finally {
      setSaving(false)
    }
  }

  const deleteCat = async (id: string) => {
    const res = await deleteSetariCategoryAction({ id })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    // Serviciile rămân, devin „Fără categorie" (category_id → null în DB).
    setCategories((prev) => prev.filter((c) => c.id !== id))
    setServices((prev) => prev.map((s) => (s.categoryId === id ? { ...s, categoryId: null } : s)))
    toast.success("Categorie ștearsă.")
  }

  // ── Product links ──────────────────────────────────────────────────
  const addProduct = () => {
    setEditingService((prev) => ({ ...prev, products: [...prev.products, { productId: "", quantity: "1" }] }))
  }
  const updateProduct = (i: number, field: "productId" | "quantity", val: string) => {
    setEditingService((prev) => ({
      ...prev,
      products: prev.products.map((p, idx) => idx === i ? { ...p, [field]: val } : p),
    }))
  }
  const removeProduct = (i: number) => {
    setEditingService((prev) => ({
      ...prev,
      products: prev.products.filter((_, idx) => idx !== i),
    }))
  }

  // ── Staff toggle ───────────────────────────────────────────────────
  const toggleStaff = (staffId: string) => {
    setEditingService((prev) => ({
      ...prev,
      staff: prev.staff.includes(staffId) ? prev.staff.filter((s) => s !== staffId) : [...prev.staff, staffId],
    }))
  }

  return (
    <div className="max-w-5xl space-y-6">
      <Toaster position="top-center" richColors />
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Catalog servicii</h2>
          <p className="text-xs text-muted-foreground">{services.length} servicii în {categories.length} categorii</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openNewCat} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Categorie nouă
          </Button>
          <Button size="sm" onClick={openNewService} className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 text-xs">
            <Plus className="h-3.5 w-3.5" /> Serviciu nou
          </Button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Caută serviciu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm h-9"
          />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
            <SelectValue placeholder="Toate categoriile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate categoriile</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category management strip */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.icon as keyof typeof CATEGORY_ICONS] ?? Star
          return (
            <div
              key={cat.id}
              className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
              <Icon className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{cat.name}</span>
              <button type="button" onClick={() => openEditCat(cat)} className="ml-1 text-muted-foreground hover:text-foreground">
                <Pencil className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => deleteCat(cat.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Service table grouped by category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          Niciun serviciu găsit.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([catId, items]) => {
            const cat = categories.find((c) => c.id === catId)
            const Icon = cat ? CATEGORY_ICONS[cat.icon as keyof typeof CATEGORY_ICONS] ?? Star : Scissors
            return (
              <div key={catId} className="overflow-hidden rounded-xl border border-border">
                {/* Category header */}
                <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat?.color ?? "#6b7280" }} />
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{cat?.name ?? "Fără categorie"}</span>
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                    {items.length}
                  </Badge>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/10 text-xs text-muted-foreground">
                        <th className="w-6 px-3 py-2" />
                        <th className="px-4 py-2 text-left font-medium">Serviciu</th>
                        <th className="px-4 py-2 text-left font-medium">Durată</th>
                        <th className="px-4 py-2 text-left font-medium">Preț</th>
                        <th className="px-4 py-2 text-left font-medium">Personal</th>
                        <th className="px-4 py-2 text-left font-medium">Online</th>
                        <th className="px-4 py-2 text-left font-medium">Status</th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((svc) => (
                        <tr key={svc.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-3 text-muted-foreground/40">
                            <GripVertical className="h-4 w-4 cursor-grab" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: svc.color }} />
                              <span className="font-medium">{svc.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{svc.duration} min</td>
                          <td className="px-4 py-3 font-medium text-accent">{svc.price} RON</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {svc.staff.length > 0 ? (
                              <span>{svc.staff.length} pers.</span>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">Toți</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {svc.onlineBooking ? (
                              <Globe className="h-4 w-4 text-accent" />
                            ) : (
                              <Globe className="h-4 w-4 text-muted-foreground/30" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Switch
                              checked={svc.active}
                              onCheckedChange={() => toggleActive(svc.id)}
                              className="scale-90"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditService(svc)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteService(svc.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── ADD/EDIT SERVICE MODAL ── */}
      <Dialog open={serviceModal} onOpenChange={setServiceModal}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNewService ? "Serviciu nou" : "Editează serviciu"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Name + Category */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nume serviciu <span className="text-destructive">*</span></Label>
                <Input
                  value={editingService.name}
                  onChange={(e) => setEditingService((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ex: Tuns dame"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categorie</Label>
                <Select
                  value={editingService.categoryId ?? "none"}
                  onValueChange={(v) => setEditingService((p) => ({ ...p, categoryId: v === "none" ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Fără categorie</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration + Price */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Durată (minute)</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {DURATION_PRESETS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setEditingService((p) => ({ ...p, duration: d }))}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        editingService.duration === d
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-accent/50"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={editingService.duration}
                  onChange={(e) => setEditingService((p) => ({ ...p, duration: Number(e.target.value) }))}
                  placeholder="Custom"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Preț (RON) <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  value={editingService.price || ""}
                  onChange={(e) => setEditingService((p) => ({ ...p, price: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Descriere <span className="text-xs text-muted-foreground">(opțional)</span></Label>
              <Textarea
                value={editingService.description}
                rows={2}
                onChange={(e) => setEditingService((p) => ({ ...p, description: e.target.value }))}
                placeholder="Detalii despre serviciu..."
              />
            </div>

            {/* Color tag — UI-only */}
            <div className="space-y-1.5">
              <Label>Culoare tag calendar</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditingService((p) => ({ ...p, color: c }))}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-all",
                      editingService.color === c ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Staff */}
            <div className="space-y-1.5">
              <Label>Personal alocat <span className="text-xs text-muted-foreground">(implicit toți)</span></Label>
              {staff.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nu ai angajați încă — adaugă în tab-ul Echipă.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {staff.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleStaff(member.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        editingService.staff.includes(member.id)
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:border-accent/50"
                      )}
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product consumption */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Consum produse</Label>
                <Button variant="ghost" size="sm" onClick={addProduct} className="h-7 gap-1 text-xs" disabled={products.length === 0}>
                  <Plus className="h-3 w-3" /> Adaugă produs
                </Button>
              </div>
              {products.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nu ai produse în stoc — adaugă în modulul Stocuri.</p>
              ) : editingService.products.length === 0 ? (
                <p className="text-xs text-muted-foreground">Niciun produs adăugat.</p>
              ) : (
                <div className="space-y-2">
                  {editingService.products.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Select value={p.productId || "none"} onValueChange={(v) => updateProduct(i, "productId", v === "none" ? "" : v)}>
                        <SelectTrigger className="flex-1 h-8 text-sm">
                          <SelectValue placeholder="Alege produsul" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Alege produsul</SelectItem>
                          {products.map((prod) => (
                            <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Cant."
                        value={p.quantity}
                        onChange={(e) => updateProduct(i, "quantity", e.target.value)}
                        className="w-20 h-8 text-sm"
                      />
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeProduct(i)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Disponibil pentru programare online</p>
                  <p className="text-xs text-muted-foreground">Clienții pot rezerva singuri</p>
                </div>
                <Switch
                  checked={editingService.onlineBooking}
                  onCheckedChange={(v) => setEditingService((p) => ({ ...p, onlineBooking: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Activ</p>
                  <p className="text-xs text-muted-foreground">Serviciul apare în programări</p>
                </div>
                <Switch
                  checked={editingService.active}
                  onCheckedChange={(v) => setEditingService((p) => ({ ...p, active: v }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceModal(false)}>Anulează</Button>
            <Button
              onClick={saveService}
              disabled={!editingService.name.trim() || editingService.price <= 0 || saving}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? "Se salvează…" : isNewService ? "Adaugă serviciu" : "Salvează modificările"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ADD/EDIT CATEGORY MODAL ── */}
      <Dialog open={catModal} onOpenChange={setCatModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isNewCat ? "Categorie nouă" : "Editează categorie"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nume categorie</Label>
              <Input
                value={editingCat.name}
                onChange={(e) => setEditingCat((p) => ({ ...p, name: e.target.value }))}
                placeholder="ex: Manichiură"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Iconiță</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CATEGORY_ICONS) as Array<keyof typeof CATEGORY_ICONS>).map((iconKey) => {
                  const Icon = CATEGORY_ICONS[iconKey]
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setEditingCat((p) => ({ ...p, icon: iconKey }))}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                        editingCat.icon === iconKey
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:border-accent/50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Culoare</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditingCat((p) => ({ ...p, color: c }))}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-all",
                      editingCat.color === c ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Iconița și culoarea rămân doar pe acest dispozitiv (nu se salvează în baza de date).
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCatModal(false)}>Anulează</Button>
            <Button
              onClick={saveCat}
              disabled={!editingCat.name.trim() || saving}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? "Se salvează…" : isNewCat ? "Adaugă" : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
