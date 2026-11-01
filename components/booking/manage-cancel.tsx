"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cancelBookingByToken } from "@/app/booking/manage/[token]/actions"

export function ManageCancel({
  token,
  salonPhone,
}: {
  token: string
  salonPhone: string
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const cancel = () => {
    setError(null)
    startTransition(async () => {
      const res = await cancelBookingByToken(token)
      if (res.ok) {
        router.refresh()
      } else {
        setError(res.message)
        setConfirming(false)
      }
    })
  }

  if (!confirming) {
    return (
      <div className="bk-card" style={{ padding: "14px 16px" }}>
        <p className="bk-fine" style={{ color: "var(--ink-2)" }}>
          Nu mai poți veni? Anulează programarea ca să eliberezi ora pentru altcineva.
        </p>
        {error && (
          <p role="alert" className="bk-ferr" style={{ marginTop: 8 }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="bk-btn2"
          style={{ marginTop: 12 }}
        >
          Anulează programarea
        </button>
      </div>
    )
  }

  return (
    <div className="bk-alert err" style={{ padding: 14 }}>
      <p style={{ fontWeight: 500 }}>
        Sigur vrei să anulezi programarea? Ora va fi eliberată definitiv.
      </p>
      {error && (
        <p role="alert" className="bk-ferr" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}
      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" onClick={cancel} disabled={pending} className="bk-btn" style={{ minHeight: 46 }}>
          {pending ? "Se anulează..." : "Da, anulează"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="bk-btn2"
          style={{ minHeight: 46 }}
        >
          Renunță
        </button>
        <a
          href={`tel:${salonPhone.replace(/\s/g, "")}`}
          className="bk-link"
          style={{ display: "inline-flex", alignItems: "center", minHeight: 46, textDecoration: "underline" }}
        >
          sau sună la {salonPhone}
        </a>
      </div>
    </div>
  )
}
