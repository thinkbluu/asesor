"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AuthShell } from "@/components/auth/auth-shell"
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
    <AuthShell title="Alege o parolă nouă">
      {!configured && <div className="au-alert" style={{ marginTop: 18 }}>Autentificarea va fi disponibilă în curând.</div>}

      {configured && !ready && <p className="au-hint" style={{ marginTop: 18 }}>Se verifică linkul…</p>}

      {configured && ready && !hasSession && !done && (
        <div role="alert" className="au-alert err" style={{ marginTop: 18 }}>
          Linkul a expirat. Cere unul nou.
          <div style={{ marginTop: 8 }}>
            <Link href="/forgot-password">Solicită alt link</Link>
          </div>
        </div>
      )}

      {done ? (
        <div role="status" className="au-alert" style={{ marginTop: 18 }}>
          Parola a fost schimbată. Te poți autentifica cu parola nouă.
          <div style={{ marginTop: 8 }}>
            <Link href="/login">Mergi la autentificare</Link>
          </div>
        </div>
      ) : (
        configured &&
        ready &&
        hasSession && (
          <form onSubmit={handleSubmit} className="au-form">
            {error && (
              <div role="alert" className="au-alert err">
                {error}
              </div>
            )}
            <div className="au-field">
              <label className="au-label" htmlFor="password">
                Parolă nouă
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="au-input"
              />
              <p className={passwordTooShort ? "au-ferr" : "au-hint"}>
                {passwordTooShort
                  ? "Parola trebuie să aibă cel puțin 10 caractere."
                  : "Minim 10 caractere."}
              </p>
            </div>
            <div className="au-field">
              <label className="au-label" htmlFor="confirm">
                Confirmă parola
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                disabled={loading}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="au-input"
              />
              {mismatch && <p className="au-ferr">Parolele nu coincid.</p>}
            </div>
            <button
              type="submit"
              disabled={loading || passwordTooShort || mismatch}
              className="au-btn"
            >
              {loading ? "Se salvează…" : "Salvează parola nouă"}
            </button>
          </form>
        )
      )}
    </AuthShell>
  )
}
