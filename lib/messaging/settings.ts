// Per-salon email notification toggles, stored in
// salons.booking_settings.notifications. Pure module — shared by the app UI,
// the messaging layer and the cron jobs.

export type NotificationKey =
  | "confirmare"
  | "reamintire"
  | "anulare"
  | "programare_noua"
  | "feedback"
  | "stoc_scazut"

export type NotificationSettings = Record<NotificationKey, boolean>

export const NOTIFICATION_LABELS: Record<NotificationKey, { label: string; description: string }> = {
  confirmare: {
    label: "Confirmare programare",
    description: "Către client, imediat după rezervarea online sau confirmarea din calendar",
  },
  reamintire: {
    label: "Reamintire cu 24h înainte",
    description: "Către client, cu o zi înainte de programare",
  },
  anulare: {
    label: "Anulare programare",
    description: "Către client și către salon, când o programare este anulată",
  },
  programare_noua: {
    label: "Programare nouă online",
    description: "Către salon și specialist, când cineva se programează online",
  },
  feedback: {
    label: "Cerere de feedback",
    description: "Către client, la ~2 ore după finalizarea programării",
  },
  stoc_scazut: {
    label: "Raport zilnic stoc scăzut",
    description: "Către proprietar, zilnic la ora 03:00, doar dacă există produse de comandat",
  },
}

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  confirmare: true,
  reamintire: true,
  anulare: true,
  programare_noua: true,
  feedback: true,
  stoc_scazut: true,
}

export function readNotificationSettings(json: unknown): NotificationSettings {
  if (!json || typeof json !== "object") return { ...DEFAULT_NOTIFICATIONS }
  const raw = (json as Record<string, unknown>).notifications
  if (!raw || typeof raw !== "object") return { ...DEFAULT_NOTIFICATIONS }
  const out = { ...DEFAULT_NOTIFICATIONS }
  for (const key of Object.keys(DEFAULT_NOTIFICATIONS) as NotificationKey[]) {
    const value = (raw as Record<string, unknown>)[key]
    if (typeof value === "boolean") out[key] = value
  }
  return out
}
