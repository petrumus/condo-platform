import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Button } from "@/components/ui/button"
import { AnnouncementCard } from "@/components/announcements/announcement-card"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

export default async function AnnouncementsPage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const isAdmin = role === "admin"
  const supabase = await createClient()
  const t = await getTranslations("announcements")

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, pinned, published_at")
    .eq("condominium_id", condominium.id)
    .not("published_at", "is", null)
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false })

  const pinned = (announcements ?? []).filter((a) => a.pinned)
  const unpinned = (announcements ?? []).filter((a) => !a.pinned)

  const base = `/app/${condominiumSlug}`

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{condominium.name}</p>
        </div>
        {isAdmin && (
          <Button asChild size="sm">
            <Link href={`${base}/announcements/new`}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t("new")}
            </Link>
          </Button>
        )}
      </div>

      {/* Empty state */}
      {(!announcements || announcements.length === 0) && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">{t("empty")}</p>
          {isAdmin && (
            <p className="text-sm mt-1">
              <Link
                href={`${base}/announcements/new`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {t("publishFirst")}
              </Link>
            </p>
          )}
        </div>
      )}

      {/* Pinned section */}
      {pinned.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("pinned")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                condominiumSlug={condominiumSlug}
              />
            ))}
          </div>
        </section>
      )}

      {/* Unpinned section */}
      {unpinned.length > 0 && (
        <section className="space-y-3">
          {pinned.length > 0 && (
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("allAnnouncements")}
            </h2>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unpinned.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                condominiumSlug={condominiumSlug}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
