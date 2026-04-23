import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, Users, UserCog, Package, PieChart, Megaphone, ArrowRight, Check } from "lucide-react"

const modules = [
  {
    id: "programari",
    icon: Calendar,
    title: "Programări inteligente",
    description: "Nucleul platformei. Aici se organizează întreaga activitate zilnică.",
    features: [
      "Calendar vizual (zi / săptămână / lună)",
      "Programări online — clienții se programează singuri, 24/7",
      "Confirmare și reminder automat prin SMS sau email",
      "Reguli personalizate: timp buffer între programări, politică de anulare",
      "Atribuire automată sau manuală pe membrii echipei",
    ],
    result: "Mai puține apeluri. Mai puține anulări. Mai mult timp pentru ceea ce contează.",
  },
  {
    id: "clienti",
    icon: Users,
    title: "Clienți — CRM Beauty",
    description: "Fiecare client are o poveste. ASESOR o ține minte pentru tine.",
    features: [
      "Fișă completă: date contact, istoric servicii, produse cumpărate",
      "Note și preferințe (ex: „nu vrea vopsea cu amoniac”)",
      "Segmentare: clienți noi, fideli, inactivi",
      "Istoric valoare: cât a cheltuit, cât de des revine",
      "Etichete personalizate pentru organizare",
    ],
    result: "Relații mai bune. Clienți care se simt cunoscuți și apreciați.",
  },
  {
    id: "echipa",
    icon: UserCog,
    title: "Echipă & Performanță",
    description: "O echipă bună are nevoie de claritate, nu de micromanagement.",
    features: [
      "Profil individual: servicii oferite, program de lucru, zile libere",
      "Calendar personal pentru fiecare membru",
      "Performanță vizibilă: programări, venituri generate, rată de retenție",
      "Setări de comision (fix sau procentual)",
      "Permisiuni diferențiate (admin, angajat, colaborator)",
    ],
    result: "Fiecare știe ce are de făcut. Tu ai imaginea de ansamblu.",
  },
  {
    id: "stocuri",
    icon: Package,
    title: "Stocuri & Produse",
    description: "Nu mai numeri pe degete. Nu mai rămâi fără vopsea vineri seara.",
    features: [
      "Catalog produse cu categorii și branduri",
      "Nivel stoc în timp real",
      "Alertă automată pentru stoc scăzut",
      "Consum legat de servicii (ex: 1 tuns = X ml șampon)",
      "Istoric ajustări și comenzi",
    ],
    result: "Stocuri optimizate. Costuri controlate. Zero surprize.",
  },
  {
    id: "financiar",
    icon: PieChart,
    title: "Financiar & Rapoarte",
    description: "Cifrele nu mint. Dar trebuie să le vezi ca să le înțelegi.",
    features: [
      "Venituri totale: pe zi, săptămână, lună, perioadă personalizată",
      "Comparație perioade (luna asta vs. luna trecută)",
      "Defalcare: servicii vs. vânzări retail",
      "Top servicii și top clienți",
      "Performanță pe membru de echipă",
      "Export PDF și CSV",
    ],
    result: "Știi exact unde ești. Poți decide unde vrei să ajungi.",
  },
  {
    id: "marketing",
    icon: Megaphone,
    title: "Marketing automat",
    description: "Clienții care nu revin nu te-au uitat. Pur și simplu nu le-ai reamintit.",
    features: [
      "Reminder programare (cu 24h/48h înainte)",
      "Mesaj post-vizită (mulțumire + cerere recenzie)",
      "Campanii de reactivare pentru clienți inactivi (30/60/90 zile)",
      "Mesaje de aniversare sau ocazii speciale",
      "Statistici: rate de deschidere, conversii",
    ],
    result: "Clienți care revin. Recenzii care vin. Fără efort manual.",
  },
]

export default function FunctionalitatiPage() {
  return (
    <MarketingLayout>
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
                Șase module. O singură platformă.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
                ASESOR nu e doar un calendar de programări. E un sistem complet de management pentru salonul tău.
              </p>
            </div>
          </div>
        </section>

        {/* Modules */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-24">
              {modules.map((module, index) => (
                <div
                  key={module.id}
                  id={module.id}
                  className={`grid gap-12 lg:grid-cols-2 lg:gap-16 ${
                    index % 2 === 1 ? "lg:grid-flow-dense" : ""
                  }`}
                >
                  <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                      <module.icon className="h-7 w-7 text-accent" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                      {module.title}
                    </h2>
                    <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                      {module.description}
                    </p>
                    <div className="mt-8 space-y-3">
                      {module.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                          <span className="text-sm leading-relaxed text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 rounded-lg bg-muted/50 p-4">
                      <p className="font-semibold text-foreground">Rezultat:</p>
                      <p className="mt-1 text-sm text-muted-foreground">{module.result}</p>
                    </div>
                  </div>
                  <div
                    className={`rounded-xl border border-border bg-muted/30 p-8 ${
                      index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""
                    }`}
                  >
                    <div className="flex aspect-video items-center justify-center">
                      <module.icon className="h-24 w-24 text-accent/20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
                Vrei să vezi cum funcționează?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground text-pretty">
                Programează o prezentare de 15 minute. Fără obligații. Îți arătăm exact ce poate face ASESOR pentru salonul tău.
              </p>
              <div className="mt-8">
                <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/contact">
                    Solicită prezentare
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MarketingLayout>
  )
}
