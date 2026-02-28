"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"
import { logAction } from "@/lib/audit/log-action"

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function requireAdmin(condominiumSlug: string) {
  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") redirect(`/app/${condominiumSlug}/dashboard`)

  return { user, condominium }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createBudgetPlan(
  condominiumSlug: string,
  year: number
): Promise<{ id: string }> {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("budget_plans")
    .insert({ condominium_id: condominium.id, year, status: "draft" })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/budget/${year}`)
  revalidatePath(`/app/${condominiumSlug}/budget/${year}/edit`)

  return data
}

export async function saveBudgetDraft(
  condominiumSlug: string,
  planId: string,
  year: number,
  lineItems: Array<{
    category: string
    amount: number
    notes: string
    sort_order: number
  }>
): Promise<void> {
  await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Replace all line items: delete existing, then insert new ones
  const { error: deleteError } = await supabase
    .from("budget_line_items")
    .delete()
    .eq("budget_plan_id", planId)

  if (deleteError) throw new Error(deleteError.message)

  if (lineItems.length > 0) {
    const { error: insertError } = await supabase
      .from("budget_line_items")
      .insert(
        lineItems.map((item) => ({
          budget_plan_id: planId,
          category: item.category,
          amount: item.amount,
          notes: item.notes || null,
          sort_order: item.sort_order,
        }))
      )

    if (insertError) throw new Error(insertError.message)
  }

  revalidatePath(`/app/${condominiumSlug}/budget/${year}`)
  revalidatePath(`/app/${condominiumSlug}/budget/${year}/edit`)
}

export async function publishBudget(
  condominiumSlug: string,
  planId: string,
  year: number
): Promise<void> {
  const { user, condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Verify at least one line item exists
  const { count } = await supabase
    .from("budget_line_items")
    .select("*", { count: "exact", head: true })
    .eq("budget_plan_id", planId)

  if (!count || count === 0) {
    throw new Error("Add at least one line item before publishing.")
  }

  const { error } = await supabase
    .from("budget_plans")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", planId)

  if (error) throw new Error(error.message)

  await logAction({
    condominiumId: condominium.id,
    actorId: user.id,
    action: "budget.published",
    entityType: "budget_plan",
    entityId: planId,
    metadata: { year },
  })

  revalidatePath(`/app/${condominiumSlug}/budget/${year}`)
  revalidatePath(`/app/${condominiumSlug}/budget/${year}/edit`)
}
