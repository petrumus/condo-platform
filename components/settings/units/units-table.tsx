"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Edit2, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UnitDialog } from "./unit-dialog"
import { UnitOwnersDialog } from "./unit-owners-dialog"
import { deleteUnit, recalculateOwnershipShares } from "@/app/app/[condominiumSlug]/settings/units/actions"
import type { UnitWithOwners } from "@/app/app/[condominiumSlug]/settings/units/page"
import type { Tables } from "@/lib/types/database"

type Member = { user_id: string; full_name: string | null; email: string | null }

interface UnitsTableProps {
  condominiumSlug: string
  units: UnitWithOwners[]
  members: Member[]
  totalArea: number
  totalShare: number
}

export function UnitsTable({
  condominiumSlug,
  units,
  members,
  totalArea,
  totalShare,
}: UnitsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingUnit, setEditingUnit] = useState<UnitWithOwners | null>(null)
  const [managingOwnersUnit, setManagingOwnersUnit] = useState<UnitWithOwners | null>(null)
  const [deletingUnit, setDeletingUnit] = useState<UnitWithOwners | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [recalcMsg, setRecalcMsg] = useState<string | null>(null)

  function handleDelete() {
    if (!deletingUnit) return
    setDeleteError(null)
    startTransition(async () => {
      try {
        await deleteUnit(condominiumSlug, deletingUnit.id)
        setDeletingUnit(null)
        router.refresh()
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Failed to delete unit.")
      }
    })
  }

  function handleRecalculate() {
    setRecalcMsg(null)
    startTransition(async () => {
      try {
        await recalculateOwnershipShares(condominiumSlug)
        setRecalcMsg("Shares recalculated.")
        setTimeout(() => setRecalcMsg(null), 3000)
        router.refresh()
      } catch (err) {
        setRecalcMsg(err instanceof Error ? err.message : "Failed to recalculate shares.")
      }
    })
  }

  return (
    <>
      {/* Recalculate button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRecalculate}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
            Recalculate Shares
          </Button>
          {recalcMsg && (
            <span className="text-sm text-muted-foreground">{recalcMsg}</span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Section</TableHead>
              <TableHead className="text-right">Area (m²)</TableHead>
              <TableHead className="text-right">Share (%)</TableHead>
              <TableHead>Owners</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((unit) => {
              const ownerNames = unit.owners.map((o) => o.owner_name).join(", ")
              return (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.unit_number}</TableCell>
                  <TableCell className="text-muted-foreground">{unit.floor ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {unit.building_section ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {unit.area_m2.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    {unit.ownership_share_pct != null
                      ? `${unit.ownership_share_pct.toFixed(4)}%`
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm truncate max-w-[140px]">
                        {ownerNames || <span className="text-muted-foreground">None</span>}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 shrink-0"
                        onClick={() => setManagingOwnersUnit(unit)}
                      >
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditingUnit(unit)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit unit</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeletingUnit(unit)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete unit</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="font-medium">
                Total ({units.length} units)
              </TableCell>
              <TableCell className="text-right font-medium">
                {totalArea.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right font-medium">
                <span
                  className={
                    Math.abs(totalShare - 100) > 0.1 ? "text-yellow-600" : "text-green-600"
                  }
                >
                  {totalShare.toFixed(4)}%
                </span>
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Edit unit dialog */}
      {editingUnit && (
        <UnitDialog
          condominiumSlug={condominiumSlug}
          editUnit={editingUnit}
          open={!!editingUnit}
          onOpenChange={(val) => !val && setEditingUnit(null)}
          totalAreaExcluding={totalArea - editingUnit.area_m2}
        />
      )}

      {/* Manage owners dialog */}
      {managingOwnersUnit && (
        <UnitOwnersDialog
          condominiumSlug={condominiumSlug}
          unitId={managingOwnersUnit.id}
          unitNumber={managingOwnersUnit.unit_number}
          owners={managingOwnersUnit.owners as Tables<"unit_owners">[]}
          members={members}
          open={!!managingOwnersUnit}
          onOpenChange={(val) => !val && setManagingOwnersUnit(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deletingUnit} onOpenChange={(val) => !val && setDeletingUnit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Unit {deletingUnit?.unit_number}?</DialogTitle>
            <DialogDescription>
              This will permanently delete this unit and remove all associated owner records. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUnit(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Delete Unit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
