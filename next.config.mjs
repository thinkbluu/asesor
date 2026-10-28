/** @type {import('next').NextConfig} */

// Baseline security headers for every route. /booking/* is exempt from
// clickjacking protection (frame-ancestors *, no X-Frame-Options) because the
// public booking page must be embeddable in salon websites later.
const csp = [
  "default-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "frame-src https://challenges.cloudflare.com https://js.stripe.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "img-src 'self' data: blob: https://*.supabase.co",
  // 'unsafe-inline' is required by Next.js inline bootstrap scripts; a nonce
  // would be the stricter fix once the app moves off inline hydration.
  // Turbopack HMR needs 'unsafe-eval' in development only.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://js.stripe.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
].join("; ")

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Content-Security-Policy", value: csp },
]

const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    // Two CSP variants: browsers enforce EVERY CSP header sent, so /booking
    // must not also receive the global one (frame-ancestors 'none' would win).
    const bookingCsp = csp.replace("frame-ancestors 'none'", "frame-ancestors *")
    return [
      {
        // Everything except /booking/*: baseline + deny framing.
        source: "/((?!booking/).*)",
        headers: [...securityHeaders, { key: "X-Frame-Options", value: "DENY" }],
      },
      {
        // /booking/* may be embedded by salon websites: no X-Frame-Options,
        // frame-ancestors *.
        source: "/booking/:path*",
        headers: securityHeaders.map(h =>
          h.key === "Content-Security-Policy" ? { ...h, value: bookingCsp } : h,
        ),
      },
    ]
  },
}

export default nextConfig
