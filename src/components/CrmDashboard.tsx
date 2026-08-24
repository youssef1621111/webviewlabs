import { useState, useEffect, useRef } from 'react'
import type { Deal, Transaction, DealWithRelations, Task, DealFilterTab } from '../lib/crm'
import { calcStudioTotals, calcDealFinancials, fmt, DEFAULT_TASKS, extractFinancialsFromSubmission } from '../lib/crm'
import { AiAnalyst } from './AiAnalyst'
import type { Locale } from '../types'

const SUPABASE_URL = 'https://xiqldupgxasaqaswcdbs.supabase.co'
const SUPABASE_KEY = 'sb_publishable_IyEQPWDQnrrC6PIHFdJWNw_K2iAA8BX'

async function dbGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  return res.json()
}

async function dbPost(table: string, body: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function dbPatch(table: string, id: string, body: any) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  })
}

async function dbDelete(table: string, id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
}

/**
 * Upload image file to Supabase storage 'receipts' bucket or fallback to Base64 Data URL
 */
async function uploadProofFile(file: File): Promise<string> {
  try {
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/receipts/${fileName}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': file.type || 'image/png',
      },
      body: file,
    })
    if (res.ok) {
      return `${SUPABASE_URL}/storage/v1/object/public/receipts/${fileName}`
    }
  } catch {
    // Fallback to data URL
  }

  // Fallback: convert file to compressed base64 data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })
}

type Props = { locale: Locale }

