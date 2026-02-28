import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PageProps {
  searchParams: Promise<{
    condo_id?: string
    action?: string
    from?: string
    to?: string
  }>
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const { condo_id, action, from, to } = await searchParams
  const supabase = await createClient()

  // Fetch condominiums for filter dropdown
  const { data: condominiums } = await supabase
    .from("condominiums")
    .select("id, name")
    .order("name")

  // Build audit log query
  let query = supabase
    .from("audit_logs")
    .select("*, condominiums(name, slug)")
    .order("created_at", { ascending: false })
    .limit(200)

  if (condo_id) query = query.eq("condominium_id", condo_id)
  if (action) query = query.ilike("action", `%${action}%`)
  if (from) query = query.gte("created_at", from)
  if (to) query = query.lte("created_at", to + "T23:59:59Z")

  const { data: rawLogs, error } = await query
  if (error) throw new Error(error.message)

  type AuditLogRow = {
    id: string
    condominium_id: string | null
    actor_id: string | null
    action: string
    entity_type: string
    entity_id: string | null
    metadata: unknown
    created_at: string
    condominiums: { name: string; slug: string } | null
  }
  const logs = (rawLogs ?? []) as unknown as AuditLogRow[]

  // Fetch profiles for actor names
  const actorIds = [
    ...new Set(logs.map((l) => l.actor_id).filter(Boolean) as string[]),
  ]
  const profileMap: Record<string, { email: string | null; full_name: string | null }> = {}
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", actorIds)
    profiles?.forEach((p) => {
      profileMap[p.id] = { email: p.email, full_name: p.full_name }
    })
  }

  const hasFilters = condo_id || action || from || to

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform-wide activity across all condominiums
        </p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Condominium
          </label>
          <select
            name="condo_id"
            defaultValue={condo_id ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All condominiums</option>
            {condominiums?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Action
          </label>
          <Input
            name="action"
            defaultValue={action ?? ""}
            placeholder="e.g. suspend"
            className="h-9 w-40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input
            name="from"
            type="date"
            defaultValue={from ?? ""}
            className="h-9 w-36"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <Input
            name="to"
            type="date"
            defaultValue={to ?? ""}
            className="h-9 w-36"
          />
        </div>

        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/super-admin/audit-log">Clear</Link>
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Time</th>
              <th className="text-left px-4 py-3 font-medium">Actor</th>
              <th className="text-left px-4 py-3 font-medium">Action</th>
              <th className="text-left px-4 py-3 font-medium">Entity</th>
              <th className="text-left px-4 py-3 font-medium">Condominium</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {!logs || logs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const actor = log.actor_id ? profileMap[log.actor_id] : null
                const condo = log.condominiums

                return (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {actor ? (
                        <div>
                          <p className="text-xs font-medium">
                            {actor.full_name ?? actor.email ?? "—"}
                          </p>
                          {actor.full_name && (
                            <p className="text-xs text-muted-foreground">
                              {actor.email}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          System
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <span className="font-medium">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="block font-mono opacity-60">
                          {log.entity_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {condo ? (
                        <Link
                          href={`/super-admin/condominiums/${log.condominium_id}`}
                          className="hover:underline"
                        >
                          {condo.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Platform</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
