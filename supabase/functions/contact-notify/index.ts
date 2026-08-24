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
    body {
      margin: 0;
      padding: 0;
      background-color: #f2efe8;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #171717;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      padding: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #f2efe8;
      padding: 40px 16px;
    }
    .container {
      max-width: 640px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #171717;
      box-shadow: 8px 8px 0px #171717;
    }
    .header {
      background-color: #171717;
      padding: 28px 32px;
      border-bottom: 3px solid #b52d20;
    }
    .header-logo {
      display: inline-block;
      background-color: #f2efe8;
      color: #171717;
      font-family: 'DM Mono', monospace;
      font-weight: 700;
      font-size: 13px;
      padding: 6px 10px;
      letter-spacing: -0.05em;
      margin-bottom: 8px;
    }
    .header-tagline {
      color: #aaa69d;
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin: 0;
    }
    .hero-banner {
      background-color: #b52d20;
      color: #f2efe8;
      padding: 36px 32px;
    }
    .eyebrow {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #f2efe8;
      margin: 0 0 12px 0;
    }
    .hero-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 32px;
      font-weight: 700;
      line-height: 1.1;
      margin: 0 0 14px 0;
      color: #ffffff;
    }
    .hero-desc {
      font-size: 15px;
      line-height: 1.6;
      color: rgba(242, 239, 232, 0.94);
      margin: 0;
    }
    .content-block {
      padding: 32px;
      background-color: #ffffff;
    }
    .arabic-section {
      direction: rtl;
      text-align: right;
      font-family: 'Noto Kufi Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      padding: 28px 32px;
      background-color: #f8f6f2;
      border-top: 1px solid #c5c0b5;
      border-bottom: 1px solid #c5c0b5;
    }
    .arabic-eyebrow {
      font-size: 11px;
      color: #b52d20;
      font-weight: 700;
      margin: 0 0 8px 0;
    }
    .arabic-title {
      font-size: 24px;
      font-weight: 700;
      color: #171717;
      margin: 0 0 12px 0;
      line-height: 1.35;
    }
    .arabic-body {
      font-size: 14px;
      line-height: 1.85;
      color: #4c4a45;
      margin: 0;
    }
    .details-box {
      margin: 28px 0;
      border: 1px solid #9d988e;
      background-color: #fcfbfa;
    }
    .details-header {
      background-color: #171717;
      color: #f2efe8;
      padding: 12px 18px;
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .details-row {
      padding: 12px 18px;
      border-bottom: 1px solid #e8e3d9;
      font-size: 13px;
    }
    .details-row:last-child {
      border-bottom: none;
    }
    .details-label {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      text-transform: uppercase;
      color: #5d5a54;
      margin-bottom: 4px;
    }
    .details-value {
      font-weight: 600;
      color: #171717;
    }
    .next-steps {
      background-color: #161616;
      color: #f2efe8;
      padding: 24px 28px;
      margin-top: 24px;
      border-left: 4px solid #b52d20;
    }
    .next-steps-title {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #ff8b74;
      margin: 0 0 10px 0;
    }
    .next-steps-item {
      font-size: 13px;
      line-height: 1.6;
      color: #c4bfb4;
      margin: 6px 0;
    }
    .founders-box {
      padding: 24px 32px;
      background-color: #e8e3d9;
      border-top: 1px solid #9d988e;
    }
    .founders-label {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #b52d20;
      margin: 0 0 10px 0;
    }
    .founders-grid {
      display: table;
      width: 100%;
    }
    .founder-cell {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      padding-right: 12px;
    }
    .founder-name {
      font-weight: 700;
      font-size: 13px;
      color: #171717;
    }
    .founder-role {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      color: #5d5a54;
      margin-top: 2px;
    }
    .footer {
      background-color: #161616;
      color: #aaa69d;
      padding: 28px 32px;
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      text-align: center;
      line-height: 1.6;
    }
    .footer a {
      color: #f2efe8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Header -->
      <div class="header">
        <div class="header-logo">WV / webviewlabs</div>
        <p class="header-tagline">Digital Studio for Ambitious Brands · Cairo / Everywhere</p>
      </div>

      <!-- English Hero -->
      <div class="hero-banner">
        <p class="eyebrow">Studio Edition / 02 · Project Confirmation</p>
        <h1 class="hero-title">Brief received.<br/>We're on it.</h1>
        <p class="hero-desc">
          Thank you for reaching out, <strong>${safeName}</strong>. We have received your project details for <strong>${safeCompany}</strong>. Our senior team is currently reviewing your brief and will contact you shortly.
        </p>
      </div>

      <!-- Arabic Section -->
      <div class="arabic-section">
        <p class="arabic-eyebrow">إصدار الاستوديو / ٠٢ · تأكيد استلام الطلب</p>
        <h2 class="arabic-title">وصلتنا التفاصيل، وسنتواصل معك قريباً.</h2>
        <p class="arabic-body">
          أهلاً <strong>${safeName}</strong>، شكراً لاهتمامك وتواصلك مع <strong>webviewlabs</strong> بخصوص مشروع <strong>${safeCompany}</strong>. تفاصيل طلبك وصلتنا بنجاح، وسيقوم فريقنا بمراجعة المعطيات والتواصل معك مباشرة لمناقشة الخطوة التالية.
        </p>
      </div>

      <!-- Submission Summary -->
      <div class="content-block">
        <div class="details-box">
          <div class="details-header">Project Submission Summary / ملخص الطلب</div>
          <div class="details-row">
            <div class="details-label">Client Name / الاسم</div>
            <div class="details-value">${safeName}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Company / Brand / الشركة أو العلامة</div>
            <div class="details-value">${safeCompany}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Phone Number / رقم الهاتف</div>
            <div class="details-value">${safePhone}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Work Email / البريد الإلكتروني</div>
            <div class="details-value">${safeEmail}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Working Range / الميزانية التقريبية</div>
            <div class="details-value">${safeBudget}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Project Brief / تفاصيل المشروع</div>
            <div class="details-value" style="font-weight: normal; line-height: 1.5; margin-top: 4px;">${safeBrief}</div>
          </div>
        </div>

        <!-- Next Steps -->
        <div class="next-steps">
          <div class="next-steps-title">Next Steps / الخطوات القادمة</div>
          <div class="next-steps-item"><strong>1. Review:</strong> We analyze the brief and technical constraints within 24 hours.</div>
          <div class="next-steps-item"><strong>2. Direct Contact:</strong> One of our founders will contact you directly via phone or WhatsApp.</div>
          <div class="next-steps-item"><strong>3. Clarity Call:</strong> A focused conversation to shape the roadmap and deliverables.</div>
        </div>
      </div>

      <!-- Founders -->
      <div class="founders-box">
        <div class="founders-label">Senior Studio · Founders / المؤسسون</div>
        <div class="founders-grid">
          <div class="founder-cell">
            <div class="founder-name">Youssef Mohamed</div>
            <div class="founder-role">CEO &amp; Co-founder · Software Engineer</div>
          </div>
          <div class="founder-cell">
            <div class="founder-name">Bejimy Milad</div>
            <div class="founder-role">CTO &amp; Co-founder · Full-stack Engineer</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 8px 0; color: #f2efe8; font-weight: 700;">webviewlabs · Digital products with a point of view.</p>
        <p style="margin: 0 0 8px 0;">Make it clear. Make it useful. Make it yours.</p>
        <p style="margin: 0; color: #7d7a72;">
          Cairo, Egypt · <a href="https://webviewlabs.vercel.app">webviewlabs.vercel.app</a> · <a href="mailto:hello@webviewlabs.com">hello@webviewlabs.com</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>`
}

function generatePhoneNotificationText(data: ContactSubmission): { arabic: string; english: string; combined: string } {
  const arabic = `مرحباً ${data.name}،
وصلتنا تفاصيل مشروعك (${data.company}) في webviewlabs بنجاح.
يقوم فريقنا الآن بمراجعة طلبك، وسيتواصل معك أحد مؤسسي الاستوديو قريباً عبر الهاتف لمناقشة التفاصيل.

webviewlabs · استوديو رقمي للعلامات الطموحة
https://webviewlabs.vercel.app`

  const english = `Hi ${data.name},
We've received your project brief for ${data.company} at webviewlabs.
Our senior team is reviewing it and someone will contact you shortly to discuss the next steps.

webviewlabs · Digital studio for ambitious brands
https://webviewlabs.vercel.app`

  const combined = `webviewlabs | تأكيد استلام الطلب · Brief Received

مرحباً ${data.name}،
وصلتنا تفاصيل مشروع ${data.company} بنجاح. سيقوم فريقنا بمراجعة الطلب والتواصل معك قريباً عبر الهاتف.

Hi ${data.name},
We've received your project brief for ${data.company}. Our team will review the details and reach out to you shortly.

Team webviewlabs (Cairo / Everywhere)
https://webviewlabs.vercel.app`

  return { arabic, english, combined }
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
        JSON.stringify({
          error: "Missing required fields: name, phone, company, and brief are required.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const emailHtml = generateWebviewLabsEmailHtml(payload)
    const phoneMessages = generatePhoneNotificationText(payload)

    let emailSent = false
    let phoneSent = false
    let emailError: string | null = null
    let phoneError: string | null = null

    // 1. Send Email if email is present and any provider key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "re_XXFoB3jY_3DYaLo2FFS8rhfDLqYsZ8HNB"
    const brevoApiKey = Deno.env.get("BREVO_API_KEY")
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY")
    const postmarkToken = Deno.env.get("POSTMARK_SERVER_TOKEN")
    const emailWebhookUrl = Deno.env.get("EMAIL_WEBHOOK_URL")

    const senderEmail = Deno.env.get("SENDER_EMAIL") || "webviewlabs <onboarding@resend.dev>"

    if (payload.email) {
      if (resendApiKey) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: senderEmail,
              to: [payload.email],
              subject: `Brief received · webviewlabs (${payload.company})`,
              html: emailHtml,
            }),
          })

          if (!res.ok) {
            const errBody = await res.text()
            emailError = `Resend API (${res.status}): ${errBody}`
            console.error("Resend error:", emailError)
          } else {
            emailSent = true
          }
        } catch (e) {
          emailError = e instanceof Error ? e.message : String(e)
        }
      } else if (brevoApiKey) {
        try {
          const res = await fetch("https://api.brevo.com/v3/smtp/email", {
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
          if (res.ok) emailSent = true
          else emailError = await res.text()
        } catch (e) {
          emailError = e instanceof Error ? e.message : String(e)
        }
      } else if (sendgridApiKey) {
        try {
          const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${sendgridApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: payload.email }] }],
              from: { email: "hello@webviewlabs.com", name: "webviewlabs" },
              subject: `Brief received · webviewlabs (${payload.company})`,
              content: [{ type: "text/html", value: emailHtml }],
            }),
          })
          if (res.ok) emailSent = true
          else emailError = await res.text()
        } catch (e) {
          emailError = e instanceof Error ? e.message : String(e)
        }
      } else if (postmarkToken) {
        try {
          const res = await fetch("https://api.postmarkapp.com/email", {
            method: "POST",
            headers: {
              "X-Postmark-Server-Token": postmarkToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              From: senderEmail,
              To: payload.email,
              Subject: `Brief received · webviewlabs (${payload.company})`,
              HtmlBody: emailHtml,
            }),
          })
          if (res.ok) emailSent = true
          else emailError = await res.text()
        } catch (e) {
          emailError = e instanceof Error ? e.message : String(e)
        }
      } else if (emailWebhookUrl) {
        try {
          const res = await fetch(emailWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: payload.email,
              subject: `Brief received · webviewlabs (${payload.company})`,
              html: emailHtml,
              data: payload,
            }),
          })
          if (res.ok) emailSent = true
        } catch (e) {
          emailError = e instanceof Error ? e.message : String(e)
        }
      } else {
        emailError = "No email provider secret configured (e.g. RESEND_API_KEY, BREVO_API_KEY, SENDGRID_API_KEY, or EMAIL_WEBHOOK_URL)."
      }
    }

    // 2. Send SMS / WhatsApp to phone
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID") || "ACbd18fed07b19e207d407dcfe41c6dfe3"
    const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN")
    const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER") || "whatsapp:+14155238886"
    const smsWebhookUrl = Deno.env.get("SMS_WEBHOOK_URL")

    if (smsWebhookUrl) {
      try {
        const smsRes = await fetch(smsWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: payload.phone,
            message: phoneMessages.combined,
            data: payload,
          }),
        })
        if (smsRes.ok) phoneSent = true
      } catch (e) {
        phoneError = e instanceof Error ? e.message : String(e)
      }
    } else if (twilioSid && twilioAuth && twilioFrom) {
      try {
        const isWhatsApp = twilioFrom.startsWith("whatsapp:")
        let formattedTo = payload.phone.trim().replace(/[^0-9+]/g, "")
        if (!formattedTo.startsWith("+")) formattedTo = "+" + formattedTo
        if (isWhatsApp && !formattedTo.startsWith("whatsapp:")) {
          formattedTo = "whatsapp:" + formattedTo
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
        const formData = new URLSearchParams()
        formData.append("To", formattedTo)
        formData.append("From", twilioFrom)
        formData.append("Body", phoneMessages.combined)

        const twilioRes = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": "Basic " + btoa(`${twilioSid}:${twilioAuth}`),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        })

        if (twilioRes.ok) {
          phoneSent = true
        } else {
          phoneError = await twilioRes.text()
        }
      } catch (e) {
        phoneError = e instanceof Error ? e.message : String(e)
      }
    } else {
      phoneError = "Twilio AuthToken not provided yet (set TWILIO_AUTH_TOKEN)."
    }

    // 3. Update status and save payload in Supabase Database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
        const updateData = {
          email_status: emailSent ? "sent" : emailError ? "error" : "skipped",
          phone_status: phoneSent ? "sent" : phoneError ? "error" : "skipped",
          notification_payload: {
            emailSent,
            phoneSent,
            emailError,
            phoneError,
            formattedSms: phoneMessages.combined,
            generatedAt: new Date().toISOString(),
          },
        }

        if (payload.id) {
          await supabaseAdmin
            .from("contact_submissions")
            .update(updateData)
            .eq("id", payload.id)
        } else {
          await supabaseAdmin
            .from("contact_submissions")
            .update(updateData)
            .eq("phone", payload.phone)
            .order("created_at", { ascending: false })
            .limit(1)
        }
      } catch (dbErr) {
        console.error("DB update error:", dbErr)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        phoneSent,
        emailError,
        phoneError,
        phoneMessage: phoneMessages.combined,
        message: "Confirmation notification processed by webviewlabs notification engine.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
