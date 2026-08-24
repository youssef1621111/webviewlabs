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
  if (!supabase) {
    return { persisted: false as const }
  }

  const phone = normalizePhone(payload.phone)

  const { error } = await supabase.from('contact_submissions').insert({
    name: payload.name,
    phone: payload.phone ? phone : payload.phone,
    email: payload.email || null,
    company: payload.company,
    brief: payload.brief,
    budget: payload.budget,
    source: 'webviewlabs-site',
  })

  if (error) throw error

  try {
    await supabase.functions.invoke('contact-notify', {
      body: {
        ...payload,
        phone,
      },
    })
  } catch (notifyError) {
    console.warn('Supabase notification dispatch:', notifyError)
  }

  return { persisted: true as const }
}
