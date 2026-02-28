import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { BudgetEditor } from "@/components/budget/budget-editor"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBudgetPlan } from "../../actions"

interface PageProps {
  params: Promise<{ condominiumSlug: string; year: string }>
}

export default async function BudgetEditPage({ params }: PageProps) {
  const { condominiumSlug, year: yearStr } = await params
  const year = parseInt(yearStr, 10)
  if (isNaN(year)) notFound()

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") redirect(`/app/${condominiumSlug}/budget/${year}`)

  const supabase = await createClient()

  const { data: plan } = await supabase
    .from("budget_plans")
    .select("id, year, status, published_at")
    .eq("condominium_id", condominium.id)
    .eq("year", year)
    .maybeSingle()

  const viewHref = `/app/${condominiumSlug}/budget/${year}`

  // If no plan exists yet, show a "Create" screen
  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={viewHref}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create {year} Budget</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {condominium.name}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground text-sm text-center">
              No budget plan exists for {year} yet.
            </p>
            <form
              action={async () => {
                "use server"
                const { id } = await createBudgetPlan(condominiumSlug, year)
                // Redirect handled by the create action; add redirect here
                redirect(`/app/${condominiumSlug}/budget/${year}/edit`)
              }}
            >
              <Button type="submit">Create {year} Budget Draft</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If already published, show read-only notice
  if (plan.status === "published") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={viewHref}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{year} Budget</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {condominium.name}
            </p>
          </div>
          <Badge className="ml-2">Published</Badge>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              This budget has been published and is now read-only.
            </p>
            <Button variant="outline" asChild>
              <Link href={viewHref}>View Published Budget</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Draft — fetch line items and show editor
  const { data: lineItems } = await supabase
    .from("budget_line_items")
    .select("id, category, amount, notes, sort_order")
    .eq("budget_plan_id", plan.id)
    .order("sort_order", { ascending: true })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={viewHref}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Edit {year} Budget</h1>
            <Badge variant="secondary">Draft</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {condominium.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetEditor
            condominiumSlug={condominiumSlug}
            planId={plan.id}
            year={year}
            initialItems={lineItems ?? []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
