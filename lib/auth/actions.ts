"use server"

import { redirect } from "next/navigation"
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { ensureSalonAndConsents } from "./post-signup"

/** Signs the user out (server action) and lands them on /login. */
export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
  }
  redirect("/login")
}

/**
 * Called by /auth/callback (and by /register when email confirmation is
 * disabled and a session exists immediately). Creates the first salon from
 * pending signup metadata and writes the accepted legal versions to the
 * profile. Safe to call multiple times.
 */
export async function finishAuthSetup(): Promise<{ createdSalon: boolean }> {
  return ensureSalonAndConsents()
}
