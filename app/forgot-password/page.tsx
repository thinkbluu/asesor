"use client"

import { useState } from "react"
import Link from "next/link"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Mail } from "lucide-react"

type Step = "email" | "code"

export default function ForgotPasswordPage() {
  const { signIn, isLoaded, setActive } = useSignIn()
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setError("")
    setIsLoading(true)
    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier: email })
      setStep("code")
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] }
      setError(clerkError?.errors?.[0]?.message ?? "Email negăsit.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setError("")
    setIsLoading(true)
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      })
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.push("/app")
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] }
      setError(clerkError?.errors?.[0]?.message ?? "Cod sau parolă invalidă.")
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
            Resetare parolă<br />
            <span className="text-[#2D8C3C]">simplă și sigură.</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-sm">
            Îți trimitem un cod de verificare direct pe email pentru a-ți reseta parola.
          </p>
        </div>
        <p className="text-white/30 text-sm">© 2025 ASESOR. Toate drepturile rezervate.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0A]">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <span className="text-xl font-semibold text-[#0A0A0A] tracking-tight">ASESOR</span>
            </Link>
          </div>

          {step === "email" ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#0A0A0A]">Ai uitat parola?</h2>
                <p className="mt-1 text-sm text-[#0A0A0A]/50">
                  Introdu email-ul și îți trimitem un cod de resetare.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-[#0A0A0A]">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@salon.ro"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError("") }}
                    required
                    className="h-11 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C] focus-visible:border-[#2D8C3C]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !isLoaded}
                  className="w-full h-11 bg-[#2D8C3C] hover:bg-[#256b30] text-white font-semibold"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Trimite cod de resetare
                </Button>
              </form>

              <div className="mt-6">
                <Button
                  variant="ghost"
                  asChild
                  className="w-full h-11 text-[#0A0A0A]/60 hover:text-[#0A0A0A] hover:bg-[#0A0A0A]/5"
                >
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Înapoi la autentificare
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2D8C3C]/10">
                  <Mail className="h-5 w-5 text-[#2D8C3C]" />
                </div>
                <h2 className="text-2xl font-bold text-[#0A0A0A]">Verifică email-ul</h2>
                <p className="mt-1 text-sm text-[#0A0A0A]/50">
                  Am trimis un cod la <strong className="text-[#0A0A0A]">{email}</strong>
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-sm font-medium text-[#0A0A0A]">Cod verificare</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="h-11 border-[#0A0A0A]/15 bg-white text-center text-xl tracking-widest focus-visible:ring-[#2D8C3C]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-[#0A0A0A]">Parolă nouă</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minim 8 caractere"
                    className="h-11 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[#2D8C3C] hover:bg-[#256b30] text-white font-semibold"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Resetează parola
                </Button>
              </form>

              <div className="mt-6">
                <Button
                  variant="ghost"
                  asChild
                  className="w-full h-11 text-[#0A0A0A]/60 hover:text-[#0A0A0A] hover:bg-[#0A0A0A]/5"
                >
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Înapoi la autentificare
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
