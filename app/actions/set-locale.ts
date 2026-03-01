"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const SUPPORTED_LOCALES = ["ro", "ru"] as const
type Locale = (typeof SUPPORTED_LOCALES)[number]

export async function setLocale(locale: string) {
  const resolved: Locale = SUPPORTED_LOCALES.includes(locale as Locale)
    ? (locale as Locale)
    : "ro"

  const cookieStore = await cookies()
  cookieStore.set("NEXT_LOCALE", resolved, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    httpOnly: false, // readable by JS for optimistic updates
  })

  // Persist to DB if user is authenticated
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from("profiles")
        .update({ preferred_locale: resolved })
        .eq("id", user.id)
    }
  } catch {
    // Not authenticated or DB unavailable — cookie-only is fine
  }
}
