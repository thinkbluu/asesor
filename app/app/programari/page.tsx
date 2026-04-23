"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus, ChevronLeft, ChevronRight, LayoutGrid, List,
  CalendarDays, Phone, Clock, X, MoreVertical, Check,
  UserPlus, Search, Scissors, AlertTriangle, Ban,
  CheckCircle2, CircleDot, Loader2, MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type Appointment, type AppointmentStatus, type AppointmentService,
  APPOINTMENTS_DATA, CALENDAR_STAFF, STATUS_CONFIG, SALON_HOURS,
  generateTimeSlots, timeToMinutes, minutesToTime, addMinutes,
  formatDateRO, formatDateShortRO, getDayName, toDateString,
  getWeekDates, getMonthDates, getAppointmentsForDate, getDayRevenue,
  CATALOG_SERVICES,
} from "@/lib/programari-data"
import { CLIENTS_DATA } from "@/lib/clienti-data"

type ViewMode = "day" | "week" | "month" | "list"

const TIME_SLOTS = generateTimeSlots(SALON_HOURS.start, SALON_HOURS.end, 60)
const SLOT_HEIGHT = 80 // px per hour
const SALON_START_MINS = timeToMinutes(SALON_HOURS.start)
const SALON_END_MINS = timeToMinutes(SALON_HOURS.end)
const SALON_TOTAL_MINS = SALON_END_MINS - SALON_START_MINS

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTop(time: string): number {
  return ((timeToMinutes(time) - SALON_START_MINS) / 60) * SLOT_HEIGHT
}

function getHeight(duration: number): number {
  return (duration / 60) * SLOT_HEIGHT
}

function getCurrentTimeTop(): number {
  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  return ((mins - SALON_START_MINS) / 60) * SLOT_HEIGHT
}

function isToday(dateStr: string): boolean {
  return dateStr === toDateString(new Date())
}

// ─── Appointment Block ───────────────────────────────────────────────────────

