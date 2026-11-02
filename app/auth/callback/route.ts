import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { ensureSalonAndConsents } from "@/lib/auth/post-signup"

/** Only relative, non-protocol-relative paths are safe redirect targets. */
function sanitizeNext(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null
  return value
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const code = requestUrl.searchParams.get("code")
  const next = sanitizeNext(requestUrl.searchParams.get("next"))

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login`)
  }

  if (!code) {
    // Missing/invalid code — treat like an expired link.
    return NextResponse.redirect(`${origin}/login?error=expired_link`)
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=expired_link`)
  }

  const { createdSalon } = await ensureSalonAndConsents()

  if (createdSalon) {
    return NextResponse.redirect(`${origin}/app/onboarding`)
  }

  return NextResponse.redirect(`${origin}${next ?? "/app"}`)
}
