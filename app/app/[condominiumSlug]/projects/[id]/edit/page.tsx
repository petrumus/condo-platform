import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { ProjectForm } from "@/components/projects/project-form"
import type { Tables } from "@/lib/types/database"
import type { ProjectFormData, ProjectStatus } from "../../actions"

interface PageProps {
  params: Promise<{ condominiumSlug: string; id: string }>
}

export default async function EditProjectPage({ params }: PageProps) {
  const { condominiumSlug, id } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") redirect(`/app/${condominiumSlug}/projects/${id}`)

  const supabase = await createClient()

  const { data: projectData } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("condominium_id", condominium.id)
    .single()

  const project = projectData as Tables<"projects"> | null
  if (!project) notFound()

  const initialData: Partial<ProjectFormData> = {
    title: project.title,
    description: project.description ?? "",
    category: project.category ?? "",
    status: project.status as ProjectStatus,
    estimated_cost: project.estimated_cost?.toString() ?? "",
    actual_cost: project.actual_cost?.toString() ?? "",
    start_date: project.start_date ?? "",
    end_date: project.end_date ?? "",
    responsible_person: project.responsible_person ?? "",
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/app/${condominiumSlug}/projects/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Project
        </Link>
        <h1 className="text-2xl font-bold">Edit Project</h1>
        <p className="text-sm text-muted-foreground mt-1">{project.title}</p>
      </div>

      <ProjectForm
        condominiumSlug={condominiumSlug}
        mode="edit"
        projectId={id}
        initialData={initialData}
      />
    </div>
  )
}
