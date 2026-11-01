"use client"

export function CookieSettingsLink() {
  return (
    <button
      type="button"
      className="linklike"
      onClick={() => window.dispatchEvent(new Event("asesor:open-cookie-settings"))}
    >
      Setări cookie-uri
    </button>
  )
}
