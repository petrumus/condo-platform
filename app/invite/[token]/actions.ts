"use server"

import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"

// token is pre-bound via .bind(null, token) in the page; _formData is ignored
export async function acceptInvitation(token: string, _formData?: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/?error=You+must+be+signed+in+to+accept+an+invitation`)
  }

  // Use the service client to look up the invitation (bypasses RLS)
  const serviceClient = await createServiceClient()

  const { data: invitation, error: fetchError } = await serviceClient
    .from("invitations")
    .select("*, condominiums ( slug )")
    .eq("token", token)
    .is("accepted_at", null)
    .single()

  if (fetchError || !invitation) {
    redirect(`/invite/${token}?error=This+invitation+is+invalid+or+has+already+been+used`)
  }

  // Check the invitation email matches the authenticated user
  if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
    redirect(
      `/invite/${token}?error=This+invitation+was+sent+to+${encodeURIComponent(invitation.email)}+but+you+are+signed+in+as+${encodeURIComponent(user.email ?? "")}`
    )
  }

  // Check if already a member
  const { data: existing } = await serviceClient
    .from("condominium_members")
    .select("id")
    .eq("condominium_id", invitation.condominium_id)
    .eq("user_id", user.id)
    .single()

  if (!existing) {
    // Add user to condominium
    const { error: insertError } = await serviceClient
      .from("condominium_members")
      .insert({
        condominium_id: invitation.condominium_id,
        user_id: user.id,
        system_role: invitation.role,
      })

    if (insertError) {
      redirect(`/invite/${token}?error=Failed+to+accept+invitation.+Please+try+again.`)
    }
  }

  // Mark invitation as accepted
  await serviceClient
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("token", token)

  const slug = (invitation.condominiums as { slug: string } | null)?.slug
  if (slug) {
    redirect(`/app/${slug}/dashboard`)
  }
  redirect("/")
}
