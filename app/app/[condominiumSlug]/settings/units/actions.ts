"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"

// ─── Auth helpers ──────────────────────────────────────────────────────────────

async function requireAdmin(condominiumSlug: string) {
  const user = await getUser()
  if (!user) redirect("/")

  const condominium = await getCondominium(condominiumSlug)
  if (!condominium) redirect("/")

  const role = await getUserRole(user.id, condominium.id)
  if (role !== "admin") redirect(`/app/${condominiumSlug}/dashboard`)

  return { user, condominium }
}

// ─── createUnit ────────────────────────────────────────────────────────────────

export async function createUnit(
  condominiumSlug: string,
  data: {
    unit_number: string
    floor: string | null
    building_section: string | null
    area_m2: number
    ownership_share_pct: number | null
  }
): Promise<{ id: string }> {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const unitNumber = data.unit_number.trim()
  if (!unitNumber) throw new Error("Unit number is required.")
  if (data.area_m2 <= 0) throw new Error("Area must be greater than 0.")

  const { data: unit, error } = await supabase
    .from("units")
    .insert({
      condominium_id: condominium.id,
      unit_number: unitNumber,
      floor: data.floor?.trim() || null,
      building_section: data.building_section?.trim() || null,
      area_m2: data.area_m2,
      ownership_share_pct: data.ownership_share_pct ?? null,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/settings/units`)

  return unit
}

// ─── updateUnit ────────────────────────────────────────────────────────────────

export async function updateUnit(
  condominiumSlug: string,
  unitId: string,
  data: {
    unit_number: string
    floor: string | null
    building_section: string | null
    area_m2: number
    ownership_share_pct: number | null
  }
): Promise<void> {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  const unitNumber = data.unit_number.trim()
  if (!unitNumber) throw new Error("Unit number is required.")
  if (data.area_m2 <= 0) throw new Error("Area must be greater than 0.")

  const { error } = await supabase
    .from("units")
    .update({
      unit_number: unitNumber,
      floor: data.floor?.trim() || null,
      building_section: data.building_section?.trim() || null,
      area_m2: data.area_m2,
      ownership_share_pct: data.ownership_share_pct ?? null,
    })
    .eq("id", unitId)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/settings/units`)
}

// ─── deleteUnit ────────────────────────────────────────────────────────────────

export async function deleteUnit(
  condominiumSlug: string,
  unitId: string
): Promise<void> {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // unit_owners cascade-delete via FK; just delete the unit
  const { error } = await supabase
    .from("units")
    .delete()
    .eq("id", unitId)
    .eq("condominium_id", condominium.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/settings/units`)
}

// ─── addUnitOwner ──────────────────────────────────────────────────────────────

export async function addUnitOwner(
  condominiumSlug: string,
  unitId: string,
  ownerData: {
    userId: string | null
    ownerName: string
    ownerEmail: string | null
  }
): Promise<void> {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Verify unit belongs to this condominium
  const { data: unit } = await supabase
    .from("units")
    .select("id")
    .eq("id", unitId)
    .eq("condominium_id", condominium.id)
    .single()

  if (!unit) throw new Error("Unit not found.")

  const ownerName = ownerData.ownerName.trim()
  if (!ownerName) throw new Error("Owner name is required.")

  const { error } = await supabase.from("unit_owners").insert({
    unit_id: unitId,
    user_id: ownerData.userId || null,
    owner_name: ownerName,
    owner_email: ownerData.ownerEmail?.trim() || null,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/settings/units`)
}

// ─── removeUnitOwner ──────────────────────────────────────────────────────────

export async function removeUnitOwner(
  condominiumSlug: string,
  ownerId: string
): Promise<void> {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Validate owner belongs to a unit in this condominium
  const { data: owner } = await supabase
    .from("unit_owners")
    .select("id, units(condominium_id)")
    .eq("id", ownerId)
    .single()

  if (!owner) throw new Error("Owner record not found.")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerUnit = owner.units as any
  if (ownerUnit?.condominium_id !== condominium.id) {
    throw new Error("Access denied.")
  }

  const { error } = await supabase
    .from("unit_owners")
    .delete()
    .eq("id", ownerId)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/${condominiumSlug}/settings/units`)
}

// ─── recalculateOwnershipShares ───────────────────────────────────────────────

export async function recalculateOwnershipShares(
  condominiumSlug: string
): Promise<void> {
  const { condominium } = await requireAdmin(condominiumSlug)
  const supabase = await createClient()

  // Fetch all units for this condominium
  const { data: units, error: fetchError } = await supabase
    .from("units")
    .select("id, area_m2")
    .eq("condominium_id", condominium.id)

  if (fetchError) throw new Error(fetchError.message)
  if (!units || units.length === 0) return

  const totalArea = units.reduce((sum, u) => sum + u.area_m2, 0)
  if (totalArea === 0) throw new Error("Total area is zero; cannot calculate shares.")

  // Update each unit's ownership_share_pct
  for (const unit of units) {
    const pct = (unit.area_m2 / totalArea) * 100
    const { error } = await supabase
      .from("units")
      .update({ ownership_share_pct: Math.round(pct * 10000) / 10000 })
      .eq("id", unit.id)

    if (error) throw new Error(error.message)
  }

  revalidatePath(`/app/${condominiumSlug}/settings/units`)
}
