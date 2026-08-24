import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const NVIDIA_API_KEY = "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"
const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { messages, model, temperature, top_p, max_tokens, extra_body } = body

    const targetModel = model || "nvidia/nemotron-3-ultra-550b-a55b"

    const nvidiaRes = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: targetModel,
        messages,
        temperature: temperature ?? 0.7,
        top_p: top_p ?? 0.95,
        max_tokens: max_tokens ?? 4096,
        extra_body: extra_body ?? { chat_template_kwargs: { enable_thinking: true } },
        stream: true,
      }),
    })

    if (!nvidiaRes.ok) {
      const errText = await nvidiaRes.text()
      return new Response(JSON.stringify({ error: errText }), {
        status: nvidiaRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Proxy the Server-Sent Events stream directly to client
    return new Response(nvidiaRes.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
