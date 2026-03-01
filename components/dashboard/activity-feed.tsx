"use client"

import Link from "next/link"
import { Megaphone, Vote, Lightbulb } from "lucide-react"
import { useTranslations } from "next-intl"

interface ActivityItem {
  id: string
  type: "announcement" | "ballot" | "initiative"
  title: string
  meta: string
  href: string
}

interface ActivityFeedProps {
  items: ActivityItem[]
  condominiumSlug: string
}

const ICONS = {
  announcement: Megaphone,
  ballot: Vote,
  initiative: Lightbulb,
} as const

export function ActivityFeed({ items }: ActivityFeedProps) {
  const t = useTranslations("dashboard")

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">{t("noActivity")}</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const Icon = ICONS[item.type]
        const typeLabel = t(`activityTypes.${item.type}`)
        return (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/30"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {typeLabel} · {item.meta}
                </p>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
