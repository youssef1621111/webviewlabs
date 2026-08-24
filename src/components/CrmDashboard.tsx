import { useState, useEffect } from 'react'
import type { Deal, Transaction, DealWithRelations } from '../lib/crm'
import { calcStudioTotals, calcDealFinancials, fmt } from '../lib/crm'
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

type Props = { locale: Locale }

export function CrmDashboard({ locale }: Props) {
  const isAr = locale === 'ar'
  const [deals, setDeals] = useState<DealWithRelations[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'overview' | 'deals' | 'cash' | 'deal'>('overview')
  const [activeDealId, setActiveDealId] = useState<string | null>(null)
  const [dealTab, setDealTab] = useState<'financials' | 'tasks'>('financials')

  // New transaction form state
  const [txForm, setTxForm] = useState({
    deal_id: '',
    type: 'income' as 'income' | 'expense',
    label: '',
    amount: '',
    paid_at: new Date().toISOString().split('T')[0],
    source: 'InstaPay',
  })
  const [txLoading, setTxLoading] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function load() {
    setLoading(true)
    try {
      const [dealsData, txData, subsData] = await Promise.all([
        dbGet('deals?select=*&order=created_at.desc'),
        dbGet('transactions?select=*&order=paid_at.desc'),
        dbGet('contact_submissions?select=id,name,company,phone,email,status'),
      ])
      // Join submissions info onto deals
      const subMap: Record<number, any> = {}
      ;(Array.isArray(subsData) ? subsData : []).forEach((s: any) => { subMap[s.id] = s })
      const enriched: DealWithRelations[] = (Array.isArray(dealsData) ? dealsData : []).map((d: Deal) => ({
        ...d,
        submission: subMap[d.submission_id],
      }))
      setDeals(enriched)
      setTransactions(Array.isArray(txData) ? txData : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const totals = calcStudioTotals(deals, transactions)
  const activeDeal = deals.find((d) => d.id === activeDealId) || null

  async function markDepositReceived(deal: DealWithRelations) {
    const now = new Date().toISOString()
    await dbPatch('deals', deal.id, { deposit_paid_at: now })
    // Also log transaction
    await dbPost('transactions', {
      deal_id: deal.id,
      type: 'income',
      label: `Deposit 50% — ${deal.submission?.company || deal.deal_title}`,
      amount: deal.deposit_amount,
      paid_at: now.split('T')[0],
      source: 'InstaPay',
    })
    showToast('✓ Deposit marked received & logged in ledger')
    load()
  }

  async function markFinalReceived(deal: DealWithRelations) {
    const now = new Date().toISOString()
    await dbPatch('deals', deal.id, { final_paid_at: now })
    await dbPost('transactions', {
      deal_id: deal.id,
      type: 'income',
      label: `Final Balance 50% — ${deal.submission?.company || deal.deal_title}`,
      amount: deal.final_amount,
      paid_at: now.split('T')[0],
      source: 'InstaPay',
    })
    showToast('🎉 Final payment received & logged!')
    load()
  }

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
    })
    setTxForm((p) => ({ ...p, label: '', amount: '' }))
    setTxLoading(false)
    showToast('✓ Transaction logged')
    load()
  }

  async function deleteTransaction(id: string) {
    if (!confirm('Delete this transaction?')) return
    await dbDelete('transactions', id)
    load()
  }

  // Summary cards
  function SummaryCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
    return (
      <div
        style={{
          background: '#fff',
          border: `2px solid ${color}`,
          boxShadow: `4px 4px 0 ${color}`,
          padding: '20px 24px',
          minWidth: 0,
        }}
      >
        <div style={{ font: '10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54', letterSpacing: '0.08em' }}>
          {label}
        </div>
        <div style={{ font: `700 28px "DM Mono",monospace`, color, marginTop: '6px' }}>{value}</div>
        {sub && <div style={{ font: '11px "DM Mono",monospace', color: '#5d5a54', marginTop: '4px' }}>{sub}</div>}
      </div>
    )
  }

  // Nav pill
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
        <div style={{ marginBottom: '32px' }}>
          <span className="eyebrow">WV / Studio CRM</span>
          <h1 style={{ fontSize: 'clamp(28px,4vw,46px)', marginTop: '8px' }}>
            {isAr ? 'نظام إدارة العملاء والخزينة' : 'Client & Cash Management'}
          </h1>
        </div>

        {/* CRM Nav */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '36px', flexWrap: 'wrap' }}>
          <NavBtn id="overview" label="💰 Cash Overview" current={view} />
          <NavBtn id="deals" label="📁 All Deals" current={view} />
          <NavBtn id="cash" label="📒 Ledger / Transactions" current={view} />
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

        {/* ═══════════════════ OVERVIEW ═══════════════════ */}
        {view === 'overview' && (
          <div>
            {/* Summary Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '40px',
              }}
            >
              <SummaryCard label="💰 Cash In Drawer" value={fmt(totals.cashIn)} color="#25D366" sub="All income received" />
              <SummaryCard label="⏳ Awaited" value={fmt(totals.awaited)} color="#1d70b8" sub="Deposits + finals due" />
              <SummaryCard label="📊 Total Billed" value={fmt(totals.billed)} color="#171717" sub="All active deal values" />
              <SummaryCard label="💸 Expenses" value={fmt(totals.expenses)} color="#b52d20" sub="Total costs logged" />
              <SummaryCard
                label="🏦 Net Profit"
                value={fmt(totals.netProfit)}
                color={totals.netProfit >= 0 ? '#8b5cf6' : '#b52d20'}
                sub={`${totals.margin}% margin`}
              />
            </div>

            {/* Per-deal money rows */}
            <h2 style={{ font: '700 14px "DM Mono",monospace', textTransform: 'uppercase', marginBottom: '16px', color: '#5d5a54' }}>
              Active Deals — Financial Breakdown
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {deals.length === 0 && !loading && (
                <div style={{ padding: '40px', textAlign: 'center', background: '#fff', border: '1px solid #e8e3d9', color: '#5d5a54', font: '13px "DM Mono",monospace' }}>
                  No deals yet. Create deals from the pipeline by clicking "Open in CRM" on a client card.
                </div>
              )}
              {deals.map((deal) => {
                const fin = calcDealFinancials(deal, transactions)
                return (
                  <div
                    key={deal.id}
                    style={{
                      background: '#fff',
                      border: '2px solid #171717',
                      boxShadow: '6px 6px 0 #171717',
                      padding: '22px 26px',
                    }}
                  >
                    {/* Deal Header */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ font: '700 16px "DM Sans",sans-serif' }}>
                          {deal.submission?.company || '—'} · <span style={{ color: '#b52d20' }}>{deal.deal_title || 'Unnamed Deal'}</span>
                        </div>
                        <div style={{ font: '11px "DM Mono",monospace', color: '#5d5a54', marginTop: '2px' }}>
                          Client: {deal.submission?.name || '—'} · {deal.submission?.phone || '—'}
                        </div>
                      </div>
                      <button
                        onClick={() => { setActiveDealId(deal.id); setView('deal') }}
                        style={{
                          padding: '6px 14px', font: '700 11px "DM Mono",monospace', cursor: 'pointer',
                          background: '#171717', color: '#f2efe8', border: '1px solid #171717',
                        }}
                      >
                        Open Deal →
                      </button>
                    </div>

                    {/* Money Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                      <div>
                        <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>Total Value</div>
                        <div style={{ font: '700 18px "DM Mono",monospace' }}>{fmt(deal.total_value)}</div>
                      </div>
                      <div>
                        <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>Deposit 50%</div>
                        <div style={{ font: '700 16px "DM Mono",monospace', color: deal.deposit_paid_at ? '#25D366' : '#b52d20' }}>
                          {fmt(deal.deposit_amount)}
                        </div>
                        <div style={{ font: '10px "DM Mono",monospace', color: deal.deposit_paid_at ? '#25D366' : '#aaa' }}>
                          {deal.deposit_paid_at ? `✓ Received ${new Date(deal.deposit_paid_at).toLocaleDateString()}` : '⏳ Pending'}
                        </div>
                        {!deal.deposit_paid_at && deal.deposit_amount > 0 && (
                          <button
                            onClick={() => markDepositReceived(deal)}
                            style={{
                              marginTop: '6px', padding: '4px 10px', font: '700 10px "DM Mono",monospace',
                              background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer',
                            }}
                          >
                            ✓ Mark Received
                          </button>
                        )}
                      </div>
                      <div>
                        <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>Final 50%</div>
                        <div style={{ font: '700 16px "DM Mono",monospace', color: deal.final_paid_at ? '#25D366' : '#b52d20' }}>
                          {fmt(deal.final_amount)}
                        </div>
                        <div style={{ font: '10px "DM Mono",monospace', color: deal.final_paid_at ? '#25D366' : '#aaa' }}>
                          {deal.final_paid_at ? `✓ Received ${new Date(deal.final_paid_at).toLocaleDateString()}` : '⏳ Pending'}
                        </div>
                        {!deal.final_paid_at && deal.final_amount > 0 && (
                          <button
                            onClick={() => markFinalReceived(deal)}
                            style={{
                              marginTop: '6px', padding: '4px 10px', font: '700 10px "DM Mono",monospace',
                              background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer',
                            }}
                          >
                            🎉 Mark Final Received
                          </button>
                        )}
                      </div>
                      <div>
                        <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>Expenses</div>
                        <div style={{ font: '700 16px "DM Mono",monospace', color: '#b52d20' }}>{fmt(fin.totalExpenses)}</div>
                      </div>
                      <div>
                        <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase' }}>Net Profit</div>
                        <div style={{ font: '700 18px "DM Mono",monospace', color: fin.netProfit >= 0 ? '#8b5cf6' : '#b52d20' }}>
                          {fmt(fin.netProfit)} <span style={{ fontSize: '11px', opacity: 0.7 }}>({fin.margin}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════ ALL DEALS LIST ═══════════════════ */}
        {view === 'deals' && (
          <DealsListView
            deals={deals}
            transactions={transactions}
            loading={loading}
            isAr={isAr}
            onOpenDeal={(id) => { setActiveDealId(id); setView('deal') }}
            onMarkDeposit={markDepositReceived}
            onMarkFinal={markFinalReceived}
            onReload={load}
          />
        )}

        {/* ═══════════════════ CASH LEDGER ═══════════════════ */}
        {view === 'cash' && (
          <CashLedgerView
            deals={deals}
            transactions={transactions}
            isAr={isAr}
            txForm={txForm}
            setTxForm={setTxForm}
            txLoading={txLoading}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        )}

        {/* ═══════════════════ SINGLE DEAL VIEW ═══════════════════ */}
        {view === 'deal' && activeDeal && (
          <DealDetailView
            deal={activeDeal}
            transactions={transactions.filter((t) => t.deal_id === activeDeal.id)}
            isAr={isAr}
            tab={dealTab}
            setTab={setDealTab}
            onBack={() => setView('overview')}
            onReload={load}
            showToast={showToast}
          />
        )}
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════
// Sub-views as separate components in same file
// ══════════════════════════════════════════════

function DealsListView({
  deals, transactions, loading, isAr, onOpenDeal, onMarkDeposit, onMarkFinal, onReload
}: {
  deals: DealWithRelations[]
  transactions: Transaction[]
  loading: boolean
  isAr: boolean
  onOpenDeal: (id: string) => void
  onMarkDeposit: (d: DealWithRelations) => void
  onMarkFinal: (d: DealWithRelations) => void
  onReload: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {loading && <p style={{ font: '13px "DM Mono",monospace', color: '#5d5a54' }}>Loading deals…</p>}
      {!loading && deals.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center', background: '#fff', border: '1px solid #e8e3d9', font: '13px "DM Mono",monospace', color: '#5d5a54' }}>
          No deals in CRM yet. Open a client card in the Pipeline and click "Open in CRM".
        </div>
      )}
      {deals.map((deal) => {
        const fin = calcDealFinancials(deal, transactions)
        return (
          <div
            key={deal.id}
            style={{
              background: '#fff', border: '2px solid #171717',
              boxShadow: '5px 5px 0 #171717', padding: '20px 24px',
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', justifyContent: 'space-between',
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ font: '700 15px "DM Sans",sans-serif' }}>
                {deal.submission?.company} · <span style={{ color: '#b52d20' }}>{deal.deal_title}</span>
              </div>
              <div style={{ font: '11px "DM Mono",monospace', color: '#5d5a54', marginTop: '2px' }}>
                {deal.submission?.name} · Total: {fmt(deal.total_value)} · Profit: <strong style={{ color: fin.netProfit >= 0 ? '#25D366' : '#b52d20' }}>{fmt(fin.netProfit)}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {!deal.deposit_paid_at && deal.deposit_amount > 0 && (
                <button onClick={() => onMarkDeposit(deal)} style={{ padding: '6px 12px', font: '700 10px "DM Mono",monospace', background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  ✓ Deposit Rcvd
                </button>
              )}
              {!deal.final_paid_at && deal.final_amount > 0 && (
                <button onClick={() => onMarkFinal(deal)} style={{ padding: '6px 12px', font: '700 10px "DM Mono",monospace', background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  🎉 Final Rcvd
                </button>
              )}
              <button onClick={() => onOpenDeal(deal.id)} style={{ padding: '6px 14px', font: '700 11px "DM Mono",monospace', background: '#171717', color: '#f2efe8', border: 'none', cursor: 'pointer' }}>
                Open →
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CashLedgerView({
  deals, transactions, isAr, txForm, setTxForm, txLoading, onAddTransaction, onDeleteTransaction
}: {
  deals: DealWithRelations[]
  transactions: Transaction[]
  isAr: boolean
  txForm: any
  setTxForm: any
  txLoading: boolean
  onAddTransaction: () => void
  onDeleteTransaction: (id: string) => void
}) {
  const totalIn = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div>
      {/* Totals Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Income', value: fmt(totalIn), color: '#25D366' },
          { label: 'Total Expenses', value: fmt(totalOut), color: '#b52d20' },
          { label: 'Net Cash', value: fmt(totalIn - totalOut), color: totalIn - totalOut >= 0 ? '#8b5cf6' : '#b52d20' },
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
          + Log Transaction
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
            style={{ ...inputStyle, minWidth: '240px' }}
          />
          <input
            type="number"
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
            {['InstaPay', 'Bank Wire', 'Stripe', 'Cash', 'Vodafone Cash', 'Other'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={onAddTransaction}
            disabled={txLoading}
            style={{
              padding: '10px 18px', font: '700 11px "DM Mono",monospace',
              background: '#171717', color: '#f2efe8', border: 'none', cursor: 'pointer',
            }}
          >
            {txLoading ? '…' : '+ Add'}
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#171717', color: '#f2efe8' }}>
              {['Date', 'Type', 'Label', 'Deal', 'Source', 'Amount', ''].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', font: '700 10px "DM Mono",monospace', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: '#5d5a54', font: '12px "DM Mono",monospace' }}>
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

function DealDetailView({
  deal, transactions, isAr, tab, setTab, onBack, onReload, showToast
}: {
  deal: DealWithRelations
  transactions: Transaction[]
  isAr: boolean
  tab: 'financials' | 'tasks'
  setTab: (t: 'financials' | 'tasks') => void
  onBack: () => void
  onReload: () => void
  showToast: (m: string) => void
}) {
  const fin = calcDealFinancials(deal, transactions)
  const [tasks, setTasks] = useState<any[]>([])
  const [taskLoading, setTaskLoading] = useState(false)
  const [editDeal, setEditDeal] = useState({
    deal_title: deal.deal_title || '',
    total_value: String(deal.total_value || ''),
    deposit_amount: String(deal.deposit_amount || ''),
    final_amount: String(deal.final_amount || ''),
    expenses: String(deal.expenses || ''),
    notes: deal.notes || '',
  })

  async function loadTasks() {
    setTaskLoading(true)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/tasks?deal_id=eq.${deal.id}&order=sort_order.asc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
    setTaskLoading(false)
  }

  useEffect(() => { loadTasks() }, [deal.id])

  async function saveDealMeta() {
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
    showToast('✓ Deal info saved')
    onReload()
  }

  async function toggleTask(task: any) {
    const next = task.status === 'done' ? 'todo' : 'done'
    const body: any = { status: next }
    if (next === 'done') body.done_at = new Date().toISOString()
    else body.done_at = null
    await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${task.id}`, {
      method: 'PATCH',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(body),
    })
    loadTasks()
  }

  async function generateDefaultTasks() {
    const { DEFAULT_TASKS } = await import('../lib/crm')
    for (const t of DEFAULT_TASKS) {
      await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ ...t, deal_id: deal.id }),
      })
    }
    loadTasks()
    showToast('✓ Default tasks created for this deal')
  }

  const PHASES: { key: string; label: string; color: string }[] = [
    { key: 'build', label: '🔨 Build', color: '#1d70b8' },
    { key: 'qa', label: '🔍 QA', color: '#f59e0b' },
    { key: 'launch', label: '🚀 Launch', color: '#8b5cf6' },
  ]

  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0

  return (
    <div>
      {/* Back + Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ padding: '6px 14px', font: '11px "DM Mono",monospace', cursor: 'pointer', border: '1px solid #c5c0b5', background: '#f8f6f2' }}>
          ← Back
        </button>
        <div>
          <h2 style={{ fontSize: '22px', margin: 0 }}>
            {deal.submission?.company} · <span style={{ color: '#b52d20' }}>{deal.deal_title || 'Deal Details'}</span>
          </h2>
          <div style={{ font: '11px "DM Mono",monospace', color: '#5d5a54', marginTop: '2px' }}>
            {deal.submission?.name} · {deal.submission?.phone}
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
        {(['financials', 'tasks'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px', font: '700 11px "DM Mono",monospace', textTransform: 'uppercase',
              background: tab === t ? '#171717' : '#fff', color: tab === t ? '#f2efe8' : '#171717',
              border: '1px solid #171717', cursor: 'pointer',
            }}
          >
            {t === 'financials' ? '💰 Financials' : `✅ Tasks (${doneTasks}/${tasks.length})`}
          </button>
        ))}
      </div>

      {/* FINANCIALS TAB */}
      {tab === 'financials' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left: edit fields */}
          <div style={{ background: '#fff', border: '2px solid #171717', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ font: '700 12px "DM Mono",monospace', textTransform: 'uppercase', marginBottom: '4px' }}>Deal Info & Financials</div>
            {[
              { label: 'Deal Title', key: 'deal_title', type: 'text' },
              { label: 'Total Value ($)', key: 'total_value', type: 'number' },
              { label: 'Deposit 50% ($)', key: 'deposit_amount', type: 'number' },
              { label: 'Final Balance ($)', key: 'final_amount', type: 'number' },
              { label: 'Overhead Expenses ($)', key: 'expenses', type: 'number' },
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
              ✓ Save Deal Info
            </button>
          </div>

          {/* Right: calculated summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: '💰 Cash Received', value: fmt(fin.cashIn), color: '#25D366' },
              { label: '⏳ Deposit Due', value: fmt(fin.depositDue), color: fin.depositDue > 0 ? '#f59e0b' : '#25D366' },
              { label: '⏳ Final Due', value: fmt(fin.finalDue), color: fin.finalDue > 0 ? '#1d70b8' : '#25D366' },
              { label: '💸 Total Expenses', value: fmt(fin.totalExpenses), color: '#b52d20' },
              { label: '🏦 Net Profit', value: `${fmt(fin.netProfit)} (${fin.margin}%)`, color: fin.netProfit >= 0 ? '#8b5cf6' : '#b52d20' },
            ].map((row) => (
              <div key={row.label} style={{ background: '#fff', border: `2px solid ${row.color}`, boxShadow: `3px 3px 0 ${row.color}`, padding: '14px 18px' }}>
                <div style={{ font: '10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54' }}>{row.label}</div>
                <div style={{ font: '700 20px "DM Mono",monospace', color: row.color, marginTop: '4px' }}>{row.value}</div>
              </div>
            ))}

            {/* Deal Transactions */}
            {transactions.length > 0 && (
              <div style={{ background: '#f8f6f2', border: '1px solid #c5c0b5', padding: '14px 18px' }}>
                <div style={{ font: '700 10px "DM Mono",monospace', textTransform: 'uppercase', marginBottom: '10px' }}>Transactions for This Deal</div>
                {transactions.map((tx) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e8e3d9', font: '12px "DM Mono",monospace' }}>
                    <span style={{ color: '#5d5a54' }}>{new Date(tx.paid_at).toLocaleDateString()} · {tx.label}</span>
                    <span style={{ fontWeight: 700, color: tx.type === 'income' ? '#25D366' : '#b52d20' }}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TASKS TAB */}
      {tab === 'tasks' && (
        <div>
          {/* Progress Bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', font: '11px "DM Mono",monospace', color: '#5d5a54', marginBottom: '6px' }}>
              <span>Project Progress</span>
              <span>{doneTasks} / {tasks.length} tasks done ({progress}%)</span>
            </div>
            <div style={{ height: '8px', background: '#e8e3d9', borderRadius: 0 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#25D366' : '#8b5cf6', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Generate Tasks Button if empty */}
          {tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8f6f2', border: '1px solid #c5c0b5', marginBottom: '24px' }}>
              <p style={{ font: '13px "DM Mono",monospace', color: '#5d5a54', marginBottom: '14px' }}>
                No tasks yet. Generate the default 15-task build/QA/launch checklist?
              </p>
              <button
                onClick={generateDefaultTasks}
                style={{ padding: '10px 20px', font: '700 12px "DM Mono",monospace', background: '#171717', color: '#f2efe8', border: 'none', cursor: 'pointer' }}
              >
                ⚡ Generate Default Tasks
              </button>
            </div>
          )}

          {/* Tasks by Phase */}
          {PHASES.map((ph) => {
            const phaseTasks = tasks.filter((t) => t.phase === ph.key)
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

const SUPABASE_URL = 'https://xiqldupgxasaqaswcdbs.supabase.co'
const SUPABASE_KEY = 'sb_publishable_IyEQPWDQnrrC6PIHFdJWNw_K2iAA8BX'
