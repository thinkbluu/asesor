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

// Shared layout for all ASESOR transactional emails. Plain and readable on
// purpose: inline styles only (no Tailwind — email clients), one accent
// colour taken from the salon branding, footer with the salon's address and
// phone. Templates never receive client health data (see P12 acceptance).

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

const DEFAULT_ACCENT = "#7C3AED"

export function EmailLayout({ branding, preview, children }: EmailLayoutProps) {
  const accent = branding.accentColor || DEFAULT_ACCENT
  return (
    <Html lang="ro">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f5f5f4", fontFamily: "Helvetica, Arial, sans-serif", margin: 0 }}>
        <Container style={{ margin: "24px auto", maxWidth: 560, padding: "0 16px" }}>
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 8,
              border: "1px solid #e7e5e4",
              padding: "32px 32px 24px",
            }}
          >
            {branding.logoUrl ? (
              <Img
                src={branding.logoUrl}
                alt={branding.name}
                height={36}
                style={{ marginBottom: 24, objectFit: "contain" }}
              />
            ) : (
              <Text style={{ ...styles.salonName, color: accent, margin: "0 0 24px" }}>{branding.name}</Text>
            )}
            {children}
          </Section>
          <Section style={{ padding: "16px 8px 8px" }}>
            <Text style={styles.footer}>
              {branding.name}
              {branding.address ? ` · ${branding.address}` : ""}
              {branding.city ? `, ${branding.city}` : ""} · Tel: {branding.phone}
            </Text>
            <Text style={styles.footerMuted}>
              Mesaj automat trimis prin ASESOR — sistemul de management al salonului.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return <Text style={{ ...styles.heading, margin: "0 0 16px" }}>{children}</Text>
}

export function EmailButton({ href, label, accent }: { href: string; label: string; accent: string }) {
  return (
    <a
      href={href}
      style={{
        backgroundColor: accent,
        borderRadius: 6,
        color: "#ffffff",
        display: "inline-block",
        fontSize: 14,
        fontWeight: 600,
        padding: "12px 24px",
        textDecoration: "none",
      }}
    >
      {label}
    </a>
  )
}

export function EmailHr() {
  return <Hr style={{ borderColor: "#e7e5e4", margin: "24px 0" }} />
}

const styles: Record<string, React.CSSProperties> = {
  salonName: {
    fontSize: 20,
    fontWeight: 700,
  },
  heading: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1c1917",
  },
  footer: {
    color: "#57534e",
    fontSize: 12,
    lineHeight: "18px",
    margin: 0,
    textAlign: "center",
  },
  footerMuted: {
    color: "#a8a29e",
    fontSize: 11,
    lineHeight: "16px",
    margin: "4px 0 0",
    textAlign: "center",
  },
}
