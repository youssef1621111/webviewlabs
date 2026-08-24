// CRM Types — matches DB schema

export type Deal = {
  id: string
  submission_id: number
  deal_title: string
  total_value: number
  deposit_amount: number
  final_amount: number
  deposit_paid_at: string | null
  final_paid_at: string | null
  signed_at: string | null
  delivered_at: string | null
  expenses: number
  notes: string
  created_at: string
}

export type Task = {
  id: string
  deal_id: string
  title: string
  phase: 'pitch' | 'legal' | 'onboarding' | 'build' | 'qa' | 'launch'
  status: 'todo' | 'in_progress' | 'done' | 'blocked'
  assignee: string
  due_date: string | null
  done_at: string | null
  sort_order: number
  created_at: string
}

export type Transaction = {
  id: string
  deal_id: string | null
  type: 'income' | 'expense'
  label: string
  amount: number
  paid_at: string
  source: string
  proof_url: string | null
  created_at: string
}

export type DealWithRelations = Deal & {
  submission?: {
    id: number
    name: string
    company: string
    phone: string
    email?: string | null
    status?: string
  }
  tasks?: Task[]
  transactions?: Transaction[]
}

// Default tasks auto-created when deal moves to in_progress
export const DEFAULT_TASKS: Omit<Task, 'id' | 'deal_id' | 'created_at'>[] = [
  // Build
  { title: 'Figma Design — Homepage, About, Services, Contact', phase: 'build', status: 'todo', assignee: 'Both', due_date: null, done_at: null, sort_order: 1 },
  { title: 'Client Design Approval Round', phase: 'build', status: 'todo', assignee: 'Youssef', due_date: null, done_at: null, sort_order: 2 },
  { title: 'Frontend Development — All Pages', phase: 'build', status: 'todo', assignee: 'Bejimy', due_date: null, done_at: null, sort_order: 3 },
  { title: 'CMS / Admin Integration', phase: 'build', status: 'todo', assignee: 'Bejimy', due_date: null, done_at: null, sort_order: 4 },
  { title: 'Contact Form + SMS/Email Notifications', phase: 'build', status: 'todo', assignee: 'Bejimy', due_date: null, done_at: null, sort_order: 5 },
  // QA
  { title: 'Cross-browser Testing (Chrome, Safari, Firefox)', phase: 'qa', status: 'todo', assignee: 'Both', due_date: null, done_at: null, sort_order: 6 },
  { title: 'Mobile Responsive QA', phase: 'qa', status: 'todo', assignee: 'Both', due_date: null, done_at: null, sort_order: 7 },
  { title: 'PageSpeed / Core Web Vitals Audit', phase: 'qa', status: 'todo', assignee: 'Bejimy', due_date: null, done_at: null, sort_order: 8 },
  { title: 'SEO Meta Tags Review', phase: 'qa', status: 'todo', assignee: 'Youssef', due_date: null, done_at: null, sort_order: 9 },
  { title: 'Content Copy Final Review with Client', phase: 'qa', status: 'todo', assignee: 'Youssef', due_date: null, done_at: null, sort_order: 10 },
  // Launch
  { title: 'Domain DNS Configuration + SSL', phase: 'launch', status: 'todo', assignee: 'Bejimy', due_date: null, done_at: null, sort_order: 11 },
  { title: 'Final Invoice Sent to Client', phase: 'launch', status: 'todo', assignee: 'Youssef', due_date: null, done_at: null, sort_order: 12 },
  { title: 'Final Payment Received ✓', phase: 'launch', status: 'todo', assignee: 'Youssef', due_date: null, done_at: null, sort_order: 13 },
  { title: 'Code Repo Handover to Client', phase: 'launch', status: 'todo', assignee: 'Bejimy', due_date: null, done_at: null, sort_order: 14 },
  { title: 'Client Training Call / Handoff Meeting', phase: 'launch', status: 'todo', assignee: 'Both', due_date: null, done_at: null, sort_order: 15 },
]

// Financial helpers
export function calcDealFinancials(deal: Deal, transactions: Transaction[]) {
  const dealTx = transactions.filter((t) => t.deal_id === deal.id)
  const cashIn = dealTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const cashOut = dealTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = deal.expenses + cashOut
  const netProfit = cashIn - totalExpenses
  const margin = cashIn > 0 ? Math.round((netProfit / cashIn) * 100) : 0
  const depositDue = !deal.deposit_paid_at ? deal.deposit_amount : 0
  const finalDue = !deal.final_paid_at ? deal.final_amount : 0
  return { cashIn, totalExpenses, netProfit, margin, depositDue, finalDue }
}

export function calcStudioTotals(deals: Deal[], allTransactions: Transaction[]) {
  const cashIn = allTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = allTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const netProfit = cashIn - expenses
  const margin = cashIn > 0 ? Math.round((netProfit / cashIn) * 100) : 0

  const activeDeals = deals.filter((d) => d.submission_id) // all deals
  const billed = activeDeals.reduce((s, d) => s + d.total_value, 0)

  const awaited = activeDeals.reduce((s, d) => {
    const depositPending = !d.deposit_paid_at ? d.deposit_amount : 0
    const finalPending = !d.final_paid_at ? d.final_amount : 0
    return s + depositPending + finalPending
  }, 0)

  return { cashIn, expenses, netProfit, margin, billed, awaited }
}

export function fmt(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
