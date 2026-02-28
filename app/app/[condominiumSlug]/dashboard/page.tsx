import {
  BarChart3,
  Briefcase,
  Building2,
  FileText,
  Lightbulb,
  Megaphone,
  Vote,
  Wrench,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { NavCard } from "@/components/dashboard/nav-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { notFound } from "next/navigation"

interface DashboardPageProps {
  params: Promise<{ condominiumSlug: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { condominiumSlug } = await params

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const base = `/app/${condominiumSlug}`
  const currentYear = new Date().getFullYear()

  const navCards = [
    {
      href: `${base}/budget/${currentYear}`,
      icon: BarChart3,
      title: "Yearly Budget Plan",
      description: "View and manage the annual budget",
    },
    {
      href: `${base}/projects`,
      icon: Briefcase,
      title: "Projects",
      description: "Track ongoing and completed projects",
    },
    {
      href: `${base}/administration`,
      icon: Building2,
      title: "Administration",
      description: "Members, titles, and units",
    },
    {
      href: `${base}/documents`,
      icon: FileText,
      title: "Documents",
      description: "Shared files and document folders",
    },
    {
      href: `${base}/initiatives`,
      icon: Lightbulb,
      title: "Initiatives",
      description: "Submit and review resident initiatives",
    },
    {
      href: `${base}/ballots`,
      icon: Vote,
      title: "Ballots & Voting",
      description: "Active and past voting sessions",
    },
    {
      href: `${base}/maintenance`,
      icon: Wrench,
      title: "Maintenance Requests",
      description: "Report and track maintenance issues",
    },
    {
      href: `${base}/announcements`,
      icon: Megaphone,
      title: "Announcements",
      description: "Latest news and notices",
    },
  ]

  const supabase = await createClient()

  // Fetch recent activity in parallel
  const [announcementsResult, ballotsResult, initiativesResult] =
    await Promise.all([
      supabase
        .from("announcements")
        .select("id, title, published_at")
        .eq("condominium_id", condominium.id)
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(3),
      supabase
        .from("ballots")
        .select("id, title, close_at")
        .eq("condominium_id", condominium.id)
        .eq("status", "open")
        .order("close_at", { ascending: true })
        .limit(3),
      supabase
        .from("initiatives")
        .select("id, title, created_at")
        .eq("condominium_id", condominium.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(3),
    ])

  type ActivityItem = {
    id: string
    type: "announcement" | "ballot" | "initiative"
    title: string
    meta: string
    href: string
  }

  const activityItems: ActivityItem[] = []

  for (const row of announcementsResult.data ?? []) {
    activityItems.push({
      id: `announcement-${row.id}`,
      type: "announcement",
      title: row.title,
      meta: formatDate(row.published_at!),
      href: `${base}/announcements/${row.id}`,
    })
  }

  for (const row of ballotsResult.data ?? []) {
    activityItems.push({
      id: `ballot-${row.id}`,
      type: "ballot",
      title: row.title,
      meta: `Closes ${formatDate(row.close_at)}`,
      href: `${base}/ballots/${row.id}`,
    })
  }

  for (const row of initiativesResult.data ?? []) {
    activityItems.push({
      id: `initiative-${row.id}`,
      type: "initiative",
      title: row.title,
      meta: formatDate(row.created_at),
      href: `${base}/initiatives/${row.id}`,
    })
  }

  // Sort by most relevant: open ballots first, then by recency
  activityItems.sort((a, b) => {
    if (a.type === "ballot" && b.type !== "ballot") return -1
    if (b.type === "ballot" && a.type !== "ballot") return 1
    return 0
  })

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        {condominium.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={condominium.logo_url}
            alt={condominium.name}
            className="h-14 w-14 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shrink-0">
            {condominium.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{condominium.name}</h1>
          {condominium.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {condominium.description}
            </p>
          )}
          {condominium.address && !condominium.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {condominium.address}
            </p>
          )}
        </div>
      </div>

      {/* Navigation card grid */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Sections
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {navCards.map((card) => (
            <NavCard key={card.href} {...card} />
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Recent Activity
        </h2>
        <ActivityFeed items={activityItems} condominiumSlug={condominiumSlug} />
      </section>
    </div>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
