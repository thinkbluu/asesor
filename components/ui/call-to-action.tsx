"use client"

import { MoveRight, PhoneCall } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function CTA() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex flex-col text-center bg-muted rounded-md p-4 lg:p-14 gap-8 items-center">
          <div>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
              Gata de start?
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular">
              14 zile gratuit. Fără card. Fără obligații.
            </h3>
            <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl">
              Configurezi salonul în 10 minute. Dacă nu ești convins, anulezi oricând. Zero risc.
            </p>
          </div>
          <div className="flex flex-row gap-4 flex-wrap justify-center">
            <Button asChild className="gap-4 bg-emerald-500 hover:bg-emerald-600">
              <Link href="/register">
                Creează cont gratuit <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild className="gap-4 bg-transparent" variant="outline">
              <Link href="/contact">
                Programează un demo <PhoneCall className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { CTA }
