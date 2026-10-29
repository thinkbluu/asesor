"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth/session"
import { isPlatformAdminEmail } from "@/lib/billing/admin"
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"

type Result = { ok: true; message: string } | { ok: false; error: string }

const schema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Introdu slug-ul salonului.")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug-ul poate conține doar litere mici, cifre și cratime."),
  pilotUntil: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Data trebuie să fie în formatul AAAA-LL-ZZ sau goală."),
})

export async function setPilotUntilAction(input: unknown): Promise<Result> {
  const session = await getSession()
  if (!session || !isPlatformAdminEmail(session.user.email)) {
    return { ok: false, error: "Nu ai acces la această acțiune." }
  }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Date invalide." }
  const { slug, pilotUntil } = parsed.data

  if (pilotUntil && Number.isNaN(new Date(`${pilotUntil}T00:00:00Z`).getTime())) {
    return { ok: false, error: "Data introdusă nu este validă." }
  }

  if (!isSupabaseAdminConfigured()) {
    console.error("[v0] setPilotUntil: service role not configured")
    return { ok: false, error: "Serviciul nu este configurat (cheia de serviciu lipsește)." }
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("salons")
    .update({ pilot_until: pilotUntil || null })
    .eq("slug", slug)
    .select("id, name")
    .maybeSingle()

  if (error) {
    console.error("[v0] setPilotUntil failed:", error.message)
    return { ok: false, error: "Nu am putut salva data. Încearcă din nou." }
  }
  if (!data) return { ok: false, error: "Nu există un salon cu acest slug." }

  console.log("[v0] pilot_until set", { salonId: data.id, pilotUntil: pilotUntil || null, by: session.user.id })
  revalidatePath("/app", "layout")
  return {
    ok: true,
    message: pilotUntil
      ? `${data.name}: acces pilot până la ${pilotUntil}.`
      : `${data.name}: perioada pilot a fost eliminată.`,
  }
}
