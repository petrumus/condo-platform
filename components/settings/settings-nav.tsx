"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const ADMIN_NAV_ITEMS = [
  { label: "General", href: "general" },
  { label: "Members", href: "members" },
  { label: "Titles", href: "titles" },
  { label: "Units", href: "units" },
  { label: "Audit Log", href: "audit-log" },
]

interface SettingsNavProps {
  condominiumSlug: string
  isAdmin: boolean
}

export function SettingsNav({ condominiumSlug, isAdmin }: SettingsNavProps) {
  const pathname = usePathname()
  const base = `/app/${condominiumSlug}/settings`

  const navItems = [
    ...(isAdmin ? ADMIN_NAV_ITEMS : []),
    { label: "Profile", href: "profile" },
  ]

  return (
    <aside className="w-52 shrink-0 border-r border-border bg-background">
      <div className="sticky top-14 p-4">
        <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Settings
        </p>
        <nav className="space-y-0.5">
          {navItems.map(({ label, href }) => {
            const fullHref = `${base}/${href}`
            const isActive = pathname.startsWith(fullHref)
            return (
              <Link
                key={href}
                href={fullHref}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
