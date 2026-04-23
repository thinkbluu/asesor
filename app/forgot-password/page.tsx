"use client"

import { useState } from "react"
import Link from "next/link"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Mail } from "lucide-react"

type Step = "email" | "code" | "done"

export default function ForgotPasswordPage() {
  const { signIn, isLoaded } = useSignIn()
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
      const result = await signIn.attemptFirstFactor({ strategy: "reset_password_email_code", code, password: newPassword })
      if (result.status === "complete") {
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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A0A0A]">
              <span className="font-semibold text-white">A</span>
            </div>
            <span className="text-2xl font-semibold tracking-tight">ASESOR</span>
          </Link>
        </div>

        <Card>
          {step === "email" && (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Resetează parola</CardTitle>
                <CardDescription>Introdu adresa de email și îți trimitem un cod de resetare</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="email@exemplu.com" value={email}
                      onChange={(e) => { setEmail(e.target.value); setError("") }} required className="h-11" />
                  </div>
                  <Button type="submit" className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading || !isLoaded}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Trimite cod de resetare
                  </Button>
                </form>
                <Button variant="outline" asChild className="w-full h-11 bg-transparent">
                  <Link href="/login"><ArrowLeft className="mr-2 h-4 w-4" /> Înapoi la autentificare</Link>
                </Button>
              </CardContent>
            </>
          )}

          {step === "code" && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                  <Mail className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-2xl">Introdu codul</CardTitle>
                <CardDescription>Am trimis un cod la <span className="font-medium text-foreground">{email}</span></CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Cod verificare</Label>
                    <Input id="code" value={code} onChange={(e) => setCode(e.target.value)}
                      placeholder="123456" className="h-11 text-center text-xl tracking-widest" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Parolă nouă</Label>
                    <Input id="newPassword" type="password" value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)} placeholder="Minim 8 caractere" className="h-11" required />
                  </div>
                  <Button type="submit" className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Resetează parola
                  </Button>
                </form>
                <Button variant="outline" asChild className="w-full h-11 bg-transparent">
                  <Link href="/login"><ArrowLeft className="mr-2 h-4 w-4" /> Înapoi la autentificare</Link>
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
