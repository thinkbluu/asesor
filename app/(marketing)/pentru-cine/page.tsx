import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Building2, Sparkles, User, Crown, ArrowRight } from "lucide-react"

const segments = [
  {
    icon: Building2,
    title: "Saloane cu echipe de 5+ persoane",
    description:
      "Coordonarea unei echipe nu trebuie să fie un haos de mesaje și foi Excel. ASESOR îți dă o vedere de ansamblu asupra întregii activități — cine lucrează, când, cu ce rezultate.",
    benefit: "Control fără micromanagement.",
  },
  {
    icon: Sparkles,
    title: "Hair + Beauty + Nails sub același acoperiș",
    description:
      "Servicii diferite, echipe diferite, nevoi diferite. ASESOR le ține pe toate organizate într-un singur loc, cu calendare separate dar rapoarte unificate.",
    benefit: "O platformă pentru tot.",
  },
  {
    icon: User,
    title: "Profesioniști care lucrează singuri",
    description:
      "Nu ai nevoie de un sistem complicat. Ai nevoie de un calendar care funcționează, clienți care nu uită de programări și o imagine clară a veniturilor tale.",
    benefit: "Simplu, rapid, eficient.",
  },
  {
    icon: Crown,
    title: "Spații unde experiența contează",
    description:
      "Clienții tăi așteaptă un anumit nivel. ASESOR te ajută să-l livrezi constant — cu programări precise, comunicare profesionistă și atenție la detalii.",
    benefit: "Profesionalism în fiecare interacțiune.",
  },
]

export default function PentruCinePage() {
  return (
    <MarketingLayout>
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
                Pentru saloane care iau lucrurile în serios.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
                ASESOR nu e pentru toată lumea. E pentru cei care vor ordine, claritate și control asupra afacerii lor.
              </p>
            </div>
          </div>
        </section>

        {/* Segments */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              {segments.map((segment, index) => (
                <div key={index} className="relative rounded-xl border border-border bg-card p-8">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <segment.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{segment.title}</h2>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{segment.description}</p>
                  <div className="mt-6 rounded-lg bg-muted/50 p-4">
                    <p className="text-sm font-semibold text-accent">Beneficiu cheie:</p>
                    <p className="mt-1 text-sm text-foreground">{segment.benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What clients have in common */}
        <section className="border-t border-border bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
                Ce au în comun clienții noștri
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
                Toți tratează salonul ca pe o afacere, nu ca pe un hobby. Vor să știe cifrele, să aibă control și să crească sustenabil. Nu caută scurtături — caută instrumente care funcționează.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 text-primary-foreground sm:px-12 sm:py-20">
              <div className="relative mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
                  Te regăsești aici?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80 text-pretty">
                  Hai să vedem dacă ASESOR e potrivit pentru tine.
                </p>
                <div className="mt-8">
                  <Button
                    size="lg"
                    asChild
                    className="bg-accent text-black hover:bg-accent/90 font-semibold"
                  >
                    <Link href="/contact">
                      Solicită o prezentare
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MarketingLayout>
  )
}
