import Link from "next/link"
import { CalendarDays, Vote, CheckCircle2, Clock } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { BallotStatusBadge } from "./ballot-status-badge"

interface BallotCardProps {
  ballot: {
    id: string
    title: string
    question_type: string
    status: string
    open_at: string
    close_at: string
  }
  condominiumSlug: string
  hasVoted: boolean
  isAdmin: boolean
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  yes_no: "Yes / No",
  single_choice: "Single Choice",
  multi_choice: "Multiple Choice",
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function BallotCard({ ballot, condominiumSlug, hasVoted, isAdmin }: BallotCardProps) {
  const isOpen = ballot.status === "open"
  const isClosed = ballot.status === "closed" || ballot.status === "results_published"

  let votingIndicator: React.ReactNode = null
  if (isOpen) {
    if (hasVoted) {
      votingIndicator = (
        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
          <CheckCircle2 className="h-3 w-3" />
          You voted
        </div>
      )
    } else {
      votingIndicator = (
        <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
          <Vote className="h-3 w-3" />
          Vote now
        </div>
      )
    }
  } else if (isClosed) {
    votingIndicator = (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        Voting closed
      </div>
    )
  }

  return (
    <Link href={`/app/${condominiumSlug}/ballots/${ballot.id}`} className="block group">
      <Card className="h-full transition-colors group-hover:border-foreground/30">
        <CardHeader className="pb-2 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug group-hover:underline underline-offset-4">
              {ballot.title}
            </h3>
            <BallotStatusBadge status={ballot.status} />
          </div>
          {votingIndicator}
        </CardHeader>
        <CardContent className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Vote className="h-3 w-3 shrink-0" />
            {QUESTION_TYPE_LABELS[ballot.question_type] ?? ballot.question_type}
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 shrink-0" />
            {formatDate(ballot.open_at)} → {formatDate(ballot.close_at)}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
