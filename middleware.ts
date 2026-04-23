import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/app(.*)'])
const isAuthRoute = createRouteMatcher(['/login', '/register', '/forgot-password'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute(req) && !userId) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute(req) && userId) {
    const url = new URL('/app', req.url)
    const { NextResponse } = await import('next/server')
    return NextResponse.redirect(url)
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
