"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Package, Search, Plus, AlertTriangle, TrendingDown, MoreHorizontal,
  Download, History, ArrowUpCircle, ArrowDownCircle, Edit2, Trash2,
  ChevronDown, X, Filter, RefreshCw, Boxes,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────
type StockStatus = "ok" | "low" | "out"
type MovementType = "Receptie" | "Consum" | "Ajustare" | "Pierdere" | "Retur"

interface LinkedService {
  serviceId: string
  serviceName: string
  quantityPerUse: number
}

interface Product {
  id: string
  name: string
  brand: string
  category: string
  sku: string
  unit: string
  stock: number
  minStock: number
  costPrice: number
  retailPrice: number
  supplierName: string
  supplierPhone: string
  supplierEmail: string
  linkedServices: LinkedService[]
  notes: string
  active: boolean
}

interface Movement {
  id: string
  date: string
  productId: string
  productName: string
  type: MovementType
  quantity: number
  user: string
  note: string
  invoiceNumber?: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = ["Vopsele", "Oxidanți", "Tratamente păr", "Styling", "Unghii", "Cosmetice", "Consumabile"]
const UNITS = ["bucată", "ml", "g", "tub", "flacon", "set", "pereche"]
const MOVEMENT_TYPES: MovementType[] = ["Receptie", "Consum", "Ajustare", "Pierdere", "Retur"]
const ADJUST_REASONS = ["Inventar", "Pierdere", "Expirare", "Altele"]

const SERVICES = [
  "Vopsit rădăcini", "Vopsit integral", "Balayage", "Șuvițe",
  "Tuns dame", "Manichiură gel", "Tratament Olaplex", "Extensii gene",
]

function stockStatus(p: Product): StockStatus {
  if (p.stock === 0) return "out"
  if (p.stock < p.minStock) return "low"
  return "ok"
}

function StatusBadge({ status }: { status: StockStatus }) {
  if (status === "out") return <Badge className="bg-red-600 text-white hover:bg-red-600">Epuizat</Badge>
  if (status === "low") return <Badge className="bg-amber-600 text-white hover:bg-amber-600">Stoc Scăzut</Badge>
  return <Badge className="bg-emerald-700 text-white hover:bg-emerald-700">OK</Badge>
}

function MovementBadge({ type }: { type: MovementType }) {
  const styles: Record<MovementType, string> = {
    Receptie: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    Consum: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    Ajustare: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    Pierdere: "bg-red-500/15 text-red-400 border-red-500/20",
    Retur: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  }
  return <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", styles[type])}>{type}</span>
}

// ── Sample data ──────────────────────────────────────────────────────────────
const INITIAL_PRODUCTS: Product[] = [
  { id: "p1", name: "Majirel 50ml #5.0", brand: "L'Oreal", category: "Vopsele", sku: "LOR-MAJ-50-50", unit: "tub", stock: 38, minStock: 15, costPrice: 18, retailPrice: 0, supplierName: "L'Oreal Professional RO", supplierPhone: "021 300 1234", supplierEmail: "comenzi@loreal.ro", linkedServices: [{ serviceId: "s5", serviceName: "Vopsit rădăcini", quantityPerUse: 2 }, { serviceId: "s6", serviceName: "Vopsit integral", quantityPerUse: 3 }], notes: "", active: true },
  { id: "p2", name: "Majirel 50ml #7.3", brand: "L'Oreal", category: "Vopsele", sku: "LOR-MAJ-50-73", unit: "tub", stock: 25, minStock: 15, costPrice: 18, retailPrice: 0, supplierName: "L'Oreal Professional RO", supplierPhone: "021 300 1234", supplierEmail: "comenzi@loreal.ro", linkedServices: [{ serviceId: "s5", serviceName: "Vopsit rădăcini", quantityPerUse: 2 }], notes: "", active: true },
  { id: "p3", name: "Majirel 50ml #9.1", brand: "L'Oreal", category: "Vopsele", sku: "LOR-MAJ-50-91", unit: "tub", stock: 8, minStock: 10, costPrice: 18, retailPrice: 0, supplierName: "L'Oreal Professional RO", supplierPhone: "021 300 1234", supplierEmail: "comenzi@loreal.ro", linkedServices: [], notes: "Stoc scăzut - de comandat", active: true },
  { id: "p4", name: "Oxidant 6% 1000ml", brand: "L'Oreal", category: "Oxidanți", sku: "LOR-OXI-6-1L", unit: "flacon", stock: 12, minStock: 8, costPrice: 28, retailPrice: 0, supplierName: "L'Oreal Professional RO", supplierPhone: "021 300 1234", supplierEmail: "comenzi@loreal.ro", linkedServices: [{ serviceId: "s5", serviceName: "Vopsit rădăcini", quantityPerUse: 1 }], notes: "", active: true },
  { id: "p5", name: "Oxidant 9% 1000ml", brand: "L'Oreal", category: "Oxidanți", sku: "LOR-OXI-9-1L", unit: "flacon", stock: 10, minStock: 8, costPrice: 28, retailPrice: 0, supplierName: "L'Oreal Professional RO", supplierPhone: "021 300 1234", supplierEmail: "comenzi@loreal.ro", linkedServices: [], notes: "", active: true },
  { id: "p6", name: "Koleston Perfect 60ml #55/0", brand: "Wella", category: "Vopsele", sku: "WEL-KOL-6005", unit: "tub", stock: 20, minStock: 12, costPrice: 22, retailPrice: 0, supplierName: "Wella Professionals", supplierPhone: "021 450 9900", supplierEmail: "order@wella.ro", linkedServices: [{ serviceId: "s7", serviceName: "Balayage", quantityPerUse: 4 }], notes: "", active: true },
  { id: "p7", name: "Blondor Multi Blonde 800g", brand: "Wella", category: "Vopsele", sku: "WEL-BLO-800", unit: "bucată", stock: 5, minStock: 4, costPrice: 145, retailPrice: 0, supplierName: "Wella Professionals", supplierPhone: "021 450 9900", supplierEmail: "order@wella.ro", linkedServices: [{ serviceId: "s7", serviceName: "Balayage", quantityPerUse: 1 }, { serviceId: "s8", serviceName: "Șuvițe", quantityPerUse: 1 }], notes: "", active: true },
  { id: "p8", name: "Olaplex No.1 100ml", brand: "Olaplex", category: "Tratamente păr", sku: "OLA-001-100", unit: "flacon", stock: 4, minStock: 6, costPrice: 180, retailPrice: 220, supplierName: "Olaplex Europe", supplierPhone: "0729 100 200", supplierEmail: "ro@olaplex.com", linkedServices: [{ serviceId: "s6", serviceName: "Vopsit integral", quantityPerUse: 1 }], notes: "Necesar la fiecare vopsire cu tratament", active: true },
  { id: "p9", name: "Olaplex No.2 250ml", brand: "Olaplex", category: "Tratamente păr", sku: "OLA-002-250", unit: "flacon", stock: 3, minStock: 6, costPrice: 165, retailPrice: 200, supplierName: "Olaplex Europe", supplierPhone: "0729 100 200", supplierEmail: "ro@olaplex.com", linkedServices: [], notes: "", active: true },
  { id: "p10", name: "Nutritive Bain Satin 250ml", brand: "Kerastase", category: "Tratamente păr", sku: "KER-NUT-250", unit: "flacon", stock: 18, minStock: 10, costPrice: 95, retailPrice: 135, supplierName: "Kerastase RO", supplierPhone: "021 210 5500", supplierEmail: "salon@kerastase.ro", linkedServices: [], notes: "", active: true },
  { id: "p11", name: "Nutritive Fondant 200ml", brand: "Kerastase", category: "Tratamente păr", sku: "KER-NUT-FOND-200", unit: "flacon", stock: 15, minStock: 8, costPrice: 110, retailPrice: 155, supplierName: "Kerastase RO", supplierPhone: "021 210 5500", supplierEmail: "salon@kerastase.ro", linkedServices: [], notes: "", active: true },
  { id: "p12", name: "Osis+ Freeze Strong 500ml", brand: "Schwarzkopf", category: "Styling", sku: "SCH-OSI-FRZ-500", unit: "flacon", stock: 22, minStock: 10, costPrice: 45, retailPrice: 68, supplierName: "Schwarzkopf Professional", supplierPhone: "021 330 7700", supplierEmail: "pro@schwarzkopf.ro", linkedServices: [], notes: "", active: true },
  { id: "p13", name: "Silkwhip Mousse 200ml", brand: "Schwarzkopf", category: "Styling", sku: "SCH-SWH-200", unit: "flacon", stock: 9, minStock: 8, costPrice: 38, retailPrice: 55, supplierName: "Schwarzkopf Professional", supplierPhone: "021 330 7700", supplierEmail: "pro@schwarzkopf.ro", linkedServices: [], notes: "", active: true },
  { id: "p14", name: "Fibre Crimper 150ml", brand: "Schwarzkopf", category: "Styling", sku: "SCH-FIB-150", unit: "flacon", stock: 0, minStock: 5, costPrice: 42, retailPrice: 62, supplierName: "Schwarzkopf Professional", supplierPhone: "021 330 7700", supplierEmail: "pro@schwarzkopf.ro", linkedServices: [], notes: "Epuizat - de comandat urgent", active: true },
  { id: "p15", name: "Infinite Shine #Big Hair", brand: "OPI", category: "Unghii", sku: "OPI-INS-BH", unit: "flacon", stock: 24, minStock: 8, costPrice: 38, retailPrice: 65, supplierName: "OPI Romania", supplierPhone: "0744 500 600", supplierEmail: "comenzi@opi.ro", linkedServices: [{ serviceId: "s9", serviceName: "Manichiură gel", quantityPerUse: 1 }], notes: "", active: true },
  { id: "p16", name: "Infinite Shine #Bubble Bath", brand: "OPI", category: "Unghii", sku: "OPI-INS-BB", unit: "flacon", stock: 32, minStock: 8, costPrice: 38, retailPrice: 65, supplierName: "OPI Romania", supplierPhone: "0744 500 600", supplierEmail: "comenzi@opi.ro", linkedServices: [], notes: "", active: true },
  { id: "p17", name: "Vinylux #Beau 15ml", brand: "CND", category: "Unghii", sku: "CND-VNX-BEU", unit: "flacon", stock: 7, minStock: 10, costPrice: 32, retailPrice: 55, supplierName: "CND Distributors", supplierPhone: "0724 800 900", supplierEmail: "cnd@prosalon.ro", linkedServices: [], notes: "", active: true },
  { id: "p18", name: "Shellac Base Coat 7.3ml", brand: "CND", category: "Unghii", sku: "CND-SHL-BASE", unit: "flacon", stock: 14, minStock: 6, costPrice: 55, retailPrice: 0, supplierName: "CND Distributors", supplierPhone: "0724 800 900", supplierEmail: "cnd@prosalon.ro", linkedServices: [{ serviceId: "s9", serviceName: "Manichiură gel", quantityPerUse: 1 }], notes: "", active: true },
  { id: "p19", name: "Shellac Top Coat 7.3ml", brand: "CND", category: "Unghii", sku: "CND-SHL-TOP", unit: "flacon", stock: 11, minStock: 6, costPrice: 55, retailPrice: 0, supplierName: "CND Distributors", supplierPhone: "0724 800 900", supplierEmail: "cnd@prosalon.ro", linkedServices: [], notes: "", active: true },
  { id: "p20", name: "Crema hidratantă față SPF50 50ml", brand: "Vichy", category: "Cosmetice", sku: "VIC-HID-SPF50", unit: "flacon", stock: 8, minStock: 5, costPrice: 75, retailPrice: 120, supplierName: "L'Oreal Consumer", supplierPhone: "021 300 1234", supplierEmail: "pro@vichy.ro", linkedServices: [], notes: "", active: true },
  { id: "p21", name: "Serum vitamina C 30ml", brand: "Vichy", category: "Cosmetice", sku: "VIC-SER-VITC", unit: "flacon", stock: 6, minStock: 4, costPrice: 95, retailPrice: 145, supplierName: "L'Oreal Consumer", supplierPhone: "021 300 1234", supplierEmail: "pro@vichy.ro", linkedServices: [], notes: "", active: true },
  { id: "p22", name: "Mănuși nitrile M (100 buc)", brand: "Pro Salon", category: "Consumabile", sku: "CON-MAN-NIT-M", unit: "set", stock: 15, minStock: 5, costPrice: 28, retailPrice: 0, supplierName: "Pro Salon Supplies", supplierPhone: "0733 200 300", supplierEmail: "comenzi@prosalon.ro", linkedServices: [], notes: "", active: true },
  { id: "p23", name: "Folii aluminiu 200m", brand: "Pro Salon", category: "Consumabile", sku: "CON-FOL-200", unit: "bucată", stock: 8, minStock: 3, costPrice: 45, retailPrice: 0, supplierName: "Pro Salon Supplies", supplierPhone: "0733 200 300", supplierEmail: "comenzi@prosalon.ro", linkedServices: [], notes: "", active: true },
  { id: "p24", name: "Cape salon negre (10 buc)", brand: "Pro Salon", category: "Consumabile", sku: "CON-CAPE-10", unit: "set", stock: 4, minStock: 3, costPrice: 35, retailPrice: 0, supplierName: "Pro Salon Supplies", supplierPhone: "0733 200 300", supplierEmail: "comenzi@prosalon.ro", linkedServices: [], notes: "", active: true },
  { id: "p25", name: "Prosoape salon 50x90 (10 buc)", brand: "Pro Salon", category: "Consumabile", sku: "CON-PROS-5090", unit: "set", stock: 20, minStock: 6, costPrice: 55, retailPrice: 0, supplierName: "Pro Salon Supplies", supplierPhone: "0733 200 300", supplierEmail: "comenzi@prosalon.ro", linkedServices: [], notes: "", active: true },
]

const INITIAL_MOVEMENTS: Movement[] = [
  { id: "m1", date: "2025-03-15 10:22", productId: "p1", productName: "Majirel 50ml #5.0", type: "Receptie", quantity: 20, user: "Ana Popescu", note: "Comandă lunară", invoiceNumber: "INV-2025-0312" },
  { id: "m2", date: "2025-03-15 14:05", productId: "p8", productName: "Olaplex No.1 100ml", type: "Consum", quantity: -1, user: "Maria Ionescu", note: "Programare: Vopsit integral - Elena Constantin" },
  { id: "m3", date: "2025-03-14 09:30", productId: "p14", productName: "Fibre Crimper 150ml", type: "Pierdere", quantity: -2, user: "Elena Dumitrescu", note: "Sticle sparte la curățenie" },
  { id: "m4", date: "2025-03-14 11:45", productId: "p6", productName: "Koleston Perfect #55/0", type: "Consum", quantity: -4, user: "Ana Popescu", note: "Programare: Balayage - Mihaela Stoian" },
  { id: "m5", date: "2025-03-13 16:00", productId: "p22", productName: "Mănuși nitrile M", type: "Receptie", quantity: 5, user: "Ana Popescu", note: "Reaprovizionare urgentă", invoiceNumber: "INV-2025-0298" },
  { id: "m6", date: "2025-03-13 10:15", productId: "p17", productName: "Vinylux #Beau 15ml", type: "Ajustare", quantity: -3, user: "Ana Popescu", note: "Inventar - lipsă constatată" },
  { id: "m7", date: "2025-03-12 15:30", productId: "p10", productName: "Nutritive Bain Satin", type: "Consum", quantity: -1, user: "Maria Ionescu", note: "Programare: Tratament păr" },
  { id: "m8", date: "2025-03-11 09:00", productId: "p4", productName: "Oxidant 6% 1000ml", type: "Receptie", quantity: 6, user: "Ana Popescu", note: "Comandă săptămânală", invoiceNumber: "INV-2025-0285" },
]

// ── Empty states ──────────────────────────────────────────────────────────────
const emptyProduct = (): Product => ({
  id: "", name: "", brand: "", category: CATEGORIES[0], sku: "",
  unit: "bucată", stock: 0, minStock: 5, costPrice: 0, retailPrice: 0,
  supplierName: "", supplierPhone: "", supplierEmail: "",
  linkedServices: [], notes: "", active: true,
})

// ── Main Component ─────────────────���──────────────────────────────────────────
export default function StocuriPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [movements, setMovements] = useState<Movement[]>(INITIAL_MOVEMENTS)
  const [activeTab, setActiveTab] = useState<"produse" | "miscari">("produse")

