import { supabase } from './supabase'

export type ContactPayload = {
  name: string
  phone: string
  email?: string
  company: string
  brief: string
  budget: string
}

export async function submitContact(payload: ContactPayload) {
  if (!supabase) {
    return { persisted: false as const }
  }

  const { error } = await supabase.from('contact_submissions').insert({
    name: payload.name,
    phone: payload.phone,
    email: payload.email || null,
    company: payload.company,
    brief: payload.brief,
    budget: payload.budget,
    source: 'webviewlabs-site',
  })

  if (error) throw error

  try {
    await supabase.functions.invoke('contact-notify', {
      body: payload,
    })
  } catch (notifyError) {
    console.warn('Supabase notification dispatch:', notifyError)
  }

  return { persisted: true as const }
}
