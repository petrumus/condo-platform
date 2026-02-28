/**
 * Supabase Edge Function: trigger-n8n-webhook
 *
 * Generic helper that POSTs a payload to an n8n webhook URL.
 * Called from Next.js server actions via fetch() when email notifications
 * should be sent for platform events.
 *
 * Expected request body:
 * {
 *   workflow: string,   // e.g. "invitation", "initiative_status", "ballot_open", etc.
 *   payload: object     // workflow-specific data (see docs/n8n-webhooks.md)
 * }
 *
 * Environment variables required:
 *   N8N_WEBHOOK_BASE_URL   — base URL of the n8n instance (e.g. https://n8n.example.com)
 *   N8N_WEBHOOK_SECRET     — shared secret sent as X-Webhook-Secret header
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { workflow, payload } = await req.json()

    if (!workflow || !payload) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: workflow, payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const n8nBaseUrl = Deno.env.get("N8N_WEBHOOK_BASE_URL")
    const n8nSecret = Deno.env.get("N8N_WEBHOOK_SECRET")

    if (!n8nBaseUrl) {
      return new Response(
        JSON.stringify({ error: "N8N_WEBHOOK_BASE_URL is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const webhookUrl = `${n8nBaseUrl}/webhook/${workflow}`

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
      return new Response(
        JSON.stringify({ error: `n8n returned ${response.status}`, detail: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ ok: true, workflow }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
