"use client"

import { useState, useMemo } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download,
  Calendar, Search, Plus, Filter, Receipt, Printer, X, ChevronRight,
  Banknote, CreditCard, ArrowLeftRight, BarChart2, FileText, Clock,
  AlertTriangle, Check, Users, Scissors,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  formatRON, formatRONShort,
  TRANSACTIONS, EXPENSES, DAY_CLOSES,
  PAYMENT_LABELS, EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS,
  getRevenueByDay, getRevenueByCategory, getRevenueByStaff,
  getPaymentMethodSplit, getMonthlyComparison, getServiceRanking,
  getTopClients, getTodaySummary,
  type Transaction, type Expense, type PaymentMethod, type ExpenseCategory, type ExpenseFrequency,
} from "@/lib/financiar-data"
import { STAFF_DATA } from "@/lib/echipa-data"

// ─── Period selector ────────────────────────────────────────────────────────
type Period = "azi" | "saptamana" | "luna" | "luna_trecuta" | "custom"
const PERIOD_LABELS: Record<Period, string> = {
  azi: "Astăzi",
  saptamana: "Săptămâna aceasta",
  luna: "Luna aceasta",
  luna_trecuta: "Luna trecută",
  custom: "Interval custom",
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
function RONTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{formatRON(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Transaction row / receipt modal ─────────────────────────────────────────
function PaymentBadge({ method }: { method: PaymentMethod }) {
  const config = {
    numerar:  { icon: Banknote,        cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    card:     { icon: CreditCard,      cls: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    transfer: { icon: ArrowLeftRight,  cls: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  }[method]
  const Icon = config.icon
  return (
    <Badge variant="outline" className={cn("gap-1 text-xs font-normal", config.cls)}>
      <Icon className="h-3 w-3" />{PAYMENT_LABELS[method]}
    </Badge>
  )
}

function StatusBadge({ status }: { status: Transaction["status"] }) {
  const config = {
    incasat:    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    rambursata: "bg-red-500/10 text-red-600 border-red-500/20",
    in_asteptare: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  }[status]
  const labels = { incasat: "Încasat", rambursata: "Rambursată", in_asteptare: "În așteptare" }
  return <Badge variant="outline" className={cn("text-xs font-normal", config)}>{labels[status]}</Badge>
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function FinanciarPage() {
  const [period, setPeriod] = useState<Period>("luna")
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const tab = searchParams.get("tab") ?? "dashboard"
  const setTab = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Transaction filters
  const [txSearch, setTxSearch] = useState("")
  const [txMethod, setTxMethod] = useState("toate")
  const [txStaff, setTxStaff] = useState("toate")
  const [txStatus, setTxStatus] = useState("toate")
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  // Expense state
  const [expenses, setExpenses] = useState<Expense[]>(EXPENSES)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expCat, setExpCat] = useState<ExpenseCategory>("produse")
  const [expAmount, setExpAmount] = useState("")
  const [expDesc, setExpDesc] = useState("")
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10))
  const [expFreq, setExpFreq] = useState<ExpenseFrequency>("unica")
  const [expNotes, setExpNotes] = useState("")

  // End of day
  const [actualCash, setActualCash] = useState("")
  const [dayNotes, setDayNotes] = useState("")
  const [dayClosed, setDayClosed] = useState(false)

  // Chart data (memoised)
  const revenueByDay = useMemo(() => getRevenueByDay(14), [])
  const byCategory   = useMemo(() => getRevenueByCategory(), [])
  const byStaff      = useMemo(() => getRevenueByStaff(), [])
  const byMethod     = useMemo(() => getPaymentMethodSplit(), [])
  const monthly      = useMemo(() => getMonthlyComparison(), [])
  const serviceRank  = useMemo(() => getServiceRanking(), [])
  const topClients   = useMemo(() => getTopClients(), [])
  const todaySummary = useMemo(() => getTodaySummary(), [])

  // KPI computations
  const activeTx = TRANSACTIONS.filter(t => t.status === "incasat")
  const totalRevenue = activeTx.reduce((s, t) => s + t.amount + t.tip, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const profit = totalRevenue - totalExpenses
  const avgTx = activeTx.length ? totalRevenue / activeTx.length : 0

  // Filtered transactions
  const filteredTx = useMemo(() => TRANSACTIONS.filter(t => {
    if (txSearch && !t.clientName.toLowerCase().includes(txSearch.toLowerCase())) return false
    if (txMethod !== "toate" && t.paymentMethod !== txMethod) return false
    if (txStaff !== "toate" && t.staffId !== txStaff) return false
    if (txStatus !== "toate" && t.status !== txStatus) return false
    return true
  }), [txSearch, txMethod, txStaff, txStatus])

  const handleAddExpense = () => {
    if (!expAmount || !expDesc) return
    setExpenses(prev => [{
      id: `e-${Date.now()}`,
      date: expDate,
      category: expCat,
      description: expDesc,
      amount: parseFloat(expAmount),
      frequency: expFreq,
      notes: expNotes,
    }, ...prev])
    setExpAmount(""); setExpDesc(""); setExpNotes(""); setExpFreq("unica")
    setShowExpenseForm(false)
  }

  const expectedCash = todaySummary.numarIncasat
  const cashDiff = actualCash ? parseFloat(actualCash) - expectedCash : null
  const cashVariance = cashDiff !== null && Math.abs(cashDiff) > 10

  return (
    <div className="p-4 pt-16 sm:p-6 lg:p-8 lg:pt-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-balance">Financiar</h1>
          <p className="text-sm text-muted-foreground">Venituri, cheltuieli și rapoarte financiare</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={v => setPeriod(v as Period)}>
            <SelectTrigger className="w-48 h-9">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Download className="h-4 w-4" />Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Venituri totale", value: totalRevenue, prev: totalRevenue * 0.91, icon: TrendingUp, green: true },
          { label: "Cheltuieli totale", value: totalExpenses, prev: totalExpenses * 1.04, icon: TrendingDown, green: false },
          { label: "Profit net", value: profit, prev: profit * 0.88, icon: BarChart2, green: true },
          { label: "Nr. tranzacții", value: activeTx.length, prev: activeTx.length * 0.93, icon: Receipt, green: true, isCount: true },
          { label: "Valoare medie", value: avgTx, prev: avgTx * 0.97, icon: ArrowUpRight, green: true },
        ].map(({ label, value, prev, icon: Icon, green, isCount }) => {
          const pct = ((value - prev) / (prev || 1)) * 100
          const up = pct >= 0
          const goodChange = green ? up : !up
          return (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {isCount ? value : formatRONShort(value)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {up
                    ? <ArrowUpRight className={cn("h-3 w-3", goodChange ? "text-emerald-500" : "text-red-500")} />
                    : <ArrowDownRight className={cn("h-3 w-3", goodChange ? "text-emerald-500" : "text-red-500")} />
                  }
                  <span className={cn("text-xs font-medium", goodChange ? "text-emerald-500" : "text-red-500")}>
                    {up ? "+" : ""}{pct.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs perioada precedentă</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9 w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tranzactii">Tranzacții</TabsTrigger>
          <TabsTrigger value="cheltuieli">Cheltuieli</TabsTrigger>
          <TabsTrigger value="rapoarte">Rapoarte</TabsTrigger>
          <TabsTrigger value="inchidere">Închidere Zi</TabsTrigger>
        </TabsList>

        {/* ── DASHBOARD ── */}
        <TabsContent value="dashboard" className="space-y-6 mt-4">
          {/* Revenue line chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Evoluție venituri — ultimele 14 zile</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={revenueByDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => formatRONShort(v)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                  <Tooltip content={<RONTooltip />} />
                  <Legend />
                  <Line name="Perioada curentă" type="monotone" dataKey="venituri" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line name="Perioada precedentă" type="monotone" dataKey="prevVenituri" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Revenue by category donut */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Venituri pe categorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                      {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatRON(v), ""]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue by staff horizontal bar */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Venituri per angajat</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={byStaff} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={v => formatRONShort(v)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip content={<RONTooltip />} />
                    <Bar name="Venituri" dataKey="venituri" fill="#10b981" radius={[0, 4, 4, 0]} />
                    <Bar name="Comision" dataKey="comision" fill="#6b7280" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Payment methods + monthly comparison */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Metode de plată</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={byMethod} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                      {byMethod.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatRON(v), ""]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Comparativ lunar — 6 luni</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={monthly} margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={v => formatRONShort(v)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={65} />
                    <Tooltip content={<RONTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar name="Venituri" dataKey="venituri" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar name="Cheltuieli" dataKey="cheltuieli" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TRANZACȚII ── */}
        <TabsContent value="tranzactii" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-0 sm:min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Caută client…" className="pl-9 h-9" value={txSearch} onChange={e => setTxSearch(e.target.value)} />
            </div>
            <Select value={txMethod} onValueChange={setTxMethod}>
              <SelectTrigger className="w-full sm:w-36 h-9"><SelectValue placeholder="Metodă" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="toate">Toate metodele</SelectItem>
                <SelectItem value="numerar">Numerar</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={txStaff} onValueChange={setTxStaff}>
              <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="Angajat" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="toate">Toți angajații</SelectItem>
                {STAFF_DATA.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={txStatus} onValueChange={setTxStatus}>
              <SelectTrigger className="w-full sm:w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="toate">Toate</SelectItem>
                <SelectItem value="incasat">Încasat</SelectItem>
                <SelectItem value="rambursata">Rambursată</SelectItem>
                <SelectItem value="in_asteptare">În așteptare</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 gap-2 ml-auto">
              <Download className="h-4 w-4" />Export CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data / Ora</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Servicii</TableHead>
                    <TableHead>Angajat</TableHead>
                    <TableHead>Metodă</TableHead>
                    <TableHead className="text-right">Tip</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTx.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nicio tranzacție găsită</TableCell>
                    </TableRow>
                  )}
                  {filteredTx.map(tx => (
                    <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelectedTx(tx)}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(tx.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })} {tx.time}</TableCell>
                      <TableCell className="font-medium text-sm">{tx.clientName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[140px] sm:max-w-xs truncate">{tx.services.join(", ")}</TableCell>
                      <TableCell className="text-sm">{tx.staffName.split(" ")[0]}</TableCell>
                      <TableCell><PaymentBadge method={tx.paymentMethod} /></TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {tx.tip > 0 ? `+${tx.tip} Lei` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">{formatRON(tx.amount + tx.tip)}</TableCell>
                      <TableCell><StatusBadge status={tx.status} /></TableCell>
                      <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CHELTUIELI ── */}
        <TabsContent value="cheltuieli" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{formatRON(expenses.reduce((s, e) => s + e.amount, 0))}</span> — {expenses.length} înregistrări
            </div>
            <Button size="sm" className="h-9 gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setShowExpenseForm(true)}>
              <Plus className="h-4 w-4" />Adaugă cheltuială
            </Button>
          </div>

          {showExpenseForm && (
            <Card className="border-accent/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Cheltuială nouă</CardTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowExpenseForm(false)}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Categorie</Label>
                    <Select value={expCat} onValueChange={v => setExpCat(v as ExpenseCategory)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][]).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sumă (Lei)</Label>
                    <Input placeholder="0,00" className="h-8 text-xs" value={expAmount} onChange={e => setExpAmount(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descriere</Label>
                  <Input placeholder="Ex: Factură electricitate ianuarie" className="h-8 text-xs" value={expDesc} onChange={e => setExpDesc(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Data</Label>
                    <Input type="date" className="h-8 text-xs" value={expDate} onChange={e => setExpDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Frecvență</Label>
                    <Select value={expFreq} onValueChange={v => setExpFreq(v as ExpenseFrequency)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unica">Unică</SelectItem>
                        <SelectItem value="saptamanal">Săptămânal</SelectItem>
                        <SelectItem value="lunar">Lunar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Note (opțional)</Label>
                  <Textarea className="text-xs min-h-[60px]" placeholder="Nr. factură, furnizor…" value={expNotes} onChange={e => setExpNotes(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setShowExpenseForm(false)}>Anulează</Button>
                  <Button size="sm" className="h-8 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleAddExpense}>Salvează</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead>Descriere</TableHead>
                    <TableHead>Frecvență</TableHead>
                    <TableHead className="text-right">Sumă</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map(exp => (
                    <TableRow key={exp.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "2-digit" })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal gap-1" style={{ borderColor: EXPENSE_CATEGORY_COLORS[exp.category] + "40", color: EXPENSE_CATEGORY_COLORS[exp.category] }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: EXPENSE_CATEGORY_COLORS[exp.category] }} />
                          {EXPENSE_CATEGORY_LABELS[exp.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{exp.description}</TableCell>
                      <TableCell className="text-xs text-muted-foreground capitalize">{exp.frequency === "unica" ? "Unică" : exp.frequency === "lunar" ? "Lunar" : "Săptămânal"}</TableCell>
                      <TableCell className="text-right font-semibold text-red-500 text-sm">-{formatRON(exp.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RAPOARTE ── */}
        <TabsContent value="rapoarte" className="space-y-6 mt-4">
          {/* P&L */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Profit & Pierdere — Luna curentă</CardTitle>
                  <CardDescription className="text-xs">Rezumat financiar complet</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><Printer className="h-3.5 w-3.5" />Print</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm font-mono">
                {[
                  { label: "VENITURI TOTALE", value: totalRevenue, bold: true, color: "text-emerald-500" },
                  { label: "  Servicii", value: totalRevenue * 0.88 },
                  { label: "  Tips", value: totalRevenue * 0.05 },
                  { label: "  Retail produse", value: totalRevenue * 0.07 },
                  null,
                  { label: "CHELTUIELI TOTALE", value: totalExpenses, bold: true, color: "text-red-500" },
                  { label: "  Chirie", value: expenses.filter(e => e.category === "chirie").reduce((s, e) => s + e.amount, 0) },
                  { label: "  Salarii", value: expenses.filter(e => e.category === "salarii").reduce((s, e) => s + e.amount, 0) },
                  { label: "  Produse", value: expenses.filter(e => e.category === "produse").reduce((s, e) => s + e.amount, 0) },
                  { label: "  Marketing", value: expenses.filter(e => e.category === "marketing").reduce((s, e) => s + e.amount, 0) },
                  { label: "  Utilități", value: expenses.filter(e => e.category === "utilitati").reduce((s, e) => s + e.amount, 0) },
                  { label: "  Echipamente", value: expenses.filter(e => e.category === "echipamente").reduce((s, e) => s + e.amount, 0) },
                  { label: "  Altele", value: expenses.filter(e => e.category === "altele").reduce((s, e) => s + e.amount, 0) },
                  null,
                  { label: "PROFIT NET", value: profit, bold: true, color: profit >= 0 ? "text-emerald-500" : "text-red-500" },
                  { label: "Marjă profit", value: `${((profit / totalRevenue) * 100).toFixed(1)}%`, isPercent: true },
                ].map((row, i) => {
                  if (!row) return <Separator key={i} className="my-2" />
                  return (
                    <div key={i} className={cn("flex items-center justify-between py-1 px-2 rounded", row.bold && "font-semibold bg-muted/50")}>
                      <span className={cn("text-xs", row.color)}>{row.label}</span>
                      <span className={cn("text-xs tabular-nums", row.color)}>
                        {row.isPercent ? row.value : formatRON(row.value as number)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Service ranking */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><Scissors className="h-4 w-4" />Venituri per Serviciu</CardTitle>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Download className="h-3 w-3" />CSV</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Serviciu</TableHead>
                      <TableHead className="text-xs text-right">Nr.</TableHead>
                      <TableHead className="text-xs text-right">Venituri</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceRank.map((s, i) => (
                      <TableRow key={s.name}>
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-xs font-medium">{s.name}</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">{s.count}</TableCell>
                        <TableCell className="text-xs text-right font-semibold">{formatRONShort(s.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Top clients */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Valoare Client</CardTitle>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Download className="h-3 w-3" />CSV</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Client</TableHead>
                      <TableHead className="text-xs text-right">Vizite</TableHead>
                      <TableHead className="text-xs text-right">Medie</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topClients.map((c, i) => (
                      <TableRow key={c.name}>
                        <TableCell className="text-xs font-medium">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">{i + 1}</span>
                            {c.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">{c.visits}</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">{formatRONShort(c.avgSpend)}</TableCell>
                        <TableCell className="text-xs text-right font-semibold">{formatRONShort(c.totalSpent)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Staff revenue report */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Venituri per Angajat</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Download className="h-3 w-3" />CSV</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Angajat</TableHead>
                    <TableHead className="text-xs">Rol</TableHead>
                    <TableHead className="text-xs text-right">Programări</TableHead>
                    <TableHead className="text-xs text-right">Venituri</TableHead>
                    <TableHead className="text-xs text-right">Comision %</TableHead>
                    <TableHead className="text-xs text-right">Comision câștigat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STAFF_DATA.filter(s => s.status === "activ").map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm font-medium">{s.firstName} {s.lastName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.role}</TableCell>
                      <TableCell className="text-xs text-right">{s.stats.appointmentsThisMonth}</TableCell>
                      <TableCell className="text-sm text-right font-semibold">{formatRONShort(s.stats.revenueThisMonth)}</TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">{s.commissionRate}%</TableCell>
                      <TableCell className="text-sm text-right font-medium text-accent">
                        {formatRONShort(Math.round(s.stats.revenueThisMonth * s.commissionRate / 100))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ÎNCHIDERE ZI ── */}
        <TabsContent value="inchidere" className="space-y-4 mt-4">
          {!dayClosed ? (
            <>
              {/* Today summary */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Numerar încasat", value: todaySummary.numarIncasat, icon: Banknote, color: "text-emerald-500" },
                  { label: "Card încasat", value: todaySummary.cardIncasat, icon: CreditCard, color: "text-blue-500" },
                  { label: "Transfer încasat", value: todaySummary.transferIncasat, icon: ArrowLeftRight, color: "text-violet-500" },
                  { label: "Tips total", value: todaySummary.tips, icon: TrendingUp, color: "text-amber-500" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <Card key={label}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <Icon className={cn("h-4 w-4", color)} />
                      </div>
                      <p className={cn("text-lg font-bold", color)}>{formatRON(value)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="sm:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Numărare casă</CardTitle>
                    <CardDescription className="text-xs">Introdu suma numărată fizic din casă</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">Numerar așteptat (sistem)</span>
                      <span className="font-semibold">{formatRON(expectedCash)}</span>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Numerar numărat fizic (Lei)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className={cn("h-9", cashVariance && "border-red-500 focus-visible:ring-red-500")}
                        value={actualCash}
                        onChange={e => setActualCash(e.target.value)}
                      />
                    </div>
                    {cashDiff !== null && (
                      <div className={cn("flex items-center gap-2 rounded-lg p-3 text-sm", cashVariance ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600")}>
                        {cashVariance
                          ? <AlertTriangle className="h-4 w-4 shrink-0" />
                          : <Check className="h-4 w-4 shrink-0" />
                        }
                        <span>
                          {cashVariance
                            ? `Diferență de ${formatRON(Math.abs(cashDiff))} față de sistem. Verifică tranzacțiile.`
                            : "Casa bate cu sistemul."
                          }
                        </span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Note (opțional)</Label>
                      <Textarea className="text-xs min-h-[72px]" placeholder="Observații pentru ziua de azi…" value={dayNotes} onChange={e => setDayNotes(e.target.value)} />
                    </div>
                    <Button
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                      onClick={() => setDayClosed(true)}
                    >
                      <Clock className="h-4 w-4" />
                      Închide ziua — {new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                    </Button>
                  </CardContent>
                </Card>

                {/* Discount summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Rezumat reduceri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount total acordat</span>
                      <span className="font-semibold text-orange-500">-{formatRON(todaySummary.discounts)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nr. tranzacții</span>
                      <span className="font-semibold">{todaySummary.transactionCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Venit brut total</span>
                      <span className="font-semibold">{formatRON(todaySummary.totalRevenue)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Previous closes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Închideri anterioare</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Data</TableHead>
                        <TableHead className="text-xs text-right">Numerar</TableHead>
                        <TableHead className="text-xs text-right">Card</TableHead>
                        <TableHead className="text-xs text-right">Tips</TableHead>
                        <TableHead className="text-xs text-right">Diferență casă</TableHead>
                        <TableHead className="text-xs">Închis de</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {DAY_CLOSES.map(dc => {
                        const diff = dc.actualCash - dc.expectedCash
                        return (
                          <TableRow key={dc.id}>
                            <TableCell className="text-xs">{new Date(dc.date).toLocaleDateString("ro-RO", { weekday: "short", day: "numeric", month: "short" })}</TableCell>
                            <TableCell className="text-xs text-right">{formatRON(dc.numarIncasat)}</TableCell>
                            <TableCell className="text-xs text-right">{formatRON(dc.cardIncasat)}</TableCell>
                            <TableCell className="text-xs text-right text-amber-500">{formatRON(dc.tips)}</TableCell>
                            <TableCell className="text-xs text-right">
                              <span className={cn("font-medium", Math.abs(diff) > 10 ? "text-red-500" : "text-emerald-500")}>
                                {diff >= 0 ? "+" : ""}{formatRON(diff)}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{dc.closedBy.split(" ")[0]} {dc.closedAt}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 mx-auto mb-4">
                  <Check className="h-7 w-7 text-emerald-500" />
                </div>
                <h2 className="text-lg font-semibold mb-1">Ziua a fost închisă</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })} — Venit total: <strong>{formatRON(todaySummary.totalRevenue)}</strong>
                </p>
                <Button variant="outline" size="sm" onClick={() => setDayClosed(false)}>Redeschide</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Transaction receipt modal */}
      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Bon fiscal — #{selectedTx?.id}</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-3 text-sm font-mono">
              <div className="text-center border-b pb-3">
                <p className="font-bold text-base">Salon Demo ASESOR</p>
                <p className="text-xs text-muted-foreground">{new Date(selectedTx.date).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })} {selectedTx.time}</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Client</span><span>{selectedTx.clientName}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Angajat</span><span>{selectedTx.staffName}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Metodă plată</span><span>{PAYMENT_LABELS[selectedTx.paymentMethod]}</span></div>
              </div>
              <Separator />
              <div className="space-y-1">
                {selectedTx.services.map(s => (
                  <div key={s} className="flex justify-between text-xs"><span>{s}</span></div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1">
                {selectedTx.discount > 0 && (
                  <div className="flex justify-between text-xs text-orange-500"><span>Reducere</span><span>-{formatRON(selectedTx.discount)}</span></div>
                )}
                {selectedTx.tip > 0 && (
                  <div className="flex justify-between text-xs text-amber-500"><span>Bacșiș</span><span>+{formatRON(selectedTx.tip)}</span></div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t">
                  <span>TOTAL</span><span>{formatRON(selectedTx.amount + selectedTx.tip)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" className="gap-2"><Printer className="h-4 w-4" />Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
