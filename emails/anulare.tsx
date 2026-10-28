import { Section, Text } from "@react-email/components"
import { EmailHr, EmailHeading, EmailLayout, type SalonBranding } from "./layout"

export interface AnulareData {
  recipient: "client" | "salon"
  clientFirstName: string | null
  salon: SalonBranding
  serviceNames: string[]
  dateLabel: string
  timeLabel: string
  staffFirstName: string
  reason: string | null
}

export function Anulare({ data }: { data: AnulareData }) {
  const toSalon = data.recipient === "salon"
  return (
    <EmailLayout
      branding={data.salon}
      preview={
        toSalon
          ? `Programare anulată: ${data.dateLabel}, ora ${data.timeLabel}`
          : `Programarea ta de ${data.dateLabel} a fost anulată`
      }
    >
      <EmailHeading>
        {toSalon ? "O programare a fost anulată" : "Programarea ta a fost anulată"}
      </EmailHeading>

      {toSalon ? (
        <Text style={styles.text}>
          Programarea de mai jos a fost anulată{data.reason ? ` — motiv: ${data.reason}` : ""}.
        </Text>
      ) : (
        <Text style={styles.text}>
          {data.clientFirstName ? `${data.clientFirstName}, programarea` : "Programarea"} ta de la{" "}
          {data.salon.name} a fost anulată{data.reason ? ` — motiv: ${data.reason}` : ""}.
        </Text>
      )}

      <Section style={styles.box}>
        <Text style={styles.listItem}>
          <strong>{data.dateLabel}, ora {data.timeLabel}</strong>
        </Text>
        <Text style={styles.listItem}>{data.serviceNames.join(" + ")}</Text>
        <Text style={styles.listItem}>Specialist: {data.staffFirstName}</Text>
      </Section>

      {toSalon ? (
        <Text style={styles.text}>
          Client: {data.clientFirstName ?? "—"} · Intervalul a fost eliberat în calendar.
        </Text>
      ) : (
        <Text style={styles.text}>
          Dacă vrei să reprogramăm, sună-ne la {data.salon.phone} sau programează-te online.
        </Text>
      )}
      <EmailHr />
      <Text style={styles.small}>
        Mesaj automat trimis prin ASESOR. Pentru detalii contactează {data.salon.name} la{" "}
        {data.salon.phone}.
      </Text>
    </EmailLayout>
  )
}

export default Anulare

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
