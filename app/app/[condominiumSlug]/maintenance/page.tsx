import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Button } from "@/components/ui/button"
import { MaintenanceRequestCard } from "@/components/maintenance/maintenance-request-card"
import type { Tables } from "@/lib/types/database"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
  searchParams: Promise<{ status?: string; category?: string; priority?: string }>
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
]

export default async function MaintenancePage({ params, searchParams }: PageProps) {
  const { condominiumSlug } = await params
  const { status: statusFilter = "all" } = await searchParams

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const isAdmin = role === "admin"
  const supabase = await createClient()

  let query = supabase
    .from("maintenance_requests")
    .select("id, title, category, location, priority, status, created_at")
    .eq("condominium_id", condominium.id)
    .order("created_at", { ascending: false })

  // Non-admins only see their own requests
  if (!isAdmin) {
    query = query.eq("submitter_id", user.id)
  }

  // Status filter
  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter as "open" | "in_review" | "in_progress" | "resolved" | "closed")
  }

  const { data: requests } = await query

  const base = `/app/${condominiumSlug}`

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? condominium.name : "Your submitted requests"}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={`${base}/maintenance/new`}>
            <Plus className="h-4 w-4 mr-1.5" />
            Submit Request
          </Link>
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value || (!statusFilter && tab.value === "all")
          const href =
            tab.value === "all"
              ? `${base}/maintenance`
              : `${base}/maintenance?status=${tab.value}`
          return (
            <Link
              key={tab.value}
              href={href}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Empty state */}
      {(!requests || requests.length === 0) && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">
            {statusFilter !== "all"
              ? `No ${statusFilter.replace("_", " ")} requests.`
              : "No maintenance requests yet."}
          </p>
          <p className="text-sm mt-1">
            <Link
              href={`${base}/maintenance/new`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Submit the first one
            </Link>
          </p>
        </div>
      )}

      {/* Request grid */}
      {requests && requests.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(requests as Pick<Tables<"maintenance_requests">, "id" | "title" | "category" | "location" | "priority" | "status" | "created_at">[]).map((req) => (
            <MaintenanceRequestCard
              key={req.id}
              request={req}
              condominiumSlug={condominiumSlug}
            />
          ))}
        </div>
      )}
    </div>
  )
}
