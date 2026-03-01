/**
 * Fire-and-forget helper: POSTs directly to the n8n webhook for the given workflow.
 * Requires N8N_WEBHOOK_BASE_URL (and optionally N8N_WEBHOOK_SECRET) in env vars.
 * Failures are logged but do not propagate — email notifications are non-critical.
 */
export async function triggerN8nWebhook(
  workflow: string,
  payload: Record<string, unknown>
): Promise<void> {
  const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
  const n8nSecret = process.env.N8N_WEBHOOK_SECRET

  if (!n8nBaseUrl) {
    console.warn(`[triggerN8nWebhook] N8N_WEBHOOK_BASE_URL is not set — skipping "${workflow}" webhook`)
    return
  }

  const webhookUrl = `${n8nBaseUrl}/webhook/${workflow}`

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(n8nSecret ? { "X-Webhook-Secret": n8nSecret } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[triggerN8nWebhook] n8n returned ${response.status} for workflow "${workflow}": ${text}`)
    }
  } catch (err) {
    console.error(`[triggerN8nWebhook] Failed to reach n8n for workflow "${workflow}":`, err)
  }
}
