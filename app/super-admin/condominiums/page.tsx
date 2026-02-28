import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CondominiumRowActions } from "./condominium-row-actions"
import type { Tables } from "@/lib/types/database"

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

type CondominiumRow = Tables<"condominiums"> & {
  member_count: number
  admin_count: number
}

export default async function CondominiumsPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("condominiums")
    .select("*, condominium_members(id, system_role)")
    .order("created_at", { ascending: false })

  if (q) {
    query = query.ilike("name", `%${q}%`)
  }

  const { data: rows, error } = await query
  if (error) throw new Error(error.message)

  const condominiums: CondominiumRow[] = (rows ?? []).map((c) => {
    const members = (c.condominium_members as { id: string; system_role: string }[] | null) ?? []
    return {
      ...(c as unknown as Tables<"condominiums">),
      member_count: members.length,
      admin_count: members.filter((m) => m.system_role === "admin").length,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Condominiums</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all condominium workspaces on the platform
          </p>
        </div>
        <Button asChild>
          <Link href="/super-admin/condominiums/new">Create Condominium</Link>
        </Button>
      </div>

      {/* Search */}
      <form className="flex gap-2 max-w-sm">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by name…"
          className="flex-1"
        />
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
        {q && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/super-admin/condominiums">Clear</Link>
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Slug</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Admins</th>
              <th className="text-right px-4 py-3 font-medium">Members</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {condominiums.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {q
                    ? "No condominiums match your search."
                    : "No condominiums yet."}
                </td>
              </tr>
            ) : (
              condominiums.map((condo) => (
                <tr key={condo.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/super-admin/condominiums/${condo.id}`}
                      className="hover:underline"
                    >
                      {condo.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {condo.slug}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        condo.status === "active" ? "default" : "destructive"
                      }
                    >
                      {condo.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {condo.admin_count}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {condo.member_count}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(condo.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <CondominiumRowActions
                      condominiumId={condo.id}
                      condominiumName={condo.name}
                      status={condo.status}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
