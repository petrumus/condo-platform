"use client"

import { useRef } from "react"
import Link from "next/link"
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react"
import { useTranslations } from "next-intl"
import { useNotifications } from "@/hooks/use-notifications"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Database } from "@/lib/types/database"

type Notification = Database["public"]["Tables"]["notifications"]["Row"]

interface NotificationBellProps {
  userId: string
  condominiumId: string
  condominiumSlug: string
}

function NotificationItem({
  notification,
  onRead,
  markAsReadLabel,
}: {
  notification: Notification
  onRead: (id: string) => void
  markAsReadLabel: string
}) {
  const t = useTranslations("common")

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t("justNow")
    if (mins < 60) return t("minutesAgo", { count: mins })
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return t("hoursAgo", { count: hrs })
    const days = Math.floor(hrs / 24)
    return t("daysAgo", { count: days })
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-3 py-2.5 text-sm transition-colors",
        !notification.read && "bg-accent/40"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("font-medium truncate", !notification.read && "text-foreground")}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          )}
        </div>
        <p className="text-muted-foreground line-clamp-2 text-xs mt-0.5">{notification.body}</p>
        <p className="text-muted-foreground text-xs mt-1">{timeAgo(notification.created_at)}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {notification.link_url && (
          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
            <Link href={notification.link_url} onClick={() => onRead(notification.id)}>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        )}
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onRead(notification.id)}
            title={markAsReadLabel}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function NotificationBell({
  userId,
  condominiumId,
  condominiumSlug,
}: NotificationBellProps) {
  const bellRef = useRef<HTMLButtonElement>(null)
  const t = useTranslations("notifications")

  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications({
    userId,
    condominiumId,
    onNew: () => {
      // Briefly animate the bell on new notification
      bellRef.current?.animate(
        [
          { transform: "rotate(-15deg)" },
          { transform: "rotate(15deg)" },
          { transform: "rotate(-10deg)" },
          { transform: "rotate(10deg)" },
          { transform: "rotate(0deg)" },
        ],
        { duration: 500, easing: "ease-in-out" }
      )
    },
  })

  const recent = notifications.slice(0, 10)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={bellRef}
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`${t("title")}${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">{t("title")}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3" />
              {t("markAllRead")}
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-border">
          {loading ? (
            <p className="text-sm text-muted-foreground px-3 py-4 text-center">{t("loading")}</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-4 text-center">
              {t("empty")}
            </p>
          ) : (
            recent.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={markAsRead}
                markAsReadLabel={t("markAsRead")}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2">
              <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <Link href={`/app/${condominiumSlug}/notifications`}>
                  {t("viewAll")}
                </Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
