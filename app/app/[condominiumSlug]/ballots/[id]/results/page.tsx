import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, CheckCircle2, AlertCircle, Users, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { BallotStatusBadge } from "@/components/ballots/ballot-status-badge"
import { ExportCsvButton } from "@/components/ballots/export-csv-button"
import type { Tables } from "@/lib/types/database"
import type { BallotOption } from "../../actions"

interface PageProps {
  params: Promise<{ condominiumSlug: string; id: string }>
}

export default async function BallotResultsPage({ params }: PageProps) {
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

  // Results page only accessible after results_published, or admin can see at any closed state
  if (!isAdmin && ballot.status !== "results_published") notFound()
  if (isAdmin && !["closed", "results_published"].includes(ballot.status)) notFound()

  // Fetch all votes
  const { data: allVotes } = await supabase
    .from("votes")
    .select("selected_options, voted_at")
    .eq("ballot_id", id)

  const totalVotes = allVotes?.length ?? 0

  // Count total eligible voters (all members at this point in time)
  const { count: totalEligible } = await supabase
    .from("condominium_members")
    .select("id", { count: "exact", head: true })
    .eq("condominium_id", condominium.id)

  const eligible = totalEligible ?? 0

  // Build tally
  const tally: Record<string, number> = {}
  for (const vote of allVotes ?? []) {
    const opts = Array.isArray(vote.selected_options)
      ? (vote.selected_options as string[])
      : []
    for (const opt of opts) {
      tally[opt] = (tally[opt] ?? 0) + 1
    }
  }

  const options = ballot.options as unknown as BallotOption[]
  const displayOptions =
    ballot.question_type === "yes_no"
      ? [
          { id: "yes", label: "Yes" },
          { id: "no", label: "No" },
        ]
      : options

  const quorumMet =
    ballot.quorum_pct != null && eligible > 0
      ? totalVotes / eligible >= ballot.quorum_pct / 100
      : null

  const participationPct = eligible > 0 ? ((totalVotes / eligible) * 100).toFixed(1) : "0"
  const base = `/app/${condominiumSlug}`

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href={`${base}/ballots/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Ballot
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{ballot.title}</h1>
            <BallotStatusBadge status={ballot.status} />
          </div>
          <p className="text-sm text-muted-foreground">Results</p>
        </div>
        {isAdmin && (
          <ExportCsvButton condominiumSlug={condominiumSlug} ballotId={id} ballotTitle={ballot.title} />
        )}
      </div>

      {/* Quorum notice */}
      {quorumMet === false && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Ballot invalid — quorum not reached</p>
                <p className="text-xs mt-0.5">
                  Required {ballot.quorum_pct}% participation, but only {participationPct}% voted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {quorumMet === true && (
        <Card className="border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold">Quorum met — ballot is valid</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participation summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Votes cast</span>
            <span className="font-semibold">{totalVotes}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Eligible voters</span>
            <span className="font-semibold">{eligible}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Participation rate</span>
            <span className="font-semibold">{participationPct}%</span>
          </div>
          {ballot.quorum_pct != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quorum required</span>
              <span className="font-semibold">{ballot.quorum_pct}%</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vote counts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Results Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalVotes === 0 ? (
            <p className="text-sm text-muted-foreground italic">No votes were cast.</p>
          ) : (
            displayOptions.map((option) => {
              const count = tally[option.id] ?? 0
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              return (
                <div key={option.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-muted-foreground">
                      {count} vote{count !== 1 ? "s" : ""} — {pct}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
