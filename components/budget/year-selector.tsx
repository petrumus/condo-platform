import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface YearSelectorProps {
  currentYear: number
  availableYears: number[]
  condominiumSlug: string
}

export function YearSelector({
  currentYear,
  availableYears,
  condominiumSlug,
}: YearSelectorProps) {
  const base = `/app/${condominiumSlug}/budget`
  const prevYear = currentYear - 1
  const nextYear = currentYear + 1

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`${base}/${prevYear}`}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous year</span>
        </Link>
      </Button>

      <span className="text-lg font-semibold w-16 text-center">{currentYear}</span>

      <Button variant="ghost" size="icon" asChild>
        <Link href={`${base}/${nextYear}`}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next year</span>
        </Link>
      </Button>

      {availableYears.length > 1 && (
        <div className="ml-4 flex flex-wrap gap-1">
          {availableYears.map((y) => (
            <Button
              key={y}
              variant={y === currentYear ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`${base}/${y}`}>{y}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
