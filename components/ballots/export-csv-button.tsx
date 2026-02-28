"use client"

import { useState, useTransition } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportResultsCsv } from "@/app/app/[condominiumSlug]/ballots/actions"

interface ExportCsvButtonProps {
  condominiumSlug: string
  ballotId: string
  ballotTitle: string
}

export function ExportCsvButton({ condominiumSlug, ballotId, ballotTitle }: ExportCsvButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleExport() {
    setError(null)
    startTransition(async () => {
      try {
        const csv = await exportResultsCsv(condominiumSlug, ballotId)
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${ballotTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_results.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Export failed.")
      }
    })
  }

  return (
    <div className="space-y-1">
      <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
        <Download className="h-4 w-4 mr-1.5" />
        {isPending ? "Exporting…" : "Export CSV"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
