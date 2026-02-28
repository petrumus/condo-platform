import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Plus, Vote } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Button } from "@/components/ui/button"
import { BallotCard } from "@/components/ballots/ballot-card"
import type { BallotStatus } from "./actions"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
  searchParams: Promise<{ tab?: string }>
}

type TabValue = "open" | "upcoming" | "closed" | "draft"

const USER_TABS: { value: TabValue | "all"; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "upcoming", label: "Upcoming" },
  { value: "closed", label: "Closed" },
]

const ADMIN_TABS: { value: TabValue | "all"; label: string }[] = [
  ...USER_TABS,
  { value: "draft", label: "Drafts" },
]

export default async function BallotsPage({ params, searchParams }: PageProps) {
  const { condominiumSlug } = await params
  const { tab } = await searchParams

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const isAdmin = role === "admin"
  const supabase = await createClient()

  const now = new Date().toISOString()
  const activeTab = (tab as TabValue) || "open"

  // Build query based on active tab
  let query = supabase
    .from("ballots")
    .select("id, title, question_type, status, open_at, close_at")
    .eq("condominium_id", condominium.id)
    .order("open_at", { ascending: false })

  if (activeTab === "open") {
    query = query.eq("status", "open")
  } else if (activeTab === "upcoming") {
    // Draft ballots with future open_at that are not yet open, visible only if admin
    // For users: future open_at ballots that are 'open' status but open_at in future don't really exist
    // Treat upcoming as: open_at > now and status = open (scheduled but time not reached)
    // Actually, upcoming means open_at is in the future — so status draft with future dates (admin) or open with future dates
    if (isAdmin) {
      query = query
        .neq("status", "closed")
        .neq("status", "results_published")
        .gt("open_at", now)
    } else {
      query = query.eq("status", "open").gt("open_at", now)
    }
  } else if (activeTab === "closed") {
    query = query.in("status", ["closed", "results_published"])
  } else if (activeTab === "draft" && isAdmin) {
    query = query.eq("status", "draft")
  }

  const { data: ballots } = await query

  // Fetch user's votes to determine "has voted" for each ballot
  const ballotIds = ballots?.map((b) => b.id) ?? []
  let votedBallotIds = new Set<string>()
  if (ballotIds.length > 0) {
    const { data: myVotes } = await supabase
      .from("votes")
      .select("ballot_id")
      .eq("voter_id", user.id)
      .in("ballot_id", ballotIds)

    if (myVotes) {
      votedBallotIds = new Set(myVotes.map((v) => v.ballot_id))
    }
  }

  const tabs = isAdmin ? ADMIN_TABS : USER_TABS
  const base = `/app/${condominiumSlug}`

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Ballots & Voting</h1>
          <p className="text-sm text-muted-foreground mt-1">{condominium.name}</p>
        </div>
        {isAdmin && (
          <Button asChild size="sm">
            <Link href={`${base}/ballots/new`}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create Ballot
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b pb-0">
        {tabs.map((t) => {
          const active = activeTab === t.value
          return (
            <Link
              key={t.value}
              href={`${base}/ballots?tab=${t.value}`}
              className={`px-3 py-2 text-sm font-medium rounded-t transition-colors ${
                active
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      {/* Ballot grid */}
      {!ballots || ballots.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Vote className="mx-auto h-8 w-8 mb-3 opacity-40" />
          <p className="text-sm">No ballots found.</p>
          {isAdmin && activeTab !== "draft" && (
            <p className="text-sm mt-1">
              <Link
                href={`${base}/ballots/new`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                Create the first ballot
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ballots.map((ballot) => (
            <BallotCard
              key={ballot.id}
              ballot={ballot}
              condominiumSlug={condominiumSlug}
              hasVoted={votedBallotIds.has(ballot.id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  )
}
