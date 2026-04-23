"use client"

import { useState } from "react"
import Link from "next/link"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Mail, Phone, MapPin, Clock, MessageSquare } from "lucide-react"

export default function ContactPage() {
  const [gdprChecked, setGdprChecked] = useState(false)

  return (
    <MarketingLayout>
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-background py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
                Hai să vorbim
              </h1>
              <p className="mt-4 text-lg text-muted-foreground text-pretty">
                Avem răspunsuri la toate întrebările tale. Suntem aici să te ajutăm să alegi soluția
                potrivită pentru salonul tău.
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
                    Completează formularul și te contactăm în maxim 24 de ore.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prenume</Label>
                        <Input id="firstName" placeholder="Maria" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nume</Label>
                        <Input id="lastName" placeholder="Popescu" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="email@exemplu.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input id="phone" placeholder="07XX XXX XXX" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salonName">Numele salonului</Label>
                      <Input id="salonName" placeholder="Ex: Beauty Studio" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subiect</Label>
                      <Select>
                        <SelectTrigger id="subject">
                          <SelectValue placeholder="Selectează subiectul" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="demo">Solicit un demo</SelectItem>
                          <SelectItem value="pricing">Întrebări despre prețuri</SelectItem>
                          <SelectItem value="features">Întrebări despre funcționalități</SelectItem>
                          <SelectItem value="support">Suport tehnic</SelectItem>
                          <SelectItem value="partnership">Parteneriat</SelectItem>
                          <SelectItem value="other">Altele</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Mesaj</Label>
                      <textarea
                        id="message"
                        className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Spune-ne cum te putem ajuta..."
                        required
                      />
                    </div>

                    <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
                      <Checkbox
                        id="gdpr"
                        checked={gdprChecked}
                        onCheckedChange={(checked) => setGdprChecked(checked === true)}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="gdpr"
                        className="text-sm font-normal leading-relaxed text-muted-foreground"
                      >
                        Sunt de acord cu prelucrarea datelor personale conform{" "}
                        <Link
                          href="/privacy"
                          className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
                        >
                          Politicii de confidențialitate
                        </Link>{" "}
                        în scopul de a primi răspuns la solicitarea mea.
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      disabled={!gdprChecked}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Trimite mesajul
                    </Button>
                  </form>
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
                        <p className="text-muted-foreground">contact@asesor.ro</p>
                        <p className="text-muted-foreground">support@asesor.ro</p>
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
                        <p className="text-muted-foreground">Str. Exemplu 123</p>
                        <p className="text-muted-foreground">București, România</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                        <Clock className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Program suport</p>
                        <p className="text-muted-foreground">Luni - Vineri: 09:00 - 18:00</p>
                        <p className="text-muted-foreground">Sâmbătă: 10:00 - 14:00</p>
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
