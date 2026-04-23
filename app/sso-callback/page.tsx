"use client"

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

export default function SSOCallback() {
  return (
    <AuthenticateWithRedirectCallback
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app/onboarding"
    />
  )
}
