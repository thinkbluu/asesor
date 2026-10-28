import { Section, Text } from "@react-email/components"
import {
  EmailButton,
  EmailHr,
  EmailHeading,
  EmailLayout,
  type SalonBranding,
} from "./layout"

export interface ConfirmareProgramareData {
  clientFirstName: string
  salon: SalonBranding
  services: { name: string; durationMin: number; price: number }[]
  dateLabel: string
  timeLabel: string
  staffFirstName: string
  mapsUrl: string
  /** Present only for online bookings (the manage link needs the raw token). */
  manageUrl: string | null
  cancellationHours: number
}

export function ConfirmareProgramare({ data }: { data: ConfirmareProgramareData }) {
  const accent = data.salon.accentColor || "#7C3AED"
  const total = data.services.reduce((sum, s) => sum + s.price, 0)
  return (
    <EmailLayout
      branding={data.salon}
      preview={`Programarea ta la ${data.salon.name}, ${data.dateLabel} ora ${data.timeLabel}`}
    >
      <EmailHeading>Programarea ta a fost confirmată</EmailHeading>
      <Text style={styles.text}>
        Bună, {data.clientFirstName}! Te așteptăm la {data.salon.name} pentru:
      </Text>
      <Section style={styles.box}>
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
        <strong>Când:</strong> {data.dateLabel}, ora {data.timeLabel}
        <br />
        <strong>Cine:</strong> {data.staffFirstName}
        <br />
        <strong>Unde:</strong>{" "}
        <a href={data.mapsUrl} style={{ color: accent }}>
          {data.salon.address}
          {data.salon.city ? `, ${data.salon.city}` : ""} (deschide în hărți)
        </a>
      </Text>
      <Text style={styles.text}>
        Detaliile programării și calendarul (.ics) sunt atașate acestui email.
      </Text>
      {data.manageUrl && (
        <Section style={{ margin: "24px 0" }}>
          <EmailButton href={data.manageUrl} label="Vezi sau gestionează programarea" accent={accent} />
        </Section>
      )}
      <EmailHr />
      <Text style={styles.small}>
        Dacă nu mai poți veni, te rugăm să anulezi cu cel puțin {data.cancellationHours}{" "}
        {data.cancellationHours === 1 ? "oră" : "ore"} înainte
        {data.manageUrl ? ", folosind linkul de mai sus" : ""} sau telefonul salonului:{" "}
        {data.salon.phone}.
      </Text>
    </EmailLayout>
  )
}

export default ConfirmareProgramare

const styles: Record<string, React.CSSProperties> = {
  text: {
    color: "#292524",
    fontSize: 14,
    lineHeight: "22px",
    margin: "0 0 12px",
  },
  box: {
    backgroundColor: "#fafaf9",
    border: "1px solid #e7e5e4",
    borderRadius: 6,
    padding: "12px 16px",
    margin: "0 0 16px",
  },
  listItem: {
    color: "#292524",
    fontSize: 14,
    lineHeight: "24px",
    margin: 0,
  },
  small: {
    color: "#78716c",
    fontSize: 12,
    lineHeight: "18px",
    margin: 0,
  },
}
