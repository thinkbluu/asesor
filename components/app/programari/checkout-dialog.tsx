"use client"

import { useState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatRON } from "@/lib/mappers/financiar"
import type { Appointment } from "@/lib/mappers/programari"
import { checkoutAction, getClientLoyaltyAction } from "@/app/app/financiar/actions"

const METHODS = [
  { value: "numerar", label: "Numerar" },
  { value: "card", label: "Card" },
  { value: "transfer", label: "Transfer" },
] as const

/**
 * "Încasează" — finishing an appointment with payment. Services and prices
 * come prefilled from the appointment; the server action calls the atomic
 * checkout RPC (day lock, loyalty redemption, transaction rows, status →
 * finalizat in one transaction).
 */
export function CheckoutDialog(props: {
  apt: Appointment | null
  onClose: () => void
  onDone: () => void
}) {
  const { apt, onClose, onDone } = props
  const [pending, startTransition] = useTransition()

  const [discount, setDiscount] = useState("0")
  const [tip, setTip] = useState("0")
  const [method1, setMethod1] = useState("numerar")
  const [amount1, setAmount1] = useState("")
  const [split, setSplit] = useState(false)
  const [method2, setMethod2] = useState("card")
  const [amount2, setAmount2] = useState("")
  const [redeemPoints, setRedeemPoints] = useState("0")
  const [loyalty, setLoyalty] = useState<{ points: number; ronPerPoint: number } | null>(null)

  const servicesTotal = apt ? apt.services.reduce((s, x) => s + x.price, 0) : 0
  const appointmentDiscount = apt
    ? apt.discountType === "procent"
      ? (servicesTotal * apt.discount) / 100
      : apt.discount
    : 0
  const redeemLei = loyalty && loyalty.ronPerPoint > 0 ? Number(redeemPoints || 0) * loyalty.ronPerPoint : 0
  const base = Math.max(servicesTotal - appointmentDiscount - Number(discount || 0) - redeemLei, 0)
  const total = Math.round(base * 100) / 100

  // Prefill the split amounts when the toggle turns on.
  useEffect(() => {
    if (split && apt) {
      const half = Math.round((total / 2) * 100) / 100
      setAmount1((total - half).toFixed(2))
      setAmount2(half.toFixed(2))
    } else if (apt) {
      setAmount1(total.toFixed(2))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [split, apt?.id, total])

  // Fetch the client's loyalty balance when the dialog opens.
  useEffect(() => {
    setLoyalty(null)
    setRedeemPoints("0")
    if (!apt?.clientId) return
    void (async () => {
      const res = await getClientLoyaltyAction(apt.clientId!)
      if (res.ok) setLoyalty(res.data)
    })()
  }, [apt?.clientId])

  if (!apt) return null

  const maxRedeem = loyalty && loyalty.ronPerPoint > 0
    ? Math.min(loyalty.points, Math.ceil(base / loyalty.ronPerPoint))
    : 0

  const submit = () => {
    startTransition(async () => {
      const res = await checkoutAction({
        appointmentId: apt.id,
        discount: Number(discount || 0),
        tip: Number(tip || 0),
        method1,
        amount1: split ? Number(amount1 || 0) : total,
        split,
        method2: split ? method2 : undefined,
        amount2: split ? Number(amount2 || 0) : undefined,
        redeemPoints: Number(redeemPoints || 0),
      })
      if (res.ok) {
        toast.success(`Încasare finalizată: ${formatRON(res.data.total)}.`)
        onClose()
        onDone()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Dialog open={!!apt} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Încasează — {apt.clientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Services prefilled from the appointment */}
          <div className="rounded-md border p-2 space-y-1">
            {apt.services.map((s, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{s.name}</span>
                <span>{formatRON(s.price)}</span>
              </div>
            ))}
            {appointmentDiscount > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Reducere programare</span>
                <span>− {formatRON(appointmentDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-medium border-t pt-1">
              <span>De încasat</span>
              <span>{formatRON(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Reducere suplimentară (RON)</Label>
              <Input type="number" min="0" step="0.01" value={discount}
                onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bacșiș (RON)</Label>
              <Input type="number" min="0" step="0.01" value={tip}
                onChange={(e) => setTip(e.target.value)} />
            </div>
          </div>

          {loyalty && loyalty.ronPerPoint > 0 && loyalty.points > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">
                Răscumpără puncte ({loyalty.points} disponibile · 1 punct = {formatRON(loyalty.ronPerPoint)})
              </Label>
              <Input type="number" min="0" max={maxRedeem} value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)} />
              {redeemLei > 0 && (
                <p className="text-xs text-muted-foreground">Reducere din puncte: {formatRON(redeemLei)}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Metodă de plată</Label>
              <Select value={method1} onValueChange={setMethod1}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Suma (RON)</Label>
              <Input type="number" min="0" step="0.01" value={amount1}
                onChange={(e) => setAmount1(e.target.value)} disabled={!split} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={split} onCheckedChange={setSplit} id="split-payment" />
            <Label htmlFor="split-payment" className="text-sm">Plată împărțită pe două metode</Label>
          </div>

          {split && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">A doua metodă</Label>
                <Select value={method2} onValueChange={setMethod2}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Suma a doua (RON)</Label>
                <Input type="number" min="0" step="0.01" value={amount2}
                  onChange={(e) => setAmount2(e.target.value)} />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          <Button disabled={pending} onClick={submit}>
            {pending ? "Se procesează…" : `Încasează ${formatRON(total)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
