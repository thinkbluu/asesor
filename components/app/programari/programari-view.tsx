"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import { CheckoutDialog } from "@/components/app/programari/checkout-dialog"
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
  Plus, ChevronLeft, ChevronRight, LayoutGrid, List,
  CalendarDays, Clock, X, Check,
  UserPlus, Search, Scissors, AlertTriangle, Ban,
  CheckCircle2, Loader2, MessageSquare, Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type Appointment, type AppointmentStatus, type AppointmentServiceView,
  type CalendarStaff, type CatalogService, type StaffServiceOverride,
  STATUS_CONFIG, RECURRENCE_LABELS, resolveServiceForStaff,
  type RecurrenceType,
} from "@/lib/mappers/programari"
import {
  timeToMinutes, minutesToTime, addMinutes,
  formatDateRO, formatDateShortRO, getDayName,
  getWeekDates, getMonthDates, todayBucharest, zonedParts,
} from "@/lib/time"
import type { AppRole } from "@/lib/auth/session"
import { Checkbox } from "@/components/ui/checkbox"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import {
  loadRangeAction, searchClientsAction, createClientInlineAction,
  createAppointmentAction, updateAppointmentAction, updateAppointmentStatusAction,
} from "@/app/app/programari/actions"
import type { ClientSearchResult } from "@/lib/data/programari"
import { AppointmentWhatsApp } from "@/components/app/appointment-whatsapp"
import { AppointmentLoyalty } from "@/components/app/appointment-loyalty"

const SALON_HOURS = { start: "09:00", end: "20:00" }
const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => minutesToTime(9 * 60 + i * 60))
const SLOT_HEIGHT = 80 // px per hour
const SALON_START_MINS = timeToMinutes(SALON_HOURS.start)
const SALON_END_MINS = timeToMinutes(SALON_HOURS.end)
const SALON_TOTAL_MINS = SALON_END_MINS - SALON_START_MINS
const DRAG_THRESHOLD_PX = 4
const SNAP_MIN = 5

type ViewMode = "day" | "week" | "month" | "list"

interface ProgramariViewProps {
  salonId: string
  role: AppRole
  staffId: string | null
  staff: CalendarStaff[]
  services: CatalogService[]
  staffServices: StaffServiceOverride[]
  initialAppointments: Appointment[]
  initialDate: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTop(time: string): number {
  return ((timeToMinutes(time) - SALON_START_MINS) / 60) * SLOT_HEIGHT
}

function getHeight(duration: number): number {
  return (duration / 60) * SLOT_HEIGHT
}

function getCurrentTimeTop(): number {
  const p = zonedParts(new Date())
  const mins = p.hour * 60 + p.minute
  return ((mins - SALON_START_MINS) / 60) * SLOT_HEIGHT
}

function isToday(dateStr: string): boolean {
  return dateStr === todayBucharest()
}

function snapTo(minutes: number): number {
  return Math.round(minutes / SNAP_MIN) * SNAP_MIN
}

// ─── Appointment Block (day view, with drag + resize) ───────────────────────

interface DragState {
  apt: Appointment
  mode: "move" | "resize"
  startX: number
  startY: number
  origStartMin: number
  origDuration: number
  curStartMin: number
  curDuration: number
  staffIndex: number
  active: boolean
}

function AppointmentBlock({
  apt, staffColor, canDrag, onOpen, onDragStart,
}: {
  apt: Appointment
  staffColor: string
  canDrag: boolean
  onOpen: (a: Appointment) => void
  onDragStart: (e: React.PointerEvent, apt: Appointment, mode: "move" | "resize") => void
}) {
  const cfg = STATUS_CONFIG[apt.status]
  const top = getTop(apt.startTime)
  const height = Math.max(getHeight(apt.duration), 28)
  const isShort = height < 52

  return (
    <div
      className={cn(
        "absolute left-1 right-1 rounded-md select-none overflow-hidden",
        "transition-shadow hover:z-20 hover:shadow-lg",
        canDrag && "cursor-grab active:cursor-grabbing",
        cfg.bg, "border border-current", cfg.color,
      )}
      style={{
        top: `${top}px`,
        height: `${height - 2}px`,
        borderLeftWidth: 3,
        borderLeftColor: staffColor,
        zIndex: 10,
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        if (!canDrag || e.button !== 0) return
        onDragStart(e, apt, "move")
      }}
      onClick={() => onOpen(apt)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(apt)}
    >
      <div className="px-1.5 py-1 h-full flex flex-col justify-start pointer-events-none">
        <p className={cn("font-semibold leading-tight truncate", isShort ? "text-[10px]" : "text-xs")}>
          {apt.clientHasAllergies && (
            <span
              className="mr-1 inline-block h-2 w-2 rounded-full bg-red-600 align-middle"
              title="Clienta are alergii înregistrate"
              aria-label="Clienta are alergii înregistrate"
            />
          )}
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
      {canDrag && (
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
          onPointerDown={(e) => {
            e.stopPropagation()
            onDragStart(e, apt, "resize")
          }}
        />
      )}
    </div>
  )
}

// ─── Detail Panel ────────────────────────────────────────────────────────────

function AppointmentDetail({
  apt, onClose, onStatusChange, onEdit, canEdit, canStatus, clientInfo, onCheckout,
}: {
  apt: Appointment
  onClose: () => void
  onStatusChange: (id: string, status: AppointmentStatus) => void
  onEdit: (apt: Appointment) => void
  canEdit: boolean
  canStatus: boolean
  clientInfo: ClientSearchResult | null
  onCheckout?: (apt: Appointment) => void
}) {
  const cfg = STATUS_CONFIG[apt.status]
  const staff = apt.staffName
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
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Închide">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Allergy safety warning — boolean flag only; the details live in the
            client's protected file (owner/manager/staff) */}
        {apt.clientHasAllergies && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3" role="alert">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Clienta are alergii înregistrate
              </p>
              <p className="text-xs text-red-700/80 dark:text-red-400/80">
                Verifică fișa protejată a clientei înainte de serviciu.
              </p>
            </div>
          </div>
        )}

