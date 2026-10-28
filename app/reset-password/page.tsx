"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isSupabaseConfigured, createSupabaseBrowserClient } from "@/lib/supabase/client"
import { mapAuthError } from "@/lib/auth/errors"

export default function ResetPasswordPage() {
  const configured = isSupabaseConfigured()
  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!configured) {
      setReady(true)
      return
    }
    createSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        setHasSession(Boolean(user))
        setReady(true)
      })
  }, [configured])

  const passwordTooShort = password.length > 0 && password.length < 10
  const mismatch = confirm.length > 0 && confirm !== password

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configured || loading || password.length < 10 || password !== confirm) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(mapAuthError(error))
        return
      }
      setDone(true)
    } catch {
      setError("A apărut o eroare neașteptată. Încearcă din nou.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#0A0A0A] p-12">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/asesor-logo.png"
            alt="ASESOR"
            className="h-9 w-9 rounded-full bg-white object-cover ring-1 ring-white/20 shrink-0"
          />
          <span className="text-xl font-semibold text-white tracking-tight">ASESOR</span>
        </Link>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Parolă nouă.<br />
            <span className="text-[#2D8C3C]">Cont securizat.</span>
          </h1>
        </div>
        <p className="text-white/30 text-sm">© 2025 ASESOR. Toate drepturile rezervate.</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[#F7F5F2] px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">Setează o parolă nouă</h2>

          {!configured && (
            <div className="mt-6 rounded-lg bg-black/5 px-4 py-3 text-sm text-black/60">
              Autentificarea va fi disponibilă în curând.
            </div>
          )}

          {configured && !ready && (
            <p className="mt-6 text-sm text-black/50">Se verifică linkul…</p>
          )}

          {configured && ready && !hasSession && !done && (
            <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
              Linkul a expirat. Cere unul nou.
              <div className="mt-2">
                <Link href="/forgot-password" className="font-medium underline">
                  Solicită alt link
                </Link>
              </div>
            </div>
          )}

          {done ? (
            <div
              role="status"
              className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 border border-green-100"
            >
              Parola a fost schimbată. Te poți autentifica cu parola nouă.
              <div className="mt-2">
                <Link href="/login" className="font-medium underline">
                  Mergi la autentificare
                </Link>
              </div>
            </div>
          ) : (
            configured && ready && hasSession && (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100"
                  >
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="password">Parolă nouă</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={10}
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-black/40">
                    {passwordTooShort
                      ? "Parola trebuie să aibă cel puțin 10 caractere."
                      : "Minim 10 caractere."}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirmă parola</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  {mismatch && <p className="text-xs text-red-600">Parolele nu coincid.</p>}
                </div>
                <Button
                  type="submit"
                  disabled={loading || passwordTooShort || mismatch}
                  className="w-full bg-[#0A0A0A] text-white hover:bg-[#0A0A0A]/90"
                >
                  {loading ? "Se salvează…" : "Salvează parola nouă"}
                </Button>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  )
}
