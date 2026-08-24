import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Locale } from '../types'

const SUPABASE_URL = 'https://xiqldupgxasaqaswcdbs.supabase.co'
const SUPABASE_KEY = 'sb_publishable_IyEQPWDQnrrC6PIHFdJWNw_K2iAA8BX'

export type Submission = {
  id: number
  name: string
  phone: string
  email?: string | null
  company: string
  brief: string
  budget: string
  source?: string
  status?: string
  created_at: string
  email_status?: string
  phone_status?: string
  notification_payload?: any
}

type TabType = 'pending' | 'contacted' | 'in_progress' | 'all'

export function AdminPortal({ locale }: { locale: Locale }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('wv_admin_auth') === 'true'
  })
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [actionMessage, setActionMessage] = useState('')

  const isArabic = locale === 'ar'

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (
      pinInput.trim() === 'webview2026' ||
      pinInput.trim() === 'admin' ||
      pinInput.trim() === 'wv123'
    ) {
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
    setLoading(true)
    setFetchError(null)

    // 1. Try via Supabase client
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('contact_submissions')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data) {
          setSubmissions(data as Submission[])
          setLoading(false)
          return
        }
      }
    } catch (clientErr) {
      console.warn('Supabase SDK fetch failed, attempting direct REST fetch...', clientErr)
    }

    // 2. Direct REST Fallback
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions?select=*&order=created_at.desc`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`HTTP ${res.status}: ${errText}`)
      }
      const data = await res.json()
      setSubmissions(data as Submission[])
    } catch (err: any) {
      console.error('Failed to load submissions:', err)
      setFetchError(err?.message || 'Failed to retrieve records from database.')
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
    // Optimistic UI update
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: newStatus } : sub))
    )

    try {
      if (supabase) {
        await supabase
          .from('contact_submissions')
          .update({ status: newStatus })
          .eq('id', id)
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ status: newStatus }),
        })
      }

      const statusLabels: Record<string, string> = {
        contacted: isArabic ? 'تم نقل الطلب إلى "تم التواصل"' : 'Moved to "Contacted"',
        pending: isArabic ? 'تم نقل الطلب إلى "قيد الانتظار"' : 'Moved to "Pending"',
        in_progress: isArabic ? 'تم نقل الطلب إلى "جاري العمل"' : 'Moved to "In Progress"',
      }
      showNotification(statusLabels[newStatus] || (isArabic ? 'تم تحديث الحالة' : 'Status updated'))
    } catch (err) {
      console.error('Failed to update status:', err)
      showNotification(isArabic ? 'فشل تحديث الحالة' : 'Failed to update status')
      fetchSubmissions() // Rollback on error
    }
  }

  async function deleteSubmission(id: number) {
    const confirmed = window.confirm(
      isArabic ? 'هل أنت متأكد من حذف هذا الطلب نهائياً؟' : 'Are you sure you want to delete this brief permanently?'
    )
    if (!confirmed) return

    setSubmissions((prev) => prev.filter((s) => s.id !== id))

    try {
      if (supabase) {
        await supabase.from('contact_submissions').delete().eq('id', id)
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions?id=eq.${id}`, {
          method: 'DELETE',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        })
      }
      showNotification(isArabic ? 'تم حذف الطلب' : 'Brief deleted')
    } catch (err) {
      console.error('Failed to delete:', err)
      fetchSubmissions()
    }
  }

  function showNotification(msg: string) {
    setActionMessage(msg)
    setTimeout(() => setActionMessage(''), 3000)
  }

  function copySubmissionToClipboard(sub: Submission) {
    const text = `webviewlabs Project Brief\nName: ${sub.name}\nCompany: ${sub.company}\nPhone: ${sub.phone}\nEmail: ${sub.email || 'N/A'}\nBudget: ${sub.budget}\nBrief: ${sub.brief}\nStatus: ${sub.status || 'pending'}\nDate: ${new Date(sub.created_at).toLocaleString()}`
    navigator.clipboard.writeText(text)
    showNotification(isArabic ? 'تم نسخ التفاصيل إلى الحافظة' : 'Copied brief details to clipboard')
  }

  function getCleanPhone(phone: string): string {
    return phone.replace(/[^0-9+]/g, '')
  }

  function getWhatsAppLink(sub: Submission): string {
    let clean = getCleanPhone(sub.phone).replace(/^\+/, '')
    if (clean.startsWith('01') && clean.length === 11) {
      clean = '2' + clean
    }
    const greeting = isArabic
      ? `أهلاً ${sub.name}، معك استوديو webviewlabs بخصوص طلب مشروع ${sub.company}...`
      : `Hi ${sub.name}, this is Team webviewlabs regarding your project brief for ${sub.company}...`
    return `https://wa.me/${clean}?text=${encodeURIComponent(greeting)}`
  }

  // Real-time Counters
  const counts = useMemo(() => {
    let pending = 0
    let contacted = 0
    let inProgress = 0
    for (const sub of submissions) {
      const st = sub.status || 'pending'
      if (st === 'pending') pending++
      else if (st === 'contacted') contacted++
      else if (st === 'in_progress') inProgress++
    }
    return {
      pending,
      contacted,
      inProgress,
      all: submissions.length,
    }
  }, [submissions])

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.email && sub.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        sub.brief.toLowerCase().includes(searchQuery.toLowerCase())

      const currentStatus = sub.status || 'pending'

      let matchesTab = true
      if (activeTab === 'pending') {
        matchesTab = currentStatus === 'pending'
      } else if (activeTab === 'contacted') {
        matchesTab = currentStatus === 'contacted'
      } else if (activeTab === 'in_progress') {
        matchesTab = currentStatus === 'in_progress'
      } else if (activeTab === 'all') {
        matchesTab = true
      }

      return matchesSearch && matchesTab
    })
  }, [submissions, searchQuery, activeTab])

  if (!isAuthenticated) {
    return (
      <section className="studio-page section-pad">
        <div className="content-width" style={{ maxWidth: '460px', margin: '0 auto' }}>
          <div
            style={{
              background: 'var(--ink)',
              color: 'var(--paper)',
              padding: '36px',
              border: '1px solid var(--ink)',
              boxShadow: '8px 8px 0 var(--red)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <span className="wordmark-mark" style={{ background: 'var(--red)', color: '#fff' }}>
                WV
              </span>
              <span
                style={{
                  font: '10px "DM Mono", monospace',
                  textTransform: 'uppercase',
                  color: '#aaa69d',
                }}
              >
                Studio Admin Portal
              </span>
            </div>
            <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>
              {isArabic ? 'لوحة تحكم webviewlabs' : 'webviewlabs Admin'}
            </h2>
            <p style={{ color: '#aaa69d', fontSize: '13px', marginBottom: '24px', lineHeight: '1.5' }}>
              {isArabic
                ? 'أدخل رمز الدخول لمتابعة وإدارة طلبات العملاء والتواصل الفوري.'
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
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--line)',
            marginBottom: '32px',
          }}
        >
          <div>
            <span className="eyebrow">{isArabic ? 'لوحة إدارة الاستوديو' : 'Internal Dashboard / Client Leads'}</span>
            <h1 style={{ fontSize: 'clamp(32px, 4vw, 52px)', marginTop: '8px' }}>
              {isArabic ? 'طلبات المشاريع والتواصل' : 'Project Briefs & Outreach'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="button"
              style={{ padding: '0 16px', minHeight: '40px', background: '#fff' }}
            >
              {loading ? (isArabic ? 'جارٍ التحميل…' : 'Refreshing…') : (isArabic ? 'تحديث ↻' : 'Refresh ↻')}
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
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 100,
              background: 'var(--ink)',
              color: 'var(--paper)',
              padding: '12px 20px',
              border: '1px solid var(--red)',
              boxShadow: '4px 4px 0 var(--red)',
              font: '12px "DM Mono", monospace',
            }}
          >
            {actionMessage}
          </div>
        )}

        {/* Error message */}
        {fetchError && (
          <div
            style={{
              background: '#fff2f0',
              border: '1px solid var(--red)',
              color: 'var(--red)',
              padding: '16px 20px',
              marginBottom: '24px',
              font: '13px "DM Mono", monospace',
            }}
          >
            ⚠️ {fetchError}
          </div>
        )}

        {/* Status Navigation Tabs with Real-Time Counters */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '28px',
            borderBottom: '2px solid var(--ink)',
            paddingBottom: '12px',
          }}
        >
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '10px 18px',
              font: '700 12px "DM Mono", monospace',
              textTransform: 'uppercase',
              background: activeTab === 'pending' ? 'var(--ink)' : '#fff',
              color: activeTab === 'pending' ? 'var(--paper)' : 'var(--ink)',
              border: '1px solid var(--ink)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>🟡 {isArabic ? 'قيد الانتظار' : 'Pending'}</span>
            <span
              style={{
                background: activeTab === 'pending' ? 'var(--red)' : '#e8e3d9',
                color: activeTab === 'pending' ? '#fff' : '#171717',
                padding: '2px 7px',
                borderRadius: '10px',
                fontSize: '11px',
              }}
            >
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('contacted')}
            style={{
              padding: '10px 18px',
              font: '700 12px "DM Mono", monospace',
              textTransform: 'uppercase',
              background: activeTab === 'contacted' ? 'var(--ink)' : '#fff',
              color: activeTab === 'contacted' ? 'var(--paper)' : 'var(--ink)',
              border: '1px solid var(--ink)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>🟢 {isArabic ? 'تم التواصل' : 'Contacted'}</span>
            <span
              style={{
                background: activeTab === 'contacted' ? '#25D366' : '#e8e3d9',
                color: activeTab === 'contacted' ? '#fff' : '#171717',
                padding: '2px 7px',
                borderRadius: '10px',
                fontSize: '11px',
              }}
            >
              {counts.contacted}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('in_progress')}
            style={{
              padding: '10px 18px',
              font: '700 12px "DM Mono", monospace',
              textTransform: 'uppercase',
              background: activeTab === 'in_progress' ? 'var(--ink)' : '#fff',
              color: activeTab === 'in_progress' ? 'var(--paper)' : 'var(--ink)',
              border: '1px solid var(--ink)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>🔵 {isArabic ? 'جاري العمل' : 'In Progress'}</span>
            <span
              style={{
                background: activeTab === 'in_progress' ? '#1d70b8' : '#e8e3d9',
                color: activeTab === 'in_progress' ? '#fff' : '#171717',
                padding: '2px 7px',
                borderRadius: '10px',
                fontSize: '11px',
              }}
            >
              {counts.inProgress}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '10px 18px',
              font: '700 12px "DM Mono", monospace',
              textTransform: 'uppercase',
              background: activeTab === 'all' ? 'var(--ink)' : '#fff',
              color: activeTab === 'all' ? 'var(--paper)' : 'var(--ink)',
              border: '1px solid var(--ink)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>🗂️ {isArabic ? 'الكل' : 'All Briefs'}</span>
            <span
              style={{
                background: '#e8e3d9',
                color: '#171717',
                padding: '2px 7px',
                borderRadius: '10px',
                fontSize: '11px',
              }}
            >
              {counts.all}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="search"
            placeholder={
              isArabic
                ? 'ابحث بالاسم، الشركة، الهاتف، أو محتوى الطلب…'
                : 'Search by client name, company, phone, email, or brief keyword…'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '12px 16px',
              border: '1px solid var(--ink)',
              background: '#fff',
              outline: 'none',
              fontSize: '14px',
              fontFamily: '"DM Mono", monospace',
            }}
          />
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div
            style={{
              padding: '56px 24px',
              textAlign: 'center',
              background: '#fff',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
              font: '14px "DM Mono", monospace',
            }}
          >
            {loading ? (
              isArabic ? 'جارٍ تحميل البيانات من قاعدة البيانات…' : 'Loading project briefs from database…'
            ) : (
              <div>
                <p style={{ margin: '0 0 8px 0', fontWeight: 700 }}>
                  {activeTab === 'pending'
                    ? (isArabic ? '🎉 لا توجد طلبات معلقة بانتظار التواصل!' : '🎉 No pending briefs waiting for outreach!')
                    : activeTab === 'contacted'
                    ? (isArabic ? 'لم يتم التواصل مع أي عملاء بعد.' : 'No contacted leads in this tab yet.')
                    : (isArabic ? 'لا توجد طلبات تطابق هذا العرض.' : 'No project briefs match this view.')}
                </p>
                <button
                  onClick={fetchSubmissions}
                  className="button"
                  style={{ marginTop: '12px', minHeight: '36px', background: '#f8f6f2' }}
                >
                  {isArabic ? 'إعادة تحميل البيانات ↻' : 'Refresh Database ↻'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '24px' }}>
            {filteredSubmissions.map((sub) => {
              const cleanPhone = getCleanPhone(sub.phone)
              const formattedDate = new Date(sub.created_at).toLocaleString(
                locale === 'ar' ? 'ar-EG' : 'en-US',
                {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }
              )
              const currentStatus = sub.status || 'pending'
              const isContacted = currentStatus === 'contacted'

              return (
                <article
                  key={sub.id}
                  style={{
                    background: isContacted ? '#faf9f6' : '#ffffff',
                    border: '2px solid var(--ink)',
                    boxShadow: isContacted ? '4px 4px 0 #888' : '8px 8px 0 var(--ink)',
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    position: 'relative',
                  }}
                >
                  {/* Top Header: ID, Date, Budget, and Mark Contacted Toggle */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      borderBottom: '1px solid #e8e3d9',
                      paddingBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          font: '700 12px "DM Mono", monospace',
                          background: 'var(--ink)',
                          color: 'var(--paper)',
                          padding: '4px 10px',
                        }}
                      >
                        #{sub.id}
                      </span>
                      <span style={{ font: '11px "DM Mono", monospace', color: 'var(--muted)' }}>
                        {formattedDate}
                      </span>
                      <span
                        style={{
                          font: '10px "DM Mono", monospace',
                          padding: '4px 10px',
                          border: '1px solid var(--line)',
                          textTransform: 'uppercase',
                          background: '#f8f6f2',
                        }}
                      >
                        💰 {sub.budget || 'Not sure yet'}
                      </span>
                    </div>

                    {/* Status Toggle Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {currentStatus === 'pending' ? (
                        <button
                          onClick={() => updateStatus(sub.id, 'contacted')}
                          style={{
                            background: '#25D366',
                            color: '#fff',
                            border: '1px solid #1fa34e',
                            padding: '8px 16px',
                            font: '700 11px "DM Mono", monospace',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '2px 2px 0 var(--ink)',
                          }}
                        >
                          ✓ {isArabic ? 'تم التواصل (نقل إلى Contacted)' : 'Mark as Contacted'}
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span
                            style={{
                              background: '#25D366',
                              color: '#fff',
                              padding: '6px 12px',
                              font: '700 11px "DM Mono", monospace',
                              textTransform: 'uppercase',
                            }}
                          >
                            ✓ {isArabic ? 'تم التواصل' : 'Contacted'}
                          </span>
                          <button
                            onClick={() => updateStatus(sub.id, 'pending')}
                            style={{
                              background: '#fff',
                              border: '1px solid var(--line)',
                              padding: '6px 12px',
                              font: '10px "DM Mono", monospace',
                              cursor: 'pointer',
                            }}
                          >
                            ↩ {isArabic ? 'إعادة إلى قيد الانتظار' : 'Back to Pending'}
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => copySubmissionToClipboard(sub)}
                        title="Copy Summary"
                        style={{
                          padding: '6px 12px',
                          font: '11px "DM Mono", monospace',
                          border: '1px solid var(--line)',
                          background: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        📋 {isArabic ? 'نسخ' : 'Copy'}
                      </button>

                      <button
                        onClick={() => deleteSubmission(sub.id)}
                        title="Delete"
                        style={{
                          padding: '6px 10px',
                          font: '11px "DM Mono", monospace',
                          border: '1px solid #ff8b74',
                          background: '#fff',
                          color: 'var(--red)',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Client Info Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '20px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          font: '10px "DM Mono", monospace',
                          color: 'var(--muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isArabic ? 'اسم العميل' : 'Client Name'}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '19px', marginTop: '4px' }}>
                        {sub.name}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          font: '10px "DM Mono", monospace',
                          color: 'var(--muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isArabic ? 'الشركة / العلامة' : 'Company / Brand'}
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '19px',
                          marginTop: '4px',
                          color: 'var(--red)',
                        }}
                      >
                        {sub.company}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          font: '10px "DM Mono", monospace',
                          color: 'var(--muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isArabic ? 'رقم الهاتف' : 'Phone Number'}
                      </div>
                      <div
                        style={{
                          font: '700 16px "DM Mono", monospace',
                          marginTop: '4px',
                          color: 'var(--ink)',
                        }}
                      >
                        {sub.phone}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          font: '10px "DM Mono", monospace',
                          color: 'var(--muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
                      </div>
                      <div style={{ fontSize: '15px', marginTop: '4px' }}>
                        {sub.email || (
                          <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                            {isArabic ? 'غير متوفر' : 'Not provided'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Project Brief Scope */}
                  <div
                    style={{
                      background: '#f8f6f2',
                      border: '1px solid #e8e3d9',
                      padding: '16px 20px',
                      borderLeft: '4px solid var(--red)',
                    }}
                  >
                    <div
                      style={{
                        font: '10px "DM Mono", monospace',
                        color: 'var(--muted)',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                      }}
                    >
                      {isArabic ? 'تفاصيل المشروع / The Brief' : 'Project Brief / Scope'}
                    </div>
                    <div
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                        color: 'var(--ink)',
                      }}
                    >
                      {sub.brief}
                    </div>
                  </div>

                  {/* Instant Contact Action Toolbar: WhatsApp, Call, Email */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
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
                          minHeight: '42px',
                          padding: '0 20px',
                          textDecoration: 'none',
                          fontWeight: 700,
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        💬 {isArabic ? 'تواصل عبر واتساب' : 'WhatsApp Client'}
                      </a>
                    )}

                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="button"
                        style={{
                          background: 'var(--ink)',
                          color: 'var(--paper)',
                          minHeight: '42px',
                          padding: '0 20px',
                          textDecoration: 'none',
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        📞 {isArabic ? `اتصل (${sub.phone})` : `Call ${sub.phone}`}
                      </a>
                    )}

                    {sub.email && (
                      <a
                        href={`mailto:${sub.email}?subject=${encodeURIComponent(
                          `webviewlabs · Regarding your project brief for ${sub.company}`
                        )}`}
                        className="button"
                        style={{
                          background: '#fff',
                          borderColor: 'var(--ink)',
                          minHeight: '42px',
                          padding: '0 20px',
                          textDecoration: 'none',
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        ✉️ {isArabic ? 'إرسال بريد إلكتروني' : `Email ${sub.email}`}
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
