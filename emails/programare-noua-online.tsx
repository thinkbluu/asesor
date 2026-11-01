import { Section, Text } from "@react-email/components"
import { EmailHr, EmailHeading, EmailLayout, type SalonBranding } from "./layout"
import { emailStyles } from "./layout"

export interface ProgramareNouaOnlineData {
  clientName: string
  clientPhone: string
  clientEmail: string | null
  salon: SalonBranding
  services: { name: string; durationMin: number; price: number }[]
  dateLabel: string
  timeLabel: string
  staffFirstName: string
  notes: string | null
}

export function ProgramareNouaOnline({ data }: { data: ProgramareNouaOnlineData }) {
  const total = data.services.reduce((sum, s) => sum + s.price, 0)
  return (
    <EmailLayout
      branding={data.salon}
      preview={`Programare nouă online: ${data.clientName}, ${data.dateLabel} ora ${data.timeLabel}`}
    >
      <EmailHeading>Programare nouă online</EmailHeading>
      <Text style={styles.text}>
        Un client nou s-a programat online pe pagina de rezervări:
      </Text>
      <Section style={styles.box}>
        <Text style={styles.listItem}>
          <strong>{data.dateLabel}, ora {data.timeLabel}</strong>
        </Text>
        <Text style={styles.listItem}>Specialist: {data.staffFirstName}</Text>
        {data.services.map((s) => (
          <Text key={s.name} style={styles.listItem}>
            {s.name} — {s.durationMin} min · {s.price.toFixed(2)} lei
          </Text>
        ))}
        <Text style={{ ...styles.listItem, fontWeight: 700, marginTop: 8 }}>
          Total: {total.toFixed(2)} lei
        </Text>
      </Section>
      <Text style={styles.text}>
        <strong>Client:</strong> {data.clientName}
        <br />
        <strong>Telefon:</strong> {data.clientPhone}
        {data.clientEmail ? (
          <>
            <br />
            <strong>Email:</strong> {data.clientEmail}
          </>
        ) : null}
        {data.notes ? (
          <>
            <br />
            <strong>Observații:</strong> {data.notes}
          </>
        ) : null}
      </Text>
      <EmailHr />
      <Text style={styles.small}>
        Programarea apare în calendarul ASESOR. Mesaj automat trimis prin ASESOR.
      </Text>
    </EmailLayout>
  )
}

export default ProgramareNouaOnline

const styles = emailStyles
