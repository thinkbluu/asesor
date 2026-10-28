"use client"

// Footer link that reopens the cookie consent banner (custom event picked up
// by components/cookie-banner.tsx).

export function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("asesor:open-cookie-settings"))}
      className="hover:text-foreground inline-flex items-center transition-all duration-300"
    >
      Setări cookie-uri
    </button>
  )
}
