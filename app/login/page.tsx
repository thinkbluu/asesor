"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Turnstile } from "@/components/auth/turnstile"
import { isSupabaseConfigured, createSupabaseBrowserClient } from "@/lib/supabase/client"
import { mapAuthError } from "@/lib/auth/errors"

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/app"
  const configured = isSupabaseConfigured()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    // /auth/callback bounces expired/invalid links back here.
    searchParams.get("error") === "expired_link" ? "Linkul a expirat. Cere unul nou." : null,
  )
  const [notice, setNotice] = useState<string | null>(null)

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app"

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configured || loading) return
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        ...(captchaToken ? { captchaToken } : {}),
      })
      if (error) {
        setError(mapAuthError(error))
        setCaptchaToken(null)
        return
      }
      window.location.assign(safeNext)
    } catch {
      setError("A apărut o eroare neașteptată. Încearcă din nou.")
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!configured || loading || !email) return
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          ...(captchaToken ? { captchaToken } : {}),
        },
      })
      if (error) {
        setError(mapAuthError(error))
        setCaptchaToken(null)
        return
      }
      setNotice("Ți-am trimis un link de autentificare. Verifică-ți emailul.")
    } catch {
      setError("A apărut o eroare neașteptată. Încearcă din nou.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    if (!configured || loading) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
        },
      })
      if (error) setError(mapAuthError(error))
    } catch {
      setError("A apărut o eroare neașteptată. Încearcă din nou.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">Autentificare</h2>
      <p className="mt-1 text-sm text-black/50">Intră în contul tău ASESOR.</p>

      {!configured && (
        <div className="mt-6 rounded-lg bg-black/5 px-4 py-3 text-sm text-black/60">
          Autentificarea va fi disponibilă în curând.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 border border-green-100"
        >
          {notice}
        </div>
      )}

      <form onSubmit={handlePasswordSignIn} className="mt-6 space-y-4">
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
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Parolă</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#2D8C3C] hover:underline"
            >
              Ai uitat parola?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={!configured || loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Turnstile onToken={setCaptchaToken} />

        <Button
          type="submit"
          disabled={!configured || loading}
          className="w-full bg-[#0A0A0A] text-white hover:bg-[#0A0A0A]/90"
        >
          {loading ? "Se autentifică…" : "Autentificare"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-black/10" />
        <span className="text-xs text-black/40">sau</span>
        <div className="h-px flex-1 bg-black/10" />
      </div>

      <div className="space-y-2.5">
        <Button
          type="button"
          variant="outline"
          disabled={!configured || loading || !email}
          onClick={handleMagicLink}
          className="w-full"
        >
          Trimite-mi un link de autentificare
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!configured || loading}
          onClick={handleGoogle}
          className="w-full"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z"
            />
          </svg>
          Continuă cu Google
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-black/50">
        Nu ai cont?{" "}
        <Link href="/register" className="font-medium text-[#2D8C3C] hover:underline">
          Creează un cont gratuit
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
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
            Salonul tău.<br />
            <span className="text-[#2D8C3C]">Controlul tău.</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-sm">
            Programări, clienți, echipă și venituri — totul într-un singur loc.
          </p>
        </div>
        <p className="text-white/30 text-sm">© 2025 ASESOR. Toate drepturile rezervate.</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[#F7F5F2] px-6 py-12">
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex lg:hidden items-center gap-2 mb-2">
            <img
              src="/asesor-logo.png"
              alt="ASESOR"
              className="h-9 w-9 rounded-full bg-[#0A0A0A] object-contain p-1 ring-1 ring-black/10 shrink-0"
            />
            <span className="text-xl font-semibold text-[#0A0A0A] tracking-tight">ASESOR</span>
          </div>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
