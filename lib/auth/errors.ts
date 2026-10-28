// Maps Supabase Auth error messages/codes to specific, user-facing Romanian
// copy. Matched case-insensitively on stable substrings of the messages
// Supabase (GoTrue) returns. Order matters: more specific rules first.

const MAP: { match: RegExp; message: string }[] = [
  {
    match: /invalid login credentials/i,
    message: "Email sau parolă greșită.",
  },
  {
    match: /email[ _-]?not[ _-]?confirmed|confirm[ _-]?your[ _-]?email/i,
    message: "Confirmă-ți adresa de email înainte să te autentifici.",
  },
  {
    match: /over_request_rate_limit|rate[ _-]?limit|too many requests/i,
    message: "Prea multe încercări. Încearcă din nou peste câteva minute.",
  },
  {
    match: /(weak|short)[ _-]?password|password.{0,30}(weak|short|at least \d+)|signup requires a valid password|password (should be|must be|cannot be empty)/i,
    message: "Parola trebuie să aibă cel puțin 10 caractere.",
  },
  {
    match: /otp_expired|email link.{0,20}(invalid|expired)|(invalid|expired).{0,20}email link|access_token.{0,20}invalid/i,
    message: "Linkul a expirat. Cere unul nou.",
  },
  {
    match: /user already (registered|exists)/i,
    message: "Există deja un cont cu acest email. Autentifică-te sau resetează parola.",
  },
  {
    match: /captcha/i,
    message: "Verificarea de securitate a eșuat. Reîncarcă pagina și încearcă din nou.",
  },
  {
    match: /invalid email/i,
    message: "Adresa de email nu este validă.",
  },
]

const FALLBACK = "A apărut o eroare neașteptată. Încearcă din nou."

export function mapAuthError(error: { message?: string; code?: string } | string): string {
  const text = typeof error === "string" ? error : `${error.code ?? ""} ${error.message ?? ""}`
  if (!text.trim()) return FALLBACK
  for (const entry of MAP) {
    if (entry.match.test(text)) return entry.message
  }
  // Never surface raw English provider messages to the user.
  return FALLBACK
}
