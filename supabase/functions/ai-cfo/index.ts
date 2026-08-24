import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const NVIDIA_API_KEY = "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"
const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

async function requestNvidiaStream(model: string, messages: any[], temperature = 0.7, max_tokens = 4096) {
  const isNemotron = model.includes("nemotron")
  const body: any = {
    model,
    messages,
    temperature,
    top_p: 0.95,
    max_tokens,
    stream: true,
  }
  if (isNemotron) {
    body.chat_template_kwargs = { enable_thinking: true }
  }

  return await fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { messages, model, temperature, max_tokens } = body

    const preferredModel = model || "nvidia/nemotron-3-ultra-550b-a55b"
    let res = await requestNvidiaStream(preferredModel, messages, temperature, max_tokens)

    if (!res.ok || res.status === 503) {
      console.log(`Model ${preferredModel} unavailable (${res.status}), switching to meta/llama-3.3-70b-instruct`)
      res = await requestNvidiaStream("meta/llama-3.3-70b-instruct", messages, temperature, max_tokens)
    }

    if (!res.ok) {
      const errText = await res.text()
      return new Response(JSON.stringify({ error: errText }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(res.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Proxy error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
