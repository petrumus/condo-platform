import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { BallotForm } from "@/components/ballots/ballot-form"
import type { BallotFormData } from "../actions"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
  searchParams: Promise<{
    title?: string
    description?: string
    from_initiative?: string
  }>
}

export default async function NewBallotPage({ params, searchParams }: PageProps) {
  const { condominiumSlug } = await params
  const { title, description, from_initiative } = await searchParams

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")
  if (role !== "admin") redirect(`/app/${condominiumSlug}/ballots`)

  const supabase = await createClient()

  // Fetch approved initiatives for the linked initiative dropdown
  const { data: initiatives } = await supabase
    .from("initiatives")
    .select("id, title")
    .eq("condominium_id", condominium.id)
    .in("status", ["approved", "converted"])
    .order("created_at", { ascending: false })

  const defaultValues: Partial<BallotFormData> = {
    title: title ?? "",
    description: description ?? "",
    linked_initiative_id: from_initiative ?? null,
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`/app/${condominiumSlug}/ballots`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Ballots
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Create Ballot</h1>
        <p className="text-sm text-muted-foreground mt-1">{condominium.name}</p>
      </div>

      <BallotForm
        condominiumSlug={condominiumSlug}
        defaultValues={defaultValues}
        initiatives={initiatives ?? []}
      />
    </div>
  )
}
