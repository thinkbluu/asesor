"use client"

import { useState } from "react"
import Link from "next/link"
import { Turnstile } from "@/components/auth/turnstile"
import { AuthShell } from "@/components/auth/auth-shell"
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
    <AuthShell
      title="Ai uitat parola?"
      subtitle="Introdu adresa de email și îți vom trimite un link de resetare."
    >
      {!configured && <div className="au-alert" style={{ marginTop: 18 }}>Autentificarea va fi disponibilă în curând.</div>}

      {sent ? (
        <div role="status" className="au-alert" style={{ marginTop: 18 }}>
          Ți-am trimis instrucțiunile de resetare. Verifică-ți emailul (și folderul Spam).
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="au-form">
          {error && (
            <div role="alert" className="au-alert err">
              {error}
            </div>
          )}
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
          <Turnstile onToken={setCaptchaToken} />
          <button type="submit" disabled={!configured || loading} className="au-btn">
            {loading ? "Se trimite…" : "Trimite linkul de resetare"}
          </button>
        </form>
      )}

      <p className="au-alt">
        <Link href="/login">Înapoi la autentificare</Link>
      </p>
    </AuthShell>
  )
}
