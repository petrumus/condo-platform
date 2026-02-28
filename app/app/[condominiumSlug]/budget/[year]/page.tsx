import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { PencilLine, CalendarDays } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { BudgetTable } from "@/components/budget/budget-table"
import { YearSelector } from "@/components/budget/year-selector"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PageProps {
  params: Promise<{ condominiumSlug: string; year: string }>
}

export default async function BudgetYearPage({ params }: PageProps) {
  const { condominiumSlug, year: yearStr } = await params
  const year = parseInt(yearStr, 10)
  if (isNaN(year)) notFound()

  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) notFound()

  const role = await getUserRole(user.id, condominium.id)
  if (!role) redirect("/")

  const isAdmin = role === "admin"
  const supabase = await createClient()

  // Fetch all plans for this condominium (for year selector)
  const { data: allPlans } = await supabase
    .from("budget_plans")
    .select("year, status")
    .eq("condominium_id", condominium.id)
    .order("year", { ascending: false })

  // Years to display in selector: published years for regular users, all for admins
  const availableYears = (allPlans ?? [])
    .filter((p) => isAdmin || p.status === "published")
    .map((p) => p.year)
    .filter((y, i, arr) => arr.indexOf(y) === i) // deduplicate

  // Fetch the plan for the requested year
  const { data: plan } = await supabase
    .from("budget_plans")
    .select("id, year, status, published_at")
    .eq("condominium_id", condominium.id)
    .eq("year", year)
    .maybeSingle()

  // Regular users can only see published budgets
  const canSeePlan = plan && (plan.status === "published" || isAdmin)

  const lineItems = canSeePlan
    ? await supabase
        .from("budget_line_items")
        .select("id, category, amount, notes, sort_order")
        .eq("budget_plan_id", plan.id)
        .order("sort_order", { ascending: true })
        .then(({ data }) => data ?? [])
    : []

  const editHref = `/app/${condominiumSlug}/budget/${year}/edit`

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Yearly Budget Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {condominium.name}
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" asChild>
            <Link href={editHref}>
              <PencilLine className="h-4 w-4 mr-1.5" />
              {plan ? "Edit Budget" : "Create Budget"}
            </Link>
          </Button>
        )}
      </div>

      {/* Year selector */}
      <YearSelector
        currentYear={year}
        availableYears={availableYears}
        condominiumSlug={condominiumSlug}
      />

      {/* Budget card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">
              {year} Budget
            </CardTitle>
            {plan && (
              <Badge variant={plan.status === "published" ? "default" : "secondary"}>
                {plan.status === "published" ? "Published" : "Draft"}
              </Badge>
            )}
          </div>
          {plan?.published_at && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Published{" "}
              {new Date(plan.published_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {!canSeePlan ? (
            <div className="px-6 pb-6 text-sm text-muted-foreground">
              {plan?.status === "draft" && !isAdmin
                ? "The budget for this year is still being prepared."
                : `No budget has been published for ${year}.`}
            </div>
          ) : (
            <BudgetTable lineItems={lineItems} />
          )}
        </CardContent>
      </Card>

      {/* Admin notice for drafts */}
      {isAdmin && plan?.status === "draft" && (
        <p className="text-sm text-muted-foreground text-center">
          This budget is a draft and only visible to admins.{" "}
          <Link
            href={editHref}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Edit and publish it
          </Link>{" "}
          to make it visible to all members.
        </p>
      )}
    </div>
  )
}
