import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
        Pagina nu a fost găsită.
      </h1>
      <p className="max-w-md text-muted-foreground text-pretty">
        Adresa pe care ai deschis-o nu există sau a fost mutată.
      </p>
      <Button asChild className="mt-2">
        <Link href="/">Înapoi la pagina principală</Link>
      </Button>
    </main>
  )
}
