import { FormEvent, useState } from 'react'
import { submitContact } from '../lib/contact'
import type { Copy } from '../types'

type ContactFormProps = { copy: Copy }
type Status = 'idle' | 'sending' | 'success' | 'fallback' | 'error'

export function ContactForm({ copy }: ContactFormProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (String(form.get('website') ?? '').trim()) return
    const payload = {
      name: String(form.get('name') ?? '').trim(),
      phone: String(form.get('phone') ?? '').trim(),
      email: String(form.get('email') ?? '').trim() || undefined,
      company: String(form.get('company') ?? '').trim(),
      brief: String(form.get('brief') ?? '').trim(),
      budget: String(form.get('budget') ?? '').trim(),
    }
    if (!payload.name || !payload.phone || !payload.company || !payload.brief) {
      setErrorMessage(copy.contact.error)
      setStatus('error')
      return
    }
    setStatus('sending')
    try {
      const result = await submitContact(payload)
      setStatus(result.persisted ? 'success' : 'fallback')
      if (result.persisted) event.currentTarget.reset()
    } catch {
      setErrorMessage(copy.contact.error)
      setStatus('error')
    }
  }

  const message = status === 'success' ? copy.contact.success : status === 'fallback' ? copy.contact.fallbackSuccess : errorMessage

  return <form className="contact-form" onSubmit={handleSubmit} noValidate>
    <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <div className="form-row"><label><span>{copy.contact.labels.name}</span><input name="name" type="text" placeholder={copy.contact.placeholders.name} autoComplete="name" required /></label><label><span>{copy.contact.labels.phone}</span><input name="phone" type="tel" placeholder={copy.contact.placeholders.phone} autoComplete="tel" inputMode="tel" required /></label></div>
    <div className="form-row"><label><span>{copy.contact.labels.email}</span><input name="email" type="email" placeholder={copy.contact.placeholders.email} autoComplete="email" /></label><label><span>{copy.contact.labels.company}</span><input name="company" type="text" placeholder={copy.contact.placeholders.company} autoComplete="organization" required /></label></div>
    <label><span>{copy.contact.labels.budget}</span><select name="budget" defaultValue=""><option value="" disabled>{copy.contact.budgetOptions[0]}</option>{copy.contact.budgetOptions.slice(1).map((option) => <option value={option} key={option}>{option}</option>)}</select></label>
    <label><span>{copy.contact.labels.brief}</span><textarea name="brief" placeholder={copy.contact.placeholders.brief} rows={4} required /></label>
    <div className="form-submit"><p>{copy.contact.note}</p><button className="submit-button" type="submit" disabled={status === 'sending'}>{status === 'sending' ? copy.contact.sending : copy.contact.labels.submit}<span aria-hidden="true">↗</span></button></div>
    {message && <p className={`form-message ${status === 'error' ? 'form-error' : 'form-success'}`} role="status">{message}</p>}
  </form>
}
