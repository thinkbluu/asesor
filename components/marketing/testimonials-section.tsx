"use client";

import { motion } from "framer-motion";
import { TestimonialsColumn } from "@/components/ui/testimonials-column";

const testimonials = [
  {
    text: "Nu mai răspund la 30 de mesaje pe zi pentru programări. Clienții se programează singuri, eu primesc doar notificarea.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    name: "Elena M.",
    role: "București",
  },
  {
    text: "Am trecut de la caiet la ASESOR în 2 zile. Acum văd clar cât câștigă fiecare angajat și ce servicii merg cel mai bine.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    name: "Andrei I.",
    role: "Cluj-Napoca",
  },
  {
    text: "Într-o lună am recuperat 15 clienți inactivi doar cu SMS-urile automate. Investiția s-a amortizat din prima săptămână.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    name: "Maria C.",
    role: "Timișoara",
  },
  {
    text: "Echipa mea de 6 persoane știe exact ce are de făcut în fiecare zi. Nu mai sun pe nimeni dimineața să confirm programul.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    name: "Alex D.",
    role: "Iași",
  },
  {
    text: "Stocurile erau un coșmar. Acum știu exact când trebuie să comand și ce se consumă cel mai mult.",
    image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop",
    name: "Ioana R.",
    role: "Brașov",
  },
  {
    text: "Raportul de la sfârșitul lunii mi-a arătat că un serviciu pe care îl subestimam genera 30% din venituri. Am ajustat prețurile imediat.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
    name: "Cristian P.",
    role: "Constanța",
  },
  {
    text: "Am 3 saloane și le gestionez pe toate din aceeași aplicație. Fără ASESOR ar fi fost imposibil.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop",
    name: "Diana S.",
    role: "București",
  },
  {
    text: "Clientele revin mai des de când primesc reminder-ul automat. Rata de revenire a crescut vizibil.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
    name: "Răzvan D.",
    role: "Sibiu",
  },
  {
    text: "Cel mai bun lucru: nu mai pierd timp cu administrarea. Mă ocup de clienți, de dezvoltare. Restul merge singur.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
    name: "Andreea V.",
    role: "Oradea",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export function TestimonialsSection() {
  return (
    <section className="relative border-t border-border bg-muted/30 py-24">
      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border border-border bg-background py-1 px-4 rounded-lg text-sm font-medium">
              Testimoniale
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter mt-5 text-center">
            Ce spun clienții noștri
          </h2>
          <p className="text-center mt-5 text-muted-foreground">
            Descoperă cum ASESOR ajută saloanele de beauty să crească și să
            prospere.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </div>
    </section>
  );
}
