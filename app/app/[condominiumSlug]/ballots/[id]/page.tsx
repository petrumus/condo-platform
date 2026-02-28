import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  CalendarDays,
  Users,
  ExternalLink,
  CheckCircle2,
  Lock,
  AlertCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { BallotStatusBadge } from "@/components/ballots/ballot-status-badge"
import { VoteForm } from "@/components/ballots/vote-form"
import { BallotAdminActions } from "@/components/ballots/ballot-admin-actions"
import type { Tables } from "@/lib/types/database"
import type { BallotOption, QuestionType } from "../actions"

interface PageProps {
  params: Promise<{ condominiumSlug: string; id: string }>
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  yes_no: "Yes / No",
  single_choice: "Single Choice",
  multi_choice: "Multiple Choice",
}

export default async function BallotDetailPage({ params }: PageProps) {
  const { condominiumSlug, id } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const isAdmin = role === "admin"
  const supabase = await createClient()

  const { data: ballotData } = await supabase
    .from("ballots")
    .select("*")
    .eq("id", id)
    .eq("condominium_id", condominium.id)
    .single()

  const ballot = ballotData as Tables<"ballots"> | null
  if (!ballot) notFound()

  // Non-admins cannot see drafts
  if (!isAdmin && ballot.status === "draft") notFound()

  // Check if user has voted
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id, selected_options")
    .eq("ballot_id", id)
    .eq("voter_id", user.id)
    .single()

  const hasVoted = Boolean(existingVote)

  // Fetch linked initiative title if applicable
  let linkedInitiativeTitle: string | null = null
  if (ballot.linked_initiative_id) {
    const { data: initiative } = await supabase
      .from("initiatives")
      .select("title")
      .eq("id", ballot.linked_initiative_id)
      .single()
    linkedInitiativeTitle = initiative?.title ?? null
  }

  // Admin sees vote tally
  let voteTally: Record<string, number> | null = null
  let totalVotes = 0
  let totalEligible = 0
  if (isAdmin) {
    const { data: allVotes } = await supabase
      .from("votes")
      .select("selected_options")
      .eq("ballot_id", id)

    if (allVotes) {
      totalVotes = allVotes.length
      const tally: Record<string, number> = {}
      for (const vote of allVotes) {
        const opts = Array.isArray(vote.selected_options)
          ? (vote.selected_options as string[])
          : []
        for (const opt of opts) {
          tally[opt] = (tally[opt] ?? 0) + 1
        }
      }
      voteTally = tally
    }

    const { count } = await supabase
      .from("condominium_members")
      .select("id", { count: "exact", head: true })
      .eq("condominium_id", condominium.id)

    totalEligible = count ?? 0
  }

  const options = ballot.options as unknown as BallotOption[]
  const questionType = ballot.question_type as QuestionType
  const displayOptions =
    questionType === "yes_no"
      ? [
          { id: "yes", label: "Yes" },
          { id: "no", label: "No" },
        ]
      : options

  const isOpen = ballot.status === "open"
  const isClosed = ballot.status === "closed" || ballot.status === "results_published"
  const base = `/app/${condominiumSlug}`

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href={`${base}/ballots`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Ballots
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold">{ballot.title}</h1>
          <BallotStatusBadge status={ballot.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {QUESTION_TYPE_LABELS[ballot.question_type]}
        </p>
      </div>

      {/* Details card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {ballot.description ? (
            <p className="text-muted-foreground whitespace-pre-wrap">{ballot.description}</p>
          ) : (
            <p className="text-muted-foreground italic">No description provided.</p>
          )}
          <Separator />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Opens</p>
                <p className="font-medium">{formatDateTime(ballot.open_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Closes</p>
                <p className="font-medium">{formatDateTime(ballot.close_at)}</p>
              </div>
            </div>
            {ballot.quorum_pct != null && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Quorum Required</p>
                  <p className="font-medium">{ballot.quorum_pct}%</p>
                </div>
              </div>
            )}
            {linkedInitiativeTitle && ballot.linked_initiative_id && (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Linked Initiative</p>
                  <Link
                    href={`${base}/initiatives/${ballot.linked_initiative_id}`}
                    className="font-medium underline underline-offset-4 hover:text-muted-foreground"
                  >
                    {linkedInitiativeTitle}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voting area */}
      {isOpen && !hasVoted && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cast Your Vote</CardTitle>
          </CardHeader>
          <CardContent>
            <VoteForm
              condominiumSlug={condominiumSlug}
              ballotId={id}
              questionType={questionType}
              options={options}
            />
          </CardContent>
        </Card>
      )}

      {isOpen && hasVoted && (
        <Card className="border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">You have already voted</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your vote has been recorded. You cannot change it.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isClosed && ballot.status !== "results_published" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5 shrink-0" />
              <p className="text-sm">Voting has closed. Results will be published soon.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {ballot.status === "results_published" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <p className="text-sm">Results have been published.</p>
              </div>
              <Link
                href={`${base}/ballots/${id}/results`}
                className="text-sm underline underline-offset-4 hover:text-muted-foreground shrink-0"
              >
                View Results
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin tally (visible before results are published) */}
      {isAdmin && voteTally !== null && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Admin: Vote Tally</span>
              <span className="text-sm font-normal text-muted-foreground">
                {totalVotes} / {totalEligible} votes cast
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayOptions.map((option) => {
              const count = voteTally![option.id] ?? 0
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              return (
                <div key={option.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{option.label}</span>
                    <span className="text-muted-foreground">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {ballot.quorum_pct != null && totalEligible > 0 && (
              <div className="pt-2">
                {totalVotes / totalEligible >= ballot.quorum_pct / 100 ? (
                  <div className="flex items-center gap-1.5 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Quorum met ({((totalVotes / totalEligible) * 100).toFixed(1)}% ≥ {ballot.quorum_pct}%)
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Quorum not met ({((totalVotes / totalEligible) * 100).toFixed(1)}% &lt; {ballot.quorum_pct}%)
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <BallotAdminActions
              condominiumSlug={condominiumSlug}
              ballotId={id}
              currentStatus={ballot.status}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
