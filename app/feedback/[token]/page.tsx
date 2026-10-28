import { notFound } from "next/navigation"
import { createHash } from "crypto"
import { getFeedbackByToken } from "@/lib/data/feedback"
import { FeedbackClient } from "@/components/app/feedback-client"

// Public feedback page, addressed by single-use token. The token is hashed
// and looked up by hash — the DB never stores the plaintext.
export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const tokenHash = createHash("sha256").update(token).digest("hex")

  const state = await getFeedbackByToken(tokenHash)
  // Unknown token (including the old /feedback/[id] appointment-id URLs —
  // an appointment id is never a valid token hash preimage) → 404.
  if (!state) notFound()

  return <FeedbackClient state={state} token={token} />
}
