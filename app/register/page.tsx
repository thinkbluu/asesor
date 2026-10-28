"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Turnstile } from "@/components/auth/turnstile"
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
  if (score <= 1) return { label: "Slabă", className: "text-red-600" }
  if (score <= 3) return { label: "Medie", className: "text-amber-600" }
  return { label: "Puternică", className: "text-[#2D8C3C]" }
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
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#2D8C3C]/10">
          <svg className="h-6 w-6 text-[#2D8C3C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m2 7 10 6 10-6" />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-[#0A0A0A] tracking-tight">
          Verifică-ți emailul
        </h2>
        <p className="mt-2 text-sm text-black/50 leading-relaxed">
          Ți-am trimis un link de confirmare la <strong className="text-[#0A0A0A]">{email}</strong>.
          Deschide-l pentru a-ți activa contul.
        </p>
        <p className="mt-4 text-xs text-black/40">
          Nu găsești emailul? Verifică și folderul Spam.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">Creează un cont</h2>
      <p className="mt-1 text-sm text-black/50">
        {inviteToken
          ? "Creează-ți contul ca să te alături salonului care te-a invitat."
          : "14 zile gratuite. Fără card bancar."}
      </p>

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

      <form onSubmit={handleRegister} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Numele tău</Label>
          <Input
            id="fullName"
            autoComplete="name"
            required
            disabled={!configured || loading}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        {!inviteToken && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="salonName">Numele salonului</Label>
              <Input
                id="salonName"
                required
                disabled={!configured || loading}
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Orașul</Label>
              <Input
                id="city"
                required
                disabled={!configured || loading}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
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

        <div className="space-y-1.5">
          <Label htmlFor="password">Parolă</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            disabled={!configured || loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="text-xs text-black/40">
            {passwordTooShort ? (
              <span className="text-red-600">Parola trebuie să aibă cel puțin 10 caractere.</span>
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

        <div className="space-y-3 rounded-lg border border-black/10 p-4">
          <label className="flex items-start gap-3 text-sm text-black/70">
            <Checkbox
              checked={terms}
              onCheckedChange={(v) => setTerms(v === true)}
              disabled={!configured || loading}
              className="mt-0.5"
            />
            <span>
              Accept{" "}
              <Link href={LEGAL_LINKS.terms} target="_blank" className="text-[#2D8C3C] hover:underline">
                Termenii și condițiile
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-black/70">
            <Checkbox
              checked={privacy}
              onCheckedChange={(v) => setPrivacy(v === true)}
              disabled={!configured || loading}
              className="mt-0.5"
            />
            <span>
              Accept{" "}
              <Link href={LEGAL_LINKS.privacy} target="_blank" className="text-[#2D8C3C] hover:underline">
                Politica de confidențialitate
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-black/70">
            <Checkbox
              checked={dpa}
              onCheckedChange={(v) => setDpa(v === true)}
              disabled={!configured || loading}
              className="mt-0.5"
            />
            <span>
              Accept{" "}
              <Link href={LEGAL_LINKS.dpa} target="_blank" className="text-[#2D8C3C] hover:underline">
                Acordul de prelucrare a datelor (DPA)
              </Link>
              .
            </span>
          </label>
        </div>

        <Turnstile onToken={setCaptchaToken} />

        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-[#0A0A0A] text-white hover:bg-[#0A0A0A]/90"
        >
          {loading ? "Se creează contul…" : "Creează cont"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-black/50">
        Ai deja cont?{" "}
        <Link href="/login" className="font-medium text-[#2D8C3C] hover:underline">
          Autentifică-te
        </Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
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
            Primul pas spre<br />
            <span className="text-[#2D8C3C]">un salon mai eficient.</span>
          </h1>
          <div className="space-y-3">
            {["Configurare în 10 minute", "14 zile gratuit", "Suport dedicat în română"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#2D8C3C] shrink-0" />
                <span className="text-white/60 text-sm">{item}</span>
              </div>
            ))}
          </div>
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
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