function AppointmentBlock({
  apt, onSelect, staffColor,
}: {
  apt: Appointment
  onSelect: (a: Appointment) => void
  staffColor: string
}) {
  const cfg = STATUS_CONFIG[apt.status]
  const top = getTop(apt.startTime)
  const height = Math.max(getHeight(apt.duration), 28)
  const isShort = height < 52

  return (
    <div
      className={cn(
        "absolute left-1 right-1 rounded-md cursor-pointer select-none overflow-hidden",
        "transition-all hover:z-20 hover:shadow-lg hover:scale-[1.01]",
        cfg.bg, "border border-current", cfg.color,
      )}
      style={{
        top: `${top}px`,
        height: `${height - 2}px`,
        borderLeftWidth: 3,
        borderLeftColor: staffColor,
        zIndex: 10,
      }}
      onClick={() => onSelect(apt)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(apt)}
    >
      <div className="px-1.5 py-1 h-full flex flex-col justify-start">
        <p className={cn("font-semibold leading-tight truncate", isShort ? "text-[10px]" : "text-xs")}>
          {apt.clientName}
        </p>
        {!isShort && (
          <>
            <p className="text-[10px] leading-tight truncate opacity-75">{apt.services.map(s => s.name).join(", ")}</p>
            <div className="mt-auto flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 opacity-60" />
              <span className="text-[10px] opacity-70">{apt.startTime}–{apt.endTime}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Detail Panel ────────────────────────────────────────────────────────────

function AppointmentDetail({
  apt, onClose, onStatusChange,
}: {
  apt: Appointment
  onClose: () => void
  onStatusChange: (id: string, status: AppointmentStatus) => void
}) {
  const cfg = STATUS_CONFIG[apt.status]
  const staff = CALENDAR_STAFF.find(s => s.id === apt.staffId)
  const totalFinal = apt.discountType === "procent"
    ? apt.totalPrice * (1 - apt.discount / 100)
    : apt.totalPrice - apt.discount

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-base text-foreground">{apt.clientName}</h3>
          <p className="text-sm text-muted-foreground">{apt.clientPhone}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs border", cfg.color, cfg.bg, "border-current")}>
            {cfg.label}
          </Badge>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Time & Staff */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Data & Ora</p>
            <p className="text-sm font-medium">{new Date(apt.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}</p>
            <p className="text-sm font-medium">{apt.startTime} – {apt.endTime}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Angajat</p>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: staff?.color }}>
                {staff?.initials}
              </div>
              <p className="text-sm font-medium truncate">{apt.staffName}</p>
            </div>
          </div>
        </div>

        {/* Services */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Servicii</p>
          <div className="space-y-1.5">
            {apt.services.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{s.name}</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{s.duration}min</span>
                  <span className="font-medium text-foreground">{s.price} RON</span>
                </div>
              </div>
            ))}
            {apt.discount > 0 && (
              <div className="flex items-center justify-between text-sm text-emerald-600">
                <span>Reducere {apt.discountType === "procent" ? `${apt.discount}%` : ""}</span>
                <span>-{apt.discountType === "procent" ? Math.round(apt.totalPrice * apt.discount / 100) : apt.discount} RON</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t border-border">
              <span>Total</span>
              <span>{Math.round(totalFinal)} RON</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {apt.notes && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-500">Notă</span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-400">{apt.notes}</p>
          </div>
        )}

        {/* Source */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Sursă: <span className="capitalize">{apt.source}</span></span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className="text-xs" onClick={() => onStatusChange(apt.id, "anulat")}>
            <Ban className="h-3.5 w-3.5 mr-1.5" /> Anulează
          </Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => onStatusChange(apt.id, "no_show")}>
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> No-show
          </Button>
        </div>
        {apt.status !== "finalizat" && (
          <Button
            size="sm"
            className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onStatusChange(apt.id, "finalizat")}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Marchează finalizat
          </Button>
        )}
        {apt.status === "in_asteptare" && (
          <Button
            size="sm"
            className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onStatusChange(apt.id, "confirmat")}
          >
            <Check className="h-3.5 w-3.5 mr-1.5" /> Confirmă programarea
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  date, appointments, onSelectApt, onNewApt,
}: {
  date: string
  appointments: Appointment[]
  onSelectApt: (a: Appointment) => void
  onNewApt: (staffId: string, time: string) => void
}) {
  const nowTop = getCurrentTimeTop()
  const totalHeight = (SALON_TOTAL_MINS / 60) * SLOT_HEIGHT
  const showNowLine = isToday(date)

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[700px]">
        {/* Staff headers */}
        <div className="sticky top-0 z-30 bg-background border-b border-border flex">
          <div className="w-16 shrink-0 border-r border-border" />
          {CALENDAR_STAFF.map(staff => (
            <div key={staff.id} className="flex-1 flex items-center gap-2 px-3 py-2.5 border-r border-border last:border-r-0">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ backgroundColor: staff.color }}
              >
                {staff.initials}
              </div>
              <span className="text-sm font-medium truncate">{staff.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex relative" style={{ height: `${totalHeight}px` }}>
          {/* Time column */}
          <div className="w-16 shrink-0 border-r border-border relative">
            {TIME_SLOTS.map(slot => (
              <div key={slot} className="absolute w-full pr-2 flex justify-end" style={{ top: `${getTop(slot) - 8}px` }}>
                <span className="text-[11px] text-muted-foreground">{slot}</span>
              </div>
            ))}
          </div>

          {/* Staff columns */}
          {CALENDAR_STAFF.map(staff => {
            const staffApts = appointments.filter(a => a.staffId === staff.id)
            return (
              <div
                key={staff.id}
                className="flex-1 relative border-r border-border last:border-r-0"
              >
                {/* Hour lines */}
                {TIME_SLOTS.map(slot => (
                  <div
                    key={slot}
                    className="absolute w-full border-t border-border/50"
                    style={{ top: `${getTop(slot)}px` }}
                  />
                ))}
                {/* Half-hour lines */}
                {TIME_SLOTS.map(slot => {
                  const mins = timeToMinutes(slot) + 30
                  if (mins >= SALON_END_MINS) return null
                  return (
                    <div
                      key={`${slot}-half`}
                      className="absolute w-full border-t border-border/25 border-dashed"
                      style={{ top: `${getTop(minutesToTime(mins))}px` }}
                    />
                  )
                })}
                {/* Click to add */}
                {Array.from({ length: (SALON_TOTAL_MINS / 30) }, (_, i) => {
                  const mins = SALON_START_MINS + i * 30
                  const time = minutesToTime(mins)
                  return (
                    <div
                      key={time}
                      className="absolute w-full opacity-0 hover:opacity-100 hover:bg-emerald-500/5 cursor-pointer flex items-center justify-center group"
                      style={{ top: `${getTop(time)}px`, height: `${SLOT_HEIGHT / 2}px` }}
                      onClick={() => onNewApt(staff.id, time)}
                    >
                      <span className="text-[10px] text-emerald-600 font-medium group-hover:opacity-100 opacity-0">+ {time}</span>
                    </div>
                  )
                })}
                {/* Appointments */}
                {staffApts.map(apt => (
                  <AppointmentBlock key={apt.id} apt={apt} onSelect={onSelectApt} staffColor={staff.color} />
                ))}
              </div>
            )
          })}

          {/* Current time line */}
          {showNowLine && nowTop > 0 && nowTop < totalHeight && (
            <div
              className="absolute left-16 right-0 flex items-center pointer-events-none"
              style={{ top: `${nowTop}px`, zIndex: 25 }}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0" />
              <div className="h-px flex-1 bg-red-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  weekDates, allAppointments, onSelectApt, onDayClick,
}: {
  weekDates: string[]
  allAppointments: Appointment[]
  onSelectApt: (a: Appointment) => void
  onDayClick: (date: string) => void
}) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[640px]">
        {/* Day headers */}
        <div className="sticky top-0 z-20 bg-background border-b border-border grid grid-cols-7 ml-14">
          {weekDates.map(date => {
            const dayApts = allAppointments.filter(a => a.date === date)
            const today = isToday(date)
            return (
              <button
                key={date}
                type="button"
                onClick={() => onDayClick(date)}
                className={cn(
                  "py-2.5 text-center border-r border-border last:border-r-0 hover:bg-muted/50 transition-colors",
                  today && "bg-emerald-500/5"
                )}
              >
                <p className={cn("text-xs text-muted-foreground capitalize", today && "text-emerald-600 font-medium")}>
                  {getDayName(date)}
                </p>
                <p className={cn(
                  "text-sm font-semibold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto",
                  today ? "bg-emerald-600 text-white" : "text-foreground"
                )}>
                  {new Date(date).getDate()}
                </p>
                {dayApts.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{dayApts.length} apt.</p>
                )}
              </button>
            )
          })}
        </div>

        {/* Grid */}
        <div className="flex">
          <div className="w-14 shrink-0 border-r border-border relative">
            {TIME_SLOTS.map(slot => (
              <div key={slot} className="h-16 border-b border-border/50 flex items-start justify-end pr-2 pt-1">
                <span className="text-[10px] text-muted-foreground">{slot}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 grid grid-cols-7">
            {weekDates.map(date => {
              const dayApts = allAppointments.filter(a => a.date === date)
              const today = isToday(date)
              return (
                <div key={date} className={cn("relative border-r border-border last:border-r-0", today && "bg-emerald-500/5")}>
                  {TIME_SLOTS.map(slot => (
                    <div key={slot} className="h-16 border-b border-border/50" />
                  ))}
                  {dayApts.map(apt => {
                    const staff = CALENDAR_STAFF.find(s => s.id === apt.staffId)
                    const top = getTop(apt.startTime)
                    const height = Math.max(getHeight(apt.duration), 20)
                    const cfg = STATUS_CONFIG[apt.status]
                    return (
                      <div
                        key={apt.id}
                        className={cn("absolute left-0.5 right-0.5 rounded cursor-pointer text-[10px] px-1 py-0.5 overflow-hidden hover:z-10", cfg.bg, cfg.color)}
                        style={{ top: `${top}px`, height: `${height - 1}px`, borderLeft: `2px solid ${staff?.color}` }}
                        onClick={() => onSelectApt(apt)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && onSelectApt(apt)}
                      >
                        <p className="font-medium leading-tight truncate">{apt.clientName}</p>
                        <p className="opacity-70 leading-tight truncate">{apt.services[0]?.name}</p>
                      </div>
                    )
                  })}
                  {today && (() => {
                    const t = getCurrentTimeTop()
                    if (t <= 0 || t >= (SALON_TOTAL_MINS / 60) * SLOT_HEIGHT) return null
                    return (
                      <div className="absolute left-0 right-0 flex items-center pointer-events-none z-20" style={{ top: `${t}px` }}>
                        <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                        <div className="h-px flex-1 bg-red-500" />
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  year, month, allAppointments, onDayClick,
}: {
  year: number
  month: number
  allAppointments: Appointment[]
  onDayClick: (date: string) => void
}) {
  const weeks = getMonthDates(year, month)
  const dayNames = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"]
  const today = toDateString(new Date())

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/50">
          {dayNames.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-r-0">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-t border-border">
            {week.map((date, di) => {
              if (!date) return <div key={di} className="border-r border-border last:border-r-0 h-28 bg-muted/20" />
              const dayApts = allAppointments.filter(a => a.date === date)
              const revenue = getDayRevenue(date)
              const isCurrentMonth = new Date(date).getMonth() === month
              const isToday2 = date === today
              const statusDots = Array.from(new Set(dayApts.map(a => a.status))).slice(0, 4)

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => onDayClick(date)}
                  className={cn(
                    "h-28 p-2 text-left border-r border-border last:border-r-0 hover:bg-muted/50 transition-colors flex flex-col",
                    !isCurrentMonth && "opacity-40",
                    isToday2 && "bg-emerald-500/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      isToday2 ? "bg-emerald-600 text-white" : "text-foreground"
                    )}>
                      {new Date(date).getDate()}
                    </span>
                    {dayApts.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">{dayApts.length}</span>
                    )}
                  </div>
                  {revenue > 0 && (
                    <span className="text-[10px] text-emerald-600 font-medium">{revenue} RON</span>
                  )}
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {statusDots.map(status => (
                      <div key={status} className={cn("h-1.5 w-1.5 rounded-full", STATUS_CONFIG[status].dot)} />
                    ))}
                  </div>
                  {dayApts.slice(0, 2).map(apt => (
                    <div key={apt.id} className={cn("text-[10px] leading-tight truncate rounded px-1 mt-0.5", STATUS_CONFIG[apt.status].bg, STATUS_CONFIG[apt.status].color)}>
                      {apt.startTime} {apt.clientName.split(" ")[0]}
                    </div>
                  ))}
                  {dayApts.length > 2 && (
                    <span className="text-[10px] text-muted-foreground mt-0.5">+{dayApts.length - 2} mai mult</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  appointments, onSelectApt,
}: {
  appointments: Appointment[]
  onSelectApt: (a: Appointment) => void
}) {
  const grouped = appointments.reduce((acc, apt) => {
    if (!acc[apt.date]) acc[apt.date] = []
    acc[apt.date].push(apt)
    return acc
  }, {} as Record<string, Appointment[]>)

  const sortedDates = Object.keys(grouped).sort()

  if (sortedDates.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nu există programări pentru perioada selectată.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      {sortedDates.map(date => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("h-2 w-2 rounded-full shrink-0", isToday(date) ? "bg-emerald-500" : "bg-muted-foreground")} />
            <h3 className={cn("text-sm font-semibold capitalize", isToday(date) ? "text-emerald-600" : "text-foreground")}>
              {formatDateRO(date)}
            </h3>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{grouped[date].length} programări</span>
          </div>
          <div className="space-y-2">
            {grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(apt => {
              const cfg = STATUS_CONFIG[apt.status]
              const staff = CALENDAR_STAFF.find(s => s.id === apt.staffId)
              return (
                <button
                  key={apt.id}
                  type="button"
                  onClick={() => onSelectApt(apt)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="text-center shrink-0 w-12">
                    <p className="text-sm font-bold text-foreground">{apt.startTime}</p>
                    <p className="text-[10px] text-muted-foreground">{apt.endTime}</p>
                  </div>
                  <div className="h-10 w-0.5 rounded-full shrink-0" style={{ backgroundColor: staff?.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{apt.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{apt.services.map(s => s.name).join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-muted-foreground">{apt.duration}min</p>
                      <p className="text-xs font-medium text-foreground">{apt.totalPrice} RON</p>
                    </div>
                    <Badge className={cn("text-[10px] border shrink-0", cfg.color, cfg.bg, "border-current")}>
                      {cfg.label}
                    </Badge>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── New Appointment Modal ────────────────────────────────────────────────────

function NewAppointmentModal({
  open, onClose, prefillStaffId, prefillTime, prefillDate,
  onSave,
}: {
  open: boolean
  onClose: () => void
  prefillStaffId?: string
  prefillTime?: string
  prefillDate?: string
  onSave: (apt: Omit<Appointment, "id" | "createdAt">) => void
}) {
  const [clientSearch, setClientSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<typeof CLIENTS_DATA[0] | null>(null)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [selectedServices, setSelectedServices] = useState<AppointmentService[]>([])
  const [staffId, setStaffId] = useState(prefillStaffId ?? "1")
  const [date, setDate] = useState(prefillDate ?? toDateString(new Date()))
  const [startTime, setStartTime] = useState(prefillTime ?? "09:00")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<AppointmentStatus>("confirmat")
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<"procent" | "fix">("procent")
  const [serviceSearch, setServiceSearch] = useState("")

  useEffect(() => {
    if (open) {
      setStaffId(prefillStaffId ?? "1")
      setDate(prefillDate ?? toDateString(new Date()))
      setStartTime(prefillTime ?? "09:00")
      setSelectedServices([])
      setSelectedClient(null)
      setClientSearch("")
      setNotes("")
      setDiscount(0)
    }
  }, [open, prefillStaffId, prefillDate, prefillTime])

  const totalDuration = selectedServices.reduce((s, svc) => s + svc.duration, 0)
  const totalPrice = selectedServices.reduce((s, svc) => s + svc.price, 0)
  const endTime = addMinutes(startTime, totalDuration)
  const discountedTotal = discountType === "procent"
    ? totalPrice * (1 - discount / 100)
    : totalPrice - discount

  const filteredClients = CLIENTS_DATA.filter(c =>
    `${c.prenume} ${c.nume} ${c.phone}`.toLowerCase().includes(clientSearch.toLowerCase())
  ).slice(0, 5)

  const filteredServices = CATALOG_SERVICES.filter(s =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) &&
    !selectedServices.find(sel => sel.name === s.name)
  )

  const staff = CALENDAR_STAFF.find(s => s.id === staffId)
  const TIME_OPTIONS = generateTimeSlots("08:00", "20:00", 15)

  const handleSave = () => {
    if (!selectedClient || selectedServices.length === 0) return
    onSave({
      clientId: selectedClient.id,
      clientName: `${selectedClient.prenume} ${selectedClient.nume}`,
      clientPhone: selectedClient.phone,
      staffId,
      staffName: CALENDAR_STAFF.find(s => s.id === staffId)?.name ?? "",
      services: selectedServices,
      date,
      startTime,
      endTime,
      duration: totalDuration,
      totalPrice,
      discount,
      discountType,
      status,
      notes,
      recurrence: "niciodata",
      source: "salon",
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" />
            Programare nouă
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Client */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Client</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Caută după nume sau telefon..."
                  value={selectedClient ? `${selectedClient.prenume} ${selectedClient.nume}` : clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value)
                    setSelectedClient(null)
                    setShowClientDropdown(true)
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                />
                {selectedClient && (
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => { setSelectedClient(null); setClientSearch("") }}>
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {showClientDropdown && !selectedClient && clientSearch && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg">
                  {filteredClients.length > 0 ? filteredClients.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left first:rounded-t-lg last:rounded-b-lg"
                      onClick={() => { setSelectedClient(c); setShowClientDropdown(false) }}
                    >
                      <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                        {c.prenume[0]}{c.nume[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{c.prenume} {c.nume}</p>
                        <p className="text-xs text-muted-foreground">{c.phone}</p>
                      </div>
                      {c.alergii && <AlertTriangle className="h-4 w-4 text-amber-500 ml-auto shrink-0" />}
                    </button>
                  )) : (
                    <div className="px-3 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <UserPlus className="h-4 w-4" />
                      <span>Niciun client găsit — adaugă client nou</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedClient?.alergii && (
              <div className="flex items-start gap-2 mt-1 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{selectedClient.alergii}</p>
              </div>
            )}
          </div>

          {/* Services */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Servicii</Label>
            {selectedServices.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {selectedServices.map((svc, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-sm">
                    <div className="flex items-center gap-2">
                      <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{svc.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">{svc.duration}min</span>
                      <span className="font-medium">{svc.price} RON</span>
                      <button type="button" onClick={() => setSelectedServices(prev => prev.filter((_, j) => j !== i))}>
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-2.5 pt-1 text-sm font-medium border-t border-border">
                  <span>Total</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">{totalDuration}min</span>
                    <span>{totalPrice} RON</span>
                  </div>
                </div>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Caută serviciu..." value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} />
            </div>
            {serviceSearch && (
              <div className="border border-border rounded-lg overflow-hidden">
                {filteredServices.slice(0, 6).map(svc => (
                  <button
                    key={svc.name}
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted transition-colors text-sm border-b border-border last:border-b-0"
                    onClick={() => {
                      setSelectedServices(prev => [...prev, { name: svc.name, duration: svc.duration, price: svc.price }])
                      setServiceSearch("")
                    }}
                  >
                    <span>{svc.name}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="text-xs">{svc.duration}min</span>
                      <span>{svc.price} RON</span>
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date, Time, Staff */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Data</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Ora</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-48">
                  {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Angajat</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger>
                  <div className="flex items-center gap-2 overflow-hidden">
                    {staff && <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: staff.color }} />}
                    <span className="truncate">{CALENDAR_STAFF.find(s => s.id === staffId)?.name.split(" ")[0]}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {CALENDAR_STAFF.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {totalDuration > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 text-sm text-emerald-700 dark:text-emerald-400">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Se termină la {endTime} ({totalDuration} minute total)</span>
            </div>
          )}

          {/* Discount */}
          {selectedServices.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Reducere (opțional)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={discountType === "procent" ? 100 : totalPrice}
                  value={discount || ""}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="flex-1"
                  placeholder="0"
                />
                <Select value={discountType} onValueChange={(v: "procent" | "fix") => setDiscountType(v)}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="procent">%</SelectItem>
                    <SelectItem value="fix">RON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {discount > 0 && (
                <p className="text-xs text-emerald-600">Total final: {Math.round(discountedTotal)} RON</p>
              )}
            </div>
          )}

          {/* Status & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={status} onValueChange={(v: AppointmentStatus) => setStatus(v)}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", STATUS_CONFIG[status].dot)} />
                    <span>{STATUS_CONFIG[status].label}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {(["confirmat", "in_asteptare"] as AppointmentStatus[]).map(s => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", STATUS_CONFIG[s].dot)} />
                        {STATUS_CONFIG[s].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Note</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note interne..." className="h-9 resize-none text-sm" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          <Button
            onClick={handleSave}
            disabled={!selectedClient || selectedServices.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Check className="h-4 w-4 mr-1.5" />
            Salvează programarea
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProgramariPage() {
  const [view, setView] = useState<ViewMode>("day")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [allAppointments, setAllAppointments] = useState<Appointment[]>(APPOINTMENTS_DATA)
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [newAptOpen, setNewAptOpen] = useState(false)
  const [prefillStaff, setPrefillStaff] = useState<string | undefined>()
  const [prefillTime, setPrefillTime] = useState<string | undefined>()
  const [listSearch, setListSearch] = useState("")
  const [listStatusFilter, setListStatusFilter] = useState<AppointmentStatus | "all">("all")

  const dateStr = toDateString(currentDate)
  const weekDates = getWeekDates(currentDate)

  const dayApts = allAppointments.filter(a => a.date === dateStr)
  const weekApts = allAppointments.filter(a => weekDates.includes(a.date))

  const listApts = allAppointments
    .filter(a => {
      if (listStatusFilter !== "all" && a.status !== listStatusFilter) return false
      if (listSearch) {
        const q = listSearch.toLowerCase()
        return a.clientName.toLowerCase().includes(q) || a.staffName.toLowerCase().includes(q) || a.services.some(s => s.name.toLowerCase().includes(q))
      }
      return true
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

  const todayCount = allAppointments.filter(a => a.date === toDateString(new Date())).length
  const todayRevenue = allAppointments.filter(a => a.date === toDateString(new Date()) && a.status === "finalizat").reduce((s, a) => s + a.totalPrice, 0)
  const confirmedToday = allAppointments.filter(a => a.date === toDateString(new Date()) && (a.status === "confirmat" || a.status === "in_desfasurare")).length

  const navigatePrev = () => {
    const d = new Date(currentDate)
    if (view === "day") d.setDate(d.getDate() - 1)
    else if (view === "week") d.setDate(d.getDate() - 7)
    else { d.setMonth(d.getMonth() - 1) }
    setCurrentDate(d)
  }

  const navigateNext = () => {
    const d = new Date(currentDate)
    if (view === "day") d.setDate(d.getDate() + 1)
    else if (view === "week") d.setDate(d.getDate() + 7)
    else { d.setMonth(d.getMonth() + 1) }
    setCurrentDate(d)
  }

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    setAllAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    setSelectedApt(prev => prev?.id === id ? { ...prev, status } : prev)
  }

  const handleNewApt = (staffId: string, time: string) => {
    setPrefillStaff(staffId)
    setPrefillTime(time)
    setNewAptOpen(true)
  }

  const handleSaveApt = (apt: Omit<Appointment, "id" | "createdAt">) => {
    const id = `a${Date.now()}`
    setAllAppointments(prev => [...prev, { ...apt, id, createdAt: toDateString(new Date()) }])
  }

  const dateLabel = view === "day"
    ? formatDateRO(dateStr)
    : view === "week"
      ? `${formatDateShortRO(weekDates[0])} – ${formatDateShortRO(weekDates[6])} ${currentDate.getFullYear()}`
      : currentDate.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })

  return (
    <div className="flex flex-col h-screen overflow-hidden pt-16 lg:pt-0">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-border bg-background px-4 py-3 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: title + nav */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">Programări</h1>
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
              <button type="button" onClick={navigatePrev} className="p-1.5 rounded hover:bg-muted">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setCurrentDate(new Date())} className="px-2 py-1 text-xs font-medium rounded hover:bg-muted">
                Astăzi
              </button>
              <button type="button" onClick={navigateNext} className="p-1.5 rounded hover:bg-muted">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm font-medium text-muted-foreground capitalize hidden md:block">{dateLabel}</span>
          </div>

          {/* Right: stats + view toggle + new btn */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Quick stats */}
            <div className="hidden lg:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Azi:</span>
                <span className="font-semibold">{todayCount} apt.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="font-semibold">{confirmedToday} confirm.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Încasat:</span>
                <span className="font-semibold text-emerald-600">{todayRevenue} RON</span>
              </div>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
              {([
                { id: "day",   label: "Zi",          icon: CalendarDays },
                { id: "week",  label: "Săptămână",   icon: LayoutGrid },
                { id: "month", label: "Lună",         icon: CalendarDays },
                { id: "list",  label: "Listă",        icon: List },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors",
                    view === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:block">{label}</span>
                </button>
              ))}
            </div>

            <Button
              size="sm"
              onClick={() => { setPrefillStaff(undefined); setPrefillTime(undefined); setNewAptOpen(true) }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Programare nouă
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-hidden flex">
        {/* Calendar / List area */}
        <div className={cn("flex-1 flex flex-col overflow-hidden", selectedApt && "border-r border-border")}>
          {view === "list" && (
            <div className="shrink-0 flex gap-3 px-4 py-2.5 border-b border-border bg-background">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 h-8 text-sm" placeholder="Caută..." value={listSearch} onChange={e => setListSearch(e.target.value)} />
              </div>
              <Select value={listStatusFilter} onValueChange={(v: AppointmentStatus | "all") => setListStatusFilter(v)}>
                <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate statusurile</SelectItem>
                  {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map(s => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", STATUS_CONFIG[s].dot)} />
                        {STATUS_CONFIG[s].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {view === "day" && (
            <DayView
              date={dateStr}
              appointments={dayApts}
              onSelectApt={setSelectedApt}
              onNewApt={handleNewApt}
            />
          )}
          {view === "week" && (
            <WeekView
              weekDates={weekDates}
              allAppointments={weekApts}
              onSelectApt={setSelectedApt}
              onDayClick={(d) => { setCurrentDate(new Date(d)); setView("day") }}
            />
          )}
          {view === "month" && (
            <MonthView
              year={currentDate.getFullYear()}
              month={currentDate.getMonth()}
              allAppointments={allAppointments}
              onDayClick={(d) => { setCurrentDate(new Date(d)); setView("day") }}
            />
          )}
          {view === "list" && (
            <ListView appointments={listApts} onSelectApt={setSelectedApt} />
          )}
        </div>

        {/* Detail panel */}
        {selectedApt && (
          <div className="w-80 shrink-0 flex flex-col bg-background overflow-hidden">
            <AppointmentDetail
              apt={selectedApt}
              onClose={() => setSelectedApt(null)}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}
      </div>

      {/* New Appointment Modal */}
      <NewAppointmentModal
        open={newAptOpen}
        onClose={() => setNewAptOpen(false)}
        prefillStaffId={prefillStaff}
        prefillTime={prefillTime}
        prefillDate={dateStr}
        onSave={handleSaveApt}
      />
    </div>
  )
}
