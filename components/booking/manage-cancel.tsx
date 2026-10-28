"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm text-zinc-600">
          Nu mai poți veni? Anulează programarea ca să eliberezi ora pentru altcineva.
        </p>
        {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
        <Button
          variant="outline"
          onClick={() => setConfirming(true)}
          className="mt-3 h-11 border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100"
        >
          Anulează programarea
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-900">
        Sigur vrei să anulezi programarea? Ora va fi eliberată definitiv.
      </p>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          onClick={cancel}
          disabled={pending}
          className="h-11 bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:bg-red-300"
        >
          {pending ? "Se anulează..." : "Da, anulează"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="h-11 border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100"
        >
          Renunță
        </Button>
        <a
          href={`tel:${salonPhone.replace(/\s/g, "")}`}
          className="flex h-11 items-center rounded-lg px-4 text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
        >
          sau sună la {salonPhone}
        </a>
      </div>
    </div>
  )
}
