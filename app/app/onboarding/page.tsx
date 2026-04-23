"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Building2,
  Scissors,
  Clock,
  Users,
  Settings2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  Upload,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────

interface Service {
  id: string
  name: string
  duration: string
  price: string
}

interface StaffMember {
  id: string
  name: string
  role: string
  phone: string
  services: string[]
}

interface DaySchedule {
  open: boolean
  start: string
  end: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: "Salonul tău", icon: Building2 },
  { number: 2, label: "Servicii", icon: Scissors },
  { number: 3, label: "Program", icon: Clock },
  { number: 4, label: "Echipă", icon: Users },
  { number: 5, label: "Reguli", icon: Settings2 },
]

const DAYS = [
  { key: "luni", label: "Luni" },
  { key: "marti", label: "Marți" },
  { key: "miercuri", label: "Miercuri" },
  { key: "joi", label: "Joi" },
  { key: "vineri", label: "Vineri" },
  { key: "sambata", label: "Sâmbătă" },
  { key: "duminica", label: "Duminică" },
]

const ROLES = ["Coafor", "Stilist", "Manichiuristă", "Esteticiană", "Frizer", "Manager", "Recepționer"]

const DEFAULT_SERVICES: Service[] = [
  { id: "1", name: "Tuns dame", duration: "60", price: "80" },
  { id: "2", name: "Vopsit rădăcini", duration: "90", price: "150" },
  { id: "3", name: "Manichiură gel", duration: "60", price: "100" },
  { id: "4", name: "Tratament facial", duration: "45", price: "120" },
  { id: "5", name: "Coafat", duration: "30", price: "60" },
]

