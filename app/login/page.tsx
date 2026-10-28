"use client"

import Link from "next/link"

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
          <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-[#0A0A0A]">Autentificare in curand</p>
          </div>
        </div>
      </div>
    </div>
  )
}
