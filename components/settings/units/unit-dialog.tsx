"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createUnit, updateUnit } from "@/app/app/[condominiumSlug]/settings/units/actions"
import type { Tables } from "@/lib/types/database"

type Unit = Pick<
  Tables<"units">,
  "id" | "unit_number" | "floor" | "building_section" | "area_m2" | "ownership_share_pct"
>

interface UnitDialogProps {
  condominiumSlug: string
  /** When provided, switches to edit mode */
  editUnit?: Unit
  /** Controlled open state */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Total area of all other units (for auto-share preview) */
  totalAreaExcluding?: number
}

export function UnitDialog({
  condominiumSlug,
  editUnit,
  open,
  onOpenChange,
  totalAreaExcluding = 0,
}: UnitDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [unitNumber, setUnitNumber] = useState(editUnit?.unit_number ?? "")
  const [floor, setFloor] = useState(editUnit?.floor ?? "")
  const [buildingSection, setBuildingSection] = useState(editUnit?.building_section ?? "")
  const [areaM2, setAreaM2] = useState(editUnit?.area_m2?.toString() ?? "")
  const [ownershipPct, setOwnershipPct] = useState(
    editUnit?.ownership_share_pct != null ? editUnit.ownership_share_pct.toString() : ""
  )

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  // Reset form when dialog opens with editUnit data
  useEffect(() => {
    if (isOpen) {
      setUnitNumber(editUnit?.unit_number ?? "")
      setFloor(editUnit?.floor ?? "")
      setBuildingSection(editUnit?.building_section ?? "")
      setAreaM2(editUnit?.area_m2?.toString() ?? "")
      setOwnershipPct(
        editUnit?.ownership_share_pct != null ? editUnit.ownership_share_pct.toString() : ""
      )
      setError(null)
    }
  }, [isOpen, editUnit])

  // Auto-calculate ownership share preview
  const parsedArea = parseFloat(areaM2)
  const autoShare =
    !ownershipPct && parsedArea > 0 && totalAreaExcluding >= 0
      ? ((parsedArea / (totalAreaExcluding + parsedArea)) * 100).toFixed(2)
      : null

  function handleOpenChange(val: boolean) {
    if (!val) setError(null)
    if (isControlled) {
      onOpenChange?.(val)
    } else {
      setInternalOpen(val)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const area = parseFloat(areaM2)
    if (isNaN(area) || area <= 0) {
      setError("Area must be a positive number.")
      return
    }

    const pct = ownershipPct ? parseFloat(ownershipPct) : null
    if (pct !== null && (isNaN(pct) || pct < 0 || pct > 100)) {
      setError("Ownership share must be between 0 and 100.")
      return
    }

    startTransition(async () => {
      try {
        if (editUnit) {
          await updateUnit(condominiumSlug, editUnit.id, {
            unit_number: unitNumber,
            floor: floor || null,
            building_section: buildingSection || null,
            area_m2: area,
            ownership_share_pct: pct,
          })
        } else {
          await createUnit(condominiumSlug, {
            unit_number: unitNumber,
            floor: floor || null,
            building_section: buildingSection || null,
            area_m2: area,
            ownership_share_pct: pct,
          })
        }
        handleOpenChange(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save unit.")
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Unit
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editUnit ? "Edit Unit" : "Add Unit"}</DialogTitle>
          <DialogDescription>
            {editUnit
              ? "Update the details for this unit."
              : "Register a new unit in the condominium."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}

          {/* Unit number */}
          <div className="space-y-1.5">
            <Label htmlFor="unit-number">Unit Number *</Label>
            <Input
              id="unit-number"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              placeholder="e.g. 101, A-12, PH-3"
              required
              autoFocus
            />
          </div>

          {/* Floor + Building Section side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="e.g. 3, Ground"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="building-section">Building Section</Label>
              <Input
                id="building-section"
                value={buildingSection}
                onChange={(e) => setBuildingSection(e.target.value)}
                placeholder="e.g. Tower A"
              />
            </div>
          </div>

          {/* Area */}
          <div className="space-y-1.5">
            <Label htmlFor="area">Area (m²) *</Label>
            <Input
              id="area"
              type="number"
              value={areaM2}
              onChange={(e) => setAreaM2(e.target.value)}
              placeholder="e.g. 75.5"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          {/* Ownership share */}
          <div className="space-y-1.5">
            <Label htmlFor="ownership-pct">Ownership Share (%)</Label>
            <Input
              id="ownership-pct"
              type="number"
              value={ownershipPct}
              onChange={(e) => setOwnershipPct(e.target.value)}
              placeholder={autoShare ? `Auto: ${autoShare}%` : "e.g. 2.5"}
              min="0"
              max="100"
              step="0.0001"
            />
            {autoShare && !ownershipPct && (
              <p className="text-xs text-muted-foreground">
                Leave blank to use auto-calculated value ({autoShare}% based on area).
              </p>
            )}
            {!autoShare && !ownershipPct && (
              <p className="text-xs text-muted-foreground">
                Leave blank — use &ldquo;Recalculate Shares&rdquo; after adding all units.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {editUnit ? "Save Changes" : "Add Unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
