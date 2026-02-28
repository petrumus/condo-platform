"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, MoveUp, MoveDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { saveBudgetDraft, publishBudget } from "@/app/app/[condominiumSlug]/budget/actions"

interface EditorLineItem {
  clientId: string
  category: string
  amount: string
  notes: string
}

interface BudgetEditorProps {
  condominiumSlug: string
  planId: string
  year: number
  initialItems: Array<{
    id: string
    category: string
    amount: number
    notes: string | null
    sort_order: number
  }>
}

function makeId() {
  return Math.random().toString(36).slice(2)
}

function formatTotal(items: EditorLineItem[]) {
  const total = items.reduce((sum, item) => {
    const n = parseFloat(item.amount)
    return sum + (isNaN(n) ? 0 : n)
  }, 0)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(total)
}

export function BudgetEditor({
  condominiumSlug,
  planId,
  year,
  initialItems,
}: BudgetEditorProps) {
  const router = useRouter()
  const [items, setItems] = useState<EditorLineItem[]>(() =>
    initialItems.map((item) => ({
      clientId: item.id,
      category: item.category,
      amount: item.amount.toString(),
      notes: item.notes ?? "",
    }))
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [isSaving, startSave] = useTransition()
  const [isPublishing, startPublish] = useTransition()

  function addItem() {
    setItems((prev) => [
      ...prev,
      { clientId: makeId(), category: "", amount: "", notes: "" },
    ])
  }

  function removeItem(clientId: string) {
    setItems((prev) => prev.filter((i) => i.clientId !== clientId))
  }

  function moveItem(index: number, direction: "up" | "down") {
    setItems((prev) => {
      const next = [...prev]
      const swapWith = direction === "up" ? index - 1 : index + 1
      if (swapWith < 0 || swapWith >= next.length) return prev
      ;[next[index], next[swapWith]] = [next[swapWith], next[index]]
      return next
    })
  }

  function updateItem(
    clientId: string,
    field: keyof Omit<EditorLineItem, "clientId">,
    value: string
  ) {
    setItems((prev) =>
      prev.map((i) => (i.clientId === clientId ? { ...i, [field]: value } : i))
    )
  }

  function buildPayload() {
    return items.map((item, index) => ({
      category: item.category.trim(),
      amount: parseFloat(item.amount) || 0,
      notes: item.notes.trim(),
      sort_order: index,
    }))
  }

  function handleSave() {
    setSaveError(null)
    startSave(async () => {
      try {
        await saveBudgetDraft(condominiumSlug, planId, year, buildPayload())
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to save draft.")
      }
    })
  }

  function handlePublishConfirm() {
    setPublishError(null)
    startPublish(async () => {
      try {
        // Save the current state first, then publish
        await saveBudgetDraft(condominiumSlug, planId, year, buildPayload())
        await publishBudget(condominiumSlug, planId, year)
        setPublishOpen(false)
        router.push(`/app/${condominiumSlug}/budget/${year}`)
        router.refresh()
      } catch (err) {
        setPublishError(
          err instanceof Error ? err.message : "Failed to publish budget."
        )
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Line items table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Category</TableHead>
              <TableHead className="w-36">Amount (USD)</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No line items yet. Click &quot;Add Item&quot; to get started.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.clientId}>
                  {/* Reorder buttons */}
                  <TableCell className="p-1">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                        className="p-0.5 rounded hover:bg-accent disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <MoveUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => moveItem(index, "down")}
                        disabled={index === items.length - 1}
                        className="p-0.5 rounded hover:bg-accent disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <MoveDown className="h-3 w-3" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.category}
                      onChange={(e) =>
                        updateItem(item.clientId, "category", e.target.value)
                      }
                      placeholder="e.g. Maintenance"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) =>
                        updateItem(item.clientId, "amount", e.target.value)
                      }
                      placeholder="0.00"
                      className="h-8 text-right tabular-nums"
                    />
                  </TableCell>
                  <TableCell>
                    <Textarea
                      value={item.notes}
                      onChange={(e) =>
                        updateItem(item.clientId, "notes", e.target.value)
                      }
                      placeholder="Optional notes"
                      rows={1}
                      className="min-h-0 h-8 resize-none py-1.5 text-sm"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <button
                      onClick={() => removeItem(item.clientId)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Total */}
      {items.length > 0 && (
        <div className="flex justify-end pr-14">
          <span className="text-sm text-muted-foreground mr-2">Total:</span>
          <span className="text-sm font-semibold tabular-nums">
            {formatTotal(items)}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Item
        </Button>

        <div className="flex-1" />

        {saveError && (
          <p className="text-sm text-destructive">{saveError}</p>
        )}

        <Button
          variant="outline"
          onClick={handleSave}
          disabled={isSaving || isPublishing}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Draft"
          )}
        </Button>

        {/* Publish confirmation dialog */}
        <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
          <DialogTrigger asChild>
            <Button disabled={isSaving || isPublishing}>
              Publish Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish {year} Budget?</DialogTitle>
              <DialogDescription>
                Once published, the budget will be visible to all members and
                can no longer be edited. Make sure all line items are final.
              </DialogDescription>
            </DialogHeader>
            {publishError && (
              <p className="text-sm text-destructive">{publishError}</p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPublishOpen(false)}
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button onClick={handlePublishConfirm} disabled={isPublishing}>
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  "Confirm & Publish"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
