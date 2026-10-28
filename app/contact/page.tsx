import Link from "next/link"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock, MessageSquare } from "lucide-react"
import { SITE } from "@/lib/site"
import { ContactForm } from "@/components/marketing/contact-form"
import { CONTACT_SUBJECTS, type ContactSubject } from "@/lib/validation/contact"

export const metadata = {
  title: "Contact · ASESOR",
  description: "Contactează echipa ASESOR. Îți răspundem în maxim 24 de ore.",
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ subiect?: string }>
}) {
  const { subiect } = await searchParams
  const initialSubject = CONTACT_SUBJECTS.includes(subiect as ContactSubject)
    ? (subiect as ContactSubject)
    : null

  return (
    <MarketingLayout>
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-background py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
                Contactează-ne.
              </h1>
              <p className="mt-4 text-lg text-muted-foreground text-pretty">
                Îți răspundem în cel mai scurt timp.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Trimite un mesaj</CardTitle>
                  <CardDescription>
                    Completează formularul și te contactăm în maxim {SITE.responseTime}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactForm initialSubject={initialSubject} />
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Solicită un demo personalizat</CardTitle>
                    <CardDescription>
                      Un consultant ASESOR te va ghida prin toate funcționalitățile platformei,
                      adaptate nevoilor salonului tău.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      size="lg"
                    >
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Programează un demo
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground">Informații de contact</h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                        <Mail className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Email</p>
                        <p className="text-muted-foreground">{SITE.emails.contact}</p>
                        <p className="text-muted-foreground">{SITE.emails.support}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                        <Phone className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Telefon</p>
                        <p className="text-muted-foreground">+40 722 123 456</p>
                        <p className="text-sm text-muted-foreground">Luni - Vineri, 09:00 - 18:00</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                        <MapPin className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Sediu</p>
                        <p className="text-muted-foreground">{SITE.address}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                        <Clock className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Program suport</p>
                        <p className="text-muted-foreground">{SITE.supportHours}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MarketingLayout>
  )
}