export function CrmDashboard({ locale }: Props) {
  const isAr = locale === 'ar'
  const [deals, setDeals] = useState<DealWithRelations[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tasksMap, setTasksMap] = useState<Record<string, Task[]>>({})
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'overview' | 'deals' | 'cash' | 'deal' | 'ai'>('overview')
  const [activeDealId, setActiveDealId] = useState<string | null>(null)
  const [dealTab, setDealTab] = useState<'financials' | 'tasks'>('tasks')
  const [dealFilter, setDealFilter] = useState<DealFilterTab>('all')

  // Payment Recording Modal
  const [paymentModalDeal, setPaymentModalDeal] = useState<DealWithRelations | null>(null)
  
  // Proof Lightbox
  const [viewingProof, setViewingProof] = useState<{ url: string; title: string; amount?: number; date?: string; source?: string } | null>(null)

  // Transaction form state (Ledger tab)
  const [txForm, setTxForm] = useState({
    deal_id: '',
    type: 'income' as 'income' | 'expense',
    label: '',
    amount: '',
    paid_at: new Date().toISOString().split('T')[0],
    source: 'InstaPay',
    proof_url: '',
  })
  const [txProofPreview, setTxProofPreview] = useState<string | null>(null)
  const [txLoading, setTxLoading] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function load() {
    setLoading(true)
    try {
      const [dealsDataRaw, txDataRaw, subsDataRaw, allTasks] = await Promise.all([
        dbGet('deals?select=*&order=created_at.desc'),
        dbGet('transactions?select=*&order=paid_at.desc'),
        dbGet('contact_submissions?select=*&order=id.desc'),
        dbGet('tasks?select=*&order=sort_order.asc'),
      ])

      const dealsData: Deal[] = Array.isArray(dealsDataRaw) ? dealsDataRaw : []
      const subsData: any[] = Array.isArray(subsDataRaw) ? subsDataRaw : []
      const txData: Transaction[] = Array.isArray(txDataRaw) ? txDataRaw : []

      // 1. Auto-sync missing deals from submissions and auto-extract financials
      const dealBySubId = new Map<number, Deal>(dealsData.map((d) => [d.submission_id, d]))
      for (const sub of subsData) {
        const deal = dealBySubId.get(sub.id)
        const fin = extractFinancialsFromSubmission(sub)

        if (!deal) {
          try {
            const res = await dbPost('deals', {
              submission_id: sub.id,
              deal_title: sub.company || 'Unnamed Client',
              total_value: fin.total,
              deposit_amount: fin.deposit,
              final_amount: fin.finalVal,
              notes: sub.brief || '',
              deposit_paid_at: sub.status === 'in_progress' || sub.status === 'finished' ? new Date().toISOString() : null,
              final_paid_at: sub.status === 'finished' ? new Date().toISOString() : null,
              delivered_at: sub.status === 'finished' ? new Date().toISOString() : null,
            })
            if (Array.isArray(res) && res[0]) {
              dealsData.push(res[0])
              dealBySubId.set(sub.id, res[0])
            }
          } catch { /* ignore */ }
        } else if ((deal.total_value === 0 || !deal.total_value) && fin.total > 0) {
          try {
            await dbPatch('deals', deal.id, {
              total_value: fin.total,
              deposit_amount: fin.deposit,
              final_amount: fin.finalVal,
            })
            deal.total_value = fin.total
            deal.deposit_amount = fin.deposit
            deal.final_amount = fin.finalVal
          } catch { /* ignore */ }
        }
      }

      const subMap: Record<number, any> = {}
      subsData.forEach((s: any) => { subMap[s.id] = s })

      const tMap: Record<string, Task[]> = {}
      ;(Array.isArray(allTasks) ? allTasks : []).forEach((t: Task) => {
        if (!tMap[t.deal_id]) tMap[t.deal_id] = []
        tMap[t.deal_id].push(t)
      })
      setTasksMap(tMap)

      const enriched: DealWithRelations[] = dealsData.map((d: Deal) => ({
        ...d,
        submission: subMap[d.submission_id],
        tasks: tMap[d.id] || [],
      }))
      setDeals(enriched)
      setTransactions(txData)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => { load() }, [])

  const totals = calcStudioTotals(deals, transactions, tasksMap)
  const activeDeal = deals.find((d) => d.id === activeDealId) || null

  async function addTransaction() {
    if (!txForm.label || !txForm.amount) return
    setTxLoading(true)
    await dbPost('transactions', {
      deal_id: txForm.deal_id || null,
      type: txForm.type,
      label: txForm.label,
      amount: parseFloat(txForm.amount),
      paid_at: txForm.paid_at,
      source: txForm.source,
      proof_url: txForm.proof_url || null,
    })
    setTxForm((p) => ({ ...p, label: '', amount: '', proof_url: '' }))
    setTxProofPreview(null)
    setTxLoading(false)
    showToast('✓ Transaction logged in ledger')
    load()
  }

  async function deleteTransaction(id: string) {
    if (!confirm('Delete this transaction?')) return
    await dbDelete('transactions', id)
    showToast('Transaction deleted')
    load()
  }

  // Segmented deals filtering
  const filteredDeals = deals.filter((deal) => {
    const fin = calcDealFinancials(deal, transactions, tasksMap[deal.id])
    if (dealFilter === 'deposit_paid') return fin.hasDepositPaid
    if (dealFilter === 'awaiting_deposit') return fin.isAwaitingDeposit
    if (dealFilter === 'paid_in_full') return fin.isFullyPaid
    if (dealFilter === 'completed_and_paid') return fin.isCompletedAndPaid
    return true
  })

  // Summary Card Helper
  function SummaryCard({ label, value, color, sub, badge }: { label: string; value: string; color: string; sub?: string; badge?: string }) {
    return (
      <div
        style={{
          background: '#fff',
          border: `2px solid ${color}`,
          boxShadow: `4px 4px 0 ${color}`,
          padding: '20px 24px',
          minWidth: 0,
          position: 'relative',
        }}
      >
        {badge && (
          <span
            style={{
              position: 'absolute', top: 10, right: 12,
              background: color, color: '#fff', padding: '2px 8px',
              font: '700 9px "DM Mono",monospace', textTransform: 'uppercase',
            }}
          >
            {badge}
          </span>
        )}
        <div style={{ font: '10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54', letterSpacing: '0.08em' }}>
          {label}
        </div>
        <div style={{ font: `700 26px "DM Mono",monospace`, color, marginTop: '6px' }}>{value}</div>
        {sub && <div style={{ font: '11px "DM Mono",monospace', color: '#5d5a54', marginTop: '4px' }}>{sub}</div>}
      </div>
    )
  }

  // Top Nav Button Helper
  function NavBtn({ id, label, current }: { id: typeof view; label: string; current: typeof view }) {
    return (
      <button
        onClick={() => setView(id)}
        style={{
          padding: '8px 18px',
          font: '700 11px "DM Mono",monospace',
          textTransform: 'uppercase',
          background: current === id ? '#171717' : '#fff',
          color: current === id ? '#f2efe8' : '#171717',
          border: '1px solid #171717',
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <section style={{ padding: '48px 0', minHeight: '80vh' }}>
      <div className="content-width">
        {/* Toast */}
        {toast && (
          <div
            style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
              background: '#171717', color: '#f2efe8', padding: '12px 20px',
              border: '2px solid #b52d20', boxShadow: '4px 4px 0 #b52d20',
              font: '12px "DM Mono",monospace',
            }}
          >
            {toast}
          </div>
        )}

        {/* CRM Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="eyebrow">WV / Studio CRM & Cash Drawer</span>
            <h1 style={{ fontSize: 'clamp(28px,4vw,46px)', marginTop: '8px' }}>
              {isAr ? 'إدارة العملاء والخزينة والمستحقات' : 'Client Ledger & Receivables'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ background: '#f8f6f2', border: '1px solid #c5c0b5', padding: '8px 14px', font: '11px "DM Mono",monospace' }}>
              <span>💰 In Drawer: <strong>{fmt(totals.cashIn)}</strong></span>
              <span style={{ margin: '0 8px', color: '#c5c0b5' }}>|</span>
              <span style={{ color: '#b52d20' }}>⏳ Left to Pay: <strong>{fmt(totals.totalLeftToPay)}</strong></span>
            </div>
          </div>
        </div>

        {/* CRM Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '36px', flexWrap: 'wrap', alignItems: 'center' }}>
          <NavBtn id="overview" label="💰 Cash Overview" current={view} />
          <NavBtn id="deals" label={`📁 All Deals (${deals.length})`} current={view} />
          <NavBtn id="cash" label="📒 Ledger / Transactions" current={view} />
          
          {/* AI Analyst Button */}
          <button
            onClick={() => setView('ai')}
            style={{
              padding: '8px 18px',
              font: '700 11px "DM Mono",monospace',
              textTransform: 'uppercase',
              background: view === 'ai' ? '#b52d20' : '#fff5f5',
              color: view === 'ai' ? '#fff' : '#b52d20',
              border: `1px solid #b52d20`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🤖 AI CFO
            <span style={{ background: view === 'ai' ? 'rgba(255,255,255,0.3)' : '#b52d20', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '8px' }}>
              NVIDIA
            </span>
          </button>

          <button
            onClick={load}
            style={{
              marginLeft: 'auto', padding: '8px 14px', font: '11px "DM Mono",monospace',
              border: '1px solid #c5c0b5', background: '#f8f6f2', cursor: 'pointer',
            }}
          >
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>

        {/* ═══════════════════ AI ANALYST TAB ═══════════════════ */}
        {view === 'ai' && (
          <AiAnalyst deals={deals} transactions={transactions} tasksMap={tasksMap} locale={locale} />
        )}

        {/* ═══════════════════ OVERVIEW TAB ═══════════════════ */}
        {view === 'overview' && (
          <div>
            {/* Top Metrics Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '18px',
                marginBottom: '36px',
              }}
            >
              <SummaryCard label="💰 Cash In Drawer" value={fmt(totals.cashIn)} color="#25D366" sub="All received income" badge="In Drawer" />
              <SummaryCard label="⏳ Left to Pay (Receivables)" value={fmt(totals.totalLeftToPay)} color="#f59e0b" sub="Uncollected balances" badge="Due" />
              <SummaryCard label="📊 Total Contracted" value={fmt(totals.billed)} color="#171717" sub="All deal full prices" />
              <SummaryCard label="💸 Expenses Logged" value={fmt(totals.expenses)} color="#b52d20" sub="Total studio costs" />
              <SummaryCard
                label="🏦 Net Profit"
                value={fmt(totals.netProfit)}
                color={totals.netProfit >= 0 ? '#8b5cf6' : '#b52d20'}
                sub={`${totals.margin}% net margin`}
              />
            </div>

            {/* Segmentation Quick Bar */}
            <div
              style={{
                background: '#f8f6f2',
                border: '1px solid #c5c0b5',
                padding: '16px 20px',
                marginBottom: '32px',
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span style={{ font: '700 11px "DM Mono",monospace', textTransform: 'uppercase', color: '#171717' }}>
                Pipeline Distribution:
              </span>
              <button
                onClick={() => { setDealFilter('deposit_paid'); setView('deals') }}
                style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '4px 10px', font: '700 11px "DM Mono",monospace', cursor: 'pointer' }}
              >
                💰 Deposit Paid ({totals.depositPaidCount})
              </button>
              <button
                onClick={() => { setDealFilter('awaiting_deposit'); setView('deals') }}
                style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '4px 10px', font: '700 11px "DM Mono",monospace', cursor: 'pointer' }}
              >
                ⏳ Awaiting Deposit ({totals.awaitingDepositCount})
              </button>
              <button
                onClick={() => { setDealFilter('paid_in_full'); setView('deals') }}
                style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '4px 10px', font: '700 11px "DM Mono",monospace', cursor: 'pointer' }}
              >
                💎 100% Paid in Full ({totals.fullyPaidCount})
              </button>
              <button
                onClick={() => { setDealFilter('completed_and_paid'); setView('deals') }}
                style={{ background: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff', padding: '4px 10px', font: '700 11px "DM Mono",monospace', cursor: 'pointer' }}
              >
                🎉 100% Completed & Paid ({totals.completedAndPaidCount})
              </button>
            </div>

            {/* Active Deals Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ font: '700 13px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54', margin: 0 }}>
                Active Deals — Price & Balance Breakdown
              </h2>
              <button
                onClick={() => { setDealFilter('all'); setView('deals') }}
                style={{ font: '700 11px "DM Mono",monospace', background: 'none', border: 'none', color: '#b52d20', cursor: 'pointer' }}
              >
                View segmented deals list →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {deals.length === 0 && !loading && (
                <div style={{ padding: '40px', textAlign: 'center', background: '#fff', border: '1px solid #e8e3d9', color: '#5d5a54', font: '13px "DM Mono",monospace' }}>
                  No deals yet. Open a client in the Pipeline and click "Open in CRM".
                </div>
              )}
              {deals.map((deal) => {
                const fin = calcDealFinancials(deal, transactions, tasksMap[deal.id])
                return (
                  <DealCardItem
                    key={deal.id}
                    deal={deal}
                    fin={fin}
                    onOpen={() => { setActiveDealId(deal.id); setView('deal') }}
                    onReceivePayment={() => setPaymentModalDeal(deal)}
                    onViewProof={(proof) => setViewingProof(proof)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════ ALL DEALS LIST TAB ═══════════════════ */}
        {view === 'deals' && (
          <div>
            {/* Segmented Filter Subtabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {[
                { key: 'all' as DealFilterTab, label: `🌟 All Deals (${deals.length})` },
                { key: 'deposit_paid' as DealFilterTab, label: `💰 Deposit Paid / Balance Due (${totals.depositPaidCount})` },
                { key: 'awaiting_deposit' as DealFilterTab, label: `⏳ Awaiting Deposit (${totals.awaitingDepositCount})` },
                { key: 'paid_in_full' as DealFilterTab, label: `💎 100% Paid in Full (${totals.fullyPaidCount})` },
                { key: 'completed_and_paid' as DealFilterTab, label: `🎉 100% Completed & Paid (${totals.completedAndPaidCount})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDealFilter(tab.key)}
                  style={{
                    padding: '8px 14px',
                    font: '700 11px "DM Mono",monospace',
                    textTransform: 'uppercase',
                    background: dealFilter === tab.key ? '#171717' : '#fff',
                    color: dealFilter === tab.key ? '#f2efe8' : '#171717',
                    border: '1px solid #171717',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filtered Deals List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loading && <p style={{ font: '13px "DM Mono",monospace', color: '#5d5a54' }}>Loading deals…</p>}
              {!loading && filteredDeals.length === 0 && (
                <div style={{ padding: '48px', textAlign: 'center', background: '#fff', border: '1px solid #e8e3d9', font: '13px "DM Mono",monospace', color: '#5d5a54' }}>
                  No deals match this category filter.
                </div>
              )}
              {filteredDeals.map((deal) => {
                const fin = calcDealFinancials(deal, transactions, tasksMap[deal.id])
                return (
                  <DealCardItem
                    key={deal.id}
                    deal={deal}
                    fin={fin}
                    onOpen={() => { setActiveDealId(deal.id); setView('deal') }}
                    onReceivePayment={() => setPaymentModalDeal(deal)}
                    onViewProof={(proof) => setViewingProof(proof)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════ CASH LEDGER / TRANSACTIONS TAB ═══════════════════ */}
        {view === 'cash' && (
          <CashLedgerView
            deals={deals}
            transactions={transactions}
            isAr={isAr}
            txForm={txForm}
            setTxForm={setTxForm}
            txProofPreview={txProofPreview}
            setTxProofPreview={setTxProofPreview}
            txLoading={txLoading}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
            onViewProof={(proof) => setViewingProof(proof)}
          />
        )}

        {/* ═══════════════════ SINGLE DEAL VIEW (Tasks & Financials) ═══════════════════ */}
        {view === 'deal' && activeDeal && (
          <DealDetailView
            deal={activeDeal}
            transactions={transactions.filter((t) => t.deal_id === activeDeal.id)}
            tasks={tasksMap[activeDeal.id] || []}
            isAr={isAr}
            tab={dealTab}
            setTab={setDealTab}
            onBack={() => setView('deals')}
            onReload={load}
            showToast={showToast}
            onReceivePayment={() => setPaymentModalDeal(activeDeal)}
            onViewProof={(proof) => setViewingProof(proof)}
          />
        )}

        {/* ═══════════════════ RECEIVE PAYMENT MODAL (WITH SCREENSHOT PROOF) ═══════════════════ */}
        {paymentModalDeal && (
          <ReceivePaymentModal
            deal={paymentModalDeal}
            currentFin={calcDealFinancials(paymentModalDeal, transactions, tasksMap[paymentModalDeal.id])}
            onClose={() => setPaymentModalDeal(null)}
            onSuccess={() => {
              setPaymentModalDeal(null)
              showToast('✓ Payment & proof screenshot logged successfully!')
              load()
            }}
          />
        )}

        {/* ═══════════════════ PROOF SCREENSHOT LIGHTBOX MODAL ═══════════════════ */}
        {viewingProof && (
          <div
            onClick={() => setViewingProof(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                padding: '20px',
                maxWidth: '650px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                border: '3px solid #171717',
                boxShadow: '8px 8px 0 #b52d20',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>📸 {viewingProof.title}</h3>
                  <div style={{ font: '11px "DM Mono",monospace', color: '#5d5a54', marginTop: '2px' }}>
                    {viewingProof.amount ? `Amount: ${fmt(viewingProof.amount)} · ` : ''}
                    {viewingProof.source ? `Source: ${viewingProof.source} · ` : ''}
                    {viewingProof.date ? `Date: ${new Date(viewingProof.date).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => setViewingProof(null)}
                  style={{ background: '#171717', color: '#fff', border: 'none', padding: '6px 12px', font: '700 12px "DM Mono",monospace', cursor: 'pointer' }}
                >
                  ✕ Close
                </button>
              </div>
              <div style={{ textAlign: 'center', background: '#f8f6f2', padding: '12px', border: '1px solid #e8e3d9' }}>
                <img
                  src={viewingProof.url}
                  alt="Proof Screenshot"
                  style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', border: '1px solid #ccc' }}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Deal Card Item with Full Price, Left to Pay, Progress, Proof Thumbnails
 */
function DealCardItem({
  deal, fin, onOpen, onReceivePayment, onViewProof
}: {
  deal: DealWithRelations
  fin: ReturnType<typeof calcDealFinancials>
  onOpen: () => void
  onReceivePayment: () => void
  onViewProof: (proof: any) => void
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #171717',
        boxShadow: '6px 6px 0 #171717',
        padding: '22px 26px',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ font: '700 17px "DM Sans",sans-serif' }}>
              {deal.submission?.company || '—'}
            </span>
            <span style={{ color: '#5d5a54', font: '13px "DM Sans",sans-serif' }}>·</span>
            <span style={{ color: '#b52d20', font: '700 14px "DM Mono",monospace' }}>
              {deal.deal_title || 'Unnamed Deal'}
            </span>
            {/* Status Badge */}
            {fin.isCompletedAndPaid ? (
              <span style={{ background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe', padding: '2px 8px', font: '700 10px "DM Mono",monospace' }}>
                🎉 100% Done & Paid
              </span>
            ) : fin.isFullyPaid ? (
              <span style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #a5b4fc', padding: '2px 8px', font: '700 10px "DM Mono",monospace' }}>
                💎 100% Paid in Full
              </span>
            ) : fin.hasDepositPaid ? (
              <span style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '2px 8px', font: '700 10px "DM Mono",monospace' }}>
                💰 Deposit Paid ({fin.pctPaid}%)
              </span>
            ) : (
              <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '2px 8px', font: '700 10px "DM Mono",monospace' }}>
                ⏳ Awaiting Deposit (0%)
              </span>
            )}
          </div>
          <div style={{ font: '11px "DM Mono",monospace', color: '#5d5a54', marginTop: '4px' }}>
            Client: {deal.submission?.name || '—'} · {deal.submission?.phone || '—'} · Tasks: {fin.doneTasks}/{fin.totalTasks} Done
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onReceivePayment}
            style={{
              padding: '6px 14px', font: '700 11px "DM Mono",monospace', cursor: 'pointer',
              background: '#25D366', color: '#fff', border: '1px solid #16a34a',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            📸 Receive Payment / Deposit
          </button>
          <button
            onClick={onOpen}
            style={{
              padding: '6px 14px', font: '700 11px "DM Mono",monospace', cursor: 'pointer',
              background: '#171717', color: '#f2efe8', border: '1px solid #171717',
            }}
          >
            Open Tasks & Deal →
          </button>
        </div>
      </div>

      {/* Financial Matrix Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '14px',
          background: '#f8f6f2',
          padding: '14px 18px',
          border: '1px solid #e8e3d9',
        }}
      >
        <div>
          <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>🏷️ Full Deal Price</div>
          <div style={{ font: '700 18px "DM Mono",monospace', color: '#171717' }}>{fmt(fin.totalPrice)}</div>
        </div>

        <div>
          <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>💰 Total Paid ({fin.pctPaid}%)</div>
          <div style={{ font: '700 18px "DM Mono",monospace', color: '#25D366' }}>{fmt(fin.cashIn)}</div>
        </div>

        <div>
          <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>⏳ Left to Pay</div>
          <div style={{ font: '700 18px "DM Mono",monospace', color: fin.leftToPay > 0 ? '#b52d20' : '#25D366' }}>
            {fmt(fin.leftToPay)}
          </div>
        </div>

        <div>
          <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>💸 Expenses</div>
          <div style={{ font: '700 16px "DM Mono",monospace', color: '#b52d20' }}>{fmt(fin.totalExpenses)}</div>
        </div>

        <div>
          <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>🏦 Net Profit</div>
          <div style={{ font: '700 18px "DM Mono",monospace', color: fin.netProfit >= 0 ? '#8b5cf6' : '#b52d20' }}>
            {fmt(fin.netProfit)} <span style={{ fontSize: '10px', opacity: 0.7 }}>({fin.margin}%)</span>
          </div>
        </div>
      </div>

      {/* Proof Screenshots Thumbnails Row */}
      {fin.proofs.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ font: '700 10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54' }}>
            📸 Verified Proofs ({fin.proofs.length}):
          </span>
          {fin.proofs.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onViewProof({ url: p.url, title: p.label, amount: p.amount, date: p.date, source: p.source })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '3px 8px', background: '#fff', border: '1px solid #c5c0b5',
                cursor: 'pointer', font: '11px "DM Mono",monospace', color: '#171717',
              }}
            >
              <img src={p.url} alt="Receipt thumbnail" style={{ width: 18, height: 18, objectFit: 'cover' }} />
              <span>{p.label} ({fmt(p.amount)}) ↗</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Modal to Receive Money / Deposit with Screenshot Proof Upload
 */
function ReceivePaymentModal({
  deal, currentFin, onClose, onSuccess
}: {
  deal: DealWithRelations
  currentFin: ReturnType<typeof calcDealFinancials>
  onClose: () => void
  onSuccess: () => void
}) {
  const defaultDeposit = deal.deposit_amount > 0 ? deal.deposit_amount : Math.round(deal.total_value * 0.5)
  const defaultAmount = currentFin.cashIn === 0 ? defaultDeposit : currentFin.leftToPay

  const [amount, setAmount] = useState(String(defaultAmount || ''))
  const [label, setLabel] = useState(
    currentFin.cashIn === 0
      ? `Deposit 50% — ${deal.submission?.company || deal.deal_title}`
      : `Final Balance — ${deal.submission?.company || deal.deal_title}`
  )
  const [paymentType, setPaymentType] = useState<'deposit' | 'final' | 'full' | 'custom'>(
    currentFin.cashIn === 0 ? 'deposit' : 'final'
  )
  const [source, setSource] = useState('InstaPay')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0])
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const numAmount = parseFloat(amount) || 0
  const simulatedNewPaid = currentFin.cashIn + numAmount
  const simulatedLeftToPay = Math.max(0, deal.total_value - simulatedNewPaid)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      const reader = new FileReader()
      reader.onload = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(f)
    }
  }

  function applyPreset(type: 'deposit' | 'final' | 'full') {
    setPaymentType(type)
    if (type === 'deposit') {
      const dep = deal.deposit_amount > 0 ? deal.deposit_amount : Math.round(deal.total_value * 0.5)
      setAmount(String(dep))
      setLabel(`Deposit 50% — ${deal.submission?.company || deal.deal_title}`)
    } else if (type === 'final') {
      setAmount(String(currentFin.leftToPay))
      setLabel(`Final Balance — ${deal.submission?.company || deal.deal_title}`)
    } else if (type === 'full') {
      setAmount(String(deal.total_value))
      setLabel(`100% Full Price Paid — ${deal.submission?.company || deal.deal_title}`)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!numAmount || numAmount <= 0) return

    setUploading(true)
    try {
      let proofUrl: string | null = null
      if (file) {
        proofUrl = await uploadProofFile(file)
      }

      // 1. Post transaction
      await dbPost('transactions', {
        deal_id: deal.id,
        type: 'income',
        label,
        amount: numAmount,
        paid_at: paidAt,
        source,
        proof_url: proofUrl,
      })

      // 2. Update deal timestamps
      const patchBody: any = {}
      if (paymentType === 'deposit' || currentFin.cashIn === 0) {
        patchBody.deposit_paid_at = new Date().toISOString()
      }
      if (simulatedLeftToPay === 0 || paymentType === 'full' || paymentType === 'final') {
        patchBody.final_paid_at = new Date().toISOString()
      }
      if (Object.keys(patchBody).length > 0) {
        await dbPatch('deals', deal.id, patchBody)
      }

      onSuccess()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          border: '3px solid #171717',
          boxShadow: '10px 10px 0 #171717',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <span className="eyebrow">Log Incoming Money</span>
            <h2 style={{ fontSize: '22px', margin: '4px 0 0' }}>
              Receive Payment: {deal.submission?.company}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#171717', color: '#fff', border: 'none', padding: '6px 12px', font: '700 12px "DM Mono",monospace', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Live Calculation Banner */}
        <div style={{ background: '#f8f6f2', border: '1px solid #c5c0b5', padding: '14px 18px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <div>
            <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>Full Deal Price</div>
            <div style={{ font: '700 16px "DM Mono",monospace' }}>{fmt(deal.total_value)}</div>
          </div>
          <div>
            <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>Current Paid</div>
            <div style={{ font: '700 16px "DM Mono",monospace', color: '#25D366' }}>{fmt(currentFin.cashIn)}</div>
          </div>
          <div>
            <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>Sub-Price Left</div>
            <div style={{ font: '700 16px "DM Mono",monospace', color: simulatedLeftToPay > 0 ? '#b52d20' : '#25D366' }}>
              {fmt(simulatedLeftToPay)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Quick Preset Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => applyPreset('deposit')}
              style={{
                padding: '6px 12px', font: '700 11px "DM Mono",monospace', cursor: 'pointer',
                background: paymentType === 'deposit' ? '#25D366' : '#fff',
                color: paymentType === 'deposit' ? '#fff' : '#171717',
                border: '1px solid #25D366',
              }}
            >
              💰 Deposit (50%)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('final')}
              style={{
                padding: '6px 12px', font: '700 11px "DM Mono",monospace', cursor: 'pointer',
                background: paymentType === 'final' ? '#1d70b8' : '#fff',
                color: paymentType === 'final' ? '#fff' : '#171717',
                border: '1px solid #1d70b8',
              }}
            >
              ⚡ Final Balance ({fmt(currentFin.leftToPay)})
            </button>
            <button
              type="button"
              onClick={() => applyPreset('full')}
              style={{
                padding: '6px 12px', font: '700 11px "DM Mono",monospace', cursor: 'pointer',
                background: paymentType === 'full' ? '#8b5cf6' : '#fff',
                color: paymentType === 'full' ? '#fff' : '#171717',
                border: '1px solid #8b5cf6',
              }}
            >
              💎 Full Price 100% ({fmt(deal.total_value)})
            </button>
          </div>

          {/* Amount Input */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ font: '10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54' }}>
              Amount Received ($ USD) *
            </span>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ ...inputStyle, fontSize: '18px', fontWeight: 'bold' }}
              placeholder="e.g. 1500"
            />
          </label>

          {/* Label / Reference */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ font: '10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54' }}>
              Transaction Label / Note
            </span>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={inputStyle}
            />
          </label>

          {/* Payment Source & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ font: '10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54' }}>
                Payment Source
              </span>
              <select value={source} onChange={(e) => setSource(e.target.value)} style={inputStyle}>
                {['InstaPay', 'Bank Wire', 'Vodafone Cash', 'Stripe', 'Cash', 'Other'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ font: '10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54' }}>
                Date Received
              </span>
              <input
                type="date"
                required
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                style={inputStyle}
              />
            </label>
          </div>

          {/* Screenshot / Proof Image Upload */}
          <div style={{ border: '1px dashed #c5c0b5', padding: '16px', background: '#f8f6f2' }}>
            <div style={{ font: '700 11px "DM Mono",monospace', textTransform: 'uppercase', marginBottom: '8px', color: '#171717' }}>
              📸 Upload Receipt Screenshot / Proof (Optional)
            </div>
            
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {!previewUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%', padding: '14px', font: '12px "DM Mono",monospace',
                  background: '#fff', border: '1px solid #c5c0b5', cursor: 'pointer',
                  textAlign: 'center', color: '#5d5a54',
                }}
              >
                📎 Click to upload InstaPay / Bank transfer screenshot
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  style={{ width: 64, height: 64, objectFit: 'cover', border: '1px solid #171717' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ font: '700 12px "DM Mono",monospace', color: '#25D366' }}>✓ Screenshot attached</div>
                  <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54' }}>{file?.name}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreviewUrl(null) }}
                  style={{ background: 'none', border: '1px solid #fca5a5', color: '#b52d20', padding: '4px 8px', font: '10px "DM Mono",monospace', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            style={{
              marginTop: '8px',
              padding: '14px',
              font: '700 13px "DM Mono",monospace',
              background: '#25D366',
              color: '#fff',
              border: 'none',
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {uploading ? '⏳ Recording & Uploading Proof…' : `✓ Confirm Receipt of ${fmt(numAmount)}`}
          </button>
        </form>
      </div>
    </div>
  )
}

/**
 * Deal Detail View with Full Price Input directly in Tasks & Financials
 */
function DealDetailView({
  deal, transactions, tasks, isAr, tab, setTab, onBack, onReload, showToast, onReceivePayment, onViewProof
}: {
  deal: DealWithRelations
  transactions: Transaction[]
  tasks: Task[]
  isAr: boolean
  tab: 'financials' | 'tasks'
  setTab: (t: 'financials' | 'tasks') => void
  onBack: () => void
  onReload: () => void
  showToast: (m: string) => void
  onReceivePayment: () => void
  onViewProof: (proof: any) => void
}) {
  const fin = calcDealFinancials(deal, transactions, tasks)
  const [dealTasks, setDealTasks] = useState<Task[]>(tasks)
  const [taskLoading, setTaskLoading] = useState(false)
  const [isSavingPrice, setIsSavingPrice] = useState(false)

  const [editDeal, setEditDeal] = useState({
    deal_title: deal.deal_title || '',
    total_value: String(deal.total_value || ''),
    deposit_amount: String(deal.deposit_amount || ''),
    final_amount: String(deal.final_amount || ''),
    expenses: String(deal.expenses || ''),
    notes: deal.notes || '',
  })

  useEffect(() => {
    setDealTasks(tasks)
  }, [tasks])

  async function saveDealPriceQuick(newTotalVal: number) {
    setIsSavingPrice(true)
    const dep = Math.round(newTotalVal * 0.5)
    const finVal = newTotalVal - dep
    await fetch(`${SUPABASE_URL}/rest/v1/deals?id=eq.${deal.id}`, {
      method: 'PATCH',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        total_value: newTotalVal,
        deposit_amount: dep,
        final_amount: finVal,
      }),
    })
    setEditDeal((p) => ({ ...p, total_value: String(newTotalVal), deposit_amount: String(dep), final_amount: String(finVal) }))
    setIsSavingPrice(false)
    showToast(`✓ Deal Full Price updated to ${fmt(newTotalVal)}`)
    onReload()
  }

  async function saveDealMeta() {
    setIsSavingPrice(true)
    await fetch(`${SUPABASE_URL}/rest/v1/deals?id=eq.${deal.id}`, {
      method: 'PATCH',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        deal_title: editDeal.deal_title,
        total_value: parseFloat(editDeal.total_value) || 0,
        deposit_amount: parseFloat(editDeal.deposit_amount) || 0,
        final_amount: parseFloat(editDeal.final_amount) || 0,
        expenses: parseFloat(editDeal.expenses) || 0,
        notes: editDeal.notes,
      }),
    })
    setIsSavingPrice(false)
    showToast('✓ Deal info saved')
    onReload()
  }

  async function toggleTask(task: any) {
    const next = task.status === 'done' ? 'todo' : 'done'
    const body: any = { status: next }
    if (next === 'done') body.done_at = new Date().toISOString()
    else body.done_at = null
    
    setDealTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...body } : t)))
    
    await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${task.id}`, {
      method: 'PATCH',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(body),
    })
    onReload()
  }

  async function generateDefaultTasks() {
    setTaskLoading(true)
    for (const t of DEFAULT_TASKS) {
      await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ ...t, deal_id: deal.id }),
      })
    }
    setTaskLoading(false)
    showToast('✓ 15 default tasks generated')
    onReload()
  }

  const PHASES: { key: string; label: string; color: string }[] = [
    { key: 'build', label: '🔨 Build', color: '#1d70b8' },
    { key: 'qa', label: '🔍 QA', color: '#f59e0b' },
    { key: 'launch', label: '🚀 Launch', color: '#8b5cf6' },
  ]

  const doneTasks = dealTasks.filter((t) => t.status === 'done').length
  const progress = dealTasks.length > 0 ? Math.round((doneTasks / dealTasks.length) * 100) : 0

  return (
    <div>
      {/* Back + Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onBack} style={{ padding: '6px 14px', font: '11px "DM Mono",monospace', cursor: 'pointer', border: '1px solid #c5c0b5', background: '#f8f6f2' }}>
            ← Back to Deals
          </button>
          <div>
            <h2 style={{ fontSize: '22px', margin: 0 }}>
              {deal.submission?.company} · <span style={{ color: '#b52d20' }}>{deal.deal_title || 'Deal Workspace'}</span>
            </h2>
            <div style={{ font: '11px "DM Mono",monospace', color: '#5d5a54', marginTop: '2px' }}>
              Client: {deal.submission?.name} · {deal.submission?.phone}
            </div>
          </div>
        </div>

        <button
          onClick={onReceivePayment}
          style={{
            padding: '10px 18px', font: '700 12px "DM Mono",monospace',
            background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '3px 3px 0 #16a34a', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          📸 + Receive Payment / Deposit
        </button>
      </div>

      {/* ─── LIVE PRICE & SUB-PRICE LEFT TO PAY BANNER ─── */}
      <div
        style={{
          background: '#fff',
          border: '2px solid #171717',
          boxShadow: '6px 6px 0 #171717',
          padding: '20px 24px',
          marginBottom: '28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        {/* Full Deal Price Input */}
        <div>
          <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase', marginBottom: '4px' }}>
            🏷️ Full Price of Deal ($)
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="number"
              value={editDeal.total_value}
              onChange={(e) => setEditDeal((p) => ({ ...p, total_value: e.target.value }))}
              onBlur={() => {
                const val = parseFloat(editDeal.total_value) || 0
                if (val !== deal.total_value) saveDealPriceQuick(val)
              }}
              style={{ ...inputStyle, width: '130px', fontWeight: 'bold', fontSize: '16px' }}
            />
            <button
              onClick={() => saveDealPriceQuick(parseFloat(editDeal.total_value) || 0)}
              disabled={isSavingPrice}
              style={{ padding: '0 10px', font: '700 11px "DM Mono",monospace', background: '#171717', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              {isSavingPrice ? '…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Total Paid So Far */}
        <div>
          <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>
            💰 Total Paid So Far
          </div>
          <div style={{ font: '700 22px "DM Mono",monospace', color: '#25D366' }}>
            {fmt(fin.cashIn)} <span style={{ fontSize: '12px', opacity: 0.8 }}>({fin.pctPaid}%)</span>
          </div>
        </div>

        {/* Sub-Price Left To Pay */}
        <div style={{ background: fin.leftToPay > 0 ? '#fef2f2' : '#f0fdf4', padding: '10px 14px', border: `1px solid ${fin.leftToPay > 0 ? '#fca5a5' : '#86efac'}` }}>
          <div style={{ font: '10px "DM Mono",monospace', color: fin.leftToPay > 0 ? '#991b1b' : '#166534', textTransform: 'uppercase' }}>
            ⏳ Sub-Price Left to Pay
          </div>
          <div style={{ font: '700 22px "DM Mono",monospace', color: fin.leftToPay > 0 ? '#b52d20' : '#166534' }}>
            {fmt(fin.leftToPay)}
          </div>
        </div>

        {/* Net Profit */}
        <div>
          <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>
            🏦 Net Studio Profit
          </div>
          <div style={{ font: '700 20px "DM Mono",monospace', color: fin.netProfit >= 0 ? '#8b5cf6' : '#b52d20' }}>
            {fmt(fin.netProfit)} <span style={{ fontSize: '11px', opacity: 0.7 }}>({fin.margin}%)</span>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
        {(['tasks', 'financials'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px', font: '700 11px "DM Mono",monospace', textTransform: 'uppercase',
              background: tab === t ? '#171717' : '#fff', color: tab === t ? '#f2efe8' : '#171717',
              border: '1px solid #171717', cursor: 'pointer',
            }}
          >
            {t === 'tasks' ? `✅ Deliverables & Tasks (${doneTasks}/${dealTasks.length})` : '💰 Full Financial Ledger'}
          </button>
        ))}
      </div>

      {/* ─── TASKS TAB (WITH PRICE EMBEDDED) ─── */}
      {tab === 'tasks' && (
        <div>
          {/* Progress Bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', font: '11px "DM Mono",monospace', color: '#5d5a54', marginBottom: '6px' }}>
              <span>Project Deliverables Progress</span>
              <span>{doneTasks} / {dealTasks.length} tasks done ({progress}%)</span>
            </div>
            <div style={{ height: '8px', background: '#e8e3d9', borderRadius: 0 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#25D366' : '#8b5cf6', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Empty tasks state */}
          {dealTasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8f6f2', border: '1px solid #c5c0b5', marginBottom: '24px' }}>
              <p style={{ font: '13px "DM Mono",monospace', color: '#5d5a54', marginBottom: '14px' }}>
                No tasks yet for this deal. Generate the default 15-step studio checklist?
              </p>
              <button
                onClick={generateDefaultTasks}
                disabled={taskLoading}
                style={{ padding: '10px 20px', font: '700 12px "DM Mono",monospace', background: '#171717', color: '#f2efe8', border: 'none', cursor: 'pointer' }}
              >
                {taskLoading ? 'Generating…' : '⚡ Generate Default 15 Tasks'}
              </button>
            </div>
          )}

          {/* Tasks By Phase */}
          {PHASES.map((ph) => {
            const phaseTasks = dealTasks.filter((t) => t.phase === ph.key)
            if (phaseTasks.length === 0) return null
            return (
              <div key={ph.key} style={{ marginBottom: '24px' }}>
                <div style={{ font: '700 11px "DM Mono",monospace', textTransform: 'uppercase', color: ph.color, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{ph.label}</span>
                  <span style={{ background: '#e8e3d9', padding: '2px 8px', borderRadius: '10px', font: '10px "DM Mono",monospace', color: '#5d5a54' }}>
                    {phaseTasks.filter((t) => t.status === 'done').length}/{phaseTasks.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {phaseTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 16px', background: task.status === 'done' ? '#f0fdf4' : '#fff',
                        border: `1px solid ${task.status === 'done' ? '#bbf7d0' : '#e8e3d9'}`,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onClick={() => toggleTask(task)}
                    >
                      <div
                        style={{
                          width: 18, height: 18, border: `2px solid ${task.status === 'done' ? '#25D366' : '#c5c0b5'}`,
                          background: task.status === 'done' ? '#25D366' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >
                        {task.status === 'done' && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? '#5d5a54' : '#171717' }}>
                          {task.title}
                        </div>
                        <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', marginTop: '2px' }}>
                          {task.assignee} {task.done_at ? `· Done ${new Date(task.done_at).toLocaleDateString()}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── FINANCIALS TAB ─── */}
      {tab === 'financials' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Edit Fields */}
          <div style={{ background: '#fff', border: '2px solid #171717', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ font: '700 12px "DM Mono",monospace', textTransform: 'uppercase', marginBottom: '4px' }}>
              Deal Financial Structure
            </div>
            {[
              { label: 'Deal Title', key: 'deal_title', type: 'text' },
              { label: 'Full Deal Price ($)', key: 'total_value', type: 'number' },
              { label: 'Target Deposit 50% ($)', key: 'deposit_amount', type: 'number' },
              { label: 'Target Final Balance ($)', key: 'final_amount', type: 'number' },
              { label: 'Studio Overhead Expenses ($)', key: 'expenses', type: 'number' },
            ].map(({ label, key, type }) => (
              <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ font: '10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54' }}>{label}</span>
                <input
                  type={type}
                  value={(editDeal as any)[key]}
                  onChange={(e) => setEditDeal((p) => ({ ...p, [key]: e.target.value }))}
                  style={inputStyle}
                />
              </label>
            ))}
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ font: '10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54' }}>Internal Notes</span>
              <textarea
                value={editDeal.notes}
                rows={3}
                onChange={(e) => setEditDeal((p) => ({ ...p, notes: e.target.value }))}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </label>
            <button
              onClick={saveDealMeta}
              style={{ padding: '10px', font: '700 12px "DM Mono",monospace', background: '#171717', color: '#f2efe8', border: 'none', cursor: 'pointer', marginTop: '4px' }}
            >
              ✓ Save Financial Details
            </button>
          </div>

          {/* Transactions & Proofs for This Deal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#f8f6f2', border: '1px solid #c5c0b5', padding: '16px 20px' }}>
              <div style={{ font: '700 11px "DM Mono",monospace', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Deal Payment History ({transactions.length})</span>
                <button
                  onClick={onReceivePayment}
                  style={{ background: '#25D366', color: '#fff', border: 'none', padding: '4px 10px', font: '700 10px "DM Mono",monospace', cursor: 'pointer' }}
                >
                  + Add Payment
                </button>
              </div>

              {transactions.length === 0 ? (
                <div style={{ color: '#5d5a54', font: '12px "DM Mono",monospace', textAlign: 'center', padding: '16px 0' }}>
                  No payments logged yet for this deal.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e8e3d9', font: '12px "DM Mono",monospace' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{tx.label}</div>
                      <div style={{ color: '#5d5a54', fontSize: '10px', marginTop: '2px' }}>
                        {new Date(tx.paid_at).toLocaleDateString()} · {tx.source}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {tx.proof_url && (
                        <button
                          onClick={() => onViewProof({ url: tx.proof_url!, title: tx.label, amount: tx.amount, date: tx.paid_at, source: tx.source })}
                          style={{ padding: '2px 6px', background: '#fff', border: '1px solid #c5c0b5', font: '10px "DM Mono",monospace', cursor: 'pointer' }}
                        >
                          📸 Proof
                        </button>
                      )}
                      <span style={{ fontWeight: 700, color: tx.type === 'income' ? '#25D366' : '#b52d20' }}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Cash Ledger Table View with Screenshot Proof Upload
 */
function CashLedgerView({
  deals, transactions, isAr, txForm, setTxForm, txProofPreview, setTxProofPreview, txLoading, onAddTransaction, onDeleteTransaction, onViewProof
}: {
  deals: DealWithRelations[]
  transactions: Transaction[]
  isAr: boolean
  txForm: any
  setTxForm: any
  txProofPreview: string | null
  setTxProofPreview: (p: string | null) => void
  txLoading: boolean
  onAddTransaction: () => void
  onDeleteTransaction: (id: string) => void
  onViewProof: (proof: any) => void
}) {
  const totalIn = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const ledgerFileRef = useRef<HTMLInputElement>(null)

  async function handleProofFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      const url = await uploadProofFile(f)
      setTxForm((p: any) => ({ ...p, proof_url: url }))
      setTxProofPreview(url)
    }
  }

  return (
    <div>
      {/* Totals Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Income Received', value: fmt(totalIn), color: '#25D366' },
          { label: 'Total Studio Expenses', value: fmt(totalOut), color: '#b52d20' },
          { label: 'Net Cash In Drawer', value: fmt(totalIn - totalOut), color: totalIn - totalOut >= 0 ? '#8b5cf6' : '#b52d20' },
        ].map((card) => (
          <div key={card.label} style={{ background: '#fff', border: `2px solid ${card.color}`, boxShadow: `3px 3px 0 ${card.color}`, padding: '16px 20px' }}>
            <div style={{ font: '10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54' }}>{card.label}</div>
            <div style={{ font: `700 22px "DM Mono",monospace`, color: card.color, marginTop: '4px' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Add Transaction Form */}
      <div style={{ background: '#f8f6f2', border: '1px solid #c5c0b5', padding: '20px 24px', marginBottom: '28px' }}>
        <div style={{ font: '700 11px "DM Mono",monospace', textTransform: 'uppercase', marginBottom: '14px', color: '#171717' }}>
          + Log Transaction (Income or Expense)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
          <select
            value={txForm.type}
            onChange={(e) => setTxForm((p: any) => ({ ...p, type: e.target.value }))}
            style={inputStyle}
          >
            <option value="income">💰 Income</option>
            <option value="expense">💸 Expense</option>
          </select>
          <select
            value={txForm.deal_id}
            onChange={(e) => setTxForm((p: any) => ({ ...p, deal_id: e.target.value }))}
            style={inputStyle}
          >
            <option value="">— No deal (studio overhead) —</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>{d.submission?.company} · {d.deal_title}</option>
            ))}
          </select>
          <input
            placeholder={isAr ? 'الوصف / Label' : 'Label (e.g. Deposit from Codera)'}
            value={txForm.label}
            onChange={(e) => setTxForm((p: any) => ({ ...p, label: e.target.value }))}
            style={{ ...inputStyle, minWidth: '220px' }}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount $"
            value={txForm.amount}
            onChange={(e) => setTxForm((p: any) => ({ ...p, amount: e.target.value }))}
            style={{ ...inputStyle, width: '120px' }}
          />
          <input
            type="date"
            value={txForm.paid_at}
            onChange={(e) => setTxForm((p: any) => ({ ...p, paid_at: e.target.value }))}
            style={inputStyle}
          />
          <select
            value={txForm.source}
            onChange={(e) => setTxForm((p: any) => ({ ...p, source: e.target.value }))}
            style={inputStyle}
          >
            {['InstaPay', 'Bank Wire', 'Vodafone Cash', 'Stripe', 'Cash', 'Other'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Screenshot input button */}
          <input
            type="file"
            accept="image/*"
            ref={ledgerFileRef}
            onChange={handleProofFile}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => ledgerFileRef.current?.click()}
            style={{
              padding: '10px 14px', font: '700 11px "DM Mono",monospace',
              background: txProofPreview ? '#25D366' : '#fff',
              color: txProofPreview ? '#fff' : '#171717',
              border: '1px solid #c5c0b5', cursor: 'pointer',
            }}
          >
            {txProofPreview ? '📸 Screenshot ✓' : '📎 Screenshot'}
          </button>

          <button
            onClick={onAddTransaction}
            disabled={txLoading}
            style={{
              padding: '10px 18px', font: '700 11px "DM Mono",monospace',
              background: '#171717', color: '#f2efe8', border: 'none', cursor: 'pointer',
            }}
          >
            {txLoading ? '…' : '+ Log'}
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#171717', color: '#f2efe8' }}>
              {['Date', 'Type', 'Label', 'Deal', 'Source', 'Proof', 'Amount', ''].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', font: '700 10px "DM Mono",monospace', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '28px', textAlign: 'center', color: '#5d5a54', font: '12px "DM Mono",monospace' }}>
                  No transactions yet.
                </td>
              </tr>
            )}
            {transactions.map((tx, i) => {
              const deal = deals.find((d) => d.id === tx.deal_id)
              return (
                <tr key={tx.id} style={{ background: i % 2 === 0 ? '#fff' : '#fcfbfa', borderBottom: '1px solid #e8e3d9' }}>
                  <td style={{ padding: '10px 14px', font: '11px "DM Mono",monospace', whiteSpace: 'nowrap' }}>
                    {new Date(tx.paid_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 8px', font: '700 10px "DM Mono",monospace', background: tx.type === 'income' ? '#dcfce7' : '#fee2e2', color: tx.type === 'income' ? '#166534' : '#991b1b' }}>
                      {tx.type === 'income' ? '↑ Income' : '↓ Expense'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>{tx.label}</td>
                  <td style={{ padding: '10px 14px', font: '11px "DM Mono",monospace', color: '#5d5a54' }}>
                    {deal ? `${deal.submission?.company}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', font: '11px "DM Mono",monospace' }}>{tx.source}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {tx.proof_url ? (
                      <button
                        onClick={() => onViewProof({ url: tx.proof_url!, title: tx.label, amount: tx.amount, date: tx.paid_at, source: tx.source })}
                        style={{ background: '#f8f6f2', border: '1px solid #c5c0b5', padding: '3px 8px', font: '10px "DM Mono",monospace', cursor: 'pointer' }}
                      >
                        📸 View
                      </button>
                    ) : (
                      <span style={{ color: '#aaa', fontSize: '11px' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', font: '700 13px "DM Mono",monospace', color: tx.type === 'income' ? '#25D366' : '#b52d20', whiteSpace: 'nowrap' }}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      style={{ background: 'none', border: '1px solid #fca5a5', color: '#b52d20', padding: '3px 8px', cursor: 'pointer', font: '10px "DM Mono",monospace' }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #c5c0b5',
  background: '#fff',
  fontFamily: '"DM Mono", monospace',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
}
