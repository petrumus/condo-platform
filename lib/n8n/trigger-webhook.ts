/**
 * Fire-and-forget helper: calls the Supabase Edge Function which forwards
 * the payload to the appropriate n8n webhook workflow.
 * Failures are silently swallowed — email notifications are non-critical.
 */
export async function triggerN8nWebhook(
  workflow: string,
  payload: Record<string, unknown>
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return

  try {
    await fetch(`${supabaseUrl}/functions/v1/trigger-n8n-webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ workflow, payload }),
    })
  } catch {
    // Non-critical — email failures must not break the main action
  }
}
