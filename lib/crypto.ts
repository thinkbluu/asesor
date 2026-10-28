import "server-only"

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto"

/**
 * Field-level encryption for protected health data (allergies, color
 * formulas). AES-256-GCM with a random 12-byte IV per value; ciphertext
 * format: v1:<iv b64>:<tag b64>:<cipher b64>.
 *
 * The key comes from FIELD_ENCRYPTION_KEY (32 bytes, base64). It is read on
 * first use — never at import time — so a missing key can never break the
 * build; in production the first encrypt/decrypt throws a clear error.
 * In development a deterministic fallback key is derived so the preview keeps
 * working (with a console warning); production data is never touched by it.
 */

const PREFIX = "v1"
const IV_BYTES = 12
const KEY_BYTES = 32

let cachedKey: Buffer | null | undefined

function loadKey(): Buffer {
  if (cachedKey !== undefined) return cachedKey

  const raw = process.env.FIELD_ENCRYPTION_KEY
  if (raw && raw.length > 0) {
    const key = Buffer.from(raw, "base64")
    if (key.length !== KEY_BYTES) {
      throw new Error(
        "FIELD_ENCRYPTION_KEY invalid: expected 32 bytes base64 (openssl rand -base64 32).",
      )
    }
    cachedKey = key
    return cachedKey
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "FIELD_ENCRYPTION_KEY is not set — required to store or read protected health data. " +
        "Generate one with: openssl rand -base64 32",
    )
  }

  // Development fallback: deterministic so previously stored dev values stay
  // readable across server restarts. Never used in production.
  console.warn(
    "[v0] FIELD_ENCRYPTION_KEY missing — using a development-only fallback key. " +
      "Set FIELD_ENCRYPTION_KEY before production.",
  )
  cachedKey = createHash("sha256")
    .update("asesor-dev-field-encryption-fallback")
    .digest()
  return cachedKey
}

export function encryptField(plain: string): string {
  if (plain.length === 0) throw new Error("encryptField: empty plaintext")
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv("aes-256-gcm", loadKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`
}

export function decryptField(cipherText: string): string {
  const parts = cipherText.split(":")
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new Error("decryptField: unrecognized ciphertext format")
  }
  const iv = Buffer.from(parts[1], "base64")
  const tag = Buffer.from(parts[2], "base64")
  const data = Buffer.from(parts[3], "base64")
  const decipher = createDecipheriv("aes-256-gcm", loadKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")
}
