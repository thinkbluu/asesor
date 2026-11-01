import { Section, Text } from "@react-email/components"
import { EmailHr, EmailHeading, EmailLayout } from "./layout"
import { emailStyles } from "./layout"
import { SITE } from "@/lib/site"

export interface ContactNouData {
  name: string
  email: string
  phone: string
  salonName: string
  subject: string
  message: string
  sentAtLabel: string
}

// Site-level notification (no salon branding) — goes to SITE.emails.contact.
export function ContactNou({ data }: { data: ContactNouData }) {
  return (
    <EmailLayout
      branding={{
        name: SITE.name,
        accentColor: null,
        logoUrl: null,
        address: null,
        city: null,
        phone: SITE.emails.support,
      }}
      preview={`Mesaj nou de contact: ${data.subject}`}
    >
      <EmailHeading>Mesaj nou de contact</EmailHeading>
      <Text style={styles.text}>
        <strong>{data.name}</strong> ({data.email}) a trimis un mesaj prin formularul de contact:
      </Text>
      <Section style={styles.box}>
        <Text style={styles.listItem}>
          <strong>Subiect:</strong> {data.subject}
        </Text>
        {data.phone ? (
          <Text style={styles.listItem}>
            <strong>Telefon:</strong> {data.phone}
          </Text>
        ) : null}
        {data.salonName ? (
          <Text style={styles.listItem}>
            <strong>Salon:</strong> {data.salonName}
          </Text>
        ) : null}
        <Text style={{ ...styles.listItem, whiteSpace: "pre-wrap" }}>{data.message}</Text>
      </Section>
      <Text style={styles.text}>
        Primit: {data.sentAtLabel}
      </Text>
      <EmailHr />
      <Text style={styles.small}>
        Răspunde direct la adresa expeditorului ({data.email}). Mesajul a trecut prin
        verificarea anti-bot și limitarea de rată.
      </Text>
    </EmailLayout>
  )
}

export default ContactNou

const styles = emailStyles
