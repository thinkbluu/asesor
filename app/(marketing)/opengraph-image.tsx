import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "ASESOR — Salonul tău merge mai bine când totul e clar."

async function loadBodoni(): Promise<ArrayBuffer | null> {
  try {
    // Without a browser User-Agent, Google Fonts serves TTF files.
    const css = await fetch("https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400&display=swap").then(
      (r) => r.text(),
    )
    const url = css.match(/src: url\((https:[^)]+\.ttf)\)/)?.[1]
    if (!url) return null
    return await fetch(url).then((r) => r.arrayBuffer())
  } catch {
    return null
  }
}

export default async function OpengraphImage() {
  const font = await loadBodoni()
  const options = {
    ...size,
    ...(font ? { fonts: [{ name: "Bodoni Moda", data: font, style: "normal" as const }] } : {}),
  }
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "72px 80px",
          background: "#ECDCCE",
          color: "#131516",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 20,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#4B4F52",
            fontFamily: "sans-serif",
          }}
        >
          Gestionare salon — simplu, elegant, complet
        </p>
        <p
          style={{
            margin: "28px 0 0",
            maxWidth: 900,
            fontSize: 88,
            lineHeight: 0.95,
            letterSpacing: "-0.035em",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Salonul tău</span>
          <span>merge mai bine</span>
          <span style={{ fontStyle: "italic", color: "#00704F" }}>când totul e clar.</span>
        </p>
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 6, background: "#00704F" }} />
          <p style={{ margin: 0, fontSize: 22, color: "#4B4F52", fontFamily: "sans-serif" }}>
            14 zile gratuit · Programări, clienți, echipă, stocuri, venituri
          </p>
        </div>
      </div>
    ),
    options,
  )
}
