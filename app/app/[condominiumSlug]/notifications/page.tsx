import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { markAllNotificationsRead } from "./actions"
import { CheckCheck, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Database } from "@/lib/types/database"

type Notification = Database["public"]["Tables"]["notifications"]["Row"]

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const TYPE_LABELS: Record<string, string> = {
  announcement: "Announcement",
  ballot_open: "Ballot",
  ballot_results: "Results",
  initiative_status: "Initiative",
  maintenance_status: "Maintenance",
}

export default async function NotificationsPage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const [user, condominium] = await Promise.all([getUser(), getCondominium(condominiumSlug)])
  if (!user || !condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const supabase = await createClient()
  const { data: rawNotifications } = await supabase
    .from("notifications")
    .select("id, user_id, condominium_id, type, title, body, read, link_url, created_at")
    .eq("user_id", user.id)
    .eq("condominium_id", condominium.id)
    .order("created_at", { ascending: false })
    .limit(100)

  const notifications = (rawNotifications ?? []) as Notification[]
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <form
            action={async () => {
              "use server"
              await markAllNotificationsRead(condominiumSlug)
            }}
          >
            <Button variant="outline" size="sm" className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No notifications yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            You will be notified about announcements, ballots, initiatives, and maintenance
            updates.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y divide-border overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-4 p-4",
                !n.read && "bg-accent/30"
              )}
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {TYPE_LABELS[n.type] ?? n.type}
                  </Badge>
                  <span className="font-medium text-sm">{n.title}</span>
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
              </div>
              {n.link_url && (
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5" asChild>
                  <Link href={n.link_url}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
