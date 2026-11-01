"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Turnstile } from "@/components/auth/turnstile"
import { AuthShell } from "@/components/auth/auth-shell"
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
    <AuthShell title="Intră în cont" subtitle="Intră în contul tău ASESOR.">
      {!configured && <div className="au-alert">Autentificarea va fi disponibilă în curând.</div>}

      {error && (
        <div role="alert" className="au-alert err" style={{ marginTop: 18 }}>
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="au-alert" style={{ marginTop: 18 }}>
          {notice}
        </div>
      )}

      <form onSubmit={handlePasswordSignIn} className="au-form">
        <div className="au-field">
          <label className="au-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            disabled={!configured || loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="au-input"
          />
        </div>
        <div className="au-field">
          <div className="au-labelrow">
            <label className="au-label" htmlFor="password">
              Parolă
            </label>
            <Link href="/forgot-password" className="au-inline" style={{ fontSize: 13 }}>
              Ai uitat parola?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={!configured || loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="au-input"
          />
        </div>

        <Turnstile onToken={setCaptchaToken} />

        <button type="submit" disabled={!configured || loading} className="au-btn">
          {loading ? "Se autentifică…" : "Autentificare"}
        </button>
      </form>

      <div className="au-hr" style={{ marginTop: 22, marginBottom: 16 }}>
        <span>sau</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          type="button"
          disabled={!configured || loading || !email}
          onClick={handleMagicLink}
          className="au-btn2"
        >
          Trimite-mi un link de autentificare
        </button>
        <button
          type="button"
          disabled={!configured || loading}
          onClick={handleGoogle}
          className="au-btn2"
        >
          <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" aria-hidden="true">
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
        </button>
      </div>

      <p className="au-alt">
        Nu ai cont?{" "}
        <Link href="/register">Creează un cont gratuit</Link>
      </p>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
