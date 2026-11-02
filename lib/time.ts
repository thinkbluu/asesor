// Time helpers for the salon calendar. Everything is stored in UTC
// (timestamptz) and displayed in Europe/Bucharest. All conversions go through
// Intl — no manual offset math, so DST transitions are handled correctly.

export const SALON_TZ = "Europe/Bucharest"

type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekdayShort: string
}

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: SALON_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  weekday: "short",
})

export function zonedParts(date: Date, tz: string = SALON_TZ): ZonedParts {
  const fmt = tz === SALON_TZ ? partsFormatter : new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  })
  const map: Record<string, string> = {}
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekdayShort: map.weekday ?? "",
  }
}

/** yyyy-mm-dd of an instant, in the salon timezone. */
export function toDateStringBucharest(date: Date): string {
  const p = zonedParts(date)
  return `${String(p.year).padStart(4, "0")}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`
}

/** "HH:MM" of an instant, in the salon timezone. */
export function formatTimeHM(iso: string): string {
  const p = zonedParts(new Date(iso))
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`
}

/** { date: "yyyy-mm-dd", time: "HH:MM" } of an instant, in the salon timezone. */
export function utcIsoToCivil(iso: string): { date: string; time: string } {
  const p = zonedParts(new Date(iso))
  return {
    date: `${String(p.year).padStart(4, "0")}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`,
    time: `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`,
  }
}

function civilMinutes(dateStr: string, timeStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number)
  const [hh, mm] = timeStr.split(":").map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 60000) + hh * 60 + mm
}

/**
 * Converts a civil date+time in Europe/Bucharest to a UTC ISO instant.
 * Iterative resolution via Intl (converges in ≤2 passes for any fixed offset,
 * including DST boundaries). Ambiguous fall-back times resolve to the first
 * occurrence.
 */
export function civilToUtcIso(dateStr: string, timeStr: string): string {
  let ts = Date.parse(`${dateStr}T${timeStr}:00Z`)
  const wanted = civilMinutes(dateStr, timeStr)
  for (let i = 0; i < 3; i++) {
    const p = zonedParts(new Date(ts))
    const actual =
      Math.round(Date.UTC(p.year, p.month - 1, p.day) / 60000) + p.hour * 60 + p.minute
    const diff = wanted - actual
    if (diff === 0) break
    ts += diff * 60000
  }
  return new Date(ts).toISOString()
}

/** Minutes since midnight for "HH:MM". */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

/** "HH:MM" from minutes since midnight (wraps past midnight only for display guards). */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0")
  const m = (minutes % 60).toString().padStart(2, "0")
  return `${h}:${m}`
}

export function addMinutes(time: string, mins: number): string {
  return minutesToTime(timeToMinutes(time) + mins)
}

// ─── Civil-date formatting (dates are plain yyyy-mm-dd strings) ──────────────

export function formatDateRO(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatDateShortRO(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
  })
}

export function getDayName(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("ro-RO", { weekday: "short" })
}

/** Today's civil date in the salon timezone. */
export function todayBucharest(): string {
  return toDateStringBucharest(new Date())
}

/** The 7 civil dates (Mon–Sun) of the week containing the anchor date. */
export function getWeekDates(anchor: string): string[] {
  const [y, m, d] = anchor.split("-").map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = Sunday
  const mondayOffset = (dow + 6) % 7
  const monday = new Date(Date.UTC(y, m - 1, d - mondayOffset))
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday)
    dt.setUTCDate(monday.getUTCDate() + i)
    return dt.toISOString().slice(0, 10)
  })
}

export function getMonthDates(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const weeks: (string | null)[][] = []
  let week: (string | null)[] = Array(startDow).fill(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    )
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

/** Adds n days to a civil date string. */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

/** Adds n months to a civil date string (clamps to end of month). */
export function addMonthsToDateString(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const target = new Date(Date.UTC(y, m - 1 + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  const dt = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d, lastDay)))
  return dt.toISOString().slice(0, 10)
}
