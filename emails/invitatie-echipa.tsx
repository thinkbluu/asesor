import { Section, Text } from "@react-email/components"
import { EmailButton, EmailHr, EmailHeading, EmailLayout, type SalonBranding } from "./layout"
import { emailStyles, emailAccent, accentLinkColor } from "./layout"

export interface InvitatieEchipaData {
  salon: SalonBranding
  inviteUrl: string
  roleLabel: string
  inviterName: string | null
  expiresInDays: number
}

export function InvitatieEchipa({ data }: { data: InvitatieEchipaData }) {
  const accent = emailAccent(data.salon.accentColor)
  return (
    <EmailLayout
      branding={data.salon}
      preview={`${data.inviterName ?? "Echipa"} te-a invitat în ${data.salon.name} pe ASESOR`}
    >
      <EmailHeading>Ai fost invitat(ă) în echipă</EmailHeading>
      <Text style={styles.text}>
        {data.inviterName ? `${data.inviterName}` : "Echipa"} te-a invitat să te alături salonului{" "}
        <strong>{data.salon.name}</strong> pe ASESOR, cu rolul de <strong>{data.roleLabel}</strong>.
      </Text>
      <Text style={styles.text}>
        ASESOR este sistemul prin care salonul își gestionează programările, clienții și
        serviciile. Contul tău va fi conectat la acest salon după ce accepți invitația.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <EmailButton href={data.inviteUrl} label="Acceptă invitația" accent={accent} />
      </Section>
      <Text style={styles.text}>
        Dacă butonul nu funcționează, copiază acest link în browser:
        <br />
        <a href={data.inviteUrl} style={{ color: accentLinkColor(data.salon.accentColor), wordBreak: "break-all" }}>
          {data.inviteUrl}
        </a>
      </Text>
      <EmailHr />
      <Text style={styles.small}>
        Invitația este valabilă {data.expiresInDays} zile. Dacă nu te așteptai la acest email,
        îl poți ignora.
      </Text>
    </EmailLayout>
  )
}

export default InvitatieEchipa

const styles = emailStyles
