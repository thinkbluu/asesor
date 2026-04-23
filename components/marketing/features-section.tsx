"use client";

import { Calendar, Users, UserCog, Package, PieChart, Megaphone } from "lucide-react";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

const features = [
  {
    Icon: Calendar,
    name: "Programări inteligente",
    description: "Calendar clar. Programări online. Confirmări automate. Reguli de anulare.",
    href: "/functionalitati#programari",
    cta: "Vezi mai multe",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-60" />
    ),
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: Users,
    name: "Clienți & CRM",
    description: "Fișă completă pentru fiecare client. Istoric servicii. Preferințe. Note.",
    href: "/functionalitati#clienti",
    cta: "Vezi mai multe",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-60" />
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: UserCog,
    name: "Echipă & Performanță",
    description: "Program individual. Servicii alocate. Performanță vizibilă.",
    href: "/functionalitati#echipa",
    cta: "Vezi mai multe",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-60" />
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: Package,
    name: "Stocuri & Produse",
    description: "Ce ai. Ce consumă. Ce trebuie comandat. Alertă automată.",
    href: "/functionalitati#stocuri",
    cta: "Vezi mai multe",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-60" />
    ),
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: PieChart,
    name: "Financiar & Rapoarte",
    description: "Venituri pe zi, săptămână, lună. Servicii vs. retail. Profitabilitate reală.",
    href: "/functionalitati#financiar",
    cta: "Vezi mai multe",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-60" />
    ),
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            6 module. Un singur sistem.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tot ce ai nevoie pentru a gestiona salonul, fără funcții inutile.
          </p>
        </div>
        <div className="mx-auto mt-16">
          <BentoGrid className="lg:grid-rows-3">
            {features.map((feature) => (
              <BentoCard key={feature.name} {...feature} />
            ))}
          </BentoGrid>
        </div>
      </div>
    </section>
  );
}