const DEFAULT_SCHEDULE: Record<string, DaySchedule> = {
  luni:      { open: true,  start: "09:00", end: "19:00" },
  marti:     { open: true,  start: "09:00", end: "19:00" },
  miercuri:  { open: true,  start: "09:00", end: "19:00" },
  joi:       { open: true,  start: "09:00", end: "19:00" },
  vineri:    { open: true,  start: "09:00", end: "19:00" },
  sambata:   { open: true,  start: "09:00", end: "15:00" },
  duminica:  { open: false, start: "10:00", end: "14:00" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9)

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {STEPS.map((step, i) => {
        const done = current > step.number
        const active = current === step.number
        return (
          <div key={step.number} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  done   && "bg-[#2D8C3C] text-white",
                  active && "bg-[#0A0A0A] text-white ring-4 ring-[#0A0A0A]/10",
                  !done && !active && "bg-[#0A0A0A]/8 text-[#0A0A0A]/40",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : step.number}
              </div>
              <span
                className={cn(
                  "hidden sm:block text-xs font-medium",
                  active ? "text-[#0A0A0A]" : "text-[#0A0A0A]/40",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px flex-1 transition-colors", done ? "bg-[#2D8C3C]" : "bg-[#0A0A0A]/10")} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Salon Info ───────────────────────────────────────────────────────

function Step1({
  data,
  onChange,
}: {
  data: { name: string; address: string; city: string; phone: string }
  onChange: (field: string, value: string) => void
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0A0A0A]">Spune-ne despre salonul tău</h2>
        <p className="mt-1 text-sm text-[#0A0A0A]/50">Poți modifica oricând din setări</p>
      </div>

      {/* Logo upload */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-[#0A0A0A]/15 bg-white cursor-pointer hover:border-[#2D8C3C]/50 transition-colors group">
          <Upload className="h-5 w-5 text-[#0A0A0A]/25 group-hover:text-[#2D8C3C]/50 transition-colors" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#0A0A0A]">Logo salon</p>
          <p className="text-xs text-[#0A0A0A]/40">JPG, PNG sau SVG. Opțional.</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#0A0A0A]">Numele salonului *</Label>
        <Input
          placeholder="Beauty Studio"
          value={data.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="h-11 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C] focus-visible:border-[#2D8C3C]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#0A0A0A]">Adresă</Label>
        <Input
          placeholder="Str. Exemplu nr. 10, ap. 2"
          value={data.address}
          onChange={(e) => onChange("address", e.target.value)}
          className="h-11 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C] focus-visible:border-[#2D8C3C]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[#0A0A0A]">Oraș *</Label>
          <Input
            placeholder="București"
            value={data.city}
            onChange={(e) => onChange("city", e.target.value)}
            className="h-11 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C] focus-visible:border-[#2D8C3C]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[#0A0A0A]">Telefon</Label>
          <Input
            placeholder="07XX XXX XXX"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className="h-11 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C] focus-visible:border-[#2D8C3C]"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Services ─────────────────────────────────────────────────────────

function Step2({
  services,
  onChange,
}: {
  services: Service[]
  onChange: (services: Service[]) => void
}) {
  const addService = () => {
    onChange([...services, { id: uid(), name: "", duration: "30", price: "" }])
  }

  const updateService = (id: string, field: keyof Service, value: string) => {
    onChange(services.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const removeService = (id: string) => {
    if (services.length <= 1) return
    onChange(services.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0A0A0A]">Servicii oferite</h2>
        <p className="mt-1 text-sm text-[#0A0A0A]/50">Editează lista sau adaugă servicii noi</p>
      </div>

      <div className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-[1fr_100px_90px_32px] gap-2 px-1">
          <span className="text-xs font-medium text-[#0A0A0A]/40">Serviciu</span>
          <span className="text-xs font-medium text-[#0A0A0A]/40">Durată</span>
          <span className="text-xs font-medium text-[#0A0A0A]/40">Preț (RON)</span>
          <span />
        </div>

        {services.map((service) => (
          <div key={service.id} className="grid grid-cols-[1fr_100px_90px_32px] gap-2 items-center">
            <Input
              placeholder="Numele serviciului"
              value={service.name}
              onChange={(e) => updateService(service.id, "name", e.target.value)}
              className="h-10 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C] text-sm"
            />
            <Select
              value={service.duration}
              onValueChange={(v) => updateService(service.id, "duration", v)}
            >
              <SelectTrigger className="h-10 border-[#0A0A0A]/15 bg-white text-sm focus:ring-[#2D8C3C]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["15", "30", "45", "60", "90", "120"].map((d) => (
                  <SelectItem key={d} value={d}>
                    {d} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="0"
              type="number"
              value={service.price}
              onChange={(e) => updateService(service.id, "price", e.target.value)}
              className="h-10 border-[#0A0A0A]/15 bg-white focus-visible:ring-[#2D8C3C] text-sm"
            />
            <button
              type="button"
              onClick={() => removeService(service.id)}
              disabled={services.length <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#0A0A0A]/30 hover:text-red-500 hover:bg-red-50 disabled:opacity-20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addService}
        className="flex items-center gap-2 text-sm font-medium text-[#2D8C3C] hover:text-[#256b30] transition-colors"
      >
        <Plus className="h-4 w-4" /> Adaugă serviciu
      </button>
    </div>
  )
}

// ─── Step 3: Schedule ─────────────────────────────────────────────────────────

function Step3({
  schedule,
  onChange,
}: {
  schedule: Record<string, DaySchedule>
  onChange: (schedule: Record<string, DaySchedule>) => void
}) {
  const toggle = (day: string, field: keyof DaySchedule, value: boolean | string) => {
    onChange({ ...schedule, [day]: { ...schedule[day], [field]: value } })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0A0A0A]">Program de lucru</h2>
        <p className="mt-1 text-sm text-[#0A0A0A]/50">Setează orele pentru fiecare zi</p>
      </div>

      <div className="space-y-2">
        {DAYS.map(({ key, label }) => {
          const day = schedule[key]
          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-3 transition-colors",
                day.open ? "border-[#0A0A0A]/10 bg-white" : "border-[#0A0A0A]/5 bg-[#0A0A0A]/2",
              )}
            >
              <div className="flex items-center gap-3 w-28">
                <button
                  type="button"
                  onClick={() => toggle(key, "open", !day.open)}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors shrink-0",
                    day.open ? "bg-[#2D8C3C]" : "bg-[#0A0A0A]/15",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                      day.open ? "translate-x-4" : "translate-x-0.5",
                    )}
                  />
                </button>
                <span
                  className={cn(
                    "text-sm font-medium w-16",
                    day.open ? "text-[#0A0A0A]" : "text-[#0A0A0A]/35",
                  )}
                >
                  {label}
                </span>
              </div>

              {day.open ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={day.start}
                    onChange={(e) => toggle(key, "start", e.target.value)}
                    className="h-9 w-28 border-[#0A0A0A]/15 bg-white text-sm focus-visible:ring-[#2D8C3C]"
                  />
                  <span className="text-[#0A0A0A]/30 text-sm">—</span>
                  <Input
                    type="time"
                    value={day.end}
                    onChange={(e) => toggle(key, "end", e.target.value)}
                    className="h-9 w-28 border-[#0A0A0A]/15 bg-white text-sm focus-visible:ring-[#2D8C3C]"
                  />
                </div>
              ) : (
                <span className="text-sm text-[#0A0A0A]/30 italic">Închis</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 4: Team ─────────────────────────────────────────────────────────────

function Step4({
  staff,
  services,
  onChange,
}: {
  staff: StaffMember[]
  services: Service[]
  onChange: (staff: StaffMember[]) => void
}) {
  const addMember = () => {
    onChange([...staff, { id: uid(), name: "", role: "", phone: "", services: [] }])
  }

  const updateMember = (id: string, field: keyof StaffMember, value: string | string[]) => {
    onChange(staff.map((m) => (m.id === id ? { ...m, [field]: value } : m)))
  }

  const toggleService = (memberId: string, serviceId: string) => {
    const member = staff.find((m) => m.id === memberId)
    if (!member) return
    const has = member.services.includes(serviceId)
    updateMember(memberId, "services", has ? member.services.filter((s) => s !== serviceId) : [...member.services, serviceId])
  }

  const removeMember = (id: string) => {
    if (staff.length <= 1) return
    onChange(staff.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0A0A0A]">Echipa ta</h2>
        <p className="mt-1 text-sm text-[#0A0A0A]/50">Adaugă cel puțin un angajat</p>
      </div>

      <div className="space-y-4">
        {staff.map((member, idx) => (
          <div key={member.id} className="rounded-xl border border-[#0A0A0A]/10 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0A0A0A]/40 uppercase tracking-wide">
                Angajat {idx + 1}
              </span>
              {staff.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMember(member.id)}
                  className="text-[#0A0A0A]/30 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#0A0A0A]/60">Nume *</Label>
                <Input
                  placeholder="Ana Ionescu"
                  value={member.name}
                  onChange={(e) => updateMember(member.id, "name", e.target.value)}
                  className="h-10 border-[#0A0A0A]/15 bg-[#F7F5F2] text-sm focus-visible:ring-[#2D8C3C]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#0A0A0A]/60">Rol</Label>
                <Select
                  value={member.role}
                  onValueChange={(v) => updateMember(member.id, "role", v)}
                >
                  <SelectTrigger className="h-10 border-[#0A0A0A]/15 bg-[#F7F5F2] text-sm focus:ring-[#2D8C3C]">
                    <SelectValue placeholder="Selectează" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#0A0A0A]/60">Telefon</Label>
              <Input
                placeholder="07XX XXX XXX"
                value={member.phone}
                onChange={(e) => updateMember(member.id, "phone", e.target.value)}
                className="h-10 border-[#0A0A0A]/15 bg-[#F7F5F2] text-sm focus-visible:ring-[#2D8C3C]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-[#0A0A0A]/60">Servicii efectuate</Label>
              <div className="flex flex-wrap gap-2">
                {services.filter((s) => s.name).map((service) => {
                  const checked = member.services.includes(service.id)
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(member.id, service.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                        checked
                          ? "bg-[#2D8C3C]/10 border-[#2D8C3C]/30 text-[#2D8C3C]"
                          : "bg-white border-[#0A0A0A]/12 text-[#0A0A0A]/50 hover:border-[#0A0A0A]/25",
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                      {service.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addMember}
        className="flex items-center gap-2 text-sm font-medium text-[#2D8C3C] hover:text-[#256b30] transition-colors"
      >
        <Plus className="h-4 w-4" /> Adaugă angajat
      </button>
    </div>
  )
}

// ─── Step 5: Booking Rules ────────────────────────────────────────────────────

function Step5({
  rules,
  onChange,
}: {
  rules: { buffer: string; minAdvance: string; cancelWindow: string; onlineBooking: boolean }
  onChange: (field: string, value: string | boolean) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0A0A0A]">Reguli de programare</h2>
        <p className="mt-1 text-sm text-[#0A0A0A]/50">Configurează cum funcționează programările</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[#0A0A0A]">Pauză între programări</Label>
          <p className="text-xs text-[#0A0A0A]/40">Timp de buffer după fiecare programare</p>
          <Select value={rules.buffer} onValueChange={(v) => onChange("buffer", v)}>
            <SelectTrigger className="h-11 border-[#0A0A0A]/15 bg-white focus:ring-[#2D8C3C]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Fără pauză</SelectItem>
              <SelectItem value="5">5 minute</SelectItem>
              <SelectItem value="10">10 minute</SelectItem>
              <SelectItem value="15">15 minute</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[#0A0A0A]">Programare minimă în avans</Label>
          <p className="text-xs text-[#0A0A0A]/40">Cu cât timp înainte poate fi făcută o programare</p>
          <Select value={rules.minAdvance} onValueChange={(v) => onChange("minAdvance", v)}>
            <SelectTrigger className="h-11 border-[#0A0A0A]/15 bg-white focus:ring-[#2D8C3C]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 oră</SelectItem>
              <SelectItem value="2h">2 ore</SelectItem>
              <SelectItem value="4h">4 ore</SelectItem>
              <SelectItem value="24h">24 de ore</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[#0A0A0A]">Fereastră de anulare</Label>
          <p className="text-xs text-[#0A0A0A]/40">Cu cât timp înainte poate fi anulată o programare</p>
          <Select value={rules.cancelWindow} onValueChange={(v) => onChange("cancelWindow", v)}>
            <SelectTrigger className="h-11 border-[#0A0A0A]/15 bg-white focus:ring-[#2D8C3C]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2h">2 ore</SelectItem>
              <SelectItem value="4h">4 ore</SelectItem>
              <SelectItem value="12h">12 ore</SelectItem>
              <SelectItem value="24h">24 de ore</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#0A0A0A]/10 bg-white p-4">
          <div>
            <p className="text-sm font-medium text-[#0A0A0A]">Activează link programare online</p>
            <p className="text-xs text-[#0A0A0A]/45 mt-0.5">
              Clienții se pot programa direct de pe un link public
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange("onlineBooking", !rules.onlineBooking)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors shrink-0",
              rules.onlineBooking ? "bg-[#2D8C3C]" : "bg-[#0A0A0A]/15",
            )}
          >
            <div
              className={cn(
                "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
                rules.onlineBooking ? "translate-x-5" : "translate-x-1",
              )}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { completeOnboarding } = useAuth()
  const [step, setStep] = useState(1)

  const [salon, setSalon] = useState({ name: "", address: "", city: "", phone: "" })
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES)
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(DEFAULT_SCHEDULE)
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: uid(), name: "", role: "", phone: "", services: [] },
  ])
  const [rules, setRules] = useState({
    buffer: "5",
    minAdvance: "1h",
    cancelWindow: "2h",
    onlineBooking: true,
  })

  const canAdvance = () => {
    if (step === 1) return salon.name.trim().length > 0 && salon.city.trim().length > 0
    if (step === 4) return staff.some((m) => m.name.trim().length > 0)
    return true
  }

  const handleNext = () => {
    if (step < 5) setStep(step + 1)
    else completeOnboarding()
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A0A0A]">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <span className="text-base font-semibold text-[#0A0A0A] tracking-tight">ASESOR</span>
          </div>
          <span className="text-xs text-[#0A0A0A]/40 font-medium">
            Pas {step} din {STEPS.length}
          </span>
        </div>

        <ProgressBar current={step} />

        <div className="rounded-2xl border border-[#0A0A0A]/8 bg-white p-8 shadow-sm">
          {step === 1 && (
            <Step1
              data={salon}
              onChange={(field, value) => setSalon((prev) => ({ ...prev, [field]: value }))}
            />
          )}
          {step === 2 && <Step2 services={services} onChange={setServices} />}
          {step === 3 && <Step3 schedule={schedule} onChange={setSchedule} />}
          {step === 4 && (
            <Step4 staff={staff} services={services} onChange={setStaff} />
          )}
          {step === 5 && (
            <Step5
              rules={rules}
              onChange={(field, value) => setRules((prev) => ({ ...prev, [field]: value }))}
            />
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className="text-[#0A0A0A]/50 hover:text-[#0A0A0A] disabled:opacity-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi
            </Button>

            <div className="flex items-center gap-3">
              {step < 5 && (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="text-sm text-[#0A0A0A]/40 hover:text-[#0A0A0A]/60 transition-colors"
                >
                  Sari peste
                </button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canAdvance()}
                className="bg-[#0A0A0A] hover:bg-[#1a1a1a] text-white font-semibold px-6 disabled:opacity-40"
              >
                {step === 5 ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Finalizează
                  </>
                ) : (
                  <>
                    Continuă <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Step dots */}
        <div className="mt-6 flex justify-center gap-1.5">
          {STEPS.map((s) => (
            <div
              key={s.number}
              className={cn(
                "h-1.5 rounded-full transition-all",
                s.number === step ? "w-5 bg-[#0A0A0A]" : s.number < step ? "w-1.5 bg-[#2D8C3C]" : "w-1.5 bg-[#0A0A0A]/15",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
