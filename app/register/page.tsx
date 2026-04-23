"use client"

import { useState } from "react"
import Link from "next/link"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2 } from "lucide-react"

interface Errors { [key: string]: string }

export default function RegisterPage() {
  const { signUp, isLoaded, setActive } = useSignUp()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState("")

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" })

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }

  const validate = () => {
    const errs: Errors = {}
    if (!form.name.trim()) errs.name = "Numele este obligatoriu"
    if (!form.email.trim()) errs.email = "Email-ul este obligatoriu"
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Email invalid"
    if (!form.password) errs.password = "Parola este obligatorie"
    else if (form.password.length < 8) errs.password = "Minim 8 caractere"
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Parolele nu coincid"
    if (!acceptedTerms) errs.terms = "Trebuie să accepți termenii"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !validate()) return
    setIsLoading(true)
    const nameParts = form.name.trim().split(" ")
    const firstName = nameParts[0] ?? ""
    const lastName = nameParts.slice(1).join(" ") || ""
    try {
      await signUp.create({ emailAddress: form.email, password: form.password, firstName, lastName })
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setPendingVerification(true)
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] }
      setErrors({ submit: clerkError?.errors?.[0]?.message ?? "Eroare la creare cont." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setIsLoading(true)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.push("/app/onboarding")
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] }
      setErrors({ code: clerkError?.errors?.[0]?.message ?? "Cod invalid." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F7F5F2]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#0A0A0A] p-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2D8C3C]">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">ASESOR</span>
        </Link>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Primul pas spre<br />
            <span className="text-[#2D8C3C]">un salon mai eficient.</span>
          </h1>
          <div className="space-y-4">
            {["Configurare în 10 minute", "14 zile gratuit, fără card", "Suport dedicat în română"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#2D8C3C]" />
                <span className="text-white/60 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-sm">© 2025 ASESOR. Toate drepturile rezervate.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0A]">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <span className="text-xl font-semibold text-[#0A0A0A] tracking-tight">ASESOR</span>
            </Link>
          </div>

          {pendingVerification ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#0A0A0A]">Verifică email-ul</h2>
                <p className="mt-1 text-sm text-[#0A0A0A]/50">Am trimis un cod de verificare la <strong>{form.email}</strong></p>
              </div>
              {errors.code && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{errors.code}</div>
              )}
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-sm font-medium text-[#0A0A0A]">Cod verificare</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="h-11 border-[#0A0A0A]/15 bg-white text-center text-xl tracking-widest focus-visible:ring-[#2D8C3C]"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-11 bg-[#2D8C3C] hover:bg-[#256b30] text-white font-semibold">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verifică codul
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#0A0A0A]">Creează cont</h2>
                <p className="mt-1 text-sm text-[#0A0A0A]/50">Configurezi salonul în pasul următor</p>
              </div>

              {errors.submit && (
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{errors.submit}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-[#0A0A0A]">Nume complet</Label>
                  <Input id="name" placeholder="Maria Popescu" value={form.name} onChange={(e) => update("name", e.target.value)}
                    className="h-11 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C]" />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-[#0A0A0A]">Email</Label>
                  <Input id="email" type="email" placeholder="email@salon.ro" value={form.email} onChange={(e) => update("email", e.target.value)}
                    className="h-11 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C]" />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-[#0A0A0A]">Parolă</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Minim 8 caractere"
                      value={form.password} onChange={(e) => update("password", e.target.value)}
                      className="h-11 pr-10 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C]" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0A0A0A]/40 hover:text-[#0A0A0A]">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#0A0A0A]">Confirmă parola</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Repetă parola"
                      value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)}
                      className="h-11 pr-10 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C]" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0A0A0A]/40 hover:text-[#0A0A0A]">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-start gap-2.5">
                    <Checkbox id="terms" checked={acceptedTerms}
                      onCheckedChange={(v) => { setAcceptedTerms(v === true); if (v) setErrors((p) => { const n = { ...p }; delete n.terms; return n }) }}
                      className="mt-0.5 border-[#0A0A0A]/25 data-[state=checked]:bg-[#2D8C3C] data-[state=checked]:border-[#2D8C3C]" />
                    <Label htmlFor="terms" className="text-sm font-normal text-[#0A0A0A]/60 cursor-pointer leading-relaxed">
                      Accept{" "}
                      <Link href="/terms" className="text-[#2D8C3C] hover:underline font-medium">Termenii și Condițiile</Link>
                      {" "}și{" "}
                      <Link href="/privacy" className="text-[#2D8C3C] hover:underline font-medium">Politica de Confidențialitate</Link>
                    </Label>
                  </div>
                  {errors.terms && <p className="text-xs text-red-500">{errors.terms}</p>}
                </div>

                <Button type="submit" disabled={isLoading || !isLoaded}
                  className="w-full h-11 bg-[#2D8C3C] hover:bg-[#256b30] text-white font-semibold">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Creează cont
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-[#0A0A0A]/50">
                Ai deja cont?{" "}
                <Link href="/login" className="font-semibold text-[#2D8C3C] hover:underline">Autentificare</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
