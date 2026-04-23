import Link from "next/link"
import { SignIn } from "@clerk/nextjs"

export default function LoginPage() {
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
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex lg:hidden items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0A]">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <span className="text-xl font-semibold text-[#0A0A0A] tracking-tight">ASESOR</span>
          </div>
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full max-w-sm",
                card: "shadow-none border border-[#0A0A0A]/10 rounded-2xl bg-white",
                headerTitle: "text-2xl font-bold text-[#0A0A0A]",
                headerSubtitle: "text-sm text-[#0A0A0A]/50",
                formButtonPrimary: "bg-[#2D8C3C] hover:bg-[#256b30] text-white font-semibold h-11",
                formFieldInput: "h-11 border-[#0A0A0A]/15 bg-white focus:ring-[#2D8C3C] focus:border-[#2D8C3C]",
                formFieldLabel: "text-sm font-medium text-[#0A0A0A]",
                footerActionLink: "text-[#2D8C3C] hover:text-[#256b30] font-semibold",
                identityPreviewEditButton: "text-[#2D8C3C]",
                dividerLine: "bg-[#0A0A0A]/10",
                dividerText: "text-[#0A0A0A]/40",
                socialButtonsBlockButton: "border-[#0A0A0A]/15 bg-white hover:bg-[#0A0A0A]/5 text-[#0A0A0A] font-medium h-11",
                socialButtonsBlockButtonText: "font-medium text-[#0A0A0A]",
              },
              variables: {
                colorPrimary: "#2D8C3C",
                colorBackground: "#ffffff",
                colorText: "#0A0A0A",
                colorTextSecondary: "rgba(10,10,10,0.5)",
                colorInputBackground: "#ffffff",
                borderRadius: "0.75rem",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
