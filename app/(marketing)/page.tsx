import type { Metadata } from "next"
import { TRIAL_REQUIRES_CARD } from "@/lib/plans"
import { MarketingMotion } from "@/components/marketing/marketing-motion"
import { Hero } from "@/components/marketing/hero"
import { Why } from "@/components/marketing/why"
import { ModuleBoard } from "@/components/marketing/module-board"
import { ProductDay } from "@/components/marketing/product-day"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { ForWhom } from "@/components/marketing/for-whom"
import { Safety } from "@/components/marketing/safety"
import { Pilot } from "@/components/marketing/pilot"
import { PricingTeaser } from "@/components/marketing/pricing-teaser"
import { Faq } from "@/components/marketing/faq"
import { FinalCta } from "@/components/marketing/final-cta"

export const metadata: Metadata = {
  title: "ASESOR — gestionare salon: programări, clienți, echipă, stocuri, venituri",
  description: `Programări online, fișă de client, echipă, stocuri și închiderea zilei pentru saloane de beauty din România. ${
    TRIAL_REQUIRES_CARD
      ? "Toate pachetele încep cu 14 zile gratuit. Nu plătești nimic dacă anulezi înainte."
      : "14 zile gratuit, fără card."
  }`,
}

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Why />
      <ModuleBoard />
      <ProductDay />
      <HowItWorks />
      <ForWhom />
      <Safety />
      <Pilot />
      <PricingTeaser />
      <Faq />
      <FinalCta />
      <MarketingMotion />
    </main>
  )
}
