import { useState, useRef, useEffect } from 'react'
import type { Deal, Transaction, DealWithRelations } from '../lib/crm'
import { calcStudioTotals, calcDealFinancials, fmt } from '../lib/crm'

const NVIDIA_API_KEY = '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'
const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1'
const MODEL = 'nvidia/nemotron-3-ultra-550b-a55b'

type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
  thinking?: string
}

// ─── Build a rich system prompt from real CRM data ───────────────────────────
function buildSystemPrompt(
  deals: DealWithRelations[],
  transactions: Transaction[]
): string {
  const totals = calcStudioTotals(deals, transactions)

  const dealsJson = deals.map((d) => {
    const fin = calcDealFinancials(d, transactions)
    const dealTxs = transactions.filter((t) => t.deal_id === d.id)
    return {
      id: d.id.slice(0, 8),
      client: d.submission?.company || 'Unknown',
      name: d.submission?.name,
      deal: d.deal_title,
      status: d.submission?.status || 'unknown',
      total_value: d.total_value,
      deposit: d.deposit_amount,
      final: d.final_amount,
      deposit_received: !!d.deposit_paid_at,
      final_received: !!d.final_paid_at,
      expenses: fin.totalExpenses,
      net_profit: fin.netProfit,
      profit_margin_pct: fin.margin,
      signed_at: d.signed_at,
      delivered_at: d.delivered_at,
      transactions: dealTxs.map((t) => ({
        type: t.type,
        label: t.label,
        amount: t.amount,
        date: t.paid_at,
        source: t.source,
      })),
    }
  })

  const allTxJson = transactions.slice(0, 50).map((t) => ({
    type: t.type,
    label: t.label,
    amount: t.amount,
    date: t.paid_at,
    source: t.source,
  }))

  const incomeByMonth: Record<string, number> = {}
  const expenseByMonth: Record<string, number> = {}
  for (const tx of transactions) {
    const month = tx.paid_at?.slice(0, 7) || 'unknown'
    if (tx.type === 'income') incomeByMonth[month] = (incomeByMonth[month] || 0) + tx.amount
    else expenseByMonth[month] = (expenseByMonth[month] || 0) + tx.amount
  }

  return `You are "Studio AI", a world-class CRM analyst and business consultant embedded inside webviewlabs — a Cairo-based boutique digital studio building high-performance bilingual websites for ambitious brands.

Your job is to:
1. Analyze the studio's real financial and client data provided below
2. Surface actionable insights, revenue risks, growth opportunities
3. Verify data integrity and flag extraction issues
4. Answer any question the founders ask with precision and confidence
5. Give specific recommendations tailored to a 2-founder boutique studio
6. When useful, describe charts or visualizations clearly in text (the UI will render them)
7. Think like a CFO + CRO + business coach

## Studio Snapshot (Live Data as of ${new Date().toLocaleDateString()})

### P&L Summary
- Cash In Drawer (total received): ${fmt(totals.cashIn)}
- Total Awaited (unpaid): ${fmt(totals.awaited)}
- Total Billed: ${fmt(totals.billed)}
- Total Expenses: ${fmt(totals.expenses)}
- Net Profit: ${fmt(totals.netProfit)} (${totals.margin}% margin)
- Active Deals: ${deals.length}

### All Deals (${deals.length} total)
${JSON.stringify(dealsJson, null, 2)}

### Monthly Income Trend
${JSON.stringify(incomeByMonth, null, 2)}

### Monthly Expenses Trend
${JSON.stringify(expenseByMonth, null, 2)}

### Recent Transactions (last 50)
${JSON.stringify(allTxJson, null, 2)}

## Your Persona
- Name: Studio AI
- Tone: Sharp, direct, professional — like a CFO who also cares about the product
- Language: Match the user (English or Arabic)
- Always be honest about data gaps or integrity issues
- Proactively flag risks (e.g. client hasn't paid final, deal stuck in progress, low margins)
- When asked for a chart, describe it using a format like: CHART:BAR:[label1:value1,label2:value2,...] or CHART:LINE:[...] or CHART:PIE:[...] — the UI renders these automatically`
}

// ─── Parse chart tags from AI response ───────────────────────────────────────
type ChartData = { type: 'BAR' | 'LINE' | 'PIE'; data: { label: string; value: number }[] }

function parseCharts(text: string): { cleaned: string; charts: ChartData[] } {
  const charts: ChartData[] = []
  const cleaned = text.replace(
    /CHART:(BAR|LINE|PIE):\[([^\]]+)\]/g,
    (_, type: 'BAR' | 'LINE' | 'PIE', raw) => {
      const data = raw.split(',').map((pair: string) => {
        const [label, value] = pair.split(':')
        return { label: label?.trim() || '', value: parseFloat(value) || 0 }
      })
      charts.push({ type, data })
      return `[see chart below]`
    }
  )
  return { cleaned, charts }
}

