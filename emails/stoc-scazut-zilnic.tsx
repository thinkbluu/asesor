import { Section, Text } from "@react-email/components"
import { EmailHr, EmailHeading, EmailLayout, type SalonBranding } from "./layout"

export interface StocScazutZilnicData {
  salon: SalonBranding
  items: { name: string; stock: number; minStock: number; supplier: string | null }[]
}

export function StocScazutZilnic({ data }: { data: StocScazutZilnicData }) {
  const outOfStock = data.items.filter((i) => i.stock <= 0)
  const low = data.items.filter((i) => i.stock > 0)
  return (
    <EmailLayout
      branding={data.salon}
      preview={`${data.salon.name}: ${data.items.length} produse de comandat`}
    >
      <EmailHeading>Produse cu stoc scăzut</EmailHeading>
      <Text style={styles.text}>
        Raportul de astăzi pentru {data.salon.name} — {data.items.length}{" "}
        {data.items.length === 1 ? "produs" : "produse"} care au nevoie de comandă:
      </Text>

      {outOfStock.length > 0 && (
        <Section style={styles.box}>
          <Text style={{ ...styles.listItem, fontWeight: 700 }}>Stoc epuizat</Text>
          {outOfStock.map((i) => (
            <Text key={i.name} style={styles.listItem}>
              {i.name} — stoc: 0 (minim {i.minStock})
              {i.supplier ? ` · furnizor: ${i.supplier}` : ""}
            </Text>
          ))}
        </Section>
      )}

      {low.length > 0 && (
        <Section style={styles.box}>
          <Text style={{ ...styles.listItem, fontWeight: 700 }}>Sub minim</Text>
          {low.map((i) => (
            <Text key={i.name} style={styles.listItem}>
              {i.name} — stoc: {i.stock} (minim {i.minStock})
              {i.supplier ? ` · furnizor: ${i.supplier}` : ""}
            </Text>
          ))}
        </Section>
      )}

      <Text style={styles.text}>
        Comenzile se pot genera din ASESOR, secțiunea Stocuri → „De comandat".
      </Text>
      <EmailHr />
      <Text style={styles.small}>
        Raport zilnic trimis la ora 03:00 (ora României). Poți dezactiva acest email din
        Setări → Notificări.
      </Text>
    </EmailLayout>
  )
}

export default StocScazutZilnic

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
