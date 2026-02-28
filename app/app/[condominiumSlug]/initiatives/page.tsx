import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Plus, ClipboardList } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Button } from "@/components/ui/button"
import { InitiativeCard } from "@/components/initiatives/initiative-card"
import type { InitiativeStatus } from "./actions"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
  searchParams: Promise<{ status?: string }>
}

const ADMIN_TABS: { value: InitiativeStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "converted", label: "Converted" },
]

const USER_VISIBLE_STATUSES: InitiativeStatus[] = ["approved", "converted"]

export default async function InitiativesPage({ params, searchParams }: PageProps) {
  const { condominiumSlug } = await params
  const { status: statusFilter } = await searchParams

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const isAdmin = role === "admin"
  const supabase = await createClient()

  const activeFilter = statusFilter as InitiativeStatus | "all" | undefined

  let query = supabase
    .from("initiatives")
    .select(`
      id,
      title,
      category,
      status,
      created_at,
      submitter_id
    `)
    .eq("condominium_id", condominium.id)
    .order("created_at", { ascending: false })

  if (isAdmin) {
    // Admins: filter by selected tab if any
    if (activeFilter && activeFilter !== "all") {
      query = query.eq("status", activeFilter)
    }
  } else {
    // Regular users: only see approved + converted + their own
    query = query.or(
      `status.in.(approved,converted),submitter_id.eq.${user.id}`
    )
    if (activeFilter && activeFilter !== "all" && USER_VISIBLE_STATUSES.includes(activeFilter as InitiativeStatus)) {
      query = query.eq("status", activeFilter)
    }
  }

  const { data: initiatives } = await query

  const base = `/app/${condominiumSlug}`
  const currentFilter = activeFilter ?? "all"

  const tabs = isAdmin
    ? ADMIN_TABS
    : [
        { value: "all" as const, label: "All" },
        ...ADMIN_TABS.filter((t) =>
          USER_VISIBLE_STATUSES.includes(t.value as InitiativeStatus)
        ),
      ]

  // Fetch submitter profile names for admin view
  let submitterNames: Record<string, string> = {}
  if (isAdmin && initiatives && initiatives.length > 0) {
    const submitterIds = [...new Set(initiatives.map((i) => i.submitter_id))]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", submitterIds)

    if (profiles) {
      submitterNames = Object.fromEntries(profiles.map((p) => [p.id, p.full_name ?? ""]))
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Initiatives</h1>
          <p className="text-sm text-muted-foreground mt-1">{condominium.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button asChild variant="outline" size="sm">
              <Link href={`${base}/initiatives/review`}>
                <ClipboardList className="h-4 w-4 mr-1.5" />
                Review Queue
              </Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link href={`${base}/initiatives/new`}>
              <Plus className="h-4 w-4 mr-1.5" />
              Submit Initiative
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap border-b pb-0">
        {tabs.map((tab) => {
          const active = currentFilter === tab.value
          return (
            <Link
              key={tab.value}
              href={`${base}/initiatives${tab.value === "all" ? "" : `?status=${tab.value}`}`}
              className={`px-3 py-2 text-sm font-medium rounded-t transition-colors ${
                active
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Initiatives grid */}
      {!initiatives || initiatives.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No initiatives found.</p>
          <p className="text-sm mt-1">
            <Link
              href={`${base}/initiatives/new`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Be the first to submit one
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initiatives.map((initiative) => (
            <InitiativeCard
              key={initiative.id}
              initiative={{
                ...initiative,
                submitter_name: submitterNames[initiative.submitter_id] ?? null,
              }}
              condominiumSlug={condominiumSlug}
            />
          ))}
        </div>
      )}
    </div>
  )
}
