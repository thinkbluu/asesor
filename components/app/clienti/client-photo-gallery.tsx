"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/clienti-format"
import type { ClientPhoto } from "@/lib/mappers/clienti"
import { uploadPhotoAction, deletePhotoAction, listPhotosAction } from "@/app/app/clienti/actions"

const MAX_DIMENSION = 1600

/**
 * Resizes an image client-side (max 1600px on the long edge) and converts it
 * to WebP before upload. This is a convenience step — the server re-validates
 * MIME and size.
 */
async function resizeToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas indisponibil")
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Conversia WebP a eșuat"))),
      "image/webp",
      0.85,
    )
  })
}

export function ClientPhotoGallery({
  clientId,
  initialPhotos,
  canDelete,
}: {
  clientId: string
  initialPhotos: ClientPhoto[]
  canDelete: boolean
}) {
  const [photos, setPhotos] = useState<ClientPhoto[]>(initialPhotos)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (files.length === 0) return
    setUploading(true)
    setError(null)
    for (const file of files) {
      try {
        const webp = await resizeToWebp(file)
        const fd = new FormData()
        fd.append("file", new File([webp], "photo.webp", { type: "image/webp" }))
        const result = await uploadPhotoAction(clientId, fd)
        if (!result.ok) {
          setError(result.error)
          continue
        }
        // Signed URLs are short-lived — refresh the list after each upload.
        const refreshed = await listPhotosAction(clientId)
        if (refreshed.ok) setPhotos(refreshed.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Eroare la încărcare.")
      }
    }
    setUploading(false)
  }

  function handleDelete(photoId: string) {
    startTransition(async () => {
      const result = await deletePhotoAction(clientId, photoId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPhotos((p) => p.filter((x) => x.id !== photoId))
    })
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Galerie foto</p>
            <p className="text-xs text-muted-foreground">
              Fișiere private (bucket securizat), linkuri valabile 10 minute. JPEG/PNG/WebP/HEIC, max 8 MB.
            </p>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              className="sr-only"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Camera className="h-4 w-4 mr-1.5" />
              {uploading ? "Se încarcă…" : "Adaugă foto"}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nicio fotografie încă.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p) => (
              <li key={p.id} className="group relative overflow-hidden rounded-md border border-border bg-muted">
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not a static asset
                  <img src={p.url} alt={p.caption ?? "Fotografie clientă"} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-xs text-muted-foreground">
                    URL expirat
                  </div>
                )}
                {p.caption && (
                  <p className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] text-white truncate">
                    {p.caption}
                  </p>
                )}
                <p className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  {formatDate(p.createdAt)}
                </p>
                {canDelete && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDelete(p.id)}
                    disabled={pending}
                    aria-label="Șterge fotografia"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
