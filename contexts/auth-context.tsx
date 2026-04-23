"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

interface Profile {
  first_name: string | null
  last_name: string | null
  salon_name: string | null
  city: string | null
  phone: string | null
  has_completed_onboarding: boolean
}

interface AuthContextType {
  user: { id: string; email: string | undefined } | null
  profile: Profile | null
  isLoading: boolean
  logout: () => Promise<void>
  completeOnboarding: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const user = clerkUser
    ? { id: clerkUser.id, email: clerkUser.primaryEmailAddress?.emailAddress }
    : null

  const profile: Profile | null = clerkUser
    ? {
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        salon_name: (clerkUser.unsafeMetadata?.salon_name as string) ?? null,
        city: (clerkUser.unsafeMetadata?.city as string) ?? null,
        phone: (clerkUser.unsafeMetadata?.phone as string) ?? null,
        has_completed_onboarding: (clerkUser.unsafeMetadata?.has_completed_onboarding as boolean) ?? false,
      }
    : null

  async function logout() {
    await signOut()
    router.push("/")
  }

  async function completeOnboarding() {
    if (!clerkUser) return
    await clerkUser.update({
      unsafeMetadata: {
        ...clerkUser.unsafeMetadata,
        has_completed_onboarding: true,
      },
    })
    router.push("/app")
  }

  return (
    <AuthContext.Provider value={{ user, profile, isLoading: !isLoaded, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
