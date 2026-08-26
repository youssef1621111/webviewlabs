export const config = {
  runtime: 'edge',
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

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
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return new Response(JSON.stringify({ error: 'Supabase is not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
    }
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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions`, {
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

    if (!res.ok) {
      const errText = await res.text()
      console.error('Supabase REST insert error in api/contact:', errText)
      return new Response(
        JSON.stringify({ error: 'Database insert failed', details: errText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const insertedData = await res.json()

    // Trigger edge function notification in background
    fetch(`${SUPABASE_URL}/functions/v1/contact-notify`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        id: insertedData?.[0]?.id,
      }),
    }).catch((e) => console.warn('Background notification error:', e))

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
