import { useState, useEffect, useRef } from 'react'
import {
  documentDefinitions,
  downloadDocumentAsPdfFile,
  generatePrintableDocumentHtml,
  renderMarkdownToHtml,
  type DocumentKey,
  type DocumentPhase,
  type ClientInfo,
} from '../lib/clientDocuments'
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
  const [viewMode, setViewMode] = useState<'preview' | 'editor'>('preview')
  const [docsContent, setDocsContent] = useState<Record<string, string>>(() => {
    const merged: Record<string, string> = {}
    for (const def of documentDefinitions) {
      merged[def.key] = initialDocuments[def.key] || def.getDefaultContent(client)
    }
    return merged
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving'>('idle')
  const [copyStatus, setCopyStatus] = useState('')
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  const pdfContainerRef = useRef<HTMLDivElement>(null)

  const activeDef = documentDefinitions.find((d) => d.key === selectedDocKey) || documentDefinitions[0]
  const currentText = docsContent[selectedDocKey] || activeDef.getDefaultContent(client)

  function handleContentChange(val: string) {
    setDocsContent((prev) => ({
      ...prev,
      [selectedDocKey]: val,
    }))
    setSaveStatus('saving')
  }

  // Debounced autosave to Supabase and LocalStorage
  useEffect(() => {
    if (saveStatus !== 'saving') return
    const timer = setTimeout(async () => {
      setIsSaving(true)
      try {
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

  // Direct PDF Download
  async function handleDownloadRealPdf() {
    setIsDownloadingPdf(true)
    try {
      const cleanCompany = (client.company || 'client').replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_')
      const filename = `WV_${cleanCompany}_${activeDef.key}.pdf`
      const docTitle = isArabic ? activeDef.titleAr : activeDef.title
      await downloadDocumentAsPdfFile(
        docTitle,
        activeDef.key,
        currentText,
        client,
        filename
      )
    } catch (err) {
      console.error('Failed to generate PDF file:', err)
      alert(isArabic ? 'فشل تحميل ملف PDF' : 'Failed to download PDF')
    } finally {
      setIsDownloadingPdf(false)
    }
  }


  // Standalone Printable Window Fallback
  function handlePrintWindow() {
    const html = generatePrintableDocumentHtml(
      isArabic ? activeDef.titleAr : activeDef.title,
      activeDef.key,
      currentText,
      client
    )

    const printWindow = window.open('', '_blank', 'width=900,height=800')
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
    }
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

  const renderedPreviewHtml = renderMarkdownToHtml(currentText)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(23, 23, 23, 0.92)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '1280px',
          height: '94vh',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    font: '700 11px "DM Mono", monospace',
                    background: 'var(--ink)',
                    color: 'var(--paper)',
                    padding: '3px 8px',
                  }}
                >
                  {activeDef.phaseNumber} · {activeDef.key.toUpperCase()}
                </span>
                <strong style={{ fontSize: '15px' }}>
                  {isArabic ? activeDef.titleAr : activeDef.title}
                </strong>

                {/* View Mode Toggle */}
                <div style={{ display: 'inline-flex', border: '1px solid var(--ink)', background: '#fff', marginLeft: '12px' }}>
                  <button
                    onClick={() => setViewMode('preview')}
                    style={{
                      padding: '5px 12px',
                      font: '700 10px "DM Mono", monospace',
                      background: viewMode === 'preview' ? 'var(--ink)' : '#fff',
                      color: viewMode === 'preview' ? 'var(--paper)' : 'var(--ink)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    👁️ {isArabic ? 'معاينة التصميم' : 'Live PDF Preview'}
                  </button>
                  <button
                    onClick={() => setViewMode('editor')}
                    style={{
                      padding: '5px 12px',
                      font: '700 10px "DM Mono", monospace',
                      background: viewMode === 'editor' ? 'var(--ink)' : '#fff',
                      color: viewMode === 'editor' ? 'var(--paper)' : 'var(--ink)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    ✍️ {isArabic ? 'تعديل المحتوى' : 'Edit Text'}
                  </button>
                </div>
              </div>

              {/* Action Buttons: Real PDF Download, Print Tab, Copy, Email */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleDownloadRealPdf}
                  disabled={isDownloadingPdf}
                  className="button"
                  style={{
                    background: 'var(--red)',
                    color: '#fff',
                    borderColor: 'var(--red)',
                    minHeight: '36px',
                    padding: '0 16px',
                    fontSize: '11px',
                    fontFamily: '"DM Mono", monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '2px 2px 0 var(--ink)',
                    cursor: isDownloadingPdf ? 'wait' : 'pointer',
                  }}
                >
                  {isDownloadingPdf ? (
                    <span>⏳ {isArabic ? 'جارٍ إنشاء وتحميل PDF…' : 'Generating PDF…'}</span>
                  ) : (
                    <span>⬇️ {isArabic ? 'تحميل ملف PDF (.pdf)' : 'Download PDF File (.pdf)'}</span>
                  )}
                </button>

                <button
                  onClick={handlePrintWindow}
                  className="button"
                  title="Open isolated printable view in new window"
                  style={{
                    background: '#fff',
                    minHeight: '36px',
                    padding: '0 12px',
                    fontSize: '11px',
                    fontFamily: '"DM Mono", monospace',
                  }}
                >
                  🖨️ {isArabic ? 'طباعة' : 'Print Window'}
                </button>

                <button
                  onClick={handleCopy}
                  className="button"
                  style={{
                    background: '#fff',
                    minHeight: '36px',
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
                      minHeight: '36px',
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
                  ↺ {isArabic ? 'استعادة' : 'Reset'}
                </button>
              </div>
            </div>

            {/* Document Content View: Preview Mode vs Editor Mode */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
              {/* LIVE STYLED PDF PREVIEW CONTAINER (Used directly by html2pdf for perfect rendering) */}
              <div
                style={{
                  flex: 1,
                  padding: '32px 24px',
                  overflowY: 'auto',
                  background: '#f2efe8',
                  display: viewMode === 'preview' ? 'block' : 'none',
                }}
              >
                <div
                  ref={pdfContainerRef}
                  id="pdf-document-card"
                  style={{
                    maxWidth: '820px',
                    margin: '0 auto',
                    background: '#ffffff',
                    border: '2px solid #171717',
                    boxShadow: '8px 8px 0 #171717',
                    overflow: 'visible',
                  }}
                >
                  {/* Top Studio Header */}
                  <div
                    style={{
                      background: '#171717',
                      color: '#f2efe8',
                      padding: '24px 32px',
                      borderBottom: '4px solid #b52d20',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'inline-block',
                          background: '#f2efe8',
                          color: '#171717',
                          fontFamily: '"DM Mono", monospace',
                          fontWeight: 700,
                          fontSize: '13px',
                          padding: '4px 10px',
                          letterSpacing: '-0.04em',
                          marginBottom: '4px',
                        }}
                      >
                        WV / webviewlabs
                      </div>
                      <p
                        style={{
                          fontFamily: '"DM Mono", monospace',
                          fontSize: '10px',
                          color: '#aaa69d',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          margin: 0,
                        }}
                      >
                        Digital Studio for Ambitious Brands · Cairo / Everywhere
                      </p>
                    </div>
                    <div
                      style={{
                        textAlign: isArabic ? 'left' : 'right',
                        fontFamily: '"DM Mono", monospace',
                        fontSize: '11px',
                        color: '#aaa69d',
                        lineHeight: '1.5',
                      }}
                    >
                      <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '13px' }}>
                        {isArabic ? activeDef.titleAr : activeDef.title}
                      </div>
                      <div>Ref: WV-{client.id}-{activeDef.key.toUpperCase()}</div>
                      <div>Date: {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</div>
                    </div>
                  </div>

                  {/* Document Inner Body */}
                  <div style={{ padding: '36px 40px', background: '#ffffff' }}>
                    {/* Client Badge Card */}
                    <div
                      style={{
                        background: '#f8f6f2',
                        border: '1px solid #c5c0b5',
                        padding: '14px 20px',
                        marginBottom: '28px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ font: '10px "DM Mono", monospace', color: '#5d5a54', textTransform: 'uppercase' }}>
                          Client Name
                        </div>
                        <strong style={{ fontSize: '14px', color: '#171717' }}>{client.name}</strong>
                      </div>
                      <div>
                        <div style={{ font: '10px "DM Mono", monospace', color: '#5d5a54', textTransform: 'uppercase' }}>
                          Company / Brand
                        </div>
                        <strong style={{ fontSize: '14px', color: '#b52d20' }}>{client.company}</strong>
                      </div>
                      <div>
                        <div style={{ font: '10px "DM Mono", monospace', color: '#5d5a54', textTransform: 'uppercase' }}>
                          Phone
                        </div>
                        <strong style={{ fontSize: '14px', fontFamily: '"DM Mono", monospace' }}>{client.phone}</strong>
                      </div>
                      <div>
                        <div style={{ font: '10px "DM Mono", monospace', color: '#5d5a54', textTransform: 'uppercase' }}>
                          Email
                        </div>
                        <div style={{ fontSize: '13px' }}>{client.email || 'Not provided'}</div>
                      </div>
                    </div>

                    {/* Rendered HTML from Markdown */}
                    <div
                      className="rendered-doc-content"
                      dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }}
                      style={{ lineHeight: '1.7', fontSize: '14px' }}
                    />
                  </div>

                  {/* Studio Footer */}
                  <div
                    style={{
                      background: '#171717',
                      color: '#aaa69d',
                      padding: '20px 32px',
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '10px',
                      textAlign: 'center',
                      lineHeight: '1.6',
                      borderTop: '3px solid #b52d20',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#f2efe8', marginBottom: '2px' }}>
                      webviewlabs · Digital products with a point of view.
                    </div>
                    <div>
                      Cairo, Egypt · <a href="https://webviewlabs.vercel.app" style={{ color: '#f2efe8', textDecoration: 'none' }}>webviewlabs.vercel.app</a> · <a href="mailto:hello@webviewlabs.com" style={{ color: '#f2efe8', textDecoration: 'none' }}>hello@webviewlabs.com</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE TEXT / MARKDOWN EDITOR */}
              <div
                style={{
                  flex: 1,
                  padding: '20px',
                  overflowY: 'auto',
                  display: viewMode === 'editor' ? 'flex' : 'none',
                  flexDirection: 'column',
                }}
              >
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
                    ✍️ {isArabic ? 'عدّل أي بند أو أسعار أو تواريخ مباشرة (الحفظ تلقائي):' : 'Edit any text, terms, prices, or dates directly (autosaves automatically):'}
                  </span>
                  <span>Character count: {currentText.length}</span>
                </div>
                <textarea
                  value={currentText}
                  onChange={(e) => handleContentChange(e.target.value)}
                  style={{
                    flex: 1,
                    minHeight: '450px',
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
    </div>
  )
}
