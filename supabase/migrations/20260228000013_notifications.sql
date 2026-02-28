-- F15: Notifications (In-App + Email)
-- Creates notifications table with RLS

-- ─── notifications table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condominium_id  uuid NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  type            text NOT NULL,          -- e.g. 'announcement', 'ballot_open', 'initiative_status', 'maintenance_status'
  title           text NOT NULL,
  body            text NOT NULL,
  read            boolean NOT NULL DEFAULT false,
  link_url        text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_id_idx         ON public.notifications(user_id);
CREATE INDEX notifications_condominium_id_idx  ON public.notifications(condominium_id);
CREATE INDEX notifications_created_at_idx      ON public.notifications(created_at DESC);

-- ─── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "users_read_own_notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "users_update_own_notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (used by server actions) can insert notifications for any user
-- No INSERT policy needed for anon/authenticated — inserts go through service role only

-- Enable realtime for the notifications table so clients can subscribe
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
