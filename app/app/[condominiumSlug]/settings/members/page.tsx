import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MemberRow } from "./member-row"
import { InviteForm } from "./invite-form"
import { PendingInvitations } from "./pending-invitations"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

export default async function MembersPage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") redirect(`/app/${condominiumSlug}/dashboard`)

  const supabase = await createClient()

  // Fetch member rows
  const { data: members } = await supabase
    .from("condominium_members")
    .select("id, user_id, system_role, functional_title_id, joined_at")
    .eq("condominium_id", condominium.id)
    .order("joined_at", { ascending: true })

  // Fetch profiles for all member user_ids
  const userIds = members?.map((m) => m.user_id) ?? []
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  // Fetch functional titles for this condominium
  const { data: titles } = await supabase
    .from("functional_titles")
    .select("id, name, sort_order")
    .eq("condominium_id", condominium.id)
    .order("sort_order", { ascending: true })

  // Fetch pending (not accepted) invitations
  const { data: pendingInvitations } = await supabase
    .from("invitations")
    .select("id, email, role, created_at")
    .eq("condominium_id", condominium.id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Members</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage condominium members, roles, and functional titles.
        </p>
      </div>

      {/* Members table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Members</CardTitle>
          <CardDescription>
            {members?.length ?? 0} member{members?.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => {
                const profile = profileMap.get(member.user_id)

                return (
                  <MemberRow
                    key={member.id}
                    condominiumSlug={condominiumSlug}
                    member={{
                      id: member.id,
                      user_id: member.user_id,
                      system_role: member.system_role as "admin" | "user",
                      joined_at: member.joined_at,
                      functional_title_id: member.functional_title_id,
                      user: {
                        email: profile?.email ?? "",
                        full_name: profile?.full_name ?? null,
                      },
                    }}
                    titles={titles ?? []}
                    isCurrentUser={member.user_id === user.id}
                  />
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite new member */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite a Member</CardTitle>
          <CardDescription>
            Send an invitation link to add someone to this condominium.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm condominiumSlug={condominiumSlug} />
        </CardContent>
      </Card>

      {/* Pending invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending Invitations</CardTitle>
          <CardDescription>Invitations that have not yet been accepted.</CardDescription>
        </CardHeader>
        <CardContent>
          <PendingInvitations
            condominiumSlug={condominiumSlug}
            invitations={pendingInvitations ?? []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
