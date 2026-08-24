import { supabase } from './supabase'

export type ContactPayload = {
  name: string
  phone: string
  email?: string
  company: string
  brief: string
  budget: string
}

export function normalizePhone(raw: string): string {
  const cleaned = raw.trim().replace(/[^0-9+]/g, '')
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    return '+2' + cleaned
  }
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.slice(2)
  }
  if (!cleaned.startsWith('+') && cleaned.length >= 8) {
    return '+' + cleaned
  }
  return cleaned
}

export async function submitContact(payload: ContactPayload) {
  const phone = normalizePhone(payload.phone)
  const budget =
    payload.budget?.trim() && payload.budget.trim().length >= 2
      ? payload.budget.trim()
      : 'Not sure yet'

  let persisted = false

  // 1. Primary path: Direct Supabase client insert
  if (supabase) {
    try {
      const { error } = await supabase.from('contact_submissions').insert({
        name: payload.name.trim(),
        phone: payload.phone ? phone : payload.phone,
        email: payload.email || null,
        company: payload.company.trim(),
        brief: payload.brief.trim(),
        budget,
        source: 'webviewlabs-site',
      })

      if (!error) {
        persisted = true
        // Fire and forget background notification in next tick
        setTimeout(() => {
          try {
            supabase?.functions
              .invoke('contact-notify', {
                body: {
                  ...payload,
                  phone,
                },
              })
              .catch((notifyError) => {
                console.warn('Background notification note:', notifyError)
              })
          } catch (e) {
            console.warn('Notification invocation note:', e)
          }
        }, 10)
      } else {
        console.warn('Supabase client insert encountered error, attempting API fallback:', error)
      }
    } catch (clientErr) {
      console.warn('Supabase client exception, falling back to same-origin API:', clientErr)
    }
  }

  // 2. Secondary fallback path: Same-origin /api/contact endpoint (bypasses adblockers/CORS)
  if (!persisted) {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          phone,
          budget,
        }),
      })
      if (res.ok) {
        persisted = true
      } else {
        const errJson = await res.json().catch(() => ({}))
        console.error('API contact fallback error:', errJson)
      }
    } catch (apiErr) {
      console.error('API contact fallback fetch exception:', apiErr)
    }
  }

  if (!persisted) {
    throw new Error('Unable to submit brief to database or backup API endpoint.')
  }

  return { persisted: true as const }
}
