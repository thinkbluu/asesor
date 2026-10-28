"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Turnstile } from "@/components/auth/turnstile"
import { isSupabaseConfigured, createSupabaseBrowserClient } from "@/lib/supabase/client"
import { mapAuthError } from "@/lib/auth/errors"

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured()
  const [email, setEmail] = useState("")
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configured || loading) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
        ...(captchaToken ? { captchaToken } : {}),
      })
      if (error) {
        setError(mapAuthError(error))
        setCaptchaToken(null)
        return
      }
      setSent(true)
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
            Recuperare<br />
            <span className="text-[#2D8C3C]">cont.</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-sm">
            Îți trimitem un link de resetare a parolei.
          </p>
        </div>
        <p className="text-white/30 text-sm">© 2025 ASESOR. Toate drepturile rezervate.</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[#F7F5F2] px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">Resetare parolă</h2>
          <p className="mt-1 text-sm text-black/50">
            Introdu adresa de email și îți vom trimite un link de resetare.
          </p>

          {!configured && (
            <div className="mt-6 rounded-lg bg-black/5 px-4 py-3 text-sm text-black/60">
              Autentificarea va fi disponibilă în curând.
            </div>
          )}

          {sent ? (
            <div
              role="status"
              className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 border border-green-100"
            >
              Ți-am trimis instrucțiunile de resetare. Verifică-ți emailul (și folderul Spam).
            </div>
          ) : (
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={!configured || loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Turnstile onToken={setCaptchaToken} />
              <Button
                type="submit"
                disabled={!configured || loading}
                className="w-full bg-[#0A0A0A] text-white hover:bg-[#0A0A0A]/90"
              >
                {loading ? "Se trimite…" : "Trimite linkul de resetare"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-black/50">
            <Link href="/login" className="font-medium text-[#2D8C3C] hover:underline">
              Înapoi la autentificare
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
