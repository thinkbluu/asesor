import { Section, Text } from "@react-email/components"
import {
  EmailButton,
  EmailHr,
  EmailHeading,
  EmailLayout,
  type SalonBranding,
} from "./layout"

export interface Reamintire24hData {
  clientFirstName: string
  salon: SalonBranding
  serviceNames: string[]
  dateLabel: string
  timeLabel: string
  staffFirstName: string
  /** Present only for online bookings (the manage link needs the raw token). */
  manageUrl: string | null
}

export function Reamintire24h({ data }: { data: Reamintire24hData }) {
  const accent = data.salon.accentColor || "#7C3AED"
  return (
    <EmailLayout
      branding={data.salon}
      preview={`Mâine te așteptăm la ${data.salon.name}, ora ${data.timeLabel}`}
    >
      <EmailHeading>Mâine te așteptăm!</EmailHeading>
      <Text style={styles.text}>
        Bună, {data.clientFirstName}! Îți amintim programarea de mâine la {data.salon.name}:
      </Text>
      <Section style={styles.box}>
        <Text style={styles.listItem}>
          <strong>{data.dateLabel}, ora {data.timeLabel}</strong>
        </Text>
        <Text style={styles.listItem}>{data.serviceNames.join(" + ")}</Text>
        <Text style={styles.listItem}>Specialist: {data.staffFirstName}</Text>
      </Section>
      <Text style={styles.text}>
        Adresă: {data.salon.address}
        {data.salon.city ? `, ${data.salon.city}` : ""} · Tel: {data.salon.phone}
      </Text>
      {data.manageUrl && (
        <Section style={{ margin: "24px 0" }}>
          <EmailButton href={data.manageUrl} label="Vezi programarea" accent={accent} />
        </Section>
      )}
      <EmailHr />
      <Text style={styles.small}>
        Nu mai poți veni?{" "}
        {data.manageUrl ? (
          <>
            <a href={data.manageUrl} style={{ color: accent }}>
              Anulează aici
            </a>{" "}
            sau
          </>
        ) : null}
        sună la {data.salon.phone}.
      </Text>
    </EmailLayout>
  )
}

export default Reamintire24h

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
