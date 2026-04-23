"use client"

import { useEffect, useRef } from "react"
import { MeshGradient, PulsingBorder } from "@paper-design/shaders-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowUpRight, Sparkles } from "lucide-react"

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className="bg-slate-950 relative overflow-hidden"
      style={{ minHeight: "calc(100vh - 56px)" }}
    >
      {/* SVG Filters */}
      <svg className="absolute inset-0 w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.02
                      0 1 0 0 0.02
                      0 0 1 0 0.05
                      0 0 0 0.9 0"
            />
          </filter>
          <filter id="gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
          <filter id="text-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <path id="text-circle" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
        </defs>
      </svg>

      {/* Background shaders */}
      <MeshGradient
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        colors={["#0f172a", "#10b981", "#34d399", "#065f46", "#1e293b"]}
        speed={0.3}
      />
      <MeshGradient
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.25 }}
        colors={["#0f172a", "#6ee7b7", "#10b981", "#059669"]}
        speed={0.2}
      />

      {/* Main content — bottom-left layout */}
      <main
        className="relative z-20 flex items-end justify-start px-8 pb-16 sm:px-12 lg:px-16"
        style={{ minHeight: "calc(100vh - 56px)" }}
      >
        <div className="max-w-2xl">

          {/* Badge pill */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm mb-8 relative border border-white/10"
            style={{ filter: "url(#glass-effect)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent rounded-full" />
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-white/90 text-xs font-medium tracking-wide">
              Gestionare salon — simplu, elegant, complet
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-none tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.span
              className="block font-light text-3xl md:text-4xl lg:text-5xl mb-2 tracking-wide"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #10b981 35%, #34d399 65%, #ffffff 100%)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "url(#text-glow)",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] } as any}
              transition={{
                opacity: { duration: 0.6, delay: 0.5 },
                y: { duration: 0.6, delay: 0.5 },
                backgroundPosition: { duration: 8, repeat: Infinity, ease: "linear" },
              }}
            >
              Salonul tău.
            </motion.span>
            <span className="block font-black text-white drop-shadow-2xl text-balance">
              Într-un singur loc.
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="text-base md:text-lg font-light text-white/65 mb-10 leading-relaxed max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Programări, clienți, echipă, stocuri, venituri — totul centralizat.
            Fără haos. Fără surprize.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex items-center gap-4 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            {/* Gooey login button */}
            <div
              className="relative flex items-center group"
              style={{ filter: "url(#gooey-filter)" }}
            >
              <Link
                href="/login"
                className="absolute right-0 rounded-full bg-white text-black cursor-pointer h-10 w-10 flex items-center justify-center -translate-x-10 group-hover:-translate-x-[4.5rem] z-0 transition-transform duration-300"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/login"
                className="px-7 rounded-full bg-white text-black font-medium text-sm cursor-pointer h-10 flex items-center z-10 hover:bg-white/90 transition-colors whitespace-nowrap"
              >
                Autentificare
              </Link>
            </div>

            {/* Primary CTA */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/register"
                className="px-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all duration-300 cursor-pointer shadow-lg hover:shadow-emerald-500/25 hover:shadow-xl h-10 flex items-center whitespace-nowrap"
              >
                Începe gratuit
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust line */}
          <motion.p
            className="mt-6 text-white/35 text-xs tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.3 }}
          >
            14 zile gratuit · Fără card · Anulare instant
          </motion.p>
        </div>
      </main>

      {/* Pulsing border + rotating text — bottom right */}
      <div className="absolute bottom-8 right-8 z-30 hidden md:block">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <PulsingBorder
            colors={["#10b981", "#059669", "#ffffff", "#34d399", "#6ee7b7"]}
            speed={1.5}
            roundness={1}
            thickness={0.1}
            softness={0.2}
            intensity={5}
            spotSize={0.1}
            pulse={0.1}
            smoke={0.5}
            smokeSize={4}
            scale={0.65}
            style={{ width: "60px", height: "60px", borderRadius: "50%", position: "absolute", inset: 0, margin: "auto" }}
          />
          <motion.svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ transform: "scale(1.6)" }}
            aria-hidden="true"
          >
            <text fill="rgba(255,255,255,0.6)" fontSize="10" fontWeight="500">
              <textPath href="#text-circle" startOffset="0%">
                ASESOR • BEAUTY SALON • MANAGEMENT •{" "}
              </textPath>
            </text>
          </motion.svg>
        </div>
      </div>
    </div>
  )
}
