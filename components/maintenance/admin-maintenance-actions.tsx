"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  updateRequestStatus,
  updateAdminNotes,
  updatePriority,
  type MaintenanceStatus,
  type MaintenancePriority,
} from "@/app/app/[condominiumSlug]/maintenance/actions"

const STATUS_OPTIONS: { value: MaintenanceStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
]

interface AdminMaintenanceActionsProps {
  condominiumSlug: string
  requestId: string
  currentStatus: MaintenanceStatus
  currentPriority: MaintenancePriority
  currentAdminNotes: string | null
}

export function AdminMaintenanceActions({
  condominiumSlug,
  requestId,
  currentStatus,
  currentPriority,
  currentAdminNotes,
}: AdminMaintenanceActionsProps) {
  const [status, setStatus] = useState<MaintenanceStatus>(currentStatus)
  const [priority, setPriority] = useState<MaintenancePriority>(currentPriority)
  const [notes, setNotes] = useState(currentAdminNotes ?? "")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function showSuccess(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  function handleSaveStatus() {
    setError(null)
    startTransition(async () => {
      try {
        await updateRequestStatus(condominiumSlug, requestId, status)
        showSuccess("Status updated.")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update status.")
      }
    })
  }

  function handleSavePriority() {
    setError(null)
    startTransition(async () => {
      try {
        await updatePriority(condominiumSlug, requestId, priority)
        showSuccess("Priority updated.")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update priority.")
      }
    })
  }

  function handleSaveNotes() {
    setError(null)
    startTransition(async () => {
      try {
        await updateAdminNotes(condominiumSlug, requestId, notes)
        showSuccess("Notes saved.")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save notes.")
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Admin Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Status updater */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <div className="flex items-center gap-2">
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as MaintenanceStatus)}
              disabled={isPending}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleSaveStatus}
              disabled={isPending || status === currentStatus}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Priority adjuster */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Priority</Label>
          <div className="flex items-center gap-2">
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as MaintenancePriority)}
              disabled={isPending}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleSavePriority}
              disabled={isPending || priority === currentPriority}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Admin notes */}
        <div className="space-y-2">
          <Label htmlFor="admin-notes" className="text-sm font-medium">
            Resolution / Admin Notes
          </Label>
          <Textarea
            id="admin-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes, resolution details, or updates for the submitter…"
            rows={4}
            disabled={isPending}
          />
          <Button
            size="sm"
            onClick={handleSaveNotes}
            disabled={isPending || notes === (currentAdminNotes ?? "")}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Notes"}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
      </CardContent>
    </Card>
  )
}
