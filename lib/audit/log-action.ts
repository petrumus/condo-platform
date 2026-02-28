import { createServiceClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/types/database"

export interface LogActionParams {
  condominiumId: string | null
  actorId: string
  action: string
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Writes an entry to the audit_logs table using the service role client
 * (bypasses RLS). Call after a successful operation in a server action.
 * Errors are swallowed so a logging failure never breaks the primary operation.
 */
export async function logAction(params: LogActionParams): Promise<void> {
  try {
    const supabase = await createServiceClient()
    await supabase.from("audit_logs").insert({
      condominium_id: params.condominiumId,
      actor_id: params.actorId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      metadata: (params.metadata ?? null) as Json | null,
    })
  } catch {
    // Logging must never break the calling action
  }
}