        {/* Time & Staff */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Data & Ora</p>
            <p className="text-sm font-medium">{new Date(`${apt.date}T12:00:00`).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}</p>
            <p className="text-sm font-medium">{apt.startTime} – {apt.endTime}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Angajat</p>
            <p className="text-sm font-medium truncate">{staff}</p>
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

        {apt.status === "anulat" && apt.cancelReason && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
            <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Motiv anulare</p>
            <p className="text-xs text-red-800 dark:text-red-300">{apt.cancelReason}</p>
          </div>
        )}

        {/* Recurrence */}
        {apt.recurrence !== "niciodata" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Recurent: {RECURRENCE_LABELS[apt.recurrence]}</span>
          </div>
        )}

        {/* Source */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Sursă: <span className="capitalize">{apt.source}</span></span>
        </div>

        {/* WhatsApp */}
        <div className="rounded-xl border border-border bg-card p-3">
          <AppointmentWhatsApp
            appointmentId={apt.id}
            clientId={apt.clientId}
            clientName={apt.clientName}
            clientPhone={apt.clientPhone}
            clientWhatsApp={clientInfo?.whatsappPhone ?? undefined}
            salonName="Beauty Studio"
            salonPhone="0722 123 456"
            date={apt.date}
            startTime={apt.startTime}
            staffName={apt.staffName}
            serviceNames={apt.services.map((s) => s.name)}
          />
        </div>

        {/* Loyalty */}
        <AppointmentLoyalty
          clientId={apt.clientId}
          clientBalance={clientInfo?.loyaltyPoints ?? 0}
          clientBirthday={clientInfo?.birthDate ?? undefined}
          isFirstVisit={false}
          totalPrice={apt.totalPrice}
          visitDate={apt.date}
          isCompleted={apt.status === "finalizat"}
        />
      </div>

      {/* Actions — status changes for staff on their own appointments too;
          full edit (services/staff/time) only for owner/manager/receptionist */}
      {(canEdit || canStatus) && (
        <div className="p-4 border-t border-border space-y-2">
          {canEdit && (
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onEdit(apt)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editează
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="text-xs" onClick={() => onStatusChange(apt.id, "anulat")}>
              <Ban className="h-3.5 w-3.5 mr-1.5" /> Anulează
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => onStatusChange(apt.id, "no_show")}>
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> No-show
            </Button>
          </div>
          {apt.status !== "finalizat" && (
            onCheckout ? (
              <Button
                size="sm"
                className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onCheckout(apt)}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Încasează
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onStatusChange(apt.id, "finalizat")}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Marchează finalizat
              </Button>
            )
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
      )}
    </div>
  )
}

// ─── Day View ──────────────────────────────────────────────────────────────��──

