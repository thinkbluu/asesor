"use client"

import { useState, useTransition, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { Download, Plus, Undo2, Lock, LockOpen, FileText, Trash2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { Aal2Dialog } from "@/components/app/aal2-dialog"
import type { FinanciarState } from "@/lib/data/financiar-state"
import {
  PAYMENT_LABELS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_COLORS,
  FREQUENCY_LABELS,
  formatRON,
  formatRONShort,
  type TransactionView,
  type ExpenseView,
  type PaymentMethod,
  type ExpenseCategory,
  type ExpenseFrequency,
  type FinReport,
} from "@/lib/mappers/financiar"
import {
  listTransactionsAction,
  listExpensesAction,
  listDayClosesAction,
  refundTransactionAction,
  saveExpenseAction,
  deleteExpenseAction,
  uploadReceiptAction,
  getReceiptUrlAction,
  getDayTotalsAction,
  closeDayAction,
  reopenDayAction,
  getReportAction,
  exportCsvAction,
} from "@/app/app/financiar/actions"

const STATUS_LABELS: Record<string, string> = {
  incasat: "Încasat",
  rambursata: "Rambursat",
  in_asteptare: "În așteptare",
}

const todayIso = () => new Date().toISOString().slice(0, 10)
const monthStart = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
const monthEnd = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
}

export function FinanciarView(props: {
  role: "owner" | "manager"
  state: FinanciarState
}) {
  const { role, state } = props
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(monthEnd())
  const [staffFilter, setStaffFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [transactions, setTransactions] = useState(state.transactions)
  const [expenses, setExpenses] = useState(state.expenses)
  const [dayCloses, setDayCloses] = useState(state.dayCloses)
  const [report, setReport] = useState<FinReport | null>(state.report)
  const [refundTarget, setRefundTarget] = useState<TransactionView | null>(null)
  const [refundReason, setRefundReason] = useState("")
  const [expenseForm, setExpenseForm] = useState<ExpenseForm | null>(null)

  const reloadTransactions = () => {
    startTransition(async () => {
      const res = await listTransactionsAction({
        from,
        to,
        staffId: staffFilter === "all" ? undefined : staffFilter,
        method: methodFilter === "all" ? undefined : (methodFilter as PaymentMethod),
      })
      if (res.ok) setTransactions(res.data.items)
      else toast.error(res.error)
    })
  }

  const reloadExpenses = () => {
    startTransition(async () => {
      const res = await listExpensesAction({ from, to })
      if (res.ok) setExpenses(res.data.items)
      else toast.error(res.error)
    })
  }

  const reloadReport = () => {
    startTransition(async () => {
      const res = await getReportAction(from, to)
      if (res.ok) setReport(res.data.report)
      else toast.error(res.error)
    })
  }

  const closedDays = useMemo(
    () => new Set(dayCloses.filter((c) => !c.reopenedAt).map((c) => c.day)),
    [dayCloses],
  )

  const downloadCsv = (kind: "transactions" | "expenses") => {
    startTransition(async () => {
      const res = await exportCsvAction(kind, from, to)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      const blob = new Blob([res.data.csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = res.data.filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Export descărcat.")
    })
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Financiar</h1>
          <p className="text-sm text-muted-foreground">
            {state.recurringGenerated > 0
              ? `${state.recurringGenerated} cheltuieli recurente au fost generate astăzi.`
              : "Tranzacții, cheltuieli, închiderea zilei și rapoarte."}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">De la</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Până la</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" />
          </div>
          <Button variant="outline" size="sm" disabled={pending} onClick={() => { reloadTransactions(); reloadExpenses(); reloadReport() }}>
            Actualizează
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tranzactii">
        <TabsList>
          <TabsTrigger value="tranzactii">Tranzacții</TabsTrigger>
          <TabsTrigger value="cheltuieli">Cheltuieli</TabsTrigger>
          <TabsTrigger value="zile">Închiderea zilei</TabsTrigger>
          <TabsTrigger value="rapoarte">Rapoarte</TabsTrigger>
        </TabsList>

        {/* ─── Tranzacții ─────────────────────────────────────────── */}
        <TabsContent value="tranzactii" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toți specialiștii</SelectItem>
                {state.staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate metodele</SelectItem>
                <SelectItem value="numerar">Numerar</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" disabled={pending} onClick={reloadTransactions}>
              Filtrează
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" disabled={pending} onClick={() => downloadCsv("transactions")}>
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Servicii</TableHead>
                    <TableHead className="hidden lg:table-cell">Specialist</TableHead>
                    <TableHead className="text-right">Suma</TableHead>
                    <TableHead className="hidden md:table-cell">Metodă</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                        Nicio tranzacție în perioada selectată.
                      </TableCell>
                    </TableRow>
                  )}
                  {transactions.map((t) => (
                    <TransactionRow key={t.id} t={t} dayClosed={closedDays.has(t.day)} pending={pending}
                      onRefund={() => setRefundTarget(t)} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Cheltuieli ─────────────────────────────────────────── */}
        <TabsContent value="cheltuieli" className="space-y-3">
          <div className="flex justify-between">
            <Button size="sm" onClick={() => setExpenseForm(emptyExpense)}>
              <Plus className="h-4 w-4 mr-1.5" /> Adaugă cheltuială
            </Button>
            <Button variant="outline" size="sm" disabled={pending} onClick={() => downloadCsv("expenses")}>
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead className="hidden md:table-cell">Descriere</TableHead>
                    <TableHead className="text-right">Suma</TableHead>
                    <TableHead className="hidden md:table-cell">Frecvență</TableHead>
                    <TableHead>Chitanță</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                        Nicio cheltuială în perioada selectată.
                      </TableCell>
                    </TableRow>
                  )}
                  {expenses.map((e) => (
                    <ExpenseRow key={e.id} e={e} pending={pending}
                      onEdit={() => setExpenseForm({
                        id: e.id, spentOn: e.spentOn, category: e.category,
                        description: e.description, amount: String(e.amount),
                        frequency: e.frequency, notes: e.notes,
                      })}
                      onDelete={() => {
                        startTransition(async () => {
                          const res = await deleteExpenseAction(e.id)
                          if (res.ok) { toast.success("Cheltuiala a fost ștearsă."); reloadExpenses() }
                          else toast.error(res.error)
                        })
                      }}
                      onViewReceipt={() => {
                        if (!e.receiptPath) return
                        startTransition(async () => {
                          const res = await getReceiptUrlAction(e.receiptPath!)
                          if (res.ok) window.open(res.data.url, "_blank", "noopener")
                          else toast.error(res.error)
                        })
                      }}
                      onReceiptPicked={(file) => {
                        startTransition(async () => {
                          const fd = new FormData()
                          fd.set("file", file)
                          const res = await uploadReceiptAction(e.id, fd)
                          if (res.ok) { toast.success("Chitanța a fost încărcată."); reloadExpenses() }
                          else toast.error(res.error)
                        })
                      }}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Închiderea zilei ───────────────────────────────────── */}
        <TabsContent value="zile" className="space-y-3">
          <DayCloseTab
            role={role}
            dayCloses={dayCloses}
            pending={pending}
            onClosed={() => {
              startTransition(async () => {
                const res = await listDayClosesAction()
                if (res.ok) setDayCloses(res.data.items)
                router.refresh()
              })
            }}
          />
        </TabsContent>

        {/* ─── Rapoarte ───────────────────────────────────────────── */}
        <TabsContent value="rapoarte" className="space-y-4">
          {!report ? (
            <p className="text-sm text-muted-foreground">Niciun raport disponibil.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-1"><CardTitle className="text-sm font-medium">Venit total</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{formatRON(report.byDay.reduce((s, d) => s + d.revenue, 0))}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1"><CardTitle className="text-sm font-medium">Bilete medii</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{formatRON(report.avgTicket)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1"><CardTitle className="text-sm font-medium">Rambursări</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-red-600">
                      {formatRON(report.refunds.reduce((s, d) => s + d.amount, 0))}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-sm">Venituri pe zi</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.byDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(8)} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatRONShort(v).replace(" Lei", "")} />
                      <Tooltip formatter={(v: number) => formatRON(v)} />
                      <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Pe specialist</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {report.byStaff.length === 0 && <p className="text-sm text-muted-foreground">Nicio încasare.</p>}
                    {report.byStaff.map((s) => (
                      <div key={s.staffId ?? s.staffName} className="flex items-center justify-between text-sm">
                        <span>{s.staffName} <span className="text-muted-foreground">({s.count})</span></span>
                        <span className="font-medium">{formatRON(s.revenue)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Mix de plată</CardTitle></CardHeader>
                  <CardContent className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={report.paymentMix}
                          dataKey="revenue"
                          nameKey="paymentMethod"
                          innerRadius={40}
                          outerRadius={70}
                        >
                          {report.paymentMix.map((entry, i) => (
                            <Cell key={i} fill={["#16a34a", "#2563eb", "#a855f7"][i % 3]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatRON(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-3 text-xs text-muted-foreground">
                      {report.paymentMix.map((m) => (
                        <span key={m.paymentMethod}>{PAYMENT_LABELS[m.paymentMethod]}: {formatRON(m.revenue)}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-sm">Pe serviciu</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {report.byService.length === 0 && <p className="text-sm text-muted-foreground">Nicio încasare.</p>}
                  {report.byService.slice(0, 10).map((s) => (
                    <div key={s.serviceName} className="flex items-center justify-between text-sm">
                      <span>{s.serviceName} <span className="text-muted-foreground">({s.count})</span></span>
                      <span className="font-medium">{formatRON(s.revenue)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Refund dialog */}
      <Dialog open={refundTarget !== null} onOpenChange={(o) => !o && setRefundTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rambursează tranzacția</DialogTitle>
          </DialogHeader>
          {refundTarget && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {refundTarget.clientName} — {formatRON(refundTarget.amount)} ({PAYMENT_LABELS[refundTarget.paymentMethod]})
              </p>
              <div className="space-y-1">
                <Label>Motivul rambursării</Label>
                <Textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTarget(null)}>Anulează</Button>
            <Button
              variant="destructive"
              disabled={pending || refundReason.trim().length < 3}
              onClick={() => {
                const t = refundTarget!
                startTransition(async () => {
                  const res = await refundTransactionAction({ id: t.id, reason: refundReason.trim() })
                  if (res.ok) {
                    toast.success("Tranzacția a fost rambursată.")
                    setRefundTarget(null)
                    setRefundReason("")
                    reloadTransactions()
                  } else toast.error(res.error)
                })
              }}
            >
              {pending ? "Se procesează…" : "Rambursează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense dialog */}
      <Dialog open={expenseForm !== null} onOpenChange={(o) => !o && setExpenseForm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{expenseForm?.id ? "Editează cheltuiala" : "Adaugă cheltuială"}</DialogTitle>
          </DialogHeader>
          {expenseForm && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Data</Label>
                <Input type="date" value={expenseForm.spentOn}
                  onChange={(e) => setExpenseForm({ ...expenseForm, spentOn: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Categorie</Label>
                <Select value={expenseForm.category}
                  onValueChange={(v: ExpenseCategory) => setExpenseForm({ ...expenseForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
                      <SelectItem key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Descriere</Label>
                <Input value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Suma (RON)</Label>
                <Input type="number" min="0" step="0.01" value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Frecvență</Label>
                <Select value={expenseForm.frequency}
                  onValueChange={(v: ExpenseFrequency) => setExpenseForm({ ...expenseForm, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FREQUENCY_LABELS) as ExpenseFrequency[]).map((f) => (
                      <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Note</Label>
                <Textarea rows={2} value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseForm(null)}>Anulează</Button>
            <Button
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const res = await saveExpenseAction({
                    id: expenseForm!.id || undefined,
                    spentOn: expenseForm!.spentOn,
                    category: expenseForm!.category,
                    description: expenseForm!.description,
                    amount: expenseForm!.amount,
                    frequency: expenseForm!.frequency,
                    notes: expenseForm!.notes,
                  })
                  if (res.ok) {
                    toast.success("Cheltuiala a fost salvată.")
                    setExpenseForm(null)
                    reloadExpenses()
                  } else toast.error(res.error)
                })
              }}
            >
              {pending ? "Se salvează…" : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TransactionRow(props: {
  t: TransactionView
  dayClosed: boolean
  pending: boolean
  onRefund: () => void
}) {
  const { t, dayClosed, pending, onRefund } = props
  return (
    <TableRow className={t.status === "rambursata" ? "opacity-60" : undefined}>
      <TableCell className="text-sm whitespace-nowrap">
        {t.day.slice(8)}.{t.day.slice(5, 7)}.{t.day.slice(0, 4)}
        <span className="text-muted-foreground ml-1">{t.paidAt.slice(11, 16)}</span>
      </TableCell>
      <TableCell className="text-sm">{t.clientName}</TableCell>
      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-48 truncate">
        {t.services.join(", ") || "—"}
      </TableCell>
      <TableCell className="hidden lg:table-cell text-sm">{t.staffName}</TableCell>
      <TableCell className="text-right text-sm font-medium">
        {formatRON(t.amount)}
        {t.tip > 0 && <span className="block text-xs text-muted-foreground">+ {formatRON(t.tip)} bacșiș</span>}
      </TableCell>
      <TableCell className="hidden md:table-cell text-sm">{PAYMENT_LABELS[t.paymentMethod]}</TableCell>
      <TableCell>
        <Badge variant={t.status === "incasat" ? "default" : "secondary"} className="text-xs">
          {STATUS_LABELS[t.status]}
        </Badge>
      </TableCell>
      <TableCell>
        {t.status === "incasat" && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={pending}
            title={dayClosed ? "Ziua a fost închisă. Redeschiderea se face doar de proprietar." : "Rambursează"}
            onClick={onRefund}>
            <Undo2 className={cn("h-4 w-4", dayClosed && "text-muted-foreground")} />
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

function ExpenseRow(props: {
  e: ExpenseView
  pending: boolean
  onEdit: () => void
  onDelete: () => void
  onViewReceipt: () => void
  onReceiptPicked: (file: File) => void
}) {
  const { e, pending, onEdit, onDelete, onViewReceipt, onReceiptPicked } = props
  return (
    <TableRow>
      <TableCell className="text-sm whitespace-nowrap">
        {e.spentOn.slice(8)}.{e.spentOn.slice(5, 7)}.{e.spentOn.slice(0, 4)}
      </TableCell>
      <TableCell className="text-sm">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: EXPENSE_CATEGORY_COLORS[e.category] }} />
          {EXPENSE_CATEGORY_LABELS[e.category]}
        </span>
      </TableCell>
      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-56 truncate">
        {e.description || "—"}
      </TableCell>
      <TableCell className="text-right text-sm font-medium">{formatRON(e.amount)}</TableCell>
      <TableCell className="hidden md:table-cell text-sm">{FREQUENCY_LABELS[e.frequency]}</TableCell>
      <TableCell>
        {e.receiptPath ? (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" disabled={pending} onClick={onViewReceipt}>
            <Eye className="h-3.5 w-3.5 mr-1" /> Vezi
          </Button>
        ) : (
          <label className="cursor-pointer">
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden"
              onChange={(ev) => {
                const f = ev.target.files?.[0]
                if (f) onReceiptPicked(f)
                ev.target.value = ""
              }} />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <FileText className="h-3.5 w-3.5" /> Încarcă
            </span>
          </label>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={pending} onClick={onEdit}>
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" disabled={pending} onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function DayCloseTab(props: {
  role: "owner" | "manager"
  dayCloses: FinanciarState["dayCloses"]
  pending: boolean
  onClosed: () => void
}) {
  const { role, dayCloses, pending, onClosed } = props
  const [day, setDay] = useState(todayIso())
  const [totals, setTotals] = useState<{ numerar: number; card: number; transfer: number; tips: number; discounts: number } | null>(null)
  const [closed, setClosed] = useState(false)
  const [counted, setCounted] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [aal2Open, setAal2Open] = useState(false)
  const reopenRef = useRef<() => void>(() => {})

  const load = (d: string) => {
    setLoading(true)
    void (async () => {
      const res = await getDayTotalsAction(d)
      setLoading(false)
      if (res.ok) {
        setTotals(res.data.totals)
        setClosed(res.data.closed)
        setCounted(res.data.totals.numerar.toFixed(2))
      } else toast.error(res.error)
    })()
  }

  // Load on mount and whenever the selected day changes.
  useEffect(() => { load(day) }, [day])
  const effectiveDiff = totals ? (Number(counted || 0) - totals.numerar) : 0

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Închiderea zilei
            {closed && <Badge variant="secondary" className="text-xs"><Lock className="h-3 w-3 mr-1" />Închisă</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Ziua</Label>
              <Input type="date" value={day} onChange={(e) => { setDay(e.target.value); load(e.target.value) }} />
            </div>
          </div>
          {loading || !totals ? (
            <p className="text-sm text-muted-foreground">Se încarcă totalurile…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border p-2">
                  <p className="text-xs text-muted-foreground">Numerar</p>
                  <p className="font-medium">{formatRON(totals.numerar)}</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="text-xs text-muted-foreground">Card</p>
                  <p className="font-medium">{formatRON(totals.card)}</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="text-xs text-muted-foreground">Transfer</p>
                  <p className="font-medium">{formatRON(totals.transfer)}</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="text-xs text-muted-foreground">Bacșiș</p>
                  <p className="font-medium">{formatRON(totals.tips)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Numerar numărat (RON)</Label>
                <Input type="number" step="0.01" min="0" value={counted}
                  onChange={(e) => setCounted(e.target.value)} disabled={closed} />
              </div>
              <p className={cn("text-sm", effectiveDiff === 0 ? "text-muted-foreground" : effectiveDiff > 0 ? "text-emerald-600" : "text-red-600")}>
                Diferență: {formatRON(effectiveDiff)}
              </p>
              <div className="space-y-1">
                <Label>Note</Label>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={closed} />
              </div>
              {closed ? (
                role === "owner" && (
                  <Button variant="outline" disabled={pending}
                    onClick={() => {
                      void (async () => {
                        const res = await reopenDayAction({ day })
                        if (res.ok) { toast.success("Ziua a fost redeschisă."); setClosed(false); onClosed() }
                        else if ("needsMfa" in res) {
                          reopenRef.current = () => {
                            void (async () => {
                              const retry = await reopenDayAction({ day })
                              if (retry.ok) { toast.success("Ziua a fost redeschisă."); setClosed(false); onClosed() }
                              else if (!("needsMfa" in retry)) toast.error(retry.error)
                            })()
                          }
                          setAal2Open(true)
                        }
                        else toast.error(res.error)
                      })()
                    }}>
                    <LockOpen className="h-4 w-4 mr-1.5" /> Redeschide ziua
                  </Button>
                )
              ) : (
                <Button disabled={pending}
                  onClick={() => {
                    void (async () => {
                      const res = await closeDayAction({ day, cashCounted: Number(counted || 0), notes })
                      if (res.ok) { toast.success("Ziua a fost închisă."); setClosed(true); onClosed() }
                      else toast.error(res.error)
                    })()
                  }}>
                  <Lock className="h-4 w-4 mr-1.5" /> Închide ziua
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Zile închise recent</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {dayCloses.length === 0 && <p className="text-sm text-muted-foreground">Nicio zi închisă încă.</p>}
          {dayCloses.slice(0, 15).map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
              <span>
                {c.day.slice(8)}.{c.day.slice(5, 7)}.{c.day.slice(0, 4)}
                {c.reopenedAt && <Badge variant="outline" className="ml-2 text-xs">Redeschisă</Badge>}
              </span>
              <span className="text-muted-foreground">
                Numerar {formatRON(c.totals.numerar)}
                {c.difference != null && (
                  <span className={cn("ml-2", c.difference === 0 ? "" : c.difference > 0 ? "text-emerald-600" : "text-red-600")}>
                    ({c.difference > 0 ? "+" : ""}{c.difference.toFixed(2)})
                  </span>
                )}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Aal2Dialog
        open={aal2Open}
        onOpenChange={setAal2Open}
        onVerified={() => reopenRef.current()}
      />
    </div>
  )
}

// ─── Shared form shape ───────────────────────────────────────────────────────

interface ExpenseForm {
  id?: string
  spentOn: string
  category: ExpenseCategory
  description: string
  amount: string
  frequency: ExpenseFrequency
  notes: string
}

const emptyExpense: ExpenseForm = {
  id: undefined,
  spentOn: todayIso(),
  category: "altele",
  description: "",
  amount: "",
  frequency: "unica",
  notes: "",
}
