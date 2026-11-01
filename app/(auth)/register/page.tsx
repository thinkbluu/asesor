"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Turnstile } from "@/components/auth/turnstile"
import { AuthShell } from "@/components/auth/auth-shell"
import { isSupabaseConfigured, createSupabaseBrowserClient } from "@/lib/supabase/client"
import { mapAuthError } from "@/lib/auth/errors"
import {
  TERMS_VERSION,
  PRIVACY_VERSION,
  DPA_VERSION,
  LEGAL_LINKS,
  normalizePlan,
} from "@/lib/auth/constants"
import { finishAuthSetup } from "@/lib/auth/actions"

function passwordStrength(password: string): { label: string; className: string } | null {
  if (!password) return null
  let score = 0
  if (password.length >= 10) score++
  if (password.length >= 14) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { label: "Slabă", className: "au-ferr" }
  if (score <= 3) return { label: "Medie", className: "" }
  return { label: "Puternică", className: "au-ok" }
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const configured = isSupabaseConfigured()
  const plan = normalizePlan(searchParams.get("plan"))
  const inviteToken = searchParams.get("invite")
  const invitedEmail = searchParams.get("email") ?? ""

  const [fullName, setFullName] = useState("")
  const [salonName, setSalonName] = useState("")
  const [city, setCity] = useState("")
  const [email, setEmail] = useState(invitedEmail)
  const [password, setPassword] = useState("")
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [dpa, setDpa] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  const strength = passwordStrength(password)
  const passwordTooShort = password.length > 0 && password.length < 10
  const canSubmit =
    configured &&
    !loading &&
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 10 &&
    terms &&
    privacy &&
    dpa &&
    // Salon fields are required only for self-signup (not for invites).
    (Boolean(inviteToken) || (salonName.trim().length > 0 && city.trim().length > 0))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const nextParam = inviteToken
        ? `?next=${encodeURIComponent(`/invite/${inviteToken}`)}`
        : ""
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback${nextParam}`,
          data: {
            full_name: fullName.trim(),
            // Invited members do not create a salon of their own.
            ...(inviteToken ? {} : { salon_name: salonName.trim(), city: city.trim() }),
            plan,
            terms_version: TERMS_VERSION,
            privacy_version: PRIVACY_VERSION,
            dpa_version: DPA_VERSION,
          },
          ...(captchaToken ? { captchaToken } : {}),
        },
      })
      if (error) {
        setError(mapAuthError(error))
        setCaptchaToken(null)
        return
      }
      if (data.session) {
        // Email confirmation disabled — run the post-signup setup right away.
        const { createdSalon } = await finishAuthSetup()
        const target = createdSalon
          ? "/app/onboarding"
          : inviteToken
            ? `/invite/${inviteToken}`
            : "/app"
        window.location.assign(target)
        return
      }
      setCheckEmail(true)
    } catch {
      setError("A apărut o eroare neașteptată. Încearcă din nou.")
    } finally {
      setLoading(false)
    }
  }

  if (checkEmail) {
    return (
      <AuthShell title="Verifică-ți emailul">
        <div className="au-center" style={{ marginTop: 18 }}>
          <p className="au-sub" style={{ marginTop: 0 }}>
            Ți-am trimis un link de confirmare la <strong>{email}</strong>. Deschide-l pentru a-ți
            activa contul.
          </p>
          <p className="au-hint" style={{ marginTop: 14 }}>
            Nu găsești emailul? Verifică și folderul Spam.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Creează-ți contul"
      subtitle={
        inviteToken
          ? "Creează-ți contul ca să te alături salonului care te-a invitat."
          : "14 zile gratuit. Configurezi salonul în jur de 10 minute."
      }
    >
      {!configured && <div className="au-alert" style={{ marginTop: 18 }}>Autentificarea va fi disponibilă în curând.</div>}

      {error && (
        <div role="alert" className="au-alert err" style={{ marginTop: 18 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="au-form">
        <div className="au-field">
          <label className="au-label" htmlFor="fullName">
            Numele tău
          </label>
          <input
            id="fullName"
            autoComplete="name"
            required
            disabled={!configured || loading}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="au-input"
          />
        </div>

        {!inviteToken && (
          <div style={{ display: "grid", gap: 18 }}>
            <div className="au-field">
              <label className="au-label" htmlFor="salonName">
                Numele salonului
              </label>
              <input
                id="salonName"
                required
                disabled={!configured || loading}
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                className="au-input"
              />
            </div>
            <div className="au-field">
              <label className="au-label" htmlFor="city">
                Orașul
              </label>
              <input
                id="city"
                required
                disabled={!configured || loading}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="au-input"
              />
            </div>
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

        <div className="au-field">
          <label className="au-label" htmlFor="password">
            Parolă
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            disabled={!configured || loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-hint"
            className="au-input"
          />
          <p id="password-hint" className={passwordTooShort ? "au-ferr" : "au-hint"}>
            {passwordTooShort ? (
              "Parola trebuie să aibă cel puțin 10 caractere."
            ) : strength ? (
              <>
                Puterea parolei: <span className={strength.className}>{strength.label}</span>
                {" · "}minim 10 caractere
              </>
            ) : (
              "Minim 10 caractere."
            )}
          </p>
        </div>

        <div className="au-legal">
          <label className="au-check">
            <Checkbox
              checked={terms}
              onCheckedChange={(v) => setTerms(v === true)}
              disabled={!configured || loading}
              className="au-cbx"
            />
            <span>
              Accept{" "}
              <Link href={LEGAL_LINKS.terms} target="_blank">
                Termenii și condițiile
              </Link>
              .
            </span>
          </label>
          <label className="au-check">
            <Checkbox
              checked={privacy}
              onCheckedChange={(v) => setPrivacy(v === true)}
              disabled={!configured || loading}
              className="au-cbx"
            />
            <span>
              Accept{" "}
              <Link href={LEGAL_LINKS.privacy} target="_blank">
                Politica de confidențialitate
              </Link>
              .
            </span>
          </label>
          <label className="au-check">
            <Checkbox
              checked={dpa}
              onCheckedChange={(v) => setDpa(v === true)}
              disabled={!configured || loading}
              className="au-cbx"
            />
            <span>
              Accept{" "}
              <Link href={LEGAL_LINKS.dpa} target="_blank">
                Acordul de prelucrare a datelor (DPA)
              </Link>
              .
            </span>
          </label>
        </div>

        <Turnstile onToken={setCaptchaToken} />

        <button type="submit" disabled={!canSubmit} className="au-btn">
          {loading ? "Se creează contul…" : "Creează cont"}
        </button>
      </form>

      <p className="au-alt">
        Ai deja cont? <Link href="/login">Autentifică-te</Link>
      </p>
    </AuthShell>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}
