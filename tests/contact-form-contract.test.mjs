import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const contactFormSource = await readFile(new URL('../src/components/ContactForm.tsx', import.meta.url), 'utf8')
const contactSource = await readFile(new URL('../src/lib/contact.ts', import.meta.url), 'utf8')
const migrationSource = await readFile(new URL('../supabase/migrations/20260823120000_add_phone_to_contact_submissions.sql', import.meta.url), 'utf8')
const contentSource = await readFile(new URL('../src/content.ts', import.meta.url), 'utf8')

test('contact form requires phone and keeps email optional', () => {
  assert.match(contactFormSource, /name="phone"[^>]*required/)
  assert.match(contactFormSource, /name="email"[^>]*type="email"(?![^>]*required)/)
  assert.match(contactFormSource, /phone: String\(form\.get\('phone'\)/)
  assert.doesNotMatch(contactFormSource, /!payload\.name \|\| !payload\.email/)
})

test('Supabase contact payload persists phone and nullable email', () => {
  assert.match(contactSource, /phone: string/)
  assert.match(contactSource, /email\?: string/)
  assert.match(contactSource, /phone: payload\.phone/)
  assert.match(contactSource, /email: payload\.email \|\| null/)
})

test('Supabase migration keeps phone constrained and email nullable', () => {
  assert.match(migrationSource, /add column if not exists phone text/)
  assert.match(migrationSource, /alter column email drop not null/)
  assert.match(migrationSource, /contact_submissions_phone_check/)
  assert.match(migrationSource, /contact_submissions_email_check/)
})

test('fallback confirmation reads as a sent message', () => {
  assert.match(contentSource, /fallbackSuccess: 'Message sent\.'/)
  assert.match(contentSource, /fallbackSuccess: 'تم إرسال الرسالة بنجاح\.'/)
  assert.doesNotMatch(contentSource, /أضف متغيرات Supabase لحفظ الطلبات فعلياً/)
})
