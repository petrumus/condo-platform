"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, LogOut, Settings, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useCondominium } from "@/lib/context/condominium-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/notifications/notification-bell"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const NAV_LINKS = [
  { label: "Dashboard",     href: "dashboard" },
  { label: "Budget",        href: "budget" },
  { label: "Projects",      href: "projects" },
  { label: "Initiatives",   href: "initiatives" },
  { label: "Ballots",       href: "ballots" },
  { label: "Documents",     href: "documents" },
  { label: "Announcements", href: "announcements" },
  { label: "Maintenance",   href: "maintenance" },
] as const

interface NavbarProps {
  user: SupabaseUser
}

export function Navbar({ user }: NavbarProps) {
  const { condominium, userRole } = useCondominium()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const baseHref = `/app/${condominium.slug}`

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const userInitial =
    (user.user_metadata?.full_name as string | undefined)?.charAt(0) ??
    user.email?.charAt(0) ??
    "?"

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex h-14 items-center gap-3 px-4">
        {/* Brand / condominium identity */}
        <Link
          href={`${baseHref}/dashboard`}
          className="flex items-center gap-2 font-semibold text-sm shrink-0"
        >
          {condominium.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={condominium.logo_url}
              alt={condominium.name}
              className="h-7 w-7 rounded-md object-cover"
            />
          ) : (
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {condominium.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="hidden sm:block">{condominium.name}</span>
        </Link>

        <Separator orientation="vertical" className="h-5 shrink-0" />

        {/* Navigation links */}
        <nav className="flex items-center gap-0.5 text-sm flex-1 overflow-x-auto scrollbar-none">
          {NAV_LINKS.map(({ label, href }) => {
            const fullHref = `${baseHref}/${href}`
            const isActive = pathname.startsWith(fullHref)
            return (
              <Link
                key={href}
                href={fullHref}
                className={[
                  "px-3 py-1.5 rounded-md whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                ].join(" ")}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right-side actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Notification bell */}
          <NotificationBell
            userId={user.id}
            condominiumId={condominium.id}
            condominiumSlug={condominium.slug}
          />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1.5 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">
                    {userInitial.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                {user.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`${baseHref}/settings/profile`} className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              {userRole === "admin" && (
                <DropdownMenuItem asChild>
                  <Link href={`${baseHref}/settings/general`} className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
