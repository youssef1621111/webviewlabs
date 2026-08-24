import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

interface ContactSubmission {
  id?: number
  name: string
  phone: string
  email?: string | null
  company: string
  brief: string
  budget?: string
  source?: string
  created_at?: string
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return ""
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function generateWebviewLabsEmailHtml(data: ContactSubmission): string {
  const safeName = escapeHtml(data.name)
  const safeCompany = escapeHtml(data.company)
  const safePhone = escapeHtml(data.phone)
  const safeEmail = escapeHtml(data.email || "Not provided / لم يُذكر")
  const safeBudget = escapeHtml(data.budget || "Not sure yet / لم نحدد بعد")
  const safeBrief = escapeHtml(data.brief).replace(/\n/g, "<br/>")

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brief Received · webviewlabs</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f2efe8; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; color: #171717; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f2efe8; padding: 32px 16px; }
    .main { max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 2px solid #171717; }
    .header { background-color: #171717; color: #f2efe8; padding: 24px 32px; border-bottom: 4px solid #b52d20; }
    .hero { background-color: #b52d20; color: #ffffff; padding: 28px 32px; }
    .content { padding: 32px; }
    .card { background-color: #f8f6f2; border: 1px solid #c5c0b5; padding: 20px; margin: 20px 0; }
    .footer { background-color: #171717; color: #aaa69d; padding: 24px 32px; font-size: 11px; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <strong style="font-size: 14px; letter-spacing: 0.1em;">WV / WEBVIEWLABS</strong>
        <p style="margin: 4px 0 0; font-size: 10px; color: #aaa69d; text-transform: uppercase;">Digital Studio for Leading Brands · Cairo / Everywhere</p>
      </div>
      <div class="hero">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; opacity: 0.9;">Project Brief Received</div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">${safeCompany} — Project Brief</h1>
      </div>
      <div class="content">
        <div class="card">
          <table style="width: 100%; font-size: 13px; line-height: 1.6;">
            <tr><td style="color: #5d5a54; width: 120px; font-weight: bold;">Client Name:</td><td><strong>${safeName}</strong></td></tr>
            <tr><td style="color: #5d5a54; font-weight: bold;">Company:</td><td style="color: #b52d20; font-weight: bold;">${safeCompany}</td></tr>
            <tr><td style="color: #5d5a54; font-weight: bold;">Phone:</td><td><strong>${safePhone}</strong></td></tr>
            <tr><td style="color: #5d5a54; font-weight: bold;">Email:</td><td>${safeEmail}</td></tr>
            <tr><td style="color: #5d5a54; font-weight: bold;">Budget:</td><td><strong>${safeBudget}</strong></td></tr>
          </table>
        </div>
        <div style="font-size: 14px; line-height: 1.7; color: #2b2b2b;">
          <h3 style="font-size: 14px; text-transform: uppercase; color: #171717; margin-bottom: 8px;">Project Scope:</h3>
          <p style="background: #fdfcfb; border-left: 3px solid #b52d20; padding: 12px 16px; margin: 0;">${safeBrief}</p>
        </div>
      </div>
      <div class="footer">
        webviewlabs · Cairo, Egypt · <a href="https://webviewlabs.vercel.app" style="color: #f2efe8;">webviewlabs.vercel.app</a>
      </div>
    </div>
  </div>
</body>
</html>`
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const payload: ContactSubmission = body.record ? body.record : body

    if (!payload.name || !payload.phone || !payload.company || !payload.brief) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const emailHtml = generateWebviewLabsEmailHtml(payload)

    let emailSent = false
    let phoneSent = false
    let emailStatus = "pending"

    const brevoApiKey = Deno.env.get("BREVO_API_KEY") || "xsmtpsib-81585ab5f71330154206b48168d56e0719fd0bbb65f4dcbf7d12eed81ceddbf4-cDWZiRoKI1rGo5ZK"
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "re_XXFoB3jY_3DYaLo2FFS8rhfDLqYsZ8HNB"

    // 1. Send Email via Brevo REST API
    if (brevoApiKey && payload.email) {
      try {
        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: "webviewlabs", email: "hello@webviewlabs.com" },
            to: [{ email: payload.email, name: payload.name }],
            subject: `Brief received · webviewlabs (${payload.company})`,
            htmlContent: emailHtml,
          }),
        })
        if (brevoRes.ok) {
          emailSent = true
          emailStatus = "sent_via_brevo"
        }
      } catch (e: any) {
        console.warn("Brevo email note:", e.message)
      }
    }

    // 2. Send SMS via Brevo
    if (brevoApiKey && payload.phone) {
      try {
        let cleanPhone = payload.phone.replace(/[^0-9+]/g, "")
        if (cleanPhone.startsWith("01") && cleanPhone.length === 11) cleanPhone = "+2" + cleanPhone
        const smsRes = await fetch("https://api.brevo.com/v3/transactionalSMS/send", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: "webviewlabs",
            recipient: cleanPhone,
            content: `webviewlabs | تم استلام طلب مشروعك (${payload.company}) بنجاح. سنراجع التفاصيل ونتواصل معك قريباً.`,
          }),
        })
        if (smsRes.ok) phoneSent = true
      } catch (e: any) {
        console.warn("Brevo SMS note:", e.message)
      }
    }

    // 3. Fallback: Internal alert via Resend
    if (!emailSent && resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "webviewlabs <onboarding@resend.dev>",
            to: ["delivered@resend.dev"],
            subject: `🔥 New Lead: ${payload.company} (${payload.name}) · webviewlabs`,
            html: emailHtml,
          }),
        })
        if (res.ok) emailStatus = "founder_alert_sent"
      } catch (e: any) {
        console.warn("Resend alert note:", e.message)
      }
    }

    // 4. Update status in Supabase Database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
        await supabaseAdmin
          .from("contact_submissions")
          .update({
            email_status: emailSent ? "sent" : emailStatus,
            phone_status: phoneSent ? "sent" : "received",
            notification_payload: {
              emailSent,
              phoneSent,
              emailStatus,
              processedAt: new Date().toISOString(),
            },
          })
          .eq("phone", payload.phone)
          .order("created_at", { ascending: false })
          .limit(1)
      } catch (dbErr) {
        console.error("DB update error:", dbErr)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        phoneSent,
        emailStatus,
        message: "Notification pipeline executed.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
