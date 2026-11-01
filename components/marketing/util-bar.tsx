import { TRIAL_REQUIRES_CARD } from "@/lib/plans"
import { SITE } from "@/lib/site"

export function UtilBar() {
  return (
    <div className="util">
      <div className="wrap">
        <span>
          <b>14 zile gratuit</b> · {TRIAL_REQUIRES_CARD ? "anulezi oricând" : "fără card · anulezi oricând"}
        </span>
        <span className="r">
          <span className="h">Răspundem în maxim {SITE.responseTime}</span>
          <a href={`mailto:${SITE.emails.contact}`}>{SITE.emails.contact}</a>
        </span>
      </div>
    </div>
  )
}
