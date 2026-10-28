// Unit check for lib/crypto.ts — pure node, no DB, no Next.
// Compiles lib/crypto.ts with tsc (stubbing the "server-only" package),
// then verifies the round-trip and that IVs differ per encryption.
import { execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync, rmSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"

const nodeRequire = createRequire(import.meta.url)

const root = process.cwd()
const out = "/tmp/crypto-check"
rmSync(out, { recursive: true, force: true })
mkdirSync(path.join(out, "node_modules/server-only"), { recursive: true })

// Stub the "server-only" guard package (it throws when imported outside React
// Server Components; the plain-node check does not need it).
writeFileSync(
  path.join(out, "node_modules/server-only/package.json"),
  JSON.stringify({ name: "server-only", main: "index.js" }),
)
writeFileSync(path.join(out, "node_modules/server-only/index.js"), "module.exports = {}")

execFileSync(
  process.execPath,
  [
    path.join(root, "node_modules/typescript/lib/_tsc.js"),
    path.join(root, "lib/crypto.ts"),
    "--outDir", path.join(out, "lib"),
    "--module", "commonjs",
    "--target", "es2022",
    "--esModuleInterop",
    "--skipLibCheck",
  ],
  { stdio: "inherit" },
)

// The compiled file keeps the relative import shape; crypto.ts has no relative
// imports, only "server-only" and "node:crypto" — resolved via the stub.
const { encryptField, decryptField } = nodeRequire(path.join(out, "lib/crypto.js"))

process.env.FIELD_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64")

const samples = [
  "Alergie la parfeni; reacție severă la amoniac.",
  "x",
  "Diacritice: șțâîé — unicode round-trip.",
]

let failed = 0
for (const s of samples) {
  const c1 = encryptField(s)
  const c2 = encryptField(s)
  const back = decryptField(c1)
  const okRound = back === s
  const okFormat = /^v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/.test(c1)
  const okDiff = c1 !== c2
  console.log(`sample: ${JSON.stringify(s.slice(0, 40))}`)
  console.log(`  round-trip: ${okRound ? "PASS" : "FAIL"}`)
  console.log(`  format v1:iv:tag:cipher: ${okFormat ? "PASS" : "FAIL"}`)
  console.log(`  two encryptions differ: ${okDiff ? "PASS" : "FAIL"}`)
  if (!okRound || !okFormat || !okDiff) failed++
}

// Tamper detection: flipping a ciphertext byte must throw.
const tampered = (() => {
  const parts = encryptField("tamper test").split(":")
  const buf = Buffer.from(parts[3], "base64")
  buf[0] ^= 0xff
  parts[3] = buf.toString("base64")
  return parts.join(":")
})()
let tamperOk = false
try {
  decryptField(tampered)
} catch {
  tamperOk = true
}
console.log(`  tamper detection throws: ${tamperOk ? "PASS" : "FAIL"}`)
if (!tamperOk) failed++

// Missing key in production must throw on first use.
delete process.env.FIELD_ENCRYPTION_KEY
process.env.NODE_ENV = "production"
const mod = nodeRequire(path.join(out, "lib/crypto.js"))
// cachedKey is module-level; re-require a fresh copy to reset it.
delete nodeRequire.cache[nodeRequire.resolve(path.join(out, "lib/crypto.js"))]
const fresh = nodeRequire(path.join(out, "lib/crypto.js"))
let missingOk = false
try {
  fresh.encryptField("should throw")
} catch (e) {
  missingOk = /FIELD_ENCRYPTION_KEY/.test(e.message)
}
console.log(`  missing key in production throws: ${missingOk ? "PASS" : "FAIL"}`)
if (!missingOk) failed++
void mod

console.log(failed === 0 ? "\nALL CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)
