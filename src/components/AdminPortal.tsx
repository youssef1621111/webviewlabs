import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Locale } from '../types'

export type Submission = {
  id: number
  name: string
  phone: string
  email?: string | null
  company: string
  brief: string
  budget: string
  source?: string
  created_at: string
  email_status?: string
  phone_status?: string
  notification_payload?: any
}

type FilterStatus = 'all' | 'pending' | 'contacted' | 'in_progress' | 'done'

export function AdminPortal({ locale }: { locale: Locale }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('wv_admin_auth') === 'true'
  })
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [actionMessage, setActionMessage] = useState('')

  const isArabic = locale === 'ar'

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    // Standard studio default passcode
    if (pinInput.trim() === 'webview2026' || pinInput.trim() === 'admin' || pinInput.trim() === 'wv123') {
      sessionStorage.setItem('wv_admin_auth', 'true')
      setIsAuthenticated(true)
      setPinError('')
    } else {
      setPinError(isArabic ? 'رمز الدخول غير صحيح' : 'Invalid studio passcode')
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('wv_admin_auth')
    setIsAuthenticated(false)
  }

  async function fetchSubmissions() {
    if (!supabase) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setSubmissions(data as Submission[])
    } catch (err) {
      console.error('Failed to load submissions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions()
    }
  }, [isAuthenticated])

  async function updateStatus(id: number, newStatus: string) {
    if (!supabase) return
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ email_status: newStatus })
        .eq('id', id)

      if (error) throw error
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === id ? { ...sub, email_status: newStatus } : sub))
      )
      showNotification(isArabic ? 'تم تحديث الحالة' : 'Status updated')
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  async function deleteSubmission(id: number) {
    if (!supabase) return
    const confirmed = window.confirm(
      isArabic ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this submission?'
    )
    if (!confirmed) return

    try {
      const { error } = await supabase.from('contact_submissions').delete().eq('id', id)
      if (error) throw error
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
      showNotification(isArabic ? 'تم الحذف' : 'Submission deleted')
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  function showNotification(msg: string) {
    setActionMessage(msg)
    setTimeout(() => setActionMessage(''), 3000)
  }

  function copySubmissionToClipboard(sub: Submission) {
    const text = `webviewlabs Project Brief\nName: ${sub.name}\nCompany: ${sub.company}\nPhone: ${sub.phone}\nEmail: ${sub.email || 'N/A'}\nBudget: ${sub.budget}\nBrief: ${sub.brief}\nDate: ${new Date(sub.created_at).toLocaleString()}`
    navigator.clipboard.writeText(text)
    showNotification(isArabic ? 'تم نسخ التفاصيل إلى الحافظة' : 'Copied brief details to clipboard')
  }

  function getCleanPhone(phone: string): string {
    return phone.replace(/[^0-9+]/g, '')
  }

  function getWhatsAppLink(sub: Submission): string {
    const clean = getCleanPhone(sub.phone).replace(/^\+/, '')
    const greeting = isArabic
      ? `أهلاً ${sub.name}، معك استوديو webviewlabs بخصوص طلب مشروع ${sub.company}...`
      : `Hi ${sub.name}, this is Team webviewlabs regarding your project brief for ${sub.company}...`
    return `https://wa.me/${clean}?text=${encodeURIComponent(greeting)}`
  }

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.email && sub.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        sub.brief.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter =
        filter === 'all' ||
        (filter === 'pending' && (!sub.email_status || sub.email_status === 'pending' || sub.email_status === 'sent')) ||
        sub.email_status === filter

      return matchesSearch && matchesFilter
    })
  }, [submissions, searchQuery, filter])

  if (!isAuthenticated) {
    return (
      <section className="studio-page section-pad">
        <div className="content-width" style={{ maxWidth: '460px', margin: '0 auto' }}>
          <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '36px', border: '1px solid var(--ink)', boxShadow: '8px 8px 0 var(--red)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span className="wordmark-mark" style={{ background: 'var(--red)', color: '#fff' }}>WV</span>
              <span style={{ font: '10px "DM Mono", monospace', textTransform: 'uppercase', color: '#aaa69d' }}>
                Studio Admin Portal
              </span>
            </div>
            <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>
              {isArabic ? 'لوحة تحكم webviewlabs' : 'webviewlabs Admin'}
            </h2>
            <p style={{ color: '#aaa69d', fontSize: '13px', marginBottom: '24px', lineHeight: '1.5' }}>
              {isArabic
                ? 'أدخل رمز الدخول للمتابعة وإدارة طلبات العملاء.'
                : 'Enter your studio access passcode to manage incoming client project briefs.'}
            </p>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ font: '10px "DM Mono", monospace', textTransform: 'uppercase', color: '#f2efe8' }}>
                  {isArabic ? 'رمز الدخول (Passcode)' : 'Studio Passcode'}
                </span>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid #4a4843',
                    color: '#fff',
                    outline: 'none',
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '14px',
                  }}
                />
              </label>
              {pinError && (
                <p style={{ color: 'var(--red-light)', font: '11px "DM Mono", monospace', margin: 0 }}>
                  {pinError}
                </p>
              )}
              <button
                type="submit"
                className="button button-dark"
                style={{ background: 'var(--red)', color: '#fff', borderColor: 'var(--red)', marginTop: '8px' }}
              >
                {isArabic ? 'تسجيل الدخول' : 'Access Portal'} <span aria-hidden="true">→</span>
              </button>
            </form>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="studio-page section-pad" style={{ minHeight: '85vh' }}>
      <div className="content-width">
        {/* Admin Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px', paddingBottom: '24px', borderBottom: '1px solid var(--line)', marginBottom: '32px' }}>
          <div>
            <span className="eyebrow">{isArabic ? 'لوحة إدارة الطلبات' : 'Internal Dashboard / Live Leads'}</span>
            <h1 style={{ fontSize: 'clamp(32px, 4vw, 52px)', marginTop: '8px' }}>
              {isArabic ? 'طلبات المشاريع والتواصل' : 'Client Inquiries & Briefs'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="button"
              style={{ padding: '0 16px', minHeight: '40px', background: '#fff' }}
            >
              {loading ? (isArabic ? 'جارٍ التحديث…' : 'Refreshing…') : (isArabic ? 'تحديث ↻' : 'Refresh ↻')}
            </button>
            <button
              onClick={handleLogout}
              className="button button-dark"
              style={{ padding: '0 16px', minHeight: '40px' }}
            >
              {isArabic ? 'خروج' : 'Logout'}
            </button>
          </div>
        </div>

        {/* Action toast */}
        {actionMessage && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100, background: 'var(--ink)', color: 'var(--paper)', padding: '12px 20px', border: '1px solid var(--red)', boxShadow: '4px 4px 0 var(--red)', font: '12px "DM Mono", monospace' }}>
            {actionMessage}
          </div>
        )}

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '20px' }}>
            <span style={{ font: '10px "DM Mono", monospace', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {isArabic ? 'إجمالي الطلبات' : 'Total Submissions'}
            </span>
            <div style={{ font: '700 32px "Playfair Display", serif', marginTop: '6px' }}>
              {submissions.length}
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '20px' }}>
            <span style={{ font: '10px "DM Mono", monospace', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {isArabic ? 'البريد الإلكتروني' : 'Emails Delivered'}
            </span>
            <div style={{ font: '700 32px "Playfair Display", serif', color: 'var(--red)', marginTop: '6px' }}>
              {submissions.filter((s) => s.email_status === 'sent').length}
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '20px' }}>
            <span style={{ font: '10px "DM Mono", monospace', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {isArabic ? 'في الانتظار' : 'Recent Leads'}
            </span>
            <div style={{ font: '700 32px "Playfair Display", serif', marginTop: '6px' }}>
              {submissions.slice(0, 5).length}
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <input
            type="search"
            placeholder={isArabic ? 'ابحث بالاسم، الشركة، الهاتف، أو محتوى الطلب…' : 'Search by name, company, phone, email, or brief…'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1 1 300px',
              maxWidth: '520px',
              padding: '10px 14px',
              border: '1px solid var(--line)',
              background: '#fff',
              outline: 'none',
              fontSize: '13px',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'pending', 'contacted', 'in_progress', 'done'] as FilterStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                style={{
                  padding: '6px 12px',
                  font: '10px "DM Mono", monospace',
                  textTransform: 'uppercase',
                  border: filter === st ? '1px solid var(--ink)' : '1px solid var(--line)',
                  background: filter === st ? 'var(--ink)' : '#fff',
                  color: filter === st ? 'var(--paper)' : 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', background: '#fff', border: '1px solid var(--line)', color: 'var(--muted)', font: '13px "DM Mono", monospace' }}>
            {loading ? (isArabic ? 'جارٍ تحميل البيانات…' : 'Loading submissions…') : (isArabic ? 'لا توجد طلبات تطابق هذا البحث.' : 'No project briefs match the search criteria.')}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredSubmissions.map((sub) => {
              const cleanPhone = getCleanPhone(sub.phone)
              const formattedDate = new Date(sub.created_at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })

              return (
                <article
                  key={sub.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--ink)',
                    boxShadow: '6px 6px 0 var(--ink)',
                    padding: '24px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  {/* Top Row: Meta & Actions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid #e8e3d9', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ font: '700 11px "DM Mono", monospace', background: 'var(--ink)', color: 'var(--paper)', padding: '3px 8px' }}>
                        #{sub.id}
                      </span>
                      <span style={{ font: '11px "DM Mono", monospace', color: 'var(--muted)' }}>
                        {formattedDate}
                      </span>
                      <span style={{ font: '10px "DM Mono", monospace', padding: '3px 8px', border: '1px solid var(--line)', textTransform: 'uppercase' }}>
                        {sub.budget || 'Not sure yet'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        value={sub.email_status || 'pending'}
                        onChange={(e) => updateStatus(sub.id, e.target.value)}
                        style={{
                          font: '10px "DM Mono", monospace',
                          padding: '4px 8px',
                          border: '1px solid var(--line)',
                          background: '#fff',
                          color: 'var(--ink)',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                        }}
                      >
                        <option value="pending">🟡 Pending</option>
                        <option value="sent">🟢 Email Sent</option>
                        <option value="contacted">🔵 Contacted</option>
                        <option value="in_progress">🟣 In Progress</option>
                        <option value="done">⚪ Closed</option>
                      </select>

                      <button
                        onClick={() => copySubmissionToClipboard(sub)}
                        title="Copy Details"
                        style={{ padding: '4px 10px', font: '10px "DM Mono", monospace', border: '1px solid var(--line)', background: '#fff', cursor: 'pointer' }}
                      >
                        📋 Copy
                      </button>

                      <button
                        onClick={() => deleteSubmission(sub.id)}
                        title="Delete"
                        style={{ padding: '4px 8px', font: '10px "DM Mono", monospace', border: '1px solid #ff8b74', background: '#fff', color: 'var(--red)', cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Client Info Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ font: '10px "DM Mono", monospace', color: 'var(--muted)', textTransform: 'uppercase' }}>
                        {isArabic ? 'العميل' : 'Client Name'}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '17px', marginTop: '2px' }}>
                        {sub.name}
                      </div>
                    </div>

                    <div>
                      <div style={{ font: '10px "DM Mono", monospace', color: 'var(--muted)', textTransform: 'uppercase' }}>
                        {isArabic ? 'الشركة / العلامة' : 'Company / Brand'}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '17px', marginTop: '2px', color: 'var(--red)' }}>
                        {sub.company}
                      </div>
                    </div>

                    <div>
                      <div style={{ font: '10px "DM Mono", monospace', color: 'var(--muted)', textTransform: 'uppercase' }}>
                        {isArabic ? 'الهاتف' : 'Phone'}
                      </div>
                      <div style={{ font: '600 14px "DM Mono", monospace', marginTop: '2px' }}>
                        {sub.phone}
                      </div>
                    </div>

                    <div>
                      <div style={{ font: '10px "DM Mono", monospace', color: 'var(--muted)', textTransform: 'uppercase' }}>
                        {isArabic ? 'البريد الإلكتروني' : 'Email'}
                      </div>
                      <div style={{ fontSize: '14px', marginTop: '2px' }}>
                        {sub.email || (isArabic ? 'غير متوفر' : 'Not provided')}
                      </div>
                    </div>
                  </div>

                  {/* Project Brief Box */}
                  <div style={{ background: '#f8f6f2', border: '1px solid #e8e3d9', padding: '14px 18px' }}>
                    <div style={{ font: '10px "DM Mono", monospace', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {isArabic ? 'تفاصيل المشروع / The Brief' : 'Project Brief / Scope'}
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>
                      {sub.brief}
                    </div>
                  </div>

                  {/* Action Contact Bar: WhatsApp, Call, Email */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
                    {cleanPhone && (
                      <a
                        href={getWhatsAppLink(sub)}
                        target="_blank"
                        rel="noreferrer"
                        className="button"
                        style={{
                          background: '#25D366',
                          color: '#fff',
                          borderColor: '#25D366',
                          minHeight: '38px',
                          padding: '0 16px',
                          textDecoration: 'none',
                        }}
                      >
                        💬 WhatsApp Client
                      </a>
                    )}

                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="button"
                        style={{
                          background: 'var(--ink)',
                          color: 'var(--paper)',
                          minHeight: '38px',
                          padding: '0 16px',
                          textDecoration: 'none',
                        }}
                      >
                        📞 Call {sub.phone}
                      </a>
                    )}

                    {sub.email && (
                      <a
                        href={`mailto:${sub.email}?subject=${encodeURIComponent(`webviewlabs · Regarding your project brief for ${sub.company}`)}`}
                        className="button"
                        style={{
                          background: '#fff',
                          borderColor: 'var(--ink)',
                          minHeight: '38px',
                          padding: '0 16px',
                          textDecoration: 'none',
                        }}
                      >
                        ✉️ Email {sub.email}
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
