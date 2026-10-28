"use client"

// "Echipă și acces" tab: member list, invite by email (hashed-token invites),
// role changes and member removal. Reads through RLS with the browser client;
// mutations go through server actions that re-verify the caller's role.

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserPlus, Copy, Check, Trash2, Loader2 } from "lucide-react"
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { SALON_COOKIE } from "@/lib/auth/constants"
import { inviteMember, changeMemberRole, removeMember } from "@/lib/auth/team-actions"
import { Aal2Dialog } from "@/components/app/aal2-dialog"

type Member = {
  id: string
  user_id: string
  role: string
  full_name: string
}

type PendingInvite = {
  id: string
  email: string
  role: string
  expires_at: string
}

const ROLES = [
  { value: "owner", label: "Proprietar" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Angajat" },
  { value: "receptionist", label: "Receptioner" },
]

const roleLabel = (role: string) => ROLES.find((r) => r.value === role)?.label ?? role

function readSalonCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${SALON_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function SettingsEchipa() {
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("staff")
  const [inviting, setInviting] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoadError("Autentificarea va fi disponibilă în curând.")
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const preferredSalon = readSalonCookie()

      const { data: memberRows, error: membersError } = await supabase
        .from("salon_members")
        .select("id, user_id, role, salon_id")
      if (membersError) {
        setLoadError("Nu am putut încărca echipa. Încearcă din nou.")
        return
      }

      // RLS already limits this to the user's salons; the cookie picks the
      // active one for multi-salon users.
      const rows = (memberRows ?? []).filter(
        (m) => !preferredSalon || m.salon_id === preferredSalon,
      )

      const userIds = rows.map((m) => m.user_id)
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])

      const profilesById = new Map((profileRows ?? []).map((p) => [p.id, p]))
      setMembers(
        rows.map((m) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          full_name: profilesById.get(m.user_id)?.full_name ?? "",
        })),
      )

      const { data: inviteRows } = await supabase
        .from("salon_invites")
        .select("id, email, role, expires_at, salon_id")
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
      setInvites(
        (inviteRows ?? [])
          .filter((i) => !preferredSalon || i.salon_id === preferredSalon)
          .map((i) => ({ id: i.id, email: i.email, role: i.role, expires_at: i.expires_at })),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inviting) return
    setInviting(true)
    setActionError(null)
    setInviteUrl(null)
    const result = await inviteMember(inviteEmail, inviteRole)
    setInviting(false)
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    setInviteUrl(result.url)
    setInviteEmail("")
    void load()
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — the link stays visible for manual copy.
    }
  }

  // AAL2 step-up: when a guarded action returns needsMfa, remember the retry
  // and prompt for the 6-digit code.
  const retryRef = useRef<(() => Promise<void>) | null>(null)
  const [aal2Open, setAal2Open] = useState(false)

  const handleRoleChange = async (memberId: string, role: string) => {
    setActionError(null)
    const result = await changeMemberRole(memberId, role)
    if (!result.ok) {
      if ("needsMfa" in result) {
        retryRef.current = () => handleRoleChange(memberId, role)
        setAal2Open(true)
        return
      }
      setActionError(result.error)
      return
    }
    void load()
  }

  const handleRemove = async (memberId: string) => {
    setActionError(null)
    const result = await removeMember(memberId)
    if (!result.ok) {
      if ("needsMfa" in result) {
        retryRef.current = () => handleRemove(memberId)
        setAal2Open(true)
        return
      }
      setActionError(result.error)
      return
    }
    void load()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Membrii echipei</CardTitle>
          <CardDescription>Persoanele cu acces la salonul tău</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Se încarcă…
            </div>
          )}
          {loadError && (
            <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              {loadError}
            </div>
          )}
          {!loading &&
            members.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {(member.full_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.full_name || "Membru"}
                  </p>
                </div>
                <Select
                  value={member.role}
                  onValueChange={(value) => void handleRoleChange(member.id, value)}
                >
                  <SelectTrigger className="h-9 w-40 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => void handleRemove(member.id)}
                >
                  <Trash2 className="h-4 w-4" /> Elimină
                </Button>
              </div>
            ))}
          {!loading && !loadError && members.length === 0 && (
            <p className="py-6 text-sm text-muted-foreground">
              Niciun membru încărcat. Verifică conexiunea și reîncearcă.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invită un membru</CardTitle>
          <CardDescription>
            Persoana invitată primește un link unic, valabil 7 zile. Trimiterea pe email
            va fi disponibilă în curând — deocamdată copiază linkul și trimite-l manual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionError && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100"
            >
              {actionError}
            </div>
          )}
          <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3">
            <div className="min-w-52 flex-1 space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                required
                placeholder="nume@exemplu.ro"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-9 w-40 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={inviting}
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {inviting ? "Se creează…" : "Creează invitație"}
            </Button>
          </form>

          {inviteUrl && (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Link de invitație (valabil 7 zile) — copiază-l și trimite-l persoanei invitate:
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-background px-3 py-2 text-xs">
                  {inviteUrl}
                </code>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiat" : "Copiază"}
                </Button>
              </div>
            </div>
          )}

          {invites.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">Invitații în așteptare</p>
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expiră la{" "}
                      {new Date(invite.expires_at).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary">{roleLabel(invite.role)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Aal2Dialog
        open={aal2Open}
        onOpenChange={setAal2Open}
        onVerified={() => void retryRef.current?.()}
      />
    </div>
  )
}
