import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { BallotForm } from "@/components/ballots/ballot-form"
import type { Tables } from "@/lib/types/database"
import type { BallotFormData, BallotOption, QuestionType } from "../../actions"

interface PageProps {
  params: Promise<{ condominiumSlug: string; id: string }>
}

export default async function EditBallotPage({ params }: PageProps) {
  const { condominiumSlug, id } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")
  if (role !== "admin") redirect(`/app/${condominiumSlug}/ballots/${id}`)

  const supabase = await createClient()

  const { data: ballotData } = await supabase
    .from("ballots")
    .select("*")
    .eq("id", id)
    .eq("condominium_id", condominium.id)
    .single()

  const ballot = ballotData as Tables<"ballots"> | null
  if (!ballot) notFound()

  // Only draft ballots can be edited
  if (ballot.status !== "draft") redirect(`/app/${condominiumSlug}/ballots/${id}`)

  // Fetch approved initiatives for the linked initiative dropdown
  const { data: initiatives } = await supabase
    .from("initiatives")
    .select("id, title")
    .eq("condominium_id", condominium.id)
    .in("status", ["approved", "converted"])
    .order("created_at", { ascending: false })

  const defaultValues: Partial<BallotFormData> = {
    title: ballot.title,
    description: ballot.description ?? "",
    question_type: ballot.question_type as QuestionType,
    options: (ballot.options as unknown as BallotOption[]) ?? [],
    open_at: ballot.open_at.slice(0, 16), // datetime-local format
    close_at: ballot.close_at.slice(0, 16),
    quorum_pct: ballot.quorum_pct,
    linked_initiative_id: ballot.linked_initiative_id,
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`/app/${condominiumSlug}/ballots/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Ballot
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Edit Ballot</h1>
        <p className="text-sm text-muted-foreground mt-1">{condominium.name}</p>
      </div>

      <BallotForm
        condominiumSlug={condominiumSlug}
        ballotId={id}
        defaultValues={defaultValues}
        initiatives={initiatives ?? []}
      />
    </div>
  )
}
