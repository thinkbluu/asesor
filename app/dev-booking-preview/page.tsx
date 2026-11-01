// TEMPORARY P17 verification harness — mock-data render of BookingFlow.
// Deleted before commit; never shipped.
import { BookingFlow } from "@/components/booking/booking-flow"
import type { SalonInfo, BookingService } from "@/lib/booking-logic"

const salon: SalonInfo = {
  slug: "salonul-ana",
  name: "Salonul Ana",
  address: "Str. Victoriei 12, Timișoara",
  phone: "0722 123 456",
  city: "Timișoara",
  description: "",
  cancellationPolicy:
    "Programările pot fi anulate gratuit cu minim 4 ore înainte de ora stabilită.",
  cancellationWindowHours: 4,
  hoursText: "Luni: 09:00–18:00",
  logoUrl: null,
  // Pale accent on purpose: verifies the ink-text flip for AA contrast.
  accentColor: "#F2C9CF",
}

const services: BookingService[] = [
  { id: "s1", name: "Manicură clasică", category: "Unghii", durationMin: 45, price: 80, priceFrom: false },
  { id: "s2", name: "Manicură gel", category: "Unghii", durationMin: 75, price: 140, priceFrom: true },
  { id: "s3", name: "Tuns femei", category: "Coafură", durationMin: 60, price: 90, priceFrom: false },
  { id: "s4", name: "Vopsit rădăcină", category: "Coafură", durationMin: 90, price: 180, priceFrom: false },
]

export default function DevBookingPreviewPage() {
  return (
    <>
      <BookingFlow salon={salon} services={services} />
      {/* Static pill demo — verifies the slot design incl. struck-through
          taken slots without a live availability RPC. */}
      <div style={{ background: "var(--paper)", padding: "0 20px 40px", maxWidth: 520, margin: "0 auto" }}>
        <div className="bk-slots" style={{ borderTop: "1px solid var(--rule)", paddingTop: 20 }}>
          <div>
            <div className="bk-sg-label">Dimineața — probă vizuală</div>
            <div className="bk-slotgrid">
              <span className="bk-slot">09:00</span>
              <span className="bk-slot taken" aria-disabled="true">09:15</span>
              <span className="bk-slot on">09:30</span>
              <span className="bk-slot">10:00</span>
              <span className="bk-slot taken" aria-disabled="true">10:30</span>
              <span className="bk-slot">11:00</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
