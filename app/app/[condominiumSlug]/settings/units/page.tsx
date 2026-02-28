import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { UnitDialog } from "@/components/settings/units/unit-dialog"
import { UnitsTable } from "@/components/settings/units/units-table"
import type { Tables } from "@/lib/types/database"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

export type UnitWithOwners = Tables<"units"> & {
  owners: Tables<"unit_owners">[]
}

export default async function UnitsSettingsPage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")
  if (role !== "admin") redirect(`/app/${condominiumSlug}/settings/units/my-unit`)

  const supabase = await createClient()

  // Fetch all units with their owners
  const { data: units } = await supabase
    .from("units")
    .select("*, owners:unit_owners(*)")
    .eq("condominium_id", condominium.id)
    .order("unit_number", { ascending: true })

  // Fetch all condominium members (with profiles) for owner linking
  const { data: memberRows } = await supabase
    .from("condominium_members")
    .select("user_id, profiles(full_name, email)")
    .eq("condominium_id", condominium.id)

  type MemberRow = {
    user_id: string
    profiles: { full_name: string | null; email: string | null } | null
  }

  const members = ((memberRows ?? []) as MemberRow[]).map((m) => ({
    user_id: m.user_id,
    full_name: m.profiles?.full_name ?? null,
    email: m.profiles?.email ?? null,
  }))

  const unitList = (units ?? []) as UnitWithOwners[]

  // Totals
  const totalArea = unitList.reduce((sum, u) => sum + u.area_m2, 0)
  const totalShare = unitList.reduce((sum, u) => sum + (u.ownership_share_pct ?? 0), 0)
  const shareWarning = unitList.length > 0 && Math.abs(totalShare - 100) > 0.1

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Units & Ownership</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage unit register for {condominium.name}
          </p>
        </div>
        <UnitDialog
          condominiumSlug={condominiumSlug}
          totalAreaExcluding={totalArea}
        />
      </div>

      {/* Ownership share warning */}
      {shareWarning && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <strong>Ownership shares do not sum to 100%</strong> — current total is{" "}
          {totalShare.toFixed(4)}%. Use{" "}
          <span className="font-medium">&ldquo;Recalculate Shares&rdquo;</span> to auto-distribute
          based on area.
        </div>
      )}

      {/* Empty state */}
      {unitList.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No units registered yet.</p>
          <p className="text-sm mt-1">Click &ldquo;Add Unit&rdquo; to get started.</p>
        </div>
      )}

      {/* Units table */}
      {unitList.length > 0 && (
        <UnitsTable
          condominiumSlug={condominiumSlug}
          units={unitList}
          members={members}
          totalArea={totalArea}
          totalShare={totalShare}
        />
      )}
    </div>
  )
}
