import { useState, useEffect } from 'react'
import { documentDefinitions, type DocumentKey, type DocumentPhase, type ClientInfo } from '../lib/clientDocuments'
import { supabase } from '../lib/supabase'
import type { Locale } from '../types'

const SUPABASE_URL = 'https://xiqldupgxasaqaswcdbs.supabase.co'
const SUPABASE_KEY = 'sb_publishable_IyEQPWDQnrrC6PIHFdJWNw_K2iAA8BX'

type ClientDocumentSuiteProps = {
  client: ClientInfo
  initialDocuments?: Record<string, string>
  locale: Locale
  onClose: () => void
  onSaved?: (docs: Record<string, string>) => void
}

export function ClientDocumentSuite({
  client,
  initialDocuments = {},
  locale,
  onClose,
  onSaved,
}: ClientDocumentSuiteProps) {
  const isArabic = locale === 'ar'

  const [selectedDocKey, setSelectedDocKey] = useState<DocumentKey>('deposit_invoice')
  const [docsContent, setDocsContent] = useState<Record<string, string>>(() => {
    // Populate all defaults or saved initial docs
    const merged: Record<string, string> = {}
    for (const def of documentDefinitions) {
      merged[def.key] = initialDocuments[def.key] || def.getDefaultContent(client)
    }
    return merged
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving'>('idle')
  const [copyStatus, setCopyStatus] = useState('')

  const activeDef = documentDefinitions.find((d) => d.key === selectedDocKey) || documentDefinitions[0]
  const currentText = docsContent[selectedDocKey] || activeDef.getDefaultContent(client)

  function handleContentChange(val: string) {
    setDocsContent((prev) => ({
      ...prev,
      [selectedDocKey]: val,
    }))
    setSaveStatus('saving')
  }

  // Debounced autosave
  useEffect(() => {
    if (saveStatus !== 'saving') return
    const timer = setTimeout(async () => {
      setIsSaving(true)
      try {
        // 1. Save to Supabase
        if (supabase) {
          await supabase
            .from('contact_submissions')
            .update({ documents: docsContent })
            .eq('id', client.id)
        } else {
          await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions?id=eq.${client.id}`, {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ documents: docsContent }),
          })
        }
        // 2. Save to localStorage fallback
        localStorage.setItem(`wv_docs_${client.id}`, JSON.stringify(docsContent))
        setSaveStatus('saved')
        if (onSaved) onSaved(docsContent)
      } catch (err) {
        console.error('Failed to autosave documents:', err)
      } finally {
        setIsSaving(false)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [docsContent, saveStatus, client.id, onSaved])

  function resetToDefault() {
    const confirmed = window.confirm(
      isArabic
        ? 'هل تريد استعادة النص الافتراضي لهذا المستند؟'
        : 'Reset this document back to default studio template?'
    )
    if (!confirmed) return
    const defaultText = activeDef.getDefaultContent(client)
    handleContentChange(defaultText)
  }

  function handlePrintPdf() {
    window.print()
  }

  function handleCopy() {
    navigator.clipboard.writeText(currentText)
    setCopyStatus(isArabic ? 'تم النسخ!' : 'Copied!')
    setTimeout(() => setCopyStatus(''), 2500)
  }

  function handleEmail() {
    const subject = encodeURIComponent(`${activeDef.title} · webviewlabs (${client.company})`)
    const body = encodeURIComponent(currentText)
    window.open(`mailto:${client.email || ''}?subject=${subject}&body=${body}`, '_blank')
  }

  const phases: { phase: DocumentPhase; title: string; number: string; icon: string }[] = [
    { phase: 'pitch', title: isArabic ? 'المرحلة الأولى: العرض المبدئي' : 'Phase 1: The Pitch', number: '01', icon: '🎯' },
    { phase: 'legal', title: isArabic ? 'المرحلة الثانية: العقود والقانونيات' : 'Phase 2: The Legalities', number: '02', icon: '⚖️' },
    { phase: 'onboarding', title: isArabic ? 'المرحلة الثالثة: الإيداع وبدء العمل' : 'Phase 3: Financials & Onboarding', number: '03', icon: '💳' },
    { phase: 'wrapup', title: isArabic ? 'المرحلة الرابعة: التسليم النهائي' : 'Phase 4: Project Wrap-Up', number: '04', icon: '🚀' },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(23, 23, 23, 0.88)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="doc-modal-container"
        style={{
          width: '100%',
          maxWidth: '1200px',
          height: '92vh',
          background: '#ffffff',
          border: '2px solid var(--ink)',
          boxShadow: '12px 12px 0 var(--ink)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'var(--ink)',
            color: 'var(--paper)',
            padding: '18px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderBottom: '3px solid var(--red)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                font: '700 13px "DM Mono", monospace',
                background: 'var(--red)',
                color: '#fff',
                padding: '4px 8px',
              }}
            >
              WV / DOCUMENTS
            </span>
            <div>
              <h2 style={{ fontSize: '18px', margin: 0, color: '#fff' }}>
                {client.company} · {isArabic ? 'حزمة وثائق وفواتير المشروع' : 'Studio Project & Invoicing Suite'}
              </h2>
              <span style={{ font: '11px "DM Mono", monospace', color: '#aaa69d' }}>
                Client: {client.name} · {client.phone} {client.email ? `· ${client.email}` : ''}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {saveStatus === 'saved' && (
              <span style={{ font: '11px "DM Mono", monospace', color: '#4ade80' }}>
                ✓ {isArabic ? 'محفوظ في قاعدة البيانات' : 'Autosaved'}
              </span>
            )}
            {isSaving && (
              <span style={{ font: '11px "DM Mono", monospace', color: '#ff8b74' }}>
                {isArabic ? 'جارٍ الحفظ…' : 'Saving…'}
              </span>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #555',
                color: '#fff',
                padding: '6px 12px',
                font: '700 13px "DM Mono", monospace',
                cursor: 'pointer',
              }}
            >
              ✕ {isArabic ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>

        {/* Modal Body: Left Sidebar (Phases & Docs) + Right Editor & PDF Preview */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar: Phased Documents Navigation */}
          <div
            style={{
              width: '320px',
              background: '#f8f6f2',
              borderRight: '1px solid var(--line)',
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {phases.map((ph) => {
              const phaseDocs = documentDefinitions.filter((d) => d.phase === ph.phase)
              return (
                <div key={ph.phase}>
                  <div
                    style={{
                      font: '700 10px "DM Mono", monospace',
                      textTransform: 'uppercase',
                      color: 'var(--red)',
                      letterSpacing: '0.08em',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{ph.icon}</span>
                    <span>{ph.title}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {phaseDocs.map((doc) => {
                      const isSelected = selectedDocKey === doc.key
                      return (
                        <button
                          key={doc.key}
                          onClick={() => setSelectedDocKey(doc.key)}
                          style={{
                            textAlign: isArabic ? 'right' : 'left',
                            padding: '10px 12px',
                            background: isSelected ? 'var(--ink)' : '#fff',
                            color: isSelected ? 'var(--paper)' : 'var(--ink)',
                            border: isSelected ? '1px solid var(--ink)' : '1px solid var(--line)',
                            font: '12px "DM Mono", monospace',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>
                            {isArabic ? doc.titleAr : doc.title}
                          </div>
                          <div
                            style={{
                              fontSize: '10px',
                              opacity: isSelected ? 0.8 : 0.6,
                              marginTop: '2px',
                            }}
                          >
                            {doc.key === 'deposit_invoice' && '💰 Kickoff 50% Deposit'}
                            {doc.key === 'final_invoice' && '🚀 Handover 50% Balance'}
                            {doc.key === 'contract' && '⚖️ Master MSA Agreement'}
                            {doc.key === 'proposal' && '🎯 Scopes & Pricing Tiers'}
                            {doc.key === 'sow' && '📋 Pages & Features Breakdown'}
                            {doc.key === 'nda' && '🔒 Confidentiality Agreement'}
                            {doc.key === 'access_form' && '🔑 Credentials Collection'}
                            {doc.key === 'content_checklist' && '📦 Logos & Media Assets'}
                            {doc.key === 'creative_brief' && '🎨 Design Mood & Goals'}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Area: Document Live Editor & PDF Actions */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: '#ffffff',
            }}
          >
            {/* Toolbar */}
            <div
              style={{
                padding: '12px 20px',
                background: '#f2efe8',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div>
                <span
                  style={{
                    font: '700 11px "DM Mono", monospace',
                    background: 'var(--ink)',
                    color: 'var(--paper)',
                    padding: '3px 8px',
                    marginRight: '8px',
                  }}
                >
                  {activeDef.phaseNumber} · {activeDef.key.toUpperCase()}
                </span>
                <strong style={{ fontSize: '15px' }}>
                  {isArabic ? activeDef.titleAr : activeDef.title}
                </strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handlePrintPdf}
                  className="button"
                  style={{
                    background: 'var(--red)',
                    color: '#fff',
                    borderColor: 'var(--red)',
                    minHeight: '34px',
                    padding: '0 14px',
                    fontSize: '11px',
                    fontFamily: '"DM Mono", monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  🖨️ {isArabic ? 'تحميل / طباعة PDF' : 'Download / Print PDF'}
                </button>

                <button
                  onClick={handleCopy}
                  className="button"
                  style={{
                    background: '#fff',
                    minHeight: '34px',
                    padding: '0 12px',
                    fontSize: '11px',
                    fontFamily: '"DM Mono", monospace',
                  }}
                >
                  {copyStatus || (isArabic ? '📋 نسخ النص' : '📋 Copy Text')}
                </button>

                {client.email && (
                  <button
                    onClick={handleEmail}
                    className="button"
                    style={{
                      background: '#fff',
                      minHeight: '34px',
                      padding: '0 12px',
                      fontSize: '11px',
                      fontFamily: '"DM Mono", monospace',
                    }}
                  >
                    ✉️ {isArabic ? 'إرسال بريد' : 'Email Client'}
                  </button>
                )}

                <button
                  onClick={resetToDefault}
                  title="Reset to default template"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--line)',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontFamily: '"DM Mono", monospace',
                    cursor: 'pointer',
                    color: '#666',
                  }}
                >
                  ↺ {isArabic ? 'استعادة الافتراضي' : 'Reset'}
                </button>
              </div>
            </div>

            {/* Document Live Editor Area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    font: '11px "DM Mono", monospace',
                    color: 'var(--muted)',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    ✍️ {isArabic ? 'يمكنك تعديل أي بند أو أسعار أو تواريخ مباشرة (الحفظ تلقائي):' : 'Edit any text, terms, prices, or dates directly (autosaves automatically):'}
                  </span>
                  <span>Character count: {currentText.length}</span>
                </div>
                <textarea
                  value={currentText}
                  onChange={(e) => handleContentChange(e.target.value)}
                  style={{
                    flex: 1,
                    minHeight: '400px',
                    padding: '20px',
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '13px',
                    lineHeight: '1.7',
                    background: '#fcfbfa',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                    outline: 'none',
                    resize: 'none',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Print Container for High Quality PDF Export */}
      <div id="print-area" className="print-only">
        <div style={{ padding: '40px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#171717', background: '#fff' }}>
          {/* Header */}
          <div style={{ borderBottom: '3px solid #b52d20', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '18px', letterSpacing: '-0.05em' }}>
                WV / webviewlabs
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                Digital Studio for Ambitious Brands · Cairo, Egypt · https://webviewlabs.vercel.app
              </div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>
              <div>{activeDef.title.toUpperCase()}</div>
              <div>Ref: WV-{client.id}-{activeDef.key.toUpperCase()}</div>
              <div>Date: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Printable Text Content */}
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '1.8', fontFamily: 'Georgia, serif' }}>
            {currentText}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '50px', borderTop: '1px solid #ccc', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888', fontFamily: 'monospace' }}>
            <div>webviewlabs Studio Edition · Cairo / Everywhere</div>
            <div>hello@webviewlabs.com</div>
          </div>
        </div>
      </div>
    </div>
  )
}
