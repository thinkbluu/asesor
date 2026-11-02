import "server-only"

import { randomBytes } from "node:crypto"

/**
 * Maps an unexpected server-side failure to a client-safe Romanian message.
 * The raw error is logged with a short request id so support can correlate a
 * user-reported code with the server log; the id is the only detail that
 * crosses the boundary.
 */
export function internalActionError(
  scope: string,
  err: unknown,
): { ok: false; error: string } {
  const id = randomBytes(4).toString("hex")
  console.error(`[v0] ${scope} failed [${id}]:`, err instanceof Error ? err.message : err)
  return {
    ok: false,
    error: `Eroare internă (cod ${id}). Încearcă din nou; dacă persistă, contactează suportul cu acest cod.`,
  }
}
