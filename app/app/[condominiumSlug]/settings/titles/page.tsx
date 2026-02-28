import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TitleList } from "./title-list"
import { CreateTitleForm } from "./create-title-form"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

export default async function TitlesPage({ params }: PageProps) {
  const { condominiumSlug } = await params

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") redirect(`/app/${condominiumSlug}/dashboard`)

  const supabase = await createClient()

  const { data: rawTitles } = await supabase
    .from("functional_titles")
    .select("id, name, sort_order, condominium_id")
    .eq("condominium_id", condominium.id)
    .order("sort_order", { ascending: true })

  const titles = rawTitles ?? []

  const nextSortOrder = titles.length > 0
    ? Math.max(...titles.map((t) => t.sort_order)) + 1
    : 1

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Functional Titles</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Governance labels assigned to members. These are display-only and do not affect permissions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Titles</CardTitle>
          <CardDescription>
            Built-in titles cannot be renamed or deleted. Custom titles can be fully managed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TitleList
            condominiumSlug={condominiumSlug}
            titles={titles}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Custom Title</CardTitle>
          <CardDescription>Create a new functional title for this condominium.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTitleForm
            condominiumSlug={condominiumSlug}
            nextSortOrder={nextSortOrder}
          />
        </CardContent>
      </Card>
    </div>
  )
}
