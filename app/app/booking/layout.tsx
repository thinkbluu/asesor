import { BookingTabs } from "@/components/app/booking-tabs"

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pagina publică de rezervare</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Link-ul pe care îl distribui clienților pentru programări online
        </p>
      </div>
      <BookingTabs />
      <div>{children}</div>
    </div>
  )
}
