import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
  searchParams: Promise<{
    action?: string
    actor_id?: string
    entity_type?: string
    from?: string
    to?: string
    page?: string
  }>
}

const PAGE_SIZE = 50

export default async function AuditLogPage({ params, searchParams }: PageProps) {
  const { condominiumSlug } = await params
  const { action, actor_id, entity_type, from, to, page } = await searchParams

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") redirect(`/app/${condominiumSlug}/dashboard`)

  const supabase = await createClient()

  // Determine pagination offset
  const currentPage = Math.max(1, parseInt(page ?? "1", 10))
  const offset = (currentPage - 1) * PAGE_SIZE

  // Build query
  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .eq("condominium_id", condominium.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (action) query = query.ilike("action", `%${action}%`)
  if (actor_id) query = query.eq("actor_id", actor_id)
  if (entity_type) query = query.eq("entity_type", entity_type)
  if (from) query = query.gte("created_at", from)
  if (to) query = query.lte("created_at", to + "T23:59:59Z")

  const { data: rawLogs, count, error } = await query
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
  }
  const logs = (rawLogs ?? []) as unknown as AuditLogRow[]

  // Fetch actor profiles
  const actorIds = [...new Set(logs.map((l) => l.actor_id).filter(Boolean) as string[])]
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

  // Fetch members for actor filter dropdown
  const { data: members } = await supabase
    .from("condominium_members")
    .select("user_id")
    .eq("condominium_id", condominium.id)

  const memberProfileIds = (members ?? []).map((m) => m.user_id)
  const { data: memberProfiles } = memberProfileIds.length > 0
    ? await supabase.from("profiles").select("id, full_name, email").in("id", memberProfileIds)
    : { data: [] }

  const hasFilters = action || actor_id || entity_type || from || to
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Build pagination query string (preserving filters)
  function buildPageUrl(p: number) {
    const sp = new URLSearchParams()
    if (action) sp.set("action", action)
    if (actor_id) sp.set("actor_id", actor_id)
    if (entity_type) sp.set("entity_type", entity_type)
    if (from) sp.set("from", from)
    if (to) sp.set("to", to)
    sp.set("page", String(p))
    return `?${sp.toString()}`
  }

  const ENTITY_TYPES = [
    "project",
    "ballot",
    "initiative",
    "announcement",
    "document",
    "maintenance_request",
    "budget_plan",
    "condominium_member",
    "invitation",
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Read-only history of all significant actions in this condominium.
        </p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Action</label>
          <Input
            name="action"
            defaultValue={action ?? ""}
            placeholder="e.g. ballot.opened"
            className="h-9 w-44"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Actor</label>
          <select
            name="actor_id"
            defaultValue={actor_id ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All actors</option>
            {memberProfiles?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name ?? p.email ?? p.id}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Entity type</label>
          <select
            name="entity_type"
            defaultValue={entity_type ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All types</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input name="from" type="date" defaultValue={from ?? ""} className="h-9 w-36" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <Input name="to" type="date" defaultValue={to ?? ""} className="h-9 w-36" />
        </div>

        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/app/${condominiumSlug}/settings/audit-log`}>Clear</Link>
          </Button>
        )}
      </form>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {count ?? 0} entries{hasFilters ? " matching filters" : ""}
      </p>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Time</th>
              <th className="text-left px-4 py-3 font-medium">Actor</th>
              <th className="text-left px-4 py-3 font-medium">Action</th>
              <th className="text-left px-4 py-3 font-medium">Entity</th>
              <th className="text-left px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {!logs || logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const actor = log.actor_id ? profileMap[log.actor_id] : null
                const metadata = log.metadata as Record<string, unknown> | null

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
                            <p className="text-xs text-muted-foreground">{actor.email}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">System</span>
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
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                      {metadata ? (
                        <pre className="whitespace-pre-wrap break-all font-mono text-xs opacity-70">
                          {JSON.stringify(metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="opacity-40">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {currentPage > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildPageUrl(currentPage - 1)}>Previous</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildPageUrl(currentPage + 1)}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
