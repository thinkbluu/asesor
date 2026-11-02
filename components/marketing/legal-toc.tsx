"use client"

import { useEffect, useState } from "react"

type TocItem = { id: string; text: string }

function slugify(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-zăâîșț0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
  return base ? `s-${index + 1}-${base}` : `s-${index + 1}`
}

/**
 * Builds the table of contents from the article's H2s on the client,
 * assigning each heading a stable id and tracking the active section.
 */
export function LegalToc() {
  const [items, setItems] = useState<TocItem[]>([])
  const [active, setActive] = useState("")

  useEffect(() => {
    const article = document.querySelector("article.legal")
    if (!article) return
    const heads = Array.from(article.querySelectorAll("h2")) as HTMLHeadingElement[]
    if (heads.length === 0) return

    const list = heads.map((h, i) => {
      const id = h.id || slugify(h.textContent ?? "", i)
      h.id = id
      return { id, text: h.textContent ?? "" }
    })
    setItems(list)

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: "-96px 0px -70% 0px" },
    )
    heads.forEach((h) => obs.observe(h))
    return () => obs.disconnect()
  }, [])

  if (items.length === 0) return null

  return (
    <nav className="ltoc" aria-label="Cuprins">
      <p className="ltoc-h">Cuprins</p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={active === item.id ? "cur" : undefined}
              aria-current={active === item.id ? "true" : undefined}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
