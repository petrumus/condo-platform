"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/types/database"

type Notification = Database["public"]["Tables"]["notifications"]["Row"]

interface UseNotificationsOptions {
  userId: string
  condominiumId: string
  onNew?: (notification: Notification) => void
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export function useNotifications({
  userId,
  condominiumId,
  onNew,
}: UseNotificationsOptions): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // ─── Initial fetch ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function fetchNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("id, user_id, condominium_id, type, title, body, read, link_url, created_at")
        .eq("user_id", userId)
        .eq("condominium_id", condominiumId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (!cancelled) {
        setNotifications((data ?? []) as Notification[])
        setLoading(false)
      }
    }

    fetchNotifications()
    return () => { cancelled = true }
  }, [userId, condominiumId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Realtime subscription ─────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}:${condominiumId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          onNew?.(newNotification)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, condominiumId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Actions ───────────────────────────────────────────────────────────────

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
        .eq("user_id", userId)
    },
    [userId] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("condominium_id", condominiumId)
      .eq("read", false)
  }, [userId, condominiumId]) // eslint-disable-line react-hooks/exhaustive-deps

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
