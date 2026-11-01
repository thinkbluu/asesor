import type { Metadata } from "next"
import { SITE } from "@/lib/site"
import { ContactForm } from "@/components/marketing/contact-form"
import { CONTACT_SUBJECTS, type ContactSubject } from "@/lib/validation/contact"
import { MarketingMotion } from "@/components/marketing/marketing-motion"

export const metadata: Metadata = {
  title: "Contact — ASESOR",
  description: `Scrie-ne. Îți răspundem în maxim ${SITE.responseTime}.`,
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ subiect?: string }>
}) {
  const { subiect } = await searchParams
  const initialSubject = CONTACT_SUBJECTS.includes(subiect as ContactSubject)
    ? (subiect as ContactSubject)
    : null

  return (
    <main>
      <section className="phero pow">
        <div className="wrap in">
          <p className="eyebrow kick">Contact</p>
          <h1 className="display">
            <span className="l">
              <span>
                Scrie-<em>ne.</em>
              </span>
            </span>
          </h1>
          <p className="lede">Răspundem în maxim {SITE.responseTime}.</p>
        </div>
      </section>

      <section className="sec f-porc">
        <div className="wrap cgrid">
          <div className="rv">
            <ContactForm initialSubject={initialSubject} />
          </div>
          <aside className="cside rv" aria-label="Date de contact">
            <div className="cblock">
              <h3>Contact</h3>
              <p>
                <a className="tl" href={`mailto:${SITE.emails.contact}`}>
                  {SITE.emails.contact}
                </a>
              </p>
              <p className="mt10">
                <a className="tl" href={`mailto:${SITE.emails.support}`}>
                  {SITE.emails.support}
                </a>
              </p>
            </div>
            <div className="cblock">
              <h3>Suport</h3>
              <p>{SITE.supportHours}</p>
            </div>
            <div className="cblock">
              <h3>Sediu</h3>
              <p>{SITE.address}</p>
            </div>
            <div className="cblock">
              <h3>Date personale</h3>
              <p>
                Pentru date personale:{" "}
                <a href={`mailto:${SITE.emails.dpo}`}>{SITE.emails.dpo}</a>
              </p>
            </div>
          </aside>
        </div>
      </section>

      <MarketingMotion />
    </main>
  )
}
