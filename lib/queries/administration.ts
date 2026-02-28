import { createClient } from "@/lib/supabase/server"

export interface GovernanceMember {
  memberId: string
  userId: string
  fullName: string | null
  email: string | null
  avatarUrl: string | null
  titleId: string
  titleName: string
  titleSortOrder: number
}

export async function getGovernanceMembers(
  condominiumId: string
): Promise<GovernanceMember[]> {
  const supabase = await createClient()

  // Fetch members who have a functional title assigned
  const { data: members, error } = await supabase
    .from("condominium_members")
    .select("id, user_id, functional_title_id")
    .eq("condominium_id", condominiumId)
    .not("functional_title_id", "is", null)

  if (error || !members || members.length === 0) return []

  // Fetch functional titles for this condominium
  const titleIds = [...new Set(members.map((m) => m.functional_title_id!))]
  const { data: titles } = await supabase
    .from("functional_titles")
    .select("id, name, sort_order")
    .in("id", titleIds)
    .order("sort_order", { ascending: true })

  const titleMap = new Map((titles ?? []).map((t) => [t.id, t]))

  // Fetch profiles for member user_ids
  const userIds = members.map((m) => m.user_id)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", userIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  // Build combined result ordered by title sort_order
  const result: GovernanceMember[] = members
    .filter((m) => m.functional_title_id && titleMap.has(m.functional_title_id))
    .map((m) => {
      const title = titleMap.get(m.functional_title_id!)!
      const profile = profileMap.get(m.user_id)
      return {
        memberId: m.id,
        userId: m.user_id,
        fullName: profile?.full_name ?? null,
        email: profile?.email ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        titleId: title.id,
        titleName: title.name,
        titleSortOrder: title.sort_order,
      }
    })
    .sort((a, b) => a.titleSortOrder - b.titleSortOrder)

  return result
}
