import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Button } from "@/components/ui/button"
import { ProjectCard } from "@/components/projects/project-card"
import type { ProjectStatus } from "./actions"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
  searchParams: Promise<{ status?: string }>
}

const STATUS_TABS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "proposed", label: "Proposed" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
]

const USER_VISIBLE_STATUSES: ProjectStatus[] = [
  "approved",
  "in_progress",
  "completed",
  "archived",
]

export default async function ProjectsPage({ params, searchParams }: PageProps) {
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

  // Admins see all statuses; regular users only see approved+
  const visibleStatuses = isAdmin
    ? STATUS_TABS.map((t) => t.value).filter((v) => v !== "all")
    : USER_VISIBLE_STATUSES

  let query = supabase
    .from("projects")
    .select("id, title, category, status, start_date, responsible_person")
    .eq("condominium_id", condominium.id)
    .order("created_at", { ascending: false })

  // Apply status filter
  const activeFilter = statusFilter as ProjectStatus | "all" | undefined
  if (activeFilter && activeFilter !== "all" && visibleStatuses.includes(activeFilter as ProjectStatus)) {
    query = query.eq("status", activeFilter)
  } else if (!isAdmin) {
    query = query.in("status", USER_VISIBLE_STATUSES)
  }

  const { data: projects } = await query

  const base = `/app/${condominiumSlug}`
  const currentFilter = activeFilter ?? "all"

  // Only show tabs relevant to the user's role
  const tabs = isAdmin
    ? STATUS_TABS
    : STATUS_TABS.filter(
        (t) => t.value === "all" || USER_VISIBLE_STATUSES.includes(t.value as ProjectStatus)
      )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{condominium.name}</p>
        </div>
        {isAdmin && (
          <Button asChild size="sm">
            <Link href={`${base}/projects/new`}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Project
            </Link>
          </Button>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap border-b pb-0">
        {tabs.map((tab) => {
          const active = currentFilter === tab.value
          return (
            <Link
              key={tab.value}
              href={`${base}/projects${tab.value === "all" ? "" : `?status=${tab.value}`}`}
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

      {/* Project grid */}
      {!projects || projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No projects found.</p>
          {isAdmin && (
            <p className="text-sm mt-1">
              <Link
                href={`${base}/projects/new`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                Create the first project
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              condominiumSlug={condominiumSlug}
            />
          ))}
        </div>
      )}
    </div>
  )
}
