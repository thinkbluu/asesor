"use client"

import Link from "next/link"
import { SignUp } from "@clerk/nextjs"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen">
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
          <div className="space-y-3">
            {["Configurare în 10 minute", "14 zile gratuit, fără card", "Suport dedicat în română"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#2D8C3C] shrink-0" />
                <span className="text-white/60 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-sm">© 2025 ASESOR. Toate drepturile rezervate.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-[#F7F5F2] px-6 py-12">
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex lg:hidden items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0A]">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <span className="text-xl font-semibold text-[#0A0A0A] tracking-tight">ASESOR</span>
          </div>
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full max-w-md",
                card: "shadow-sm border border-black/10 rounded-2xl bg-white p-8",
                headerTitle: "text-2xl font-bold text-[#0A0A0A]",
                headerSubtitle: "text-sm text-[#0A0A0A]/50",
                formButtonPrimary:
                  "bg-[#2D8C3C] hover:bg-[#256b30] text-white font-semibold rounded-xl h-11 w-full",
                formFieldInput:
                  "h-11 border border-black/15 bg-white rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8C3C] focus:border-transparent w-full",
                formFieldLabel: "text-sm font-medium text-[#0A0A0A] mb-1",
                footerActionLink: "text-[#2D8C3C] hover:text-[#256b30] font-semibold",
                dividerLine: "bg-black/10",
                dividerText: "text-[#0A0A0A]/40 text-xs",
                socialButtonsBlockButton:
                  "border border-black/15 bg-white hover:bg-black/5 text-[#0A0A0A] font-medium h-11 rounded-xl w-full",
                socialButtonsBlockButtonText: "font-medium text-[#0A0A0A] text-sm",
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
