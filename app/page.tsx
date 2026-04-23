import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { HeroSection } from "@/components/marketing/hero-section"
import { SocialProofSection } from "@/components/marketing/social-proof-section"
import { BenefitsSection } from "@/components/marketing/benefits-section"
import { FeaturesSection } from "@/components/marketing/features-section"
import { TestimonialsSection } from "@/components/marketing/testimonials-section"
import { CTASection } from "@/components/marketing/cta-section"

export default function HomePage() {
  return (
    <MarketingLayout>
      <main className="flex-1">
        <HeroSection />
        <SocialProofSection />
        <BenefitsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <CTASection />
      </main>
    </MarketingLayout>
  )
}
