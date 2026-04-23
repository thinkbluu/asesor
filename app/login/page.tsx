"use client"

import { useState } from "react"
import Link from "next/link"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const { signIn, isLoaded } = useSignIn()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setError("")
    setIsLoading(true)
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === "complete") {
        router.push("/app")
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] }
      setError(clerkError?.errors?.[0]?.message ?? "Email sau parolă incorectă.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return
    await signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/app",
    })
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
            Salonul tău.<br />
            <span className="text-[#2D8C3C]">Controlul tău.</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-sm">
            Programări, clienți, echipă și venituri — totul într-un singur loc.
          </p>
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

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A0A0A]">Bine ai revenit</h2>
            <p className="mt-1 text-sm text-[#0A0A0A]/50">Conectează-te la contul tău</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-[#0A0A0A]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@salon.ro"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C] focus-visible:border-[#2D8C3C]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-[#0A0A0A]">Parolă</Label>
                <Link href="/forgot-password" className="text-xs text-[#2D8C3C] hover:underline font-medium">
                  Am uitat parola
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C] focus-visible:border-[#2D8C3C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
                className="border-[#0A0A0A]/25 data-[state=checked]:bg-[#2D8C3C] data-[state=checked]:border-[#2D8C3C]"
              />
              <Label htmlFor="remember" className="text-sm font-normal text-[#0A0A0A]/60 cursor-pointer">
                Ține-mă minte
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !isLoaded}
              className="w-full h-11 bg-[#2D8C3C] hover:bg-[#256b30] text-white font-semibold"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Autentificare
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#0A0A0A]/10" />
            <span className="text-xs text-[#0A0A0A]/40 font-medium">sau</span>
            <div className="h-px flex-1 bg-[#0A0A0A]/10" />
          </div>

          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleSignIn}
            className={cn(
              "w-full h-11 border-[#0A0A0A]/15 bg-white text-[#0A0A0A] font-medium",
              "hover:bg-[#0A0A0A]/5 hover:border-[#0A0A0A]/25",
            )}
          >
            <svg className="mr-2 h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuă cu Google
          </Button>

          <p className="mt-8 text-center text-sm text-[#0A0A0A]/50">
            Nu ai cont?{" "}
            <Link href="/register" className="font-semibold text-[#2D8C3C] hover:underline">
              Începe gratuit
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