function DayView({
  date, appointments, staff, onSelectApt, onNewApt, canEditApt, onReschedule, onResize,
}: {
  date: string
  appointments: Appointment[]
  staff: CalendarStaff[]
  onSelectApt: (a: Appointment) => void
  onNewApt: (staffId: string, time: string) => void
  canEditApt: (a: Appointment) => boolean
  onReschedule: (apt: Appointment, staffId: string, startTime: string) => void
  onResize: (apt: Appointment, durationMin: number) => void
}) {
  const nowTop = getCurrentTimeTop()
  const totalHeight = (SALON_TOTAL_MINS / 60) * SLOT_HEIGHT
  const showNowLine = isToday(date)
  const [drag, setDrag] = useState<DragState | null>(null)
  const columnsRef = useRef<HTMLDivElement | null>(null)
  const justDraggedRef = useRef(false)

  const finishDrag = useCallback((commit: boolean) => {
    setDrag(prev => {
      if (prev && prev.active) justDraggedRef.current = true
      if (prev && commit && prev.active) {
        if (prev.mode === "move") {
          const newStart = minutesToTime(Math.max(0, snapTo(prev.curStartMin)))
          const targetStaff = staff[prev.staffIndex]
          if (targetStaff && (newStart !== prev.apt.startTime || targetStaff.id !== prev.apt.staffId)) {
            onReschedule(prev.apt, targetStaff.id, newStart)
          }
        } else {
          const newDuration = Math.max(SNAP_MIN, snapTo(prev.curDuration))
          if (newDuration !== prev.apt.duration) onResize(prev.apt, newDuration)
        }
      }
      return null
    })
  }, [staff, onReschedule, onResize])

  useEffect(() => {
    if (!drag) return
    const onMove = (e: PointerEvent) => {
      setDrag(prev => {
        if (!prev) return prev
        const dy = e.clientY - prev.startY
        const dx = e.clientX - prev.startX
        if (!prev.active && Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) return prev
        const deltaMin = (dy / SLOT_HEIGHT) * 60
        if (prev.mode === "move") {
          const container = columnsRef.current
          let staffIndex = prev.staffIndex
          if (container) {
            const rect = container.getBoundingClientRect()
            const relX = e.clientX - rect.left
            const colWidth = rect.width / Math.max(1, staff.length)
            staffIndex = Math.min(staff.length - 1, Math.max(0, Math.floor(relX / colWidth)))
          }
          return {
            ...prev,
            active: true,
            curStartMin: snapTo(prev.origStartMin + deltaMin),
            staffIndex,
          }
        }
        return {
          ...prev,
          active: true,
          curDuration: Math.max(SNAP_MIN, snapTo(prev.origDuration + deltaMin)),
        }
      })
    }
    const onUp = () => finishDrag(true)
    const onCancel = () => finishDrag(false)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onCancel)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onCancel)
    }
  }, [drag, finishDrag])

  const startDrag = (e: React.PointerEvent, apt: Appointment, mode: "move" | "resize") => {
    e.preventDefault()
    const staffIndex = Math.max(0, staff.findIndex(s => s.id === apt.staffId))
    setDrag({
      apt,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origStartMin: timeToMinutes(apt.startTime),
      origDuration: apt.duration,
      curStartMin: timeToMinutes(apt.startTime),
      curDuration: apt.duration,
      staffIndex,
      active: false,
    })
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[700px]">
        {/* Staff headers */}
        <div className="sticky top-0 z-30 bg-background border-b border-border flex">
          <div className="w-16 shrink-0 border-r border-border" />
          {staff.map(s => (
            <div key={s.id} className="flex-1 flex items-center gap-2 px-3 py-2.5 border-r border-border last:border-r-0">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ backgroundColor: s.color }}
              >
                {s.initials}
              </div>
              <span className="text-sm font-medium truncate">{s.name.split(" ")[0]}</span>
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
          <div ref={columnsRef} className="flex-1 flex relative">
            {staff.map((s, colIndex) => {
              const staffApts = appointments.filter(a => a.staffId === s.id)
              const dragPreview = drag?.active && drag.mode === "move" && drag.staffIndex === colIndex ? drag : null
              const resizePreview = drag?.active && drag.mode === "resize" && drag.apt.staffId === s.id ? drag : null
              return (
                <div
                  key={s.id}
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
                        onClick={() => onNewApt(s.id, time)}
                      >
                        <span className="text-[10px] text-emerald-600 font-medium group-hover:opacity-100 opacity-0">+ {time}</span>
                      </div>
                    )
                  })}
                  {/* Appointments (hide the one being dragged) */}
                  {staffApts.filter(a => !(drag?.active && drag.apt.id === a.id)).map(apt => (
                    <AppointmentBlock
                      key={apt.id}
                      apt={apt}
                      staffColor={s.color}
                      canDrag={canEditApt(apt)}
                      onOpen={(a) => {
                        if (justDraggedRef.current) {
                          justDraggedRef.current = false
                          return
                        }
                        onSelectApt(a)
                      }}
                      onDragStart={startDrag}
                    />
                  ))}
                  {/* Drag preview */}
                  {dragPreview && (
                    <div
                      className={cn(
                        "absolute left-1 right-1 rounded-md pointer-events-none opacity-90 z-30",
                        STATUS_CONFIG[dragPreview.apt.status].bg,
                        STATUS_CONFIG[dragPreview.apt.status].color,
                        "border border-current",
                      )}
                      style={{
                        top: `${((Math.max(SALON_START_MINS, Math.min(SALON_END_MINS, dragPreview.curStartMin)) - SALON_START_MINS) / 60) * SLOT_HEIGHT}px`,
                        height: `${Math.max(getHeight(dragPreview.curDuration), 28) - 2}px`,
                        borderLeftWidth: 3,
                        borderLeftColor: s.color,
                      }}
                    >
                      <div className="px-1.5 py-1">
                        <p className="text-xs font-semibold truncate">{dragPreview.apt.clientName}</p>
                        <p className="text-[10px] opacity-75">{minutesToTime(dragPreview.curStartMin)}–{minutesToTime(dragPreview.curStartMin + dragPreview.curDuration)}</p>
                      </div>
                    </div>
                  )}
                  {/* Resize preview line */}
                  {resizePreview && (
                    <div
                      className="absolute left-1 right-1 pointer-events-none z-30 border-b-2 border-emerald-500"
                      style={{ top: `${getTop(resizePreview.apt.startTime) + Math.max(getHeight(resizePreview.curDuration), 28)}px` }}
                    />
                  )}
                </div>
              )
            })}
          </div>

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

// ─── Week View ───────────────────────────────────────────────────────��────────

