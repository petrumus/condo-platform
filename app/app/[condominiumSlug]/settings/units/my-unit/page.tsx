import { redirect, notFound } from "next/navigation"
import { Building2, Mail, User } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

export default async function MyUnitPage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  // Admins go to the full admin register
  if (role === "admin") {
    redirect(`/app/${condominiumSlug}/settings/units`)
  }

  const supabase = await createClient()

  // Find units where this user is listed as an owner
  const { data: ownerRecords } = await supabase
    .from("unit_owners")
    .select("id, owner_name, owner_email, unit_id, units(*)")
    .eq("user_id", user.id)

  const myUnits = (ownerRecords ?? []).filter((record) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unit = record.units as any
    return unit?.condominium_id === condominium.id
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Unit</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your unit details in {condominium.name}
        </p>
      </div>

      {/* No unit linked */}
      {myUnits.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground space-y-2">
          <Building2 className="mx-auto h-8 w-8 opacity-40" />
          <p className="text-sm font-medium">No unit linked to your account</p>
          <p className="text-xs">
            Contact your condominium administrator to register your unit.
          </p>
        </div>
      )}

      {/* Unit cards */}
      {myUnits.map((record) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unit = record.units as any

        return (
          <Card key={record.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Unit {unit?.unit_number}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {unit?.floor && (
                  <>
                    <dt className="text-muted-foreground">Floor</dt>
                    <dd className="font-medium">{unit.floor}</dd>
                  </>
                )}
                {unit?.building_section && (
                  <>
                    <dt className="text-muted-foreground">Section</dt>
                    <dd className="font-medium">{unit.building_section}</dd>
                  </>
                )}
                {unit?.area_m2 != null && (
                  <>
                    <dt className="text-muted-foreground">Area</dt>
                    <dd className="font-medium">
                      {Number(unit.area_m2).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      m²
                    </dd>
                  </>
                )}
                {unit?.ownership_share_pct != null && (
                  <>
                    <dt className="text-muted-foreground">Ownership Share</dt>
                    <dd className="font-medium">{Number(unit.ownership_share_pct).toFixed(4)}%</dd>
                  </>
                )}
              </dl>

              {/* Owner record details */}
              <div className="mt-4 pt-4 border-t space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Your Ownership Record
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{record.owner_name}</span>
                </div>
                {record.owner_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{record.owner_email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
