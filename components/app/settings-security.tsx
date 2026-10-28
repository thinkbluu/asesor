"use client"

// "Securitate" tab: optional TOTP MFA (enroll with QR, verify, unenroll) and
// account self-service (sign out everywhere, change password, change email
// with re-verification).

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, ShieldOff, Loader2, LogOut, KeyRound, Mail } from "lucide-react"
import {
  getMfaStatusAction,
  enrollTotpStartAction,
  enrollTotpVerifyAction,
  unenrollTotpAction,
} from "@/lib/auth/mfa"
import {
  signOutEverywhereAction,
  changePasswordAction,
  changeEmailAction,
} from "@/lib/auth/account-actions"

export function SettingsSecurity() {
  const router = useRouter()

  // ── MFA state ──
  const [statusLoading, setStatusLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [enrollCode, setEnrollCode] = useState("")
  const [enrollPending, setEnrollPending] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)

  const loadStatus = () => {
    setStatusLoading(true)
    void (async () => {
      const res = await getMfaStatusAction()
      setStatusLoading(false)
      if (res.ok) {
        setEnrolled(res.enrolled)
        setFactorId(res.factorId)
      } else toast.error(res.error)
    })()
  }

  useEffect(() => { loadStatus() }, [])

  const startEnroll = () => {
    setEnrollError(null)
    void (async () => {
      const res = await enrollTotpStartAction()
      if (!res.ok) {
        setEnrollError(res.error)
        return
      }
      setFactorId(res.factorId)
      setQr(res.qr)
      setSecret(res.secret)
      setEnrolling(true)
    })()
  }

  const confirmEnroll = () => {
    if (!factorId) return
    setEnrollPending(true)
    setEnrollError(null)
    void (async () => {
      const res = await enrollTotpVerifyAction(factorId, enrollCode)
      setEnrollPending(false)
      if (!res.ok) {
        setEnrollError(res.error)
        return
      }
      toast.success("Autentificarea în doi pași este activă.")
      setEnrolling(false)
      setQr(null)
      setSecret(null)
      setFactorId(null)
      setEnrollCode("")
      setEnrolled(true)
    })()
  }

  const unenroll = () => {
    if (!factorId) return
    void (async () => {
      const res = await unenrollTotpAction(factorId)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Autentificarea în doi pași a fost dezactivată.")
      setEnrolling(false)
      setQr(null)
      setSecret(null)
      setFactorId(null)
      setEnrollCode("")
      setEnrolled(false)
    })()
  }

  // ── Account state ──
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [accountPending, setAccountPending] = useState(false)

  const signOutEverywhere = () => {
    setAccountPending(true)
    void (async () => {
      const res = await signOutEverywhereAction()
      if (!res.ok) {
        setAccountPending(false)
        toast.error(res.error)
        return
      }
      window.location.assign("/login")
    })()
  }

  const changePassword = () => {
    setAccountPending(true)
    void (async () => {
      const res = await changePasswordAction({ currentPassword, newPassword })
      setAccountPending(false)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Parola a fost schimbată.")
      setCurrentPassword("")
      setNewPassword("")
    })()
  }

  const changeEmail = () => {
    setAccountPending(true)
    void (async () => {
      const res = await changeEmailAction({ currentPassword, newEmail })
      setAccountPending(false)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`Am trimis un email de confirmare la ${newEmail}. Schimbarea se aplică după confirmare.`)
      setCurrentPassword("")
      setNewEmail("")
      router.refresh()
    })()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Autentificare în doi pași (MFA)
          </CardTitle>
          <CardDescription>
            Adaugă un al doilea factor (aplicație de autentificare, cod TOTP). Când este activ,
            acțiunile sensibile — schimbarea rolurilor, eliminarea membrilor, redeschiderea zilei,
            ștergerea clienților — cer codul din 6 cifre.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusLoading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Se încarcă…
            </div>
          ) : !enrolling && !enrolled ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">Inactiv</Badge>
                <span className="text-muted-foreground">Contul tău nu are un al doilea factor.</span>
              </div>
              <Button onClick={startEnroll}>Activează MFA</Button>
            </div>
          ) : enrolled && !enrolling ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge>Activ</Badge>
                <span className="text-muted-foreground">Codul TOTP este cerut la acțiunile sensibile.</span>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (factorId) unenroll()
                  else toast.error("Reîncarcă pagina pentru a dezactiva MFA.")
                }}
              >
                <ShieldOff className="h-4 w-4 mr-1.5" /> Dezactivează
              </Button>
            </div>
          ) : null}

          {enrolling && qr ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  1. Scanează codul cu aplicația de autentificare (Google Authenticator, Authy…).
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="Cod QR pentru MFA" className="h-48 w-48 rounded-md border border-border bg-white p-2" />
                {secret ? (
                  <p className="break-all text-xs text-muted-foreground">
                    Sau introdu manual cheia: <code className="font-mono">{secret}</code>
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mfa-enroll-code">2. Introdu codul din 6 cifre</Label>
                <div className="flex gap-2">
                  <Input
                    id="mfa-enroll-code"
                    inputMode="numeric"
                    maxLength={6}
                    value={enrollCode}
                    onChange={(e) => setEnrollCode(e.target.value.replace(/\D/g, ""))}
                    className="w-32"
                  />
                  <Button onClick={confirmEnroll} disabled={enrollPending || enrollCode.length !== 6}>
                    {enrollPending ? "Se verifică…" : "Confirmă"}
                  </Button>
                  <Button variant="outline" onClick={unenroll} disabled={enrollPending}>
                    Renunță
                  </Button>
                </div>
                {enrollError ? <p className="text-sm text-destructive">{enrollError}</p> : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Schimbă parola
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cur-pass">Parola actuală</Label>
              <Input id="cur-pass" type="password" autoComplete="current-password"
                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pass">Parola nouă</Label>
              <Input id="new-pass" type="password" autoComplete="new-password"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </div>
          <Button onClick={changePassword} disabled={accountPending || !currentPassword || newPassword.length < 8}>
            Schimbă parola
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Schimbă emailul
          </CardTitle>
          <CardDescription>
            Vei primi un email de confirmare la noua adresă; schimbarea se aplică doar după ce îl
            confirmi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cur-pass-email">Parola actuală</Label>
              <Input id="cur-pass-email" type="password" autoComplete="current-password"
                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-email">Email nou</Label>
              <Input id="new-email" type="email" autoComplete="email"
                value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
          </div>
          <Button onClick={changeEmail} disabled={accountPending || !currentPassword || !newEmail}>
            Trimite confirmarea
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" /> Deconectare
          </CardTitle>
          <CardDescription>
            Închide sesiunea pe toate dispozitivele (telefon, tabletă, alte calculatoare).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={signOutEverywhere} disabled={accountPending}>
            Deconectează-te de pe toate dispozitivele
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