function WeekView({
  weekDates, allAppointments, staff, onSelectApt, onDayClick,
}: {
  weekDates: string[]
  allAppointments: Appointment[]
  staff: CalendarStaff[]
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
                  {Number(date.slice(8, 10))}
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
                    const s = staff.find(x => x.id === apt.staffId)
                    const top = getTop(apt.startTime)
                    const height = Math.max(getHeight(apt.duration), 20)
                    const cfg = STATUS_CONFIG[apt.status]
                    return (
                      <div
                        key={apt.id}
                        className={cn("absolute left-0.5 right-0.5 rounded cursor-pointer text-[10px] px-1 py-0.5 overflow-hidden hover:z-10", cfg.bg, cfg.color)}
                        style={{ top: `${top}px`, height: `${height - 1}px`, borderLeft: `2px solid ${s?.color}` }}
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
  const today = todayBucharest()

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
              const isCurrentMonth = Number(date.slice(5, 7)) - 1 === month
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
                      {Number(date.slice(8, 10))}
                    </span>
                    {dayApts.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">{dayApts.length}</span>
                    )}
                  </div>
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

// ─── List View ────────────────────────────────────────────────────────────��───

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
              const s = apt.staffName
              return (
                <button
                  key={apt.id}
                  type="button"
                  onClick={() => onSelectApt(apt)}
                  className="w-full flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="text-center shrink-0 w-12">
                    <p className="text-sm font-bold text-foreground">{apt.startTime}</p>
                    <p className="text-[10px] text-muted-foreground">{apt.endTime}</p>
                  </div>
                  <div className="h-10 w-0.5 rounded-full shrink-0 bg-muted-foreground/40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{apt.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{apt.services.map(x => x.name).join(", ")} · {s}</p>
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

// ─── Appointment Modal (create + edit) ───────────────────────────────────────

interface SelectedClient {
  id: string
  firstName: string
  lastName: string
  phone: string
  hasAllergies?: boolean
}

function AppointmentModal({
  open, onClose, prefillStaffId, prefillTime, prefillDate, editing,
  staff, services, staffServices, canCreate, onSaved,
}: {
  open: boolean
  onClose: () => void
  prefillStaffId?: string
  prefillTime?: string
  prefillDate?: string
  editing: Appointment | null
  staff: CalendarStaff[]
  services: CatalogService[]
  staffServices: StaffServiceOverride[]
  canCreate: boolean
  onSaved: () => void
}) {
  const isEdit = editing !== null
  const [clientSearch, setClientSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null)
  const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [creatingClient, setCreatingClient] = useState(false)
  const [selectedServices, setSelectedServices] = useState<AppointmentServiceView[]>([])
  const [staffId, setStaffId] = useState(prefillStaffId ?? staff[0]?.id ?? "")
  const [date, setDate] = useState(prefillDate ?? todayBucharest())
  const [startTime, setStartTime] = useState(prefillTime ?? "09:00")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<AppointmentStatus>("confirmat")
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<"procent" | "fix">("procent")
  const [recurrence, setRecurrence] = useState<RecurrenceType>("niciodata")
  const [sendConfirmation, setSendConfirmation] = useState(false)
  const [scope, setScope] = useState<"single" | "rest_of_series">("single")
  const [serviceSearch, setServiceSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [conflict, setConflict] = useState<{ error: string; overridable: boolean } | null>(null)

  const isRecurring = isEdit && (editing.recurrence !== "niciodata" || editing.recurrenceParentId !== null)

  useEffect(() => {
    if (!open) return
    setConflict(null)
    setShowNewClient(false)
    setSearchResults([])
    setServiceSearch("")
    if (editing) {
      setSelectedClient({
        id: editing.clientId,
        firstName: editing.clientName.split(" ")[0] ?? "",
        lastName: editing.clientName.split(" ").slice(1).join(" "),
        phone: editing.clientPhone,
      })
      setClientSearch(`${editing.clientName}`)
      setSelectedServices(editing.services.map(s => ({
        serviceId: s.serviceId,
        name: s.name,
        duration: s.duration,
        price: s.price,
      })))
      setStaffId(editing.staffId)
      setDate(editing.date)
      setStartTime(editing.startTime)
      setNotes(editing.notes)
      setStatus(editing.status)
      setDiscount(editing.discount)
      setDiscountType(editing.discountType)
      setRecurrence(editing.recurrence)
      setScope("single")
    } else {
      setSelectedClient(null)
      setClientSearch("")
      setSelectedServices([])
      setSendConfirmation(false)
      setStaffId(prefillStaffId ?? staff[0]?.id ?? "")
      setDate(prefillDate ?? todayBucharest())
      setStartTime(prefillTime ?? "09:00")
      setNotes("")
      setStatus("confirmat")
      setDiscount(0)
      setDiscountType("procent")
      setRecurrence("niciodata")
      setScope("single")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  // Debounced client search through the trigram index.
  useEffect(() => {
    if (!open || selectedClient || !clientSearch.trim() || clientSearch.length < 2) {
      setSearchResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      const res = await searchClientsAction(clientSearch.trim())
      setSearching(false)
      if (res.ok) {
        setSearchResults((res.data as ClientSearchResult[]) ?? [])
        setShowClientDropdown(true)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [clientSearch, selectedClient, open])

  // Duration/price prefill from staff_services overrides or the catalog.
  const applyService = (svc: CatalogService) => {
    const resolved = resolveServiceForStaff(svc, staffId, staffServices)
    setSelectedServices(prev => [...prev, {
      serviceId: svc.id,
      name: svc.name,
      duration: resolved.duration,
      price: resolved.price,
    }])
    setServiceSearch("")
  }

  // Re-resolve durations/prices when the staff changes (before first save).
  useEffect(() => {
    if (!open || isEdit) return
    setSelectedServices(prev => prev.map(s => {
      if (!s.serviceId) return s
      const svc = services.find(x => x.id === s.serviceId)
      if (!svc) return s
      const resolved = resolveServiceForStaff(svc, staffId, staffServices)
      return { ...s, duration: resolved.duration, price: resolved.price }
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId])

  const totalDuration = selectedServices.reduce((s, svc) => s + svc.duration, 0)
  const totalPrice = selectedServices.reduce((s, svc) => s + svc.price, 0)
  const endTime = addMinutes(startTime, totalDuration)
  const discountedTotal = discountType === "procent"
    ? totalPrice * (1 - discount / 100)
    : totalPrice - discount

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) &&
    !selectedServices.find(sel => sel.serviceId === s.id)
  )

  const selectedStaff = staff.find(s => s.id === staffId)
  const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => minutesToTime(8 * 60 + i * 15))

  const handleCreateClient = async () => {
    if (!newFirstName.trim() || !newLastName.trim() || !newPhone.trim()) {
      toast.error("Completează prenume, nume și telefon.")
      return
    }
    setCreatingClient(true)
    const res = await createClientInlineAction({
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      phone: newPhone.trim(),
    })
    setCreatingClient(false)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    const c = res.data as SelectedClient
    setSelectedClient(c)
    setClientSearch(`${c.firstName} ${c.lastName}`)
    setShowNewClient(false)
    setShowClientDropdown(false)
  }

  const buildPayload = (override: boolean) => {
    const base = {
      clientId: selectedClient?.id ?? null,
      newClient: null,
      staffId,
      date,
      startTime,
      services: selectedServices.map(s => ({
        serviceId: s.serviceId,
        name: s.name,
        durationMin: s.duration,
        price: s.price,
      })),
      status,
      notes,
      discount,
      discountType,
      recurrence,
      override,
      sendConfirmation: isEdit ? undefined : sendConfirmation,
    }
    return isEdit ? { ...base, id: editing.id, scope } : base
  }

  const handleSave = async (override = false) => {
    if (!selectedClient || selectedServices.length === 0) return
    setSaving(true)
    const res = isEdit
      ? await updateAppointmentAction(buildPayload(override))
      : await createAppointmentAction(buildPayload(override))
    setSaving(false)

    if (!res.ok) {
      const overridable = (res as { overridable?: boolean }).overridable ?? false
      setConflict({ error: res.error, overridable })
      return
    }

    const data = (res.data ?? {}) as { skippedOccurrences?: string[] }
    if (data.skippedOccurrences && data.skippedOccurrences.length > 0) {
      toast.warning(
        `Programarea a fost creată. ${data.skippedOccurrences.length} recurențe au fost omise (conflict): ${data.skippedOccurrences.slice(0, 4).join(", ")}${data.skippedOccurrences.length > 4 ? "…" : ""}`,
        { duration: 8000 },
      )
    } else {
      toast.success(isEdit ? "Programarea a fost actualizată." : "Programarea a fost creată.")
    }
    setConflict(null)
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-5 w-5 text-emerald-600" /> : <Plus className="h-5 w-5 text-emerald-600" />}
            {isEdit ? "Editează programarea" : "Programare nouă"}
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
                  value={selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value)
                    setSelectedClient(null)
                    setShowClientDropdown(true)
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                />
                {selectedClient && (
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => { setSelectedClient(null); setClientSearch("") }} aria-label="Șterge selecția">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {showClientDropdown && !selectedClient && clientSearch.length >= 2 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg">
                  {searching && (
                    <div className="px-3 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Se caută…
                    </div>
                  )}
                  {!searching && searchResults.length > 0 && searchResults.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left first:rounded-t-lg last:rounded-b-lg"
                      onClick={() => {
                        setSelectedClient({ id: c.id, firstName: c.firstName, lastName: c.lastName, phone: c.phone, hasAllergies: c.hasAllergies })
                        setShowClientDropdown(false)
                      }}
                    >
                      <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                        {c.firstName[0]}{c.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-muted-foreground">{c.phone}</p>
                      </div>
                    </button>
                  ))}
                  {!searching && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-3 text-sm text-emerald-600 hover:bg-muted transition-colors"
                      onClick={() => { setShowNewClient(true); setShowClientDropdown(false) }}
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Adaugă client nou{clientSearch ? `: „${clientSearch}"` : ""}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* Allergy safety warning — boolean flag only; details in the
                client's protected file */}
            {(selectedClient?.hasAllergies || (editing && selectedClient?.id === editing.clientId && editing.clientHasAllergies)) && (
              <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-2.5" role="alert">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-400">
                  Clienta are alergii înregistrate — verifică fișa protejată înainte de serviciu.
                </p>
              </div>
            )}
            {showNewClient && (
              <div className="p-3 rounded-lg border border-border space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Prenume" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} />
                  <Input placeholder="Nume" value={newLastName} onChange={e => setNewLastName(e.target.value)} />
                </div>
                <Input placeholder="Telefon (ex. 0722 123 456)" value={newPhone} onChange={e => setNewPhone(e.target.value)} inputMode="tel" />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowNewClient(false)}>Renunță</Button>
                  <Button size="sm" onClick={handleCreateClient} disabled={creatingClient}>
                    {creatingClient && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                    Adaugă client
                  </Button>
                </div>
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
                      <button type="button" onClick={() => setSelectedServices(prev => prev.filter((_, j) => j !== i))} aria-label="Elimină serviciul">
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
                {filteredServices.slice(0, 6).map(svc => {
                  const resolved = resolveServiceForStaff(svc, staffId, staffServices)
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted transition-colors text-sm border-b border-border last:border-b-0"
                      onClick={() => applyService(svc)}
                    >
                      <span>{svc.name}</span>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="text-xs">{resolved.duration}min</span>
                        <span>{resolved.price} RON</span>
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                    </button>
                  )
                })}
                {filteredServices.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Niciun serviciu găsit.</p>
                )}
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
                    {selectedStaff && <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: selectedStaff.color }} />}
                    <span className="truncate">{selectedStaff?.name.split(" ")[0] ?? "—"}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {staff.filter(s => s.active).map(s => (
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

          {/* Conflict / override */}
          {conflict && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">{conflict.error}</p>
              </div>
              {conflict.overridable && (
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => handleSave(true)} disabled={saving}>
                  Programează oricum
                </Button>
              )}
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

          {/* Recurrence */}
          {!isEdit && canCreate && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Recurență</Label>
              <Select value={recurrence} onValueChange={(v: RecurrenceType) => setRecurrence(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map(r => (
                    <SelectItem key={r} value={r}>{RECURRENCE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {recurrence !== "niciodata" && (
                <p className="text-xs text-muted-foreground">
                  Se creează automat aparițiile următoare (până la 12 săptămâni). Cele în conflict sunt omise.
                </p>
              )}
            </div>
          )}

          {/* Series scope on edit */}
          {isEdit && isRecurring && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Aplică modificarea</Label>
              <Select value={scope} onValueChange={(v: "single" | "rest_of_series") => setScope(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Doar aceasta</SelectItem>
                  <SelectItem value="rest_of_series">Aceasta și următoarele</SelectItem>
                </SelectContent>
              </Select>
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

          {/* P12: email confirmation tick (create only; skipped silently when
              the client has no email address) */}
          {!isEdit && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <Checkbox
                checked={sendConfirmation}
                onCheckedChange={(v) => setSendConfirmation(v === true)}
              />
              Trimite confirmare pe email clientului
            </label>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={!selectedClient || selectedServices.length === 0 || saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
            {isEdit ? "Salvează modificările" : "Salvează programarea"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Cancel reason dialog ─────────────────────────────────��──────────────────

function CancelReasonDialog({
  open, aptName, onClose, onConfirm,
}: {
  open: boolean
  aptName: string
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState("")
  useEffect(() => { if (open) setReason("") }, [open])
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Anulează programarea</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Programarea lui {aptName}. Motivul este opțional, dar ajută la rapoarte.</p>
        <Textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Motivul anularii..."
          className="resize-none"
          rows={3}
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Înapoi</Button>
          <Button variant="destructive" onClick={() => onConfirm(reason.trim())}>Anulează programarea</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function ProgramariView({
  salonId, role, staffId, staff, services, staffServices, initialAppointments, initialDate,
}: ProgramariViewProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const view = (searchParams.get("tab") as ViewMode) ?? "day"
  const dateParam = searchParams.get("date")
  const setView = (value: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const setDateParam = (date: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("date", date)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const [currentDate, setCurrentDate] = useState(dateParam ?? initialDate)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingApt, setEditingApt] = useState<Appointment | null>(null)
  const [prefillStaff, setPrefillStaff] = useState<string | undefined>()
  const [prefillTime, setPrefillTime] = useState<string | undefined>()
  const [listSearch, setListSearch] = useState("")
  const [listStatusFilter, setListStatusFilter] = useState<AppointmentStatus | "all">("all")
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [clientInfo, setClientInfo] = useState<ClientSearchResult | null>(null)

  const canCreate = role !== "staff"
  // Full edit (services/staff/time, drag & resize): owner/manager/receptionist.
  // Staff may only change status/notes on their own appointments.
  const canEditApt = useCallback(
    (a: Appointment) => role !== "staff",
    [role],
  )
  const canStatusApt = useCallback(
    (a: Appointment) => role !== "staff" || (staffId != null && a.staffId === staffId),
    [role, staffId],
  )

  // ── Range for the visible view ─────────────────────────────────────────────
  const range = useMemo((): { from: string; to: string } => {
    if (view === "day") return { from: currentDate, to: currentDate }
    if (view === "week") {
      const week = getWeekDates(currentDate)
      return { from: week[0], to: week[6] }
    }
    if (view === "month") {
      const [y, m] = currentDate.split("-").map(Number)
      const weeks = getMonthDates(y, m - 1)
      const flat = weeks.flat().filter((d): d is string => d !== null)
      return { from: flat[0], to: flat[flat.length - 1] }
    }
    const today = todayBucharest()
    const end = new Date(`${today}T12:00:00`)
    end.setDate(end.getDate() + 30)
    return { from: today, to: end.toISOString().slice(0, 10) }
  }, [view, currentDate])

  // ── SWR: refetch when the visible range changes ────────────────────────────
  const { data: rangeData, mutate: revalidateRange } = useSWR(
    ["programari-range", range.from, range.to],
    () => loadRangeAction(range.from, range.to),
    { revalidateOnFocus: false, keepPreviousData: true },
  )

  useEffect(() => {
    if (!rangeData) return
    if (!rangeData.ok) {
      toast.error(rangeData.error)
      return
    }
    const { from, to } = range
    setAppointments(prev => {
      const kept = prev.filter(a => a.date < from || a.date > to)
      return [...kept, ...rangeData.appointments]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeData])

  // ── Realtime: postgres_changes on appointments for this salon ──────────────
  const revalidateRef = useRef(revalidateRange)
  revalidateRef.current = revalidateRange
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    let timer: ReturnType<typeof setTimeout> | null = null
    const supabase = createSupabaseBrowserClient()
    const channel: RealtimeChannel = supabase
      .channel(`appointments-${salonId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `salon_id=eq.${salonId}` },
        () => {
          // Coalesce bursts (appointment_services edits touch the parent too).
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => revalidateRef.current(), 300)
        },
      )
      .subscribe()
    return () => {
      if (timer) clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [salonId])

  // ── Derived lists ──────────────────────────────────────────────────────────
  const dateStr = currentDate
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])

  const dayApts = appointments.filter(a => a.date === dateStr)
  const weekApts = appointments.filter(a => weekDates.includes(a.date))

  const listApts = appointments
    .filter(a => {
      if (listStatusFilter !== "all" && a.status !== listStatusFilter) return false
      if (listSearch) {
        const q = listSearch.toLowerCase()
        return a.clientName.toLowerCase().includes(q) || a.staffName.toLowerCase().includes(q) || a.services.some(s => s.name.toLowerCase().includes(q))
      }
      return true
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

  const today = todayBucharest()
  const todayCount = appointments.filter(a => a.date === today).length
  const todayRevenue = appointments
    .filter(a => a.date === today && a.status === "finalizat")
    .reduce((s, a) => s + a.totalPrice, 0)
  const confirmedToday = appointments
    .filter(a => a.date === today && (a.status === "confirmat" || a.status === "in_desfasurare")).length

  const navigatePrev = () => {
    if (view === "day") shiftDate(-1)
    else if (view === "week") shiftDate(-7)
    else shiftMonth(-1)
  }
  const navigateNext = () => {
    if (view === "day") shiftDate(1)
    else if (view === "week") shiftDate(7)
    else shiftMonth(1)
  }
  const shiftDate = (days: number) => {
    const [y, m, d] = currentDate.split("-").map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d + days))
    setCurrentDate(dt.toISOString().slice(0, 10))
  }
  const shiftMonth = (delta: number) => {
    const [y, m, d] = currentDate.split("-").map(Number)
    const dt = new Date(Date.UTC(y, m - 1 + delta, 1))
    const lastDay = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate()
    setCurrentDate(`${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`)
  }

  // ── Mutations ──────────────────────────────────────────────────────────────
  const applyLocalUpdate = (updated: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a))
    setSelectedApt(prev => prev?.id === updated.id ? updated : prev)
  }

  const [checkoutApt, setCheckoutApt] = useState<Appointment | null>(null)

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    const apt = appointments.find(a => a.id === id)
    if (!apt) return
    if (status === "anulat") {
      setCancelTarget(apt)
      return
    }
    const prevApt = apt
    applyLocalUpdate({ ...apt, status, cancelReason: null })
    const res = await updateAppointmentStatusAction({ id, status })
    if (!res.ok) {
      toast.error(res.error)
      applyLocalUpdate(prevApt)
      return
    }
    toast.success(`Status actualizat: ${STATUS_CONFIG[status].label}.`)
    void revalidateRange()
  }

  const handleCancelConfirm = async (reason: string) => {
    const apt = cancelTarget
    if (!apt) return
    setCancelTarget(null)
    const prevApt = apt
    applyLocalUpdate({ ...apt, status: "anulat", cancelReason: reason || null })
    const res = await updateAppointmentStatusAction({ id: apt.id, status: "anulat", cancelReason: reason || undefined })
    if (!res.ok) {
      toast.error(res.error)
      applyLocalUpdate(prevApt)
      return
    }
    toast.success("Programarea a fost anulată.")
    void revalidateRange()
  }

  const handleReschedule = (apt: Appointment, newStaffId: string, newStartTime: string) => {
    const duration = apt.duration
    const newEndTime = minutesToTime(timeToMinutes(newStartTime) + duration)
    const optimistic: Appointment = {
      ...apt,
      staffId: newStaffId,
      staffName: staff.find(s => s.id === newStaffId)?.name ?? apt.staffName,
      startTime: newStartTime,
      endTime: newEndTime,
    }
    const prevApt = apt
    applyLocalUpdate(optimistic)
    void (async () => {
      const res = await updateAppointmentAction({
        id: apt.id,
        clientId: apt.clientId,
        staffId: newStaffId,
        date: apt.date,
        startTime: newStartTime,
        services: apt.services.map(s => ({
          serviceId: s.serviceId,
          name: s.name,
          durationMin: s.duration,
          price: s.price,
        })),
        status: apt.status,
        notes: apt.notes,
        discount: apt.discount,
        discountType: apt.discountType,
        recurrence: apt.recurrence,
        override: false,
        scope: "single",
      })
      if (!res.ok) {
        toast.error(res.error)
        applyLocalUpdate(prevApt)
        return
      }
      void revalidateRange()
    })()
  }

  const handleResize = (apt: Appointment, newDuration: number) => {
    const newEndTime = minutesToTime(timeToMinutes(apt.startTime) + newDuration)
    const prevApt = apt
    applyLocalUpdate({ ...apt, duration: newDuration, endTime: newEndTime })
    void (async () => {
      // Keep the total duration: distribute the new length across services
      // proportionally (single-service appointments keep their exact duration).
      const oldTotal = apt.services.reduce((s, x) => s + x.duration, 0) || 1
      const scaled = apt.services.map(s => ({
        ...s,
        duration: Math.max(1, Math.round((s.duration / oldTotal) * newDuration)),
      }))
      const drift = newDuration - scaled.reduce((s, x) => s + x.duration, 0)
      if (drift !== 0 && scaled.length > 0) {
        const largest = scaled.reduce((a, b) => (b.duration > a.duration ? b : a))
        largest.duration = Math.max(1, largest.duration + drift)
      }
      const res = await updateAppointmentAction({
        id: apt.id,
        clientId: apt.clientId,
        staffId: apt.staffId,
        date: apt.date,
        startTime: apt.startTime,
        services: scaled.map(s => ({
          serviceId: s.serviceId,
          name: s.name,
          durationMin: s.duration,
          price: s.price,
        })),
        status: apt.status,
        notes: apt.notes,
        discount: apt.discount,
        discountType: apt.discountType,
        recurrence: apt.recurrence,
        override: false,
        scope: "single",
      })
      if (!res.ok) {
        toast.error(res.error)
        applyLocalUpdate(prevApt)
        return
      }
      void revalidateRange()
    })()
  }

  const openNewApt = (sId?: string, time?: string) => {
    setEditingApt(null)
    setPrefillStaff(sId)
    setPrefillTime(time)
    setModalOpen(true)
  }

  const openEditApt = (apt: Appointment) => {
    setSelectedApt(null)
    setEditingApt(apt)
    setPrefillStaff(undefined)
    setPrefillTime(undefined)
    setModalOpen(true)
  }

  // Lazy client info for the detail panel (loyalty + WhatsApp number).
  useEffect(() => {
    if (!selectedApt || !selectedApt.clientPhone) {
      setClientInfo(null)
      return
    }
    let cancelled = false
    void (async () => {
      const res = await searchClientsAction(selectedApt.clientPhone)
      if (cancelled) return
      if (res.ok) {
        const list = (res.data as ClientSearchResult[]) ?? []
        setClientInfo(list.find(c => c.id === selectedApt.clientId) ?? null)
      }
    })()
    return () => { cancelled = true }
  }, [selectedApt])

  const dateLabel = view === "day"
    ? formatDateRO(dateStr)
    : view === "week"
      ? `${formatDateShortRO(weekDates[0])} – ${formatDateShortRO(weekDates[6])} ${currentDate.slice(0, 4)}`
      : new Date(`${currentDate.slice(0, 7)}-15T12:00:00`).toLocaleDateString("ro-RO", { month: "long", year: "numeric" })

  return (
    <div className="flex flex-col h-screen overflow-hidden pt-16 lg:pt-0">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-border bg-background px-4 py-3 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          {/* Left: title + nav */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground text-balance">Programări</h1>
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
              <button type="button" onClick={navigatePrev} className="p-1.5 rounded hover:bg-muted" aria-label="Perioada anterioară">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setCurrentDate(todayBucharest())} className="px-2 py-1 text-xs font-medium rounded hover:bg-muted">
                Astăzi
              </button>
              <button type="button" onClick={navigateNext} className="p-1.5 rounded hover:bg-muted" aria-label="Perioada următoare">
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

            {canCreate && (
              <Button
                size="sm"
                onClick={() => openNewApt()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Programare nouă</span>
                <span className="sr-only sm:hidden">Programare nouă</span>
              </Button>
            )}
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
              staff={staff}
              onSelectApt={setSelectedApt}
              onNewApt={openNewApt}
              canEditApt={canEditApt}
              onReschedule={handleReschedule}
              onResize={handleResize}
            />
          )}
          {view === "week" && (
            <WeekView
              weekDates={weekDates}
              allAppointments={weekApts}
              staff={staff}
              onSelectApt={setSelectedApt}
              onDayClick={(d) => { setCurrentDate(d); setDateParam(d); setView("day") }}
            />
          )}
          {view === "month" && (
            <MonthView
              year={Number(currentDate.slice(0, 4))}
              month={Number(currentDate.slice(5, 7)) - 1}
              allAppointments={appointments}
              onDayClick={(d) => { setCurrentDate(d); setDateParam(d); setView("day") }}
            />
          )}
          {view === "list" && (
            <ListView appointments={listApts} onSelectApt={setSelectedApt} />
          )}
        </div>

        {/* Detail panel */}
        {selectedApt && (
          <div className="fixed inset-0 z-40 lg:static lg:inset-auto w-full lg:w-80 shrink-0 flex flex-col bg-background overflow-hidden">
            <AppointmentDetail
              apt={selectedApt}
              onClose={() => setSelectedApt(null)}
              onStatusChange={handleStatusChange}
              onEdit={openEditApt}
              canEdit={canEditApt(selectedApt)}
              canStatus={canStatusApt(selectedApt)}
              clientInfo={clientInfo}
              onCheckout={role !== "staff" ? setCheckoutApt : undefined}
            />
          </div>
        )}
      </div>

      {/* Create / edit modal */}
      <AppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        prefillStaffId={prefillStaff}
        prefillTime={prefillTime}
        prefillDate={dateStr}
        editing={editingApt}
        staff={staff}
        services={services}
        staffServices={staffServices}
        canCreate={canCreate}
        onSaved={() => void revalidateRange()}
      />

      {/* Checkout (Încasează) — o/m/r; the RPC sets status finalizat */}
      <CheckoutDialog
        apt={checkoutApt}
        onClose={() => setCheckoutApt(null)}
        onDone={() => {
          if (checkoutApt) {
            applyLocalUpdate({ ...checkoutApt, status: "finalizat" })
            void revalidateRange()
          }
          setCheckoutApt(null)
        }}
      />

      {/* Cancel reason */}
      <CancelReasonDialog
        open={cancelTarget !== null}
        aptName={cancelTarget?.clientName ?? ""}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
      />
    </div>
  )
}
