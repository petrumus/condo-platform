"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function signInWithGoogle(formData: FormData) {
  const next = formData.get("next") as string | null

  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const redirectTo = next
    ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    : `${origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  })

  if (error || !data.url) {
    redirect(`/?error=${encodeURIComponent(error?.message ?? "OAuth sign-in failed")}`)
  }

  redirect(data.url)
}

export async function signInWithGoogle(formData: FormData) {
  const next = (formData.get("next") as string) || "/"
  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error || !data.url) {
    redirect(`/?error=${encodeURIComponent(error?.message ?? "Google sign-in failed")}`)
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
