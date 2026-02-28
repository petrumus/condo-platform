import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnnouncementForm } from "@/components/announcements/announcement-form"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

export default async function NewAnnouncementPage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")
  if (role !== "admin") redirect(`/app/${condominiumSlug}/announcements`)

  const base = `/app/${condominiumSlug}`

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`${base}/announcements`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Announcements
      </Link>

      <div>
        <h1 className="text-2xl font-bold">New Announcement</h1>
        <p className="text-sm text-muted-foreground mt-1">{condominium.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Announcement Details</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm condominiumSlug={condominiumSlug} />
        </CardContent>
      </Card>
    </div>
  )
}
