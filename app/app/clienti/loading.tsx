import { OrbitalLoader } from "@/components/ui/orbital-loader"

export function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <OrbitalLoader message="Se încarcă clienții..." />
    </div>
  )
}

export default Loading
