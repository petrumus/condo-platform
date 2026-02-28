import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  CalendarDays,
  User,
  DollarSign,
  Tag,
  PencilLine,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/projects/status-badge"
import { ProjectUpdateItem } from "@/components/projects/project-update-item"
import { PostUpdateForm } from "@/components/projects/post-update-form"
import { ChangeStatusForm } from "@/components/projects/change-status-form"
import type { Tables } from "@/lib/types/database"
import type { ProjectStatus } from "../actions"

interface PageProps {
  params: Promise<{ condominiumSlug: string; id: string }>
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatCurrency(amount: number | null) {
  if (amount === null) return null
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { condominiumSlug, id } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const isAdmin = role === "admin"
  const supabase = await createClient()

  const { data: projectData } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("condominium_id", condominium.id)
    .single()

  const project = projectData as Tables<"projects"> | null
  if (!project) notFound()

  // Regular users cannot see proposed projects
  if (!isAdmin && project.status === "proposed") notFound()

  const { data: updates } = await supabase
    .from("project_updates")
    .select("id, body, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false })

  const base = `/app/${condominiumSlug}`

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href={`${base}/projects`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          {project.category && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              {project.category}
            </div>
          )}
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`${base}/projects/${id}/edit`}>
              <PencilLine className="h-4 w-4 mr-1.5" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      {/* Details card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {project.description && (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {project.description}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 pt-1">
            {project.responsible_person && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Responsible</p>
                  <p className="font-medium">{project.responsible_person}</p>
                </div>
              </div>
            )}

            {project.start_date && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(project.start_date)}</p>
                </div>
              </div>
            )}

            {project.end_date && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Expected End</p>
                  <p className="font-medium">{formatDate(project.end_date)}</p>
                </div>
              </div>
            )}

            {project.estimated_cost !== null && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Cost</p>
                  <p className="font-medium">{formatCurrency(project.estimated_cost)}</p>
                </div>
              </div>
            )}

            {project.actual_cost !== null && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Actual Cost</p>
                  <p className="font-medium">{formatCurrency(project.actual_cost)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin: change status */}
      {isAdmin && (
        <ChangeStatusForm
          condominiumSlug={condominiumSlug}
          projectId={id}
          currentStatus={project.status as ProjectStatus}
        />
      )}

      {/* Progress updates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Progress Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Post update form (admin only) */}
          {isAdmin && (
            <>
              <PostUpdateForm
                condominiumSlug={condominiumSlug}
                projectId={id}
              />
              {(updates?.length ?? 0) > 0 && <Separator />}
            </>
          )}

          {/* Updates timeline */}
          {!updates || updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No progress updates yet.
            </p>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <ProjectUpdateItem key={update.id} update={update} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
