"use client"

import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { PricingSection, type PricingPlan } from "@/components/ui/pricing"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PLANS, TRIAL_DAYS, TRIAL_REQUIRES_CARD, SHOW_YEARLY } from "@/lib/plans"

const plans: PricingPlan[] = PLANS.map((plan) => ({
  name: plan.name,
  price: String(plan.monthly),
  yearlyPrice: SHOW_YEARLY ? String(plan.yearly) : String(plan.monthly),
  period: "lună",
  features: [...plan.features],
  description: plan.description,
  buttonText: plan.id === "premium" ? "Contactează-ne" : "Începe gratuit",
  href: plan.id === "premium" ? "/contact" : "/register",
  isPopular: "highlighted" in plan ? plan.highlighted === true : false,
}))

const faqs = [
  {
    question: "Pot testa gratuit?",
    answer: `Da. Ai ${TRIAL_DAYS} zile să explorezi platforma. La înregistrare este necesar un card bancar, dar nu se debitează nimic. Dacă anulezi înainte de finalul celor ${TRIAL_DAYS} de zile, nu se percepe nicio sumă.`,
  },
  {
    question: "Ce se întâmplă după perioada de test?",
    answer:
      "Alegi un pachet sau contul rămâne inactiv. Datele tale sunt păstrate 30 de zile.",
  },
  {
    question: "Pot schimba pachetul ulterior?",
    answer:
      "Oricând. Upgrade instant, downgrade la finalul perioadei de facturare.",
  },
  {
    question: "Există contracte pe termen lung?",
    answer:
      "Nu. Plătești lunar. Poți anula oricând.",
  },
  {
    question: "Ce metode de plată acceptați?",
    answer:
      "Card bancar (Visa, Mastercard) și transfer bancar pentru plăți anuale.",
  },
]

export default function PricingPage() {
  return (
    <MarketingLayout>
      <main className="flex-1">
        <PricingSection
          plans={plans}
          title="Prețuri simple. Fără surprize."
          description="Alege pachetul potrivit pentru dimensiunea și nevoile salonului tău. Poți schimba oricând."
        />

        {/* FAQ Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
                Întrebări frecvente
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Tot ce trebuie să știi despre prețuri și facturare
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="rounded-2xl bg-accent/10 border border-accent/20 p-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
                Nu ești sigur ce pachet ți se potrivește?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Hai să vorbim. Îți recomandăm varianta potrivită pentru salonul tău, fără presiune.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center rounded-md bg-accent px-8 py-3 text-base font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
                >
                  Începe gratuit
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md border border-border bg-background px-8 py-3 text-base font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Programează un apel
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MarketingLayout>
  )
}
