"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * Port of the mockup's assets/site.js motion, scoped to the .mkt root:
 * hero line reveal + image scale + fade-ups, .rv scroll reveals, and the
 * signature pinned board (object drops in, then its digital twin appears).
 * The `js` class on .mkt is added by an inline script before first paint;
 * if motion is reduced we remove it so every .rv stays visible.
 */
export function MarketingMotion() {
  useGSAP(() => {
    const mkt = document.querySelector(".mkt")
    if (!mkt) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      mkt.classList.remove("js")
      return
    }

    // The display reveal also runs on the subpage heroes (.phero); the rest
    // is homepage-only, guarded so subpages don't log "target not found".
    gsap.from(".mkt .display .l>span", { yPercent: 108, duration: 1.3, ease: "expo.out", stagger: 0.1, delay: 0.15 })
    if (document.querySelector(".mkt .hero")) {
      gsap.from(".mkt .hero .bg img", { scale: 1.06, duration: 2.4, ease: "power2.out" })
      gsap.from(".mkt .hero .lede,.mkt .hero .ctas,.mkt .fact", {
        opacity: 0,
        y: 16,
        duration: 1,
        ease: "power3.out",
        stagger: 0.06,
        delay: 0.6,
      })
    }

    gsap.utils.toArray<HTMLElement>(".mkt .rv").forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } })
    })

    // Semnătura «Recepția»: fiecare obiect e așezat pe birou, apoi ASESOR
    // îl „trece în fișă” (perechea digitală).
    const mm = gsap.matchMedia()
    mm.add("(min-width: 1101px)", () => {
      const objs = gsap.utils.toArray<HTMLElement>(".mkt .board .obj")
      const rows = gsap.utils.toArray<HTMLElement>(".mkt .rows li")
      const table = document.querySelector(".mkt .table")
      if (!objs.length || !rows.length || !table) return
      const S = 1
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".mkt .table-pin",
          start: "top 28px",
          end: "+=3000",
          pin: true,
          scrub: 0.7,
          onUpdate: (self) => {
            const t = self.progress * tl.duration()
            const i = Math.max(0, Math.min(rows.length - 1, Math.floor((t - 0.2) / S)))
            rows.forEach((r, j) => {
              r.style.opacity = j === i ? "1" : j < i ? "0.5" : "0.28"
              r.classList.toggle("on", j === i)
            })
          },
        },
      })
      table.classList.add("pinned")
      objs.forEach((o, i) => {
        const rot = [-3, 2.5, -2, 3, -2.5, 2][i] ?? 0
        const tw = o.querySelector(".twin")
        tl.fromTo(
          o,
          { opacity: 0, y: -80, rotate: rot, scale: 1.08 },
          { opacity: 1, y: 0, rotate: 0, scale: 1, duration: 0.6, ease: "power2.out" },
          i * S,
        )
        tl.fromTo(
          o.querySelector("img"),
          { boxShadow: "0 60px 70px -30px rgba(19,21,22,.5)" },
          { boxShadow: "0 1px 0 rgba(0,0,0,.04), 0 18px 30px -22px rgba(19,21,22,.55)", duration: 0.6 },
          i * S,
        )
        if (tw)
          tl.fromTo(
            tw,
            { opacity: 0, x: -14, scale: 0.96 },
            { opacity: 1, x: 0, scale: 1, duration: 0.3, ease: "power2.out" },
            i * S + 0.55,
          )
      })
      tl.to({}, { duration: 0.5 })
      return () => {
        table.classList.remove("pinned")
        rows.forEach((r) => {
          r.style.opacity = ""
          r.classList.remove("on")
        })
      }
    })
  })

  return null
}