// ─── Inline SVG Charts ────────────────────────────────────────────────────────
function BarChart({ data, label }: { data: { label: string; value: number }[]; label?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const W = 520
  const barW = Math.min(60, Math.floor((W - 40) / data.length) - 8)
  const H = 180
  const COLORS = ['#b52d20', '#171717', '#1d70b8', '#25D366', '#8b5cf6', '#f59e0b']

  return (
    <div style={{ margin: '16px 0', background: '#f8f6f2', padding: '16px', border: '1px solid #e8e3d9' }}>
      {label && <div style={{ font: '700 10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54', marginBottom: '10px' }}>{label}</div>}
      <svg width="100%" viewBox={`0 0 ${W} ${H + 40}`} style={{ overflow: 'visible', maxWidth: W }}>
        {data.map((d, i) => {
          const barH = Math.max(4, (d.value / max) * H)
          const x = 20 + i * (barW + 8)
          const y = H - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={COLORS[i % COLORS.length]} />
              <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#5d5a54" fontFamily="monospace">
                {d.label.length > 8 ? d.label.slice(0, 8) + '…' : d.label}
              </text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="#171717" fontFamily="monospace" fontWeight="bold">
                {d.value >= 1000 ? `$${(d.value / 1000).toFixed(1)}k` : d.value.toFixed(0)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function PieChart({ data, label }: { data: { label: string; value: number }[]; label?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const COLORS = ['#b52d20', '#1d70b8', '#25D366', '#8b5cf6', '#f59e0b', '#171717']
  let cumulAngle = 0
  const R = 70
  const CX = 90
  const CY = 90

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI
    const startAngle = cumulAngle
    cumulAngle += angle
    const x1 = CX + R * Math.cos(startAngle - Math.PI / 2)
    const y1 = CY + R * Math.sin(startAngle - Math.PI / 2)
    const x2 = CX + R * Math.cos(cumulAngle - Math.PI / 2)
    const y2 = CY + R * Math.sin(cumulAngle - Math.PI / 2)
    const largeArc = angle > Math.PI ? 1 : 0
    return { d: `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: COLORS[i % COLORS.length], label: d.label, pct: Math.round((d.value / total) * 100) }
  })

  return (
    <div style={{ margin: '16px 0', background: '#f8f6f2', padding: '16px', border: '1px solid #e8e3d9', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
      {label && <div style={{ width: '100%', font: '700 10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54', marginBottom: '8px' }}>{label}</div>}
      <svg width={180} height={180} viewBox="0 0 180 180">
        {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="#fff" strokeWidth={1.5} />)}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', font: '11px "DM Mono",monospace' }}>
            <div style={{ width: 10, height: 10, background: s.color, flexShrink: 0 }} />
            <span style={{ color: '#171717' }}>{s.label} — <strong>{s.pct}%</strong></span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LineChart({ data, label }: { data: { label: string; value: number }[]; label?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const W = 520
  const H = 140

  const points = data.map((d, i) => ({
    x: 20 + (i / Math.max(data.length - 1, 1)) * (W - 40),
    y: H - (d.value / max) * (H - 20),
    label: d.label,
    value: d.value,
  }))

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div style={{ margin: '16px 0', background: '#f8f6f2', padding: '16px', border: '1px solid #e8e3d9' }}>
      {label && <div style={{ font: '700 10px "DM Mono",monospace', textTransform: 'uppercase', color: '#5d5a54', marginBottom: '10px' }}>{label}</div>}
      <svg width="100%" viewBox={`0 0 ${W} ${H + 30}`} style={{ maxWidth: W }}>
        <polyline points={polyline} fill="none" stroke="#b52d20" strokeWidth="2" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#b52d20" />
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill="#171717" fontFamily="monospace" fontWeight="bold">
              {p.value >= 1000 ? `$${(p.value / 1000).toFixed(1)}k` : p.value.toFixed(0)}
            </text>
            <text x={p.x} y={H + 20} textAnchor="middle" fontSize="8" fill="#5d5a54" fontFamily="monospace">
              {p.label.length > 7 ? p.label.slice(0, 7) : p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function RenderCharts({ charts }: { charts: ChartData[] }) {
  return (
    <>
      {charts.map((c, i) => {
        if (c.type === 'BAR') return <BarChart key={i} data={c.data} label={`Chart ${i + 1}`} />
        if (c.type === 'PIE') return <PieChart key={i} data={c.data} label={`Chart ${i + 1}`} />
        if (c.type === 'LINE') return <LineChart key={i} data={c.data} label={`Chart ${i + 1}`} />
        return null
      })}
    </>
  )
}

// ─── Quick insight prompts ────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: '📊 Full Business Analysis', prompt: 'Give me a comprehensive analysis of our studio business. Cover revenue health, deal pipeline, profit margins, payment collection risks, and top 3 growth recommendations. Include charts: monthly income trend and deal value breakdown by client.' },
  { label: '🚨 Risk Flags', prompt: 'Identify all financial and operational risks in our current pipeline. Are there deals stuck without payment? Clients who have not paid deposits or finals? Low margin projects? Flag everything.' },
  { label: '💰 Cash Flow Forecast', prompt: 'Based on our active deals and payment patterns, forecast our expected cash flow for the next 2 months. When should we expect payments and what is our realistic cash position? Show a chart.' },
  { label: '📈 Revenue Breakdown', prompt: 'Break down our revenue by client and show which deals are most profitable. Create a PIE chart of revenue by client and a BAR chart of profit margin per deal.' },
  { label: '🔍 Verify Data Integrity', prompt: 'Review all our deal and transaction data. Flag any extraction errors, missing values, deals with inconsistent financials (e.g. deposit + final != total), or suspicious entries.' },
  { label: '💡 Growth Advice', prompt: 'Based on our current client base, deal sizes, and margins, what should we do to grow revenue by 50% in the next 6 months? Be specific and practical for a 2-person studio in Cairo.' },
]


// ─── Main AI Analyst Component ────────────────────────────────────────────────
type Props = {
  deals: DealWithRelations[]
  transactions: Transaction[]
  locale: string
}

export function AiAnalyst({ deals, transactions, locale }: Props) {
  const isAr = locale === 'ar'
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingText, setThinkingText] = useState('')
  const [showThinking, setShowThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const systemPrompt = buildSystemPrompt(deals, transactions)

  async function sendMessage(userText: string) {
    if (!userText.trim() || isStreaming) return
    setError(null)

    const newMessages: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)
    setIsThinking(false)
    setThinkingText('')

    // Placeholder for streaming assistant message
    const assistantIndex = newMessages.length
    setMessages((prev) => [...prev, { role: 'assistant', content: '', thinking: '' }])

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
        method: 'POST',
        signal: abort.signal,
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...newMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 4096,
          extra_body: { chat_template_kwargs: { enable_thinking: true } },
          stream: true,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`API error ${res.status}: ${errText}`)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let contentBuf = ''
      let thinkingBuf = ''

      while (reader) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta
            if (!delta) continue

            // Handle thinking tokens
            const thinking = delta.reasoning_content
            if (thinking) {
              thinkingBuf += thinking
              setThinkingText(thinkingBuf)
              setIsThinking(true)
              setMessages((prev) => {
                const updated = [...prev]
                updated[assistantIndex] = { ...updated[assistantIndex], thinking: thinkingBuf }
                return updated
              })
            }

            // Handle content tokens
            const content = delta.content
            if (content) {
              setIsThinking(false)
              contentBuf += content
              setMessages((prev) => {
                const updated = [...prev]
                updated[assistantIndex] = { ...updated[assistantIndex], content: contentBuf }
                return updated
              })
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error('AI error:', err)
      setError(err.message || 'Connection to Studio AI failed.')
      setMessages((prev) => {
        const updated = [...prev]
        updated[assistantIndex] = {
          role: 'assistant',
          content: `⚠️ Studio AI encountered an error: ${err.message}. Check your internet connection or API key.`,
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
      setIsThinking(false)
      abortRef.current = null
    }
  }

  function stop() {
    abortRef.current?.abort()
    setIsStreaming(false)
    setIsThinking(false)
  }

  function clearChat() {
    setMessages([])
    setError(null)
  }

  const totals = calcStudioTotals(deals, transactions)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '80vh', gap: 0 }}>

      {/* AI Header */}
      <div
        style={{
          background: '#171717',
          color: '#f2efe8',
          padding: '20px 24px',
          borderBottom: '3px solid #b52d20',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ background: '#b52d20', color: '#fff', padding: '3px 8px', font: '700 10px "DM Mono",monospace' }}>
              STUDIO AI · CRM ANALYST
            </div>
            <div
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isStreaming ? '#f59e0b' : '#25D366',
                boxShadow: `0 0 6px ${isStreaming ? '#f59e0b' : '#25D366'}`,
              }}
            />
            <span style={{ font: '10px "DM Mono",monospace', color: '#aaa69d' }}>
              {isThinking ? '⚙️ Thinking…' : isStreaming ? '✍️ Writing…' : '● Ready'}
            </span>
          </div>
          <div style={{ font: '10px "DM Mono",monospace', color: '#aaa69d' }}>
            Powered by NVIDIA Nemotron · Analyzing {deals.length} deals · {fmt(totals.cashIn)} in drawer · {fmt(totals.netProfit)} net profit
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              style={{ padding: '6px 12px', font: '10px "DM Mono",monospace', background: 'transparent', border: '1px solid #555', color: '#aaa69d', cursor: 'pointer' }}
            >
              🗑️ Clear
            </button>
          )}
          {isStreaming && (
            <button
              onClick={stop}
              style={{ padding: '6px 12px', font: '700 10px "DM Mono",monospace', background: '#b52d20', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              ⏹ Stop
            </button>
          )}
        </div>
      </div>

      {/* Quick Prompts */}
      <div style={{ background: '#f8f6f2', padding: '12px 20px', borderBottom: '1px solid #e8e3d9', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => sendMessage(qp.prompt)}
            disabled={isStreaming}
            style={{
              padding: '6px 12px',
              font: '700 10px "DM Mono",monospace',
              background: '#fff',
              border: '1px solid #c5c0b5',
              color: '#171717',
              cursor: isStreaming ? 'not-allowed' : 'pointer',
              opacity: isStreaming ? 0.5 : 1,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: '#fcfbfa',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5d5a54' }}>
            <div style={{ font: '700 32px "DM Mono",monospace', color: '#171717', marginBottom: '8px' }}>Studio AI</div>
            <div style={{ font: '14px "DM Sans",sans-serif', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
              Your CRM analyst with full visibility into your deals, cash flow, and business health. Ask me anything or pick a quick insight above.
            </div>
            <div style={{ marginTop: '20px', font: '11px "DM Mono",monospace', color: '#b52d20' }}>
              {deals.length} deals · {fmt(totals.cashIn)} received · {fmt(totals.netProfit)} net profit · {fmt(totals.awaited)} awaited
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === 'system') return null
          const isUser = msg.role === 'user'
          const { cleaned, charts } = parseCharts(msg.content || '')

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: '8px' }}>
              {/* Role badge */}
              <div style={{ font: '10px "DM Mono",monospace', color: '#5d5a54', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isUser ? '👤 You' : '🤖 Studio AI'}
              </div>

              {/* Thinking box */}
              {!isUser && msg.thinking && (
                <div style={{ width: '100%', maxWidth: '720px' }}>
                  <button
                    onClick={() => setShowThinking((p) => !p)}
                    style={{ font: '10px "DM Mono",monospace', color: '#f59e0b', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '4px' }}
                  >
                    {showThinking ? '▼ Hide reasoning' : '▶ Show AI reasoning'}
                  </button>
                  {showThinking && (
                    <div style={{ background: '#fffbeb', border: '1px dashed #f59e0b', padding: '12px 16px', font: '11px "DM Mono",monospace', color: '#92400e', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                      {msg.thinking}
                    </div>
                  )}
                </div>
              )}

              {/* Message bubble */}
              <div
                style={{
                  maxWidth: '720px',
                  width: isUser ? 'auto' : '100%',
                  background: isUser ? '#171717' : '#fff',
                  color: isUser ? '#f2efe8' : '#171717',
                  padding: '16px 20px',
                  border: isUser ? 'none' : '1px solid #e8e3d9',
                  boxShadow: isUser ? '3px 3px 0 #b52d20' : '3px 3px 0 #e8e3d9',
                  font: '13px/1.7 "DM Sans",sans-serif',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {cleaned || (isStreaming && i === messages.length - 1 ? <span style={{ color: '#b52d20' }}>▌</span> : '…')}
              </div>

              {/* Charts */}
              {!isUser && charts.length > 0 && (
                <div style={{ width: '100%', maxWidth: '720px' }}>
                  <RenderCharts charts={charts} />
                </div>
              )}
            </div>
          )
        })}

        {/* Streaming thinking indicator */}
        {isThinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', font: '11px "DM Mono",monospace', color: '#f59e0b' }}>
            <span style={{ animation: 'pulse 1s infinite' }}>⚙️</span>
            <span>Studio AI is reasoning…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '16px 20px',
          background: '#fff',
          borderTop: '2px solid #171717',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage(input)
            }
          }}
          placeholder={isAr ? 'اكتب سؤالك هنا… (Enter للإرسال)' : 'Ask Studio AI anything about your business… (Enter to send, Shift+Enter for newline)'}
          disabled={isStreaming}
          rows={2}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '14px',
            border: '1px solid #c5c0b5',
            resize: 'none',
            outline: 'none',
            background: isStreaming ? '#f8f6f2' : '#fff',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isStreaming || !input.trim()}
          style={{
            padding: '12px 20px',
            font: '700 12px "DM Mono",monospace',
            background: isStreaming || !input.trim() ? '#c5c0b5' : '#b52d20',
            color: '#fff',
            border: 'none',
            cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
            minWidth: '80px',
            height: '48px',
          }}
        >
          {isStreaming ? '⏳' : '→ Send'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 20px', background: '#fff2f0', color: '#b52d20', font: '12px "DM Mono",monospace', borderTop: '1px solid #fecaca' }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}
