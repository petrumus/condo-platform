import { GovernanceMemberCard } from "./governance-member-card"
import type { GovernanceMember } from "@/lib/queries/administration"

interface GovernanceGridProps {
  members: GovernanceMember[]
}

export function GovernanceGrid({ members }: GovernanceGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {members.map((member) => (
        <GovernanceMemberCard key={member.memberId} member={member} />
      ))}
    </div>
  )
}
