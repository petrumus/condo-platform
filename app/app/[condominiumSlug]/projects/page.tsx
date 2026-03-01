import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { getTranslations } from "next-intl/server"
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

const STATUS_VALUES: (ProjectStatus | "all")[] = [
  "all",
  "proposed",
  "approved",
  "in_progress",
  "completed",
  "archived",
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
  const t = await getTranslations("projects")

  const STATUS_TABS: { value: ProjectStatus | "all"; label: string }[] = [
    { value: "all",         label: t("tabs.all") },
    { value: "proposed",    label: t("tabs.proposed") },
    { value: "approved",    label: t("tabs.approved") },
    { value: "in_progress", label: t("tabs.in_progress") },
    { value: "completed",   label: t("tabs.completed") },
    { value: "archived",    label: t("tabs.archived") },
  ]

  // Admins see all statuses; regular users only see approved+
  const visibleStatuses = isAdmin
    ? STATUS_VALUES.filter((v) => v !== "all")
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
        (tab) => tab.value === "all" || USER_VISIBLE_STATUSES.includes(tab.value as ProjectStatus)
      )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{condominium.name}</p>
        </div>
        {isAdmin && (
          <Button asChild size="sm">
            <Link href={`${base}/projects/new`}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t("new")}
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
          <p className="text-sm">{t("empty")}</p>
          {isAdmin && (
            <p className="text-sm mt-1">
              <Link
                href={`${base}/projects/new`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {t("createFirst")}
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
