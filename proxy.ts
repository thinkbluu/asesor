import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/config"

export const isProtectedRoute = (request: NextRequest) =>
  /^\/app(?:\/.*)?$/.test(request.nextUrl.pathname)

export const isAuthRoute = (request: NextRequest) =>
  /^\/(?:login|register)(?:\/.*)?$/.test(request.nextUrl.pathname)

/**
 * Proxy (Next 16 middleware). Refreshes the Supabase session on every matched
 * request (standard @supabase/ssr updateSession pattern) and enforces the
 * coarse redirects:
 *   - /app/* without a user → /login?next=<path>
 *   - /login, /register with a signed-in user → /app
 * When Supabase env vars are missing the marketing site works normally and
 * /app/* simply redirects to /login.
 */
export default async function proxy(request: NextRequest) {
  const nextPath = request.nextUrl.pathname + request.nextUrl.search
  let response = NextResponse.next({ request })

  const redirectTo = (pathname: string, search?: string) => {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    url.search = search ?? ""
    return NextResponse.redirect(url)
  }

  const url = supabaseUrl()
  const anonKey = supabaseAnonKey()

  if (!url || !anonKey) {
    if (isProtectedRoute(request)) {
      return redirectTo("/login", `?next=${encodeURIComponent(nextPath)}`)
    }
    return response
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  // getUser() (not getSession()) — validates the JWT with the Supabase server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isProtectedRoute(request) && !user) {
    return redirectTo("/login", `?next=${encodeURIComponent(nextPath)}`)
  }

  if (isAuthRoute(request) && user) {
    return redirectTo("/app")
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
