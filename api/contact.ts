import nodemailer from 'nodemailer'

// Use Node.js runtime (not Edge) — nodemailer requires Node TCP sockets
export const config = { runtime: 'nodejs' }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xiqldupgxasaqaswcdbs.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_IyEQPWDQnrrC6PIHFdJWNw_K2iAA8BX'

const GMAIL_USER = process.env.GMAIL_USER || 'fathyyoussef162@gmail.com'
const GMAIL_PASS = (process.env.GMAIL_PASS || 'akbopwhizpwdbfki').replace(/\s/g, '')

function escapeHtml(text: string | null | undefined): string {
  if (!text) return ""
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function generateWebviewLabsEmailHtml(data: any): string {
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
        <div style="margin-top: 24px; text-align: center;">
          <a href="https://webviewlabs.vercel.app/admin?view=crm" style="background: #171717; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 12px; font-weight: bold; display: inline-block;">Open in Studio CRM & Pipeline →</a>
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

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = await req.json()

    if (!payload.name || !payload.phone || !payload.company || !payload.brief) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const budget =
      payload.budget?.trim() && payload.budget.trim().length >= 2
        ? payload.budget.trim()
        : 'Not sure yet'

    // Server-side insert into Supabase contact_submissions table
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        email: payload.email?.trim() || null,
        company: payload.company.trim(),
        brief: payload.brief.trim(),
        budget,
        source: 'webviewlabs-site-api',
      }),
    })

    if (!dbRes.ok) {
      console.error('Supabase REST insert error')
    }

    const insertedData = await dbRes.json()

    // Send emails via Gmail SMTP using Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
    })

    const emailHtml = generateWebviewLabsEmailHtml(payload)
    
    // Send to founder (you)
    const mailOptionsFounder = {
      from: `"webviewlabs" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      subject: `🔥 New Lead: ${payload.company} (${payload.name}) · webviewlabs`,
      html: emailHtml,
    }

    await transporter.sendMail(mailOptionsFounder)

    // Send to client if email is provided
    if (payload.email) {
      const mailOptionsClient = {
        from: `"webviewlabs" <${GMAIL_USER}>`,
        to: payload.email,
        subject: `Brief received · webviewlabs (${payload.company})`,
        html: emailHtml,
      }
      await transporter.sendMail(mailOptionsClient).catch(console.warn)
    }

    return new Response(
      JSON.stringify({ success: true, persisted: true, record: insertedData?.[0] }),
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (err: any) {
    console.error('API contact handler error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Unknown server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
