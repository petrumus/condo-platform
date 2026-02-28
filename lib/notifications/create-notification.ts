import { createServiceClient } from "@/lib/supabase/server"

export type NotificationType =
  | "announcement"
  | "ballot_open"
  | "ballot_results"
  | "initiative_status"
  | "maintenance_status"

interface CreateNotificationParams {
  userId: string
  condominiumId: string
  type: NotificationType
  title: string
  body: string
  linkUrl?: string
}

/**
 * Inserts a single notification row using the service role client (bypasses RLS).
 * Silently ignores errors so notification failures never break the main action.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const supabase = await createServiceClient()
    await supabase.from("notifications").insert({
      user_id: params.userId,
      condominium_id: params.condominiumId,
      type: params.type,
      title: params.title,
      body: params.body,
      link_url: params.linkUrl ?? null,
    })
  } catch {
    // Notification failures are non-critical — never break the calling action
  }
}

/**
 * Inserts notifications for all members of a condominium.
 * Fetches member list using service role, then bulk-inserts.
 * Silently ignores errors.
 */
export async function createNotificationForAllMembers(params: {
  condominiumId: string
  type: NotificationType
  title: string
  body: string
  linkUrl?: string
}): Promise<void> {
  try {
    const supabase = await createServiceClient()

    const { data: members } = await supabase
      .from("condominium_members")
      .select("user_id")
      .eq("condominium_id", params.condominiumId)

    if (!members || members.length === 0) return

    const rows = members.map((m) => ({
      user_id: m.user_id,
      condominium_id: params.condominiumId,
      type: params.type,
      title: params.title,
      body: params.body,
      link_url: params.linkUrl ?? null,
    }))

    await supabase.from("notifications").insert(rows)
  } catch {
    // Notification failures are non-critical
  }
}
