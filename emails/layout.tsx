import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components"

// Shared layout for all ASESOR transactional emails (P17 look): porcelain
// background, paper content panel, salon logo/name header, Geist text stack,
// one accent button per email, footer with the salon's address and phone.
// Inline styles only (no Tailwind — email clients). Templates never receive
// client health data (see P12 acceptance).

export interface SalonBranding {
  name: string
  accentColor: string | null
  logoUrl: string | null
  address: string | null
  city: string | null
  phone: string
}

interface EmailLayoutProps {
  branding: SalonBranding
  preview: string
  children: React.ReactNode
}

// Smarald ASESOR — the fallback accent when the salon has no branding colour.
const EM = "#00704F"
const PORCELAIN = "#F2EDE7"
const PAPER = "#FBF9F6"
const INK = "#131516"
const INK_2 = "#4B4F52"
const INK_3 = "#5F6366"
const RULE = "#E2DBD2"

const SANS = '"Geist", "Helvetica Neue", Helvetica, Arial, sans-serif'
const SERIF = '"Bodoni Moda", Georgia, "Times New Roman", serif'

function normalizeHex(color?: string | null): string | null {
  if (!color) return null
  let s = color.trim().toLowerCase()
  if (s.startsWith("#")) s = s.slice(1)
  if (/^[0-9a-f]{3}$/.test(s)) s = s.split("").map((ch) => ch + ch).join("")
  if (!/^[0-9a-f]{6}$/.test(s)) return null
  return `#${s}`
}

function srgbChannel(value: number): number {
  const v = value / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b)
}

/** Accent for filled surfaces (buttons): falls back to smarald ASESOR. */
export function emailAccent(color?: string | null): string {
  return normalizeHex(color) ?? EM
}

/** Accent for text links on the paper panel: pale colours fall back to --em. */
export function accentLinkColor(color?: string | null): string {
  const hex = normalizeHex(color) ?? EM
  // Contrast vs paper (#FBF9F6, luminance ≈ 0.955): need ≥ 4.5 for body-size text.
  const vsPaper = (0.955 + 0.05) / (relativeLuminance(hex) + 0.05)
  return vsPaper >= 4.5 ? hex : EM
}

/** Text colour on top of an accent fill — higher contrast of white vs ink. */
function accentTextOn(hex: string): string {
  const lum = relativeLuminance(hex)
  const vsWhite = 1.05 / (lum + 0.05)
  const vsInk = (lum + 0.05) / (relativeLuminance(INK) + 0.05)
  return vsWhite >= vsInk ? "#FFFFFF" : INK
}

export function EmailLayout({ branding, preview, children }: EmailLayoutProps) {
  const accent = emailAccent(branding.accentColor)
  return (
    <Html lang="ro">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: PORCELAIN, fontFamily: SANS, margin: 0 }}>
        <Container style={{ margin: "24px auto", maxWidth: 560, padding: "0 16px" }}>
          <Section
            style={{
              backgroundColor: PAPER,
              borderRadius: 3,
              border: `1px solid ${RULE}`,
              padding: "28px 28px 24px",
            }}
          >
            {branding.logoUrl ? (
              <Img
                src={branding.logoUrl}
                alt={branding.name}
                height={36}
                style={{ marginBottom: 20, objectFit: "contain" }}
              />
            ) : (
              <Text
                style={{
                  fontFamily: SERIF,
                  fontSize: 22,
                  color: accentLinkColor(branding.accentColor),
                  margin: "0 0 20px",
                  lineHeight: "26px",
                }}
              >
                {branding.name}
              </Text>
            )}
            {children}
          </Section>
          <Section style={{ padding: "16px 8px 8px" }}>
            <Text style={styles.footer}>
              {branding.name}
              {branding.address ? ` · ${branding.address}` : ""}
              {branding.city ? `, ${branding.city}` : ""} · Tel: {branding.phone}
            </Text>
            <Text style={styles.footerMuted}>Trimis prin ASESOR.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: SERIF,
        fontSize: 21,
        fontWeight: 500,
        color: INK,
        lineHeight: "27px",
        margin: "0 0 14px",
        letterSpacing: "-.01em",
      }}
    >
      {children}
    </Text>
  )
}

export function EmailButton({ href, label, accent }: { href: string; label: string; accent: string }) {
  const hex = emailAccent(accent)
  return (
    <a
      href={href}
      style={{
        backgroundColor: hex,
        borderRadius: 3,
        color: accentTextOn(hex),
        display: "inline-block",
        fontSize: 14,
        fontWeight: 600,
        padding: "13px 26px",
        textDecoration: "none",
        fontFamily: SANS,
      }}
    >
      {label}
    </a>
  )
}

export function EmailHr() {
  return <Hr style={{ borderColor: RULE, margin: "22px 0" }} />
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    color: INK_2,
    fontSize: 12,
    lineHeight: "18px",
    margin: 0,
    textAlign: "center",
    fontFamily: SANS,
  },
  footerMuted: {
    color: INK_3,
    fontSize: 11,
    lineHeight: "16px",
    margin: "4px 0 0",
    textAlign: "center",
    fontFamily: SANS,
  },
}

// Shared text styles for the templates (Geist stack, ink palette).
export const emailStyles = {
  text: {
    color: INK,
    fontSize: 14,
    lineHeight: "22px",
    margin: "0 0 12px",
    fontFamily: SANS,
  } as React.CSSProperties,
  box: {
    backgroundColor: PORCELAIN,
    border: `1px solid ${RULE}`,
    borderRadius: 3,
    padding: "12px 16px",
    margin: "0 0 16px",
  } as React.CSSProperties,
  listItem: {
    color: INK,
    fontSize: 14,
    lineHeight: "24px",
    margin: 0,
    fontFamily: SANS,
  } as React.CSSProperties,
  small: {
    color: INK_3,
    fontSize: 12,
    lineHeight: "18px",
    margin: 0,
    fontFamily: SANS,
  } as React.CSSProperties,
}
