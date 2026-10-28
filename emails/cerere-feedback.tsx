import { Section, Text } from "@react-email/components"
import { EmailButton, EmailHr, EmailHeading, EmailLayout, type SalonBranding } from "./layout"

export interface CerereFeedbackData {
  clientFirstName: string
  salon: SalonBranding
  feedbackUrl: string
}

export function CerereFeedback({ data }: { data: CerereFeedbackData }) {
  const accent = data.salon.accentColor || "#7C3AED"
  return (
    <EmailLayout
      branding={data.salon}
      preview={`Cum a fost vizita ta la ${data.salon.name}?`}
    >
      <EmailHeading>Cum a fost vizita ta?</EmailHeading>
      <Text style={styles.text}>
        Bună, {data.clientFirstName}! Sperăm că te-ai simțit bine la {data.salon.name}.
      </Text>
      <Text style={styles.text}>
        Părerea ta ne ajută să îmbunătățim serviciile — îți ia mai puțin de un minut:
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <EmailButton href={data.feedbackUrl} label="Lasă o recenzie" accent={accent} />
      </Section>
      <EmailHr />
      <Text style={styles.small}>
        Linkul este personal și valabil 14 zile. Îți mulțumim! — echipa {data.salon.name}
      </Text>
    </EmailLayout>
  )
}

export default CerereFeedback

const styles: Record<string, React.CSSProperties> = {
  text: {
    color: "#292524",
    fontSize: 14,
    lineHeight: "22px",
    margin: "0 0 12px",
  },
  small: {
    color: "#78716c",
    fontSize: 12,
    lineHeight: "18px",
    margin: 0,
  },
}
