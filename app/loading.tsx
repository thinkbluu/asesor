import { OrbitalLoader } from "@/components/ui/orbital-loader"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <OrbitalLoader message="Se încarcă..." />
    </div>
  )
}
