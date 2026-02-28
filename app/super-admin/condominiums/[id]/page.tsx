import Link from "next/link"
import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EditCondominiumForm } from "./edit-condominium-form"
import { InviteAdminForm } from "./invite-admin-form"
import { MemberRow } from "./member-row"
import { DangerZone } from "./danger-zone"
import type { Tables } from "@/lib/types/database"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CondominiumDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServiceClient()

  const [
    { data: condoRaw },
    { data: members },
    { data: pendingInvites },
  ] = await Promise.all([
    supabase.from("condominiums").select("*").eq("id", id).single(),
    supabase
      .from("condominium_members")
      .select("id, system_role, joined_at, profiles(id, email, full_name)")
      .eq("condominium_id", id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("invitations")
      .select("id, email, role, created_at")
      .eq("condominium_id", id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ])

  if (!condoRaw) notFound()

  const condo = condoRaw as Tables<"condominiums">

  const typedMembers = (members ?? []) as Array<{
    id: string
    system_role: "admin" | "user"
    joined_at: string
    profiles: { id: string; email: string | null; full_name: string | null } | null
  }>

  return (
    <div className="max-w-3xl space-y-8">
      {/* Back + header */}
      <div className="space-y-1">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/super-admin/condominiums">← All Condominiums</Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{condo.name}</h1>
          <Badge variant={condo.status === "active" ? "default" : "destructive"}>
            {condo.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground font-mono">{condo.slug}</p>
      </div>

      <Separator />

      {/* Edit details */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Details</h2>
        <EditCondominiumForm
          id={condo.id}
          name={condo.name}
          address={condo.address}
          description={condo.description}
        />
      </section>

      <Separator />

      {/* Members */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Members{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({typedMembers.length})
          </span>
        </h2>

        {typedMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">User</th>
                  <th className="text-left px-4 py-2 font-medium">Role</th>
                  <th className="text-left px-4 py-2 font-medium">Joined</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {typedMembers.map((member) => (
                  <MemberRow
                    key={member.id}
                    condominiumId={condo.id}
                    member={member}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Invite admin */}
        <div className="pt-2 space-y-3">
          <h3 className="text-sm font-semibold">Invite Admin</h3>
          <InviteAdminForm condominiumId={condo.id} />
        </div>

        {/* Pending invitations */}
        {pendingInvites && pendingInvites.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Pending Invitations
            </h3>
            <div className="border rounded-lg divide-y text-sm">
              {pendingInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between px-4 py-2"
                >
                  <span>{inv.email}</span>
                  <Badge variant="secondary">{inv.role}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Separator />

      {/* Danger zone */}
      <DangerZone
        condominiumId={condo.id}
        condominiumName={condo.name}
        status={condo.status}
      />
    </div>
  )
}
