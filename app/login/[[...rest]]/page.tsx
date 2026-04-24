"use client"

import Link from "next/link"
import { SignIn } from "@clerk/nextjs"

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
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full max-w-md",
                card: "shadow-sm border border-black/10 rounded-2xl bg-white p-8",
                headerTitle: "text-2xl font-bold text-[#0A0A0A]",
                headerSubtitle: "text-sm text-[#0A0A0A]/50",
                formButtonPrimary: "bg-[#2D8C3C] hover:bg-[#256b30] text-white font-semibold rounded-xl h-11 w-full",
                formFieldInput: "h-11 border border-black/15 bg-white rounded-xl px-3 text-sm w-full",
                formFieldLabel: "text-sm font-medium text-[#0A0A0A] mb-1",
                footerActionLink: "text-[#2D8C3C] hover:text-[#256b30] font-semibold",
                dividerLine: "bg-black/10",
                dividerText: "text-[#0A0A0A]/40 text-xs",
                socialButtonsBlockButton: "border border-black/15 bg-white hover:bg-black/5 text-[#0A0A0A] font-medium h-11 rounded-xl w-full",
                alertText: "text-red-600 text-sm",
                formFieldErrorText: "text-red-500 text-xs mt-1",
              },
              variables: {
                colorPrimary: "#2D8C3C",
                colorBackground: "#ffffff",
                colorText: "#0A0A0A",
                colorTextSecondary: "rgba(10,10,10,0.5)",
                colorInputBackground: "#ffffff",
                borderRadius: "0.75rem",
                fontFamily: "inherit",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