  // Filters
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("Toate")
  const [filterStatus, setFilterStatus] = useState("Toate")
  const [sortBy, setSortBy] = useState<"name" | "stock" | "brand">("name")

  // Movement filters
  const [movSearch, setMovSearch] = useState("")
  const [movType, setMovType] = useState("Toate")

  // Modals
  const [productModal, setProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product>(emptyProduct())
  const [isNewProduct, setIsNewProduct] = useState(true)

  const [receptionModal, setReceptionModal] = useState(false)
  const [adjustModal, setAdjustModal] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null)

  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())

  // Reception form
  const [receptionLines, setReceptionLines] = useState([{ productId: "", qty: 1, note: "" }])
  const [invoiceNumber, setInvoiceNumber] = useState("")

  // Adjust form
  const [adjustNewQty, setAdjustNewQty] = useState(0)
  const [adjustReason, setAdjustReason] = useState(ADJUST_REASONS[0])
  const [adjustNote, setAdjustNote] = useState("")

  // Linked service in product form
  const [newLinkService, setNewLinkService] = useState("")
  const [newLinkQty, setNewLinkQty] = useState("1")

  // ── Derived ───────────────────────────────────────────────────────────────
  const lowCount = products.filter(p => stockStatus(p) === "low").length
  const outCount = products.filter(p => stockStatus(p) === "out").length
  const totalValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0)
  const alertProducts = products.filter(p => stockStatus(p) !== "ok")

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const s = search.toLowerCase()
        const matchSearch = p.name.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)
        const matchCat = filterCat === "Toate" || p.category === filterCat
        const st = stockStatus(p)
        const matchStatus = filterStatus === "Toate" ||
          (filterStatus === "ok" && st === "ok") ||
          (filterStatus === "low" && st === "low") ||
          (filterStatus === "out" && st === "out")
        return matchSearch && matchCat && matchStatus
      })
      .sort((a, b) => {
        if (sortBy === "stock") return a.stock - b.stock
        if (sortBy === "brand") return a.brand.localeCompare(b.brand)
        return a.name.localeCompare(b.name)
      })
  }, [products, search, filterCat, filterStatus, sortBy])

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const s = movSearch.toLowerCase()
      const matchSearch = m.productName.toLowerCase().includes(s) || m.note.toLowerCase().includes(s)
      const matchType = movType === "Toate" || m.type === movType
      return matchSearch && matchType
    })
  }, [movements, movSearch, movType])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openNewProduct = () => { setEditingProduct(emptyProduct()); setIsNewProduct(true); setProductModal(true) }
  const openEditProduct = (p: Product) => { setEditingProduct({ ...p }); setIsNewProduct(false); setProductModal(true) }

  const saveProduct = () => {
    if (!editingProduct.name.trim()) return
    if (isNewProduct) {
      setProducts(prev => [...prev, { ...editingProduct, id: `p${Date.now()}` }])
      setMovements(prev => [{
        id: `m${Date.now()}`, date: new Date().toISOString().slice(0, 16).replace("T", " "),
        productId: `p${Date.now()}`, productName: editingProduct.name,
        type: "Receptie", quantity: editingProduct.stock, user: "Admin", note: "Stoc inițial",
      }, ...prev])
    } else {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p))
    }
    setProductModal(false)
  }

  const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id))

  const openAdjust = (p: Product) => {
    setAdjustTarget(p); setAdjustNewQty(p.stock); setAdjustReason(ADJUST_REASONS[0]); setAdjustNote(""); setAdjustModal(true)
  }

  const saveAdjust = () => {
    if (!adjustTarget) return
    const diff = adjustNewQty - adjustTarget.stock
    setProducts(prev => prev.map(p => p.id === adjustTarget.id ? { ...p, stock: adjustNewQty } : p))
    setMovements(prev => [{
      id: `m${Date.now()}`, date: new Date().toISOString().slice(0, 16).replace("T", " "),
      productId: adjustTarget.id, productName: adjustTarget.name,
      type: "Ajustare", quantity: diff, user: "Admin", note: `Motiv: ${adjustReason}${adjustNote ? ` — ${adjustNote}` : ""}`,
    }, ...prev])
    setAdjustModal(false)
  }

  const saveReception = () => {
    const newMovs: Movement[] = []
    const updatedProducts = [...products]
    for (const line of receptionLines) {
      if (!line.productId || line.qty <= 0) continue
      const idx = updatedProducts.findIndex(p => p.id === line.productId)
      if (idx === -1) continue
      updatedProducts[idx] = { ...updatedProducts[idx], stock: updatedProducts[idx].stock + line.qty }
      newMovs.push({
        id: `m${Date.now()}-${line.productId}`,
        date: new Date().toISOString().slice(0, 16).replace("T", " "),
        productId: line.productId, productName: updatedProducts[idx].name,
        type: "Receptie", quantity: line.qty, user: "Admin",
        note: line.note || "Recepție marfă",
        invoiceNumber: invoiceNumber || undefined,
      })
    }
    setProducts(updatedProducts)
    setMovements(prev => [...newMovs, ...prev])
    setReceptionLines([{ productId: "", qty: 1, note: "" }])
    setInvoiceNumber("")
    setReceptionModal(false)
  }

  const addLinkedService = () => {
    if (!newLinkService.trim()) return
    setEditingProduct(prev => ({
      ...prev,
      linkedServices: [...prev.linkedServices, { serviceId: newLinkService, serviceName: newLinkService, quantityPerUse: Number(newLinkQty) || 1 }],
    }))
    setNewLinkService(""); setNewLinkQty("1")
  }

  const toggleBulk = (id: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="p-4 pt-16 sm:p-6 lg:p-8 lg:pt-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-balance">Stocuri</h1>
          <p className="text-sm text-muted-foreground">Inventar și mișcări de produse</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setReceptionModal(true)}>
            <ArrowUpCircle className="mr-2 h-4 w-4 text-emerald-500" />
            Recepție marfă
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setAdjustTarget(null); setAdjustModal(true) }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Ajustare stoc
          </Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={openNewProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Produs nou
          </Button>
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total produse</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">{CATEGORIES.length} categorii</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stoc scăzut</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{lowCount}</div>
            <p className="text-xs text-muted-foreground">sub pragul minim</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Epuizate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{outCount}</div>
            <p className="text-xs text-muted-foreground">produse fără stoc</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valoare inventar</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString("ro-RO")} RON</div>
            <p className="text-xs text-muted-foreground">la preț de achiziție</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert strip */}
      {alertProducts.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Alerte stoc ({alertProducts.length} produse)</p>
                <div className="flex flex-wrap gap-2">
                  {alertProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSearch(p.name); setActiveTab("produse") }}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                        stockStatus(p) === "out" ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                      )}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        {(["produse", "miscari"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "produse" ? "Produse" : "Mișcări stoc"}
          </button>
        ))}
      </div>

      {/* ── PRODUSE TAB ── */}
      {activeTab === "produse" && (
        <Card>
          <CardContent className="p-0">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 sm:gap-3 border-b border-border p-3 sm:p-4">
              <div className="relative w-full sm:min-w-[220px] sm:flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Caută după nume, brand, SKU..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger className="w-full sm:w-44">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Toate">Toate categoriile</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Toate">Toate statusurile</SelectItem>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="low">Stoc Scăzut</SelectItem>
                  <SelectItem value="out">Epuizat</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sortare: Nume</SelectItem>
                  <SelectItem value="brand">Sortare: Brand</SelectItem>
                  <SelectItem value="stock">Sortare: Stoc</SelectItem>
                </SelectContent>
              </Select>
              {bulkSelected.size > 0 && (
                <div className="flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5">
                  <span className="text-xs font-medium text-accent">{bulkSelected.size} selectate</span>
                  <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => { const ids = Array.from(bulkSelected); ids.forEach(id => { const p = products.find(x => x.id === id); if (p) openAdjust(p) }); setBulkSelected(new Set()) }}>
                    <RefreshCw className="h-3 w-3" /> Ajustează
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs">
                    <Download className="h-3 w-3" /> Export
                  </Button>
                  <button onClick={() => setBulkSelected(new Set())} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="accent-accent"
                      checked={bulkSelected.size === filteredProducts.length && filteredProducts.length > 0}
                      onChange={e => setBulkSelected(e.target.checked ? new Set(filteredProducts.map(p => p.id)) : new Set())}
                    />
                  </TableHead>
                  <TableHead>Produs</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Stoc curent</TableHead>
                  <TableHead>Prag minim</TableHead>
                  <TableHead className="text-right">Preț cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(p => {
                  const st = stockStatus(p)
                  const pct = p.minStock > 0 ? Math.min((p.stock / p.minStock) * 100, 100) : 100
                  return (
                    <TableRow key={p.id} className={cn(bulkSelected.has(p.id) && "bg-accent/5")}>
                      <TableCell>
                        <input type="checkbox" className="accent-accent" checked={bulkSelected.has(p.id)} onChange={() => toggleBulk(p.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium break-words min-w-0">{p.name}</div>
                        {p.sku && <div className="font-mono text-xs text-muted-foreground break-all">{p.sku}</div>}
                      </TableCell>
                      <TableCell className="text-sm">{p.brand}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className={cn("font-semibold", st === "out" ? "text-red-500" : st === "low" ? "text-amber-500" : "text-emerald-600")}>
                            {p.stock} {p.unit}
                          </span>
                          <Progress value={pct} className="h-1 w-20" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.minStock} {p.unit}</TableCell>
                      <TableCell className="text-right font-medium">{p.costPrice} RON</TableCell>
                      <TableCell><StatusBadge status={st} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditProduct(p)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Editează
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAdjust(p)}>
                              <RefreshCw className="mr-2 h-4 w-4" /> Ajustare stoc
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setMovSearch(p.name); setActiveTab("miscari") }}>
                              <History className="mr-2 h-4 w-4" /> Istoric mișcări
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteProduct(p.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Șterge
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                      Niciun produs găsit.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── MISCARI TAB ── */}
      {activeTab === "miscari" && (
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-wrap gap-2 sm:gap-3 border-b border-border p-3 sm:p-4">
              <div className="relative w-full sm:min-w-[220px] sm:flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Caută produs sau notă..." className="pl-9" value={movSearch} onChange={e => setMovSearch(e.target.value)} />
              </div>
              <Select value={movType} onValueChange={setMovType}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Toate">Toate tipurile</SelectItem>
                  {MOVEMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produs</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead className="text-right">Cantitate</TableHead>
                  <TableHead>Utilizator</TableHead>
                  <TableHead>Notă</TableHead>
                  <TableHead>Factură</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{m.date}</TableCell>
                    <TableCell className="font-medium text-sm">{m.productName}</TableCell>
                    <TableCell><MovementBadge type={m.type} /></TableCell>
                    <TableCell className={cn("text-right font-semibold", m.quantity > 0 ? "text-emerald-500" : "text-red-400")}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </TableCell>
                    <TableCell className="text-sm">{m.user}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{m.note}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.invoiceNumber || "—"}</TableCell>
                  </TableRow>
                ))}
                {filteredMovements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      Nicio mișcare găsită.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── PRODUCT MODAL ── */}
      <Dialog open={productModal} onOpenChange={setProductModal}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNewProduct ? "Produs nou" : "Editează produs"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Basic info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nume produs <span className="text-destructive">*</span></Label>
                <Input value={editingProduct.name} onChange={e => setEditingProduct(p => ({ ...p, name: e.target.value }))} placeholder="ex: Majirel 50ml #5.0" />
              </div>
              <div className="space-y-1.5">
                <Label>Brand</Label>
                <Input value={editingProduct.brand} onChange={e => setEditingProduct(p => ({ ...p, brand: e.target.value }))} placeholder="ex: L'Oreal" />
              </div>
              <div className="space-y-1.5">
                <Label>SKU (opțional)</Label>
                <Input value={editingProduct.sku} onChange={e => setEditingProduct(p => ({ ...p, sku: e.target.value }))} placeholder="LOR-MAJ-50" />
              </div>
              <div className="space-y-1.5">
                <Label>Categorie</Label>
                <Select value={editingProduct.category} onValueChange={v => setEditingProduct(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unitate de măsură</Label>
                <Select value={editingProduct.unit} onValueChange={v => setEditingProduct(p => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Stock */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Stoc curent</Label>
                <Input type="number" min={0} value={editingProduct.stock} onChange={e => setEditingProduct(p => ({ ...p, stock: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Prag minim alertă</Label>
                <Input type="number" min={0} value={editingProduct.minStock} onChange={e => setEditingProduct(p => ({ ...p, minStock: Number(e.target.value) }))} />
              </div>
            </div>

            {/* Prices */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Preț cost (RON)</Label>
                <Input type="number" min={0} step={0.01} value={editingProduct.costPrice} onChange={e => setEditingProduct(p => ({ ...p, costPrice: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Preț retail (RON)</Label>
                <Input type="number" min={0} step={0.01} value={editingProduct.retailPrice} onChange={e => setEditingProduct(p => ({ ...p, retailPrice: Number(e.target.value) }))} placeholder="0 = nu se vinde" />
              </div>
            </div>

            {/* Supplier */}
            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">Furnizor</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nume</Label>
                  <Input value={editingProduct.supplierName} onChange={e => setEditingProduct(p => ({ ...p, supplierName: e.target.value }))} placeholder="Nume furnizor" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telefon</Label>
                  <Input value={editingProduct.supplierPhone} onChange={e => setEditingProduct(p => ({ ...p, supplierPhone: e.target.value }))} placeholder="021 xxx xxxx" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input value={editingProduct.supplierEmail} onChange={e => setEditingProduct(p => ({ ...p, supplierEmail: e.target.value }))} placeholder="email@furnizor.ro" />
                </div>
              </div>
            </div>

            {/* Linked services */}
            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">Servicii asociate</p>
              <p className="text-xs text-muted-foreground">Specificați ce servicii consumă acest produs și cantitatea per utilizare.</p>
              {editingProduct.linkedServices.map((ls, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm">{ls.serviceName}</span>
                  <span className="w-20 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-center">{ls.quantityPerUse} {editingProduct.unit}</span>
                  <button onClick={() => setEditingProduct(prev => ({ ...prev, linkedServices: prev.linkedServices.filter((_, idx) => idx !== i) }))} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Select value={newLinkService} onValueChange={setNewLinkService}>
                  <SelectTrigger className="flex-1 text-sm">
                    <SelectValue placeholder="Alege serviciu..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.filter(s => !editingProduct.linkedServices.find(l => l.serviceName === s)).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min={1} value={newLinkQty} onChange={e => setNewLinkQty(e.target.value)} className="w-20 text-sm" placeholder="Qty" />
                <Button variant="outline" size="sm" onClick={addLinkedService} disabled={!newLinkService}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Textarea value={editingProduct.notes} onChange={e => setEditingProduct(p => ({ ...p, notes: e.target.value }))} placeholder="Observații opționale..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductModal(false)}>Anulează</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={saveProduct}>Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── RECEPTION MODAL ── */}
      <Dialog open={receptionModal} onOpenChange={setReceptionModal}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-emerald-500" /> Recepție marfă
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Număr factură / AWB (opțional)</Label>
              <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="INV-2025-XXXX" />
            </div>
            <div className="space-y-2">
              <Label>Produse recepționate</Label>
              {receptionLines.map((line, i) => (
                <div key={i} className="flex flex-wrap sm:flex-nowrap gap-2">
                  <Select value={line.productId} onValueChange={v => setReceptionLines(prev => prev.map((l, idx) => idx === i ? { ...l, productId: v } : l))}>
                    <SelectTrigger className="w-full sm:flex-1 text-sm">
                      <SelectValue placeholder="Selectează produs..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number" min={1} value={line.qty} placeholder="Qty"
                    className="w-20 text-sm"
                    onChange={e => setReceptionLines(prev => prev.map((l, idx) => idx === i ? { ...l, qty: Number(e.target.value) } : l))}
                  />
                  <Input
                    value={line.note} placeholder="Notă"
                    className="w-full sm:flex-1 text-sm"
                    onChange={e => setReceptionLines(prev => prev.map((l, idx) => idx === i ? { ...l, note: e.target.value } : l))}
                  />
                  {receptionLines.length > 1 && (
                    <button onClick={() => setReceptionLines(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setReceptionLines(prev => [...prev, { productId: "", qty: 1, note: "" }])}>
                <Plus className="h-3.5 w-3.5" /> Adaugă produs
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceptionModal(false)}>Anulează</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveReception}>Confirmă recepția</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ADJUST MODAL ── */}
      <Dialog open={adjustModal} onOpenChange={setAdjustModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" /> Ajustare stoc
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Produs</Label>
              {adjustTarget ? (
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm font-medium">{adjustTarget.name}</div>
              ) : (
                <Select onValueChange={v => setAdjustTarget(products.find(p => p.id === v) || null)}>
                  <SelectTrigger><SelectValue placeholder="Selectează produs..." /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
            {adjustTarget && (
              <div className="rounded-md border border-border bg-muted/10 px-3 py-2 text-sm">
                Stoc curent: <span className="font-semibold">{adjustTarget.stock} {adjustTarget.unit}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Stoc nou</Label>
              <Input type="number" min={0} value={adjustNewQty} onChange={e => setAdjustNewQty(Number(e.target.value))} />
              {adjustTarget && adjustNewQty !== adjustTarget.stock && (
                <p className={cn("text-xs font-medium", adjustNewQty > adjustTarget.stock ? "text-emerald-500" : "text-red-400")}>
                  {adjustNewQty > adjustTarget.stock ? `+${adjustNewQty - adjustTarget.stock}` : adjustNewQty - adjustTarget.stock} față de stocul curent
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Motiv</Label>
              <Select value={adjustReason} onValueChange={setAdjustReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ADJUST_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notă (opțional)</Label>
              <Textarea value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Detalii suplimentare..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustModal(false)}>Anulează</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={saveAdjust}>Salvează ajustarea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
