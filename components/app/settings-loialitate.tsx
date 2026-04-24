"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Award, Cake, Sparkles, Users, Gift, Plus, Trash2, Percent } from "lucide-react"
import {
  DEFAULT_LOYALTY_CONFIG,
  type LoyaltyConfig,
  type RedemptionTier,
  type LoyaltyReward,
} from "@/lib/loyalty"

interface Props {
  onDirty: () => void
}

let tierCounter = 100
let rewardCounter = 100

export function SettingsLoialitate({ onDirty }: Props) {
  const [cfg, setCfg] = useState<LoyaltyConfig>(DEFAULT_LOYALTY_CONFIG)

  function patch<K extends keyof LoyaltyConfig>(key: K, value: LoyaltyConfig[K]) {
    setCfg(prev => ({ ...prev, [key]: value }))
    onDirty()
  }

  function patchBonus<K extends keyof LoyaltyConfig["bonus"]>(key: K, value: LoyaltyConfig["bonus"][K]) {
    setCfg(prev => ({ ...prev, bonus: { ...prev.bonus, [key]: value } }))
    onDirty()
  }

  function patchTier(id: string, patch: Partial<RedemptionTier>) {
    setCfg(prev => ({
      ...prev,
      tiers: prev.tiers.map(t => (t.id === id ? { ...t, ...patch } : t)),
    }))
    onDirty()
  }

  function addTier() {
    const next: RedemptionTier = {
      id: `t_new_${tierCounter++}`,
      points: 150,
      discountPercent: 15,
      label: "Nou tier",
    }
    setCfg(prev => ({ ...prev, tiers: [...prev.tiers, next] }))
    onDirty()
  }

  function removeTier(id: string) {
    setCfg(prev => ({ ...prev, tiers: prev.tiers.filter(t => t.id !== id) }))
    onDirty()
  }

  function patchReward(id: string, patch: Partial<LoyaltyReward>) {
    setCfg(prev => ({
      ...prev,
      rewards: prev.rewards.map(r => (r.id === id ? { ...r, ...patch } : r)),
    }))
    onDirty()
  }

  function addReward() {
    const next: LoyaltyReward = {
      id: `r_new_${rewardCounter++}`,
      name: "Recompensă nouă",
      points: 200,
      category: "service",
      active: true,
    }
    setCfg(prev => ({ ...prev, rewards: [...prev.rewards, next] }))
    onDirty()
  }

  function removeReward(id: string) {
    setCfg(prev => ({ ...prev, rewards: prev.rewards.filter(r => r.id !== id) }))
    onDirty()
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Master toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-emerald-600" />
            Program de loialitate
            {cfg.enabled && <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Activ</Badge>}
          </CardTitle>
          <CardDescription>
            Acordă puncte automat clienților pentru fiecare vizită și oferă-le recompense pentru fidelitate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="font-medium text-sm">Activează programul de loialitate</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Când e dezactivat, nu se acordă puncte și nu se afișează în profilul clienților.
              </p>
            </div>
            <Switch
              checked={cfg.enabled}
              onCheckedChange={v => patch("enabled", v)}
            />
          </div>

          {/* Earn rate */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Rată de acumulare</Label>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">1 punct la fiecare</span>
              <Input
                type="number"
                min={1}
                value={cfg.ronPerPoint}
                onChange={e => patch("ronPerPoint", Math.max(1, Number(e.target.value) || 1))}
                className="w-20 h-9"
                disabled={!cfg.enabled}
              />
              <span className="text-muted-foreground">Lei cheltuiți</span>
              <Badge variant="outline" className="ml-2">
                ex: 100 Lei = {Math.floor(100 / Math.max(1, cfg.ronPerPoint))} puncte
              </Badge>
            </div>
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Expirare puncte</Label>
            <Select
              value={String(cfg.expirationMonths)}
              onValueChange={v => patch("expirationMonths", Number(v))}
              disabled={!cfg.enabled}
            >
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Nu expiră niciodată</SelectItem>
                <SelectItem value="6">După 6 luni de inactivitate</SelectItem>
                <SelectItem value="12">După 12 luni de inactivitate</SelectItem>
                <SelectItem value="24">După 24 luni de inactivitate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bonus rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reguli bonus</CardTitle>
          <CardDescription>Situații speciale care acordă puncte suplimentare.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Birthday */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Cake className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Aniversare client</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dublează sau triplează punctele în săptămâna aniversării.
                  </p>
                </div>
              </div>
              <Switch
                checked={cfg.bonus.birthdayEnabled}
                onCheckedChange={v => patchBonus("birthdayEnabled", v)}
                disabled={!cfg.enabled}
              />
            </div>
            {cfg.bonus.birthdayEnabled && (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm pl-11">
                <span className="text-muted-foreground">Multiplicator</span>
                <Select
                  value={String(cfg.bonus.birthdayMultiplier)}
                  onValueChange={v => patchBonus("birthdayMultiplier", Number(v))}
                >
                  <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">x2</SelectItem>
                    <SelectItem value="3">x3</SelectItem>
                    <SelectItem value="4">x4</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">timp de ±</span>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={cfg.bonus.birthdayWindowDays}
                  onChange={e => patchBonus("birthdayWindowDays", Math.max(1, Number(e.target.value) || 7))}
                  className="w-16 h-8"
                />
                <span className="text-muted-foreground">zile</span>
              </div>
            )}
          </div>

          {/* Referral */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Bonus recomandare</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Clientul care aduce un prieten nou primește puncte la prima vizită a acestuia.
                  </p>
                </div>
              </div>
              <Switch
                checked={cfg.bonus.referralEnabled}
                onCheckedChange={v => patchBonus("referralEnabled", v)}
                disabled={!cfg.enabled}
              />
            </div>
            {cfg.bonus.referralEnabled && (
              <div className="mt-4 flex items-center gap-3 text-sm pl-11">
                <span className="text-muted-foreground">Puncte acordate</span>
                <Input
                  type="number"
                  min={0}
                  value={cfg.bonus.referralPoints}
                  onChange={e => patchBonus("referralPoints", Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 h-8"
                />
              </div>
            )}
          </div>

          {/* First visit */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Bonus primă vizită</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Un cadou de bun venit pentru clienții noi.
                  </p>
                </div>
              </div>
              <Switch
                checked={cfg.bonus.firstVisitEnabled}
                onCheckedChange={v => patchBonus("firstVisitEnabled", v)}
                disabled={!cfg.enabled}
              />
            </div>
            {cfg.bonus.firstVisitEnabled && (
              <div className="mt-4 flex items-center gap-3 text-sm pl-11">
                <span className="text-muted-foreground">Puncte acordate</span>
                <Input
                  type="number"
                  min={0}
                  value={cfg.bonus.firstVisitPoints}
                  onChange={e => patchBonus("firstVisitPoints", Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 h-8"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Redemption tiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Tiere de reducere
              </CardTitle>
              <CardDescription>Clienții pot folosi puncte pentru reducere la plată.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addTier} disabled={!cfg.enabled}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Adaugă tier
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {cfg.tiers.map(tier => (
            <div key={tier.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-sm">
                <Input
                  type="number"
                  min={1}
                  value={tier.points}
                  onChange={e => patchTier(tier.id, { points: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-24 h-9"
                  disabled={!cfg.enabled}
                />
                <span className="text-muted-foreground">pct</span>
              </div>
              <span className="text-muted-foreground">=</span>
              <div className="flex items-center gap-2 text-sm">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={tier.discountPercent}
                  onChange={e => patchTier(tier.id, { discountPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                  className="w-20 h-9"
                  disabled={!cfg.enabled}
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <Input
                value={tier.label}
                onChange={e => patchTier(tier.id, { label: e.target.value })}
                className="flex-1 min-w-[180px] h-9"
                disabled={!cfg.enabled}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeTier(tier.id)}
                disabled={!cfg.enabled || cfg.tiers.length <= 1}
                className="text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reward catalog */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Catalog de recompense
              </CardTitle>
              <CardDescription>Servicii sau produse pe care clienții le pot răscumpăra cu puncte.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addReward} disabled={!cfg.enabled}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Adaugă recompensă
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {cfg.rewards.map(r => (
            <div key={r.id} className="rounded-lg border border-border p-3 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={r.name}
                  onChange={e => patchReward(r.id, { name: e.target.value })}
                  placeholder="Nume recompensă"
                  className="flex-1 min-w-[220px] h-9 font-medium"
                  disabled={!cfg.enabled}
                />
                <Select
                  value={r.category}
                  onValueChange={v => patchReward(r.id, { category: v as LoyaltyReward["category"] })}
                  disabled={!cfg.enabled}
                >
                  <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Serviciu</SelectItem>
                    <SelectItem value="product">Produs</SelectItem>
                    <SelectItem value="voucher">Voucher</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-sm">
                  <Input
                    type="number"
                    min={1}
                    value={r.points}
                    onChange={e => patchReward(r.id, { points: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-24 h-9"
                    disabled={!cfg.enabled}
                  />
                  <span className="text-muted-foreground">pct</span>
                </div>
                <Switch
                  checked={r.active}
                  onCheckedChange={v => patchReward(r.id, { active: v })}
                  disabled={!cfg.enabled}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeReward(r.id)}
                  disabled={!cfg.enabled}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input
                value={r.description ?? ""}
                onChange={e => patchReward(r.id, { description: e.target.value })}
                placeholder="Descriere (opțional)"
                className="h-8 text-xs"
                disabled={!cfg.enabled}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
