// CRM & Financial Ledger Types

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

export type ExpenseFrequency = 'one_time' | 'monthly' | 'yearly' | 'weekly' | 'daily'
export type ExpenseCategory = 'hosting' | 'domain' | 'tools' | 'contractor' | 'marketing' | 'legal' | 'other'

export type ExpenseItem = {
  id: string
  deal_id: string
  task_id: string | null
  title: string
  amount: number
  frequency: ExpenseFrequency
  category: ExpenseCategory
  paid_at: string
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
  expensesList?: ExpenseItem[]
}

export type DealFilterTab =
  | 'all'
  | 'deposit_paid'
  | 'awaiting_deposit'
  | 'paid_in_full'
  | 'completed_and_paid'

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
export function calcDealFinancials(
  deal: Deal | DealWithRelations,
  transactions: Transaction[],
  tasks?: Task[],
  expenseItems: ExpenseItem[] = []
) {
  const dealTx = transactions.filter((t) => t.deal_id === deal.id)
  const incomeTx = dealTx.filter((t) => t.type === 'income')
  const expenseTx = dealTx.filter((t) => t.type === 'expense')

  const dealExpenses = expenseItems.filter((e) => e.deal_id === deal.id)
  const itemExpensesTotal = dealExpenses.reduce((s, e) => s + (e.amount || 0), 0)

  // Cash In: actual payments received (deposits + milestones + finals)
  const cashIn = incomeTx.reduce((s, t) => s + t.amount, 0)
  
  // Cash Out: expenses directly logged in transactions + task/deal expense items
  const txExpenses = expenseTx.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = (deal.expenses || 0) + txExpenses + itemExpensesTotal

  // Contract Price and Sub-price Left to Pay
  const totalPrice = deal.total_value || 0
  const leftToPay = Math.max(0, totalPrice - cashIn)
  const pctPaid = totalPrice > 0 ? Math.min(100, Math.round((cashIn / totalPrice) * 100)) : (cashIn > 0 ? 100 : 0)

  // Realized Profit (Actual Cash In Drawer right now after expenses)
  const realizedNetProfit = cashIn - totalExpenses
  const realizedMargin = cashIn > 0 ? Math.round((realizedNetProfit / cashIn) * 100) : 0

  // Projected Profit (Total profit when 100% of deal price is collected)
  const projectedNetProfit = totalPrice - totalExpenses
  const projectedMargin = totalPrice > 0 ? Math.round((projectedNetProfit / totalPrice) * 100) : 0

  // Categorization status
  const isFullyPaid = totalPrice > 0 ? cashIn >= totalPrice : (cashIn > 0 && !!deal.final_paid_at)
  const hasDepositPaid = (totalPrice > 0 && cashIn > 0 && cashIn < totalPrice) || (!!deal.deposit_paid_at && leftToPay > 0)
  const isAwaitingDeposit = cashIn === 0 && !deal.deposit_paid_at

  const proofCount = incomeTx.filter((t) => !!t.proof_url).length
  const proofs = incomeTx.filter((t) => !!t.proof_url).map((t) => ({
    label: t.label,
    amount: t.amount,
    date: t.paid_at,
    url: t.proof_url as string,
    source: t.source,
  }))

  const dealTasks = tasks || dealWithTasks(deal)
  const totalTasks = dealTasks.length
  const doneTasks = dealTasks.filter((t) => t.status === 'done').length
  const isWorkFinished = (totalTasks > 0 && doneTasks === totalTasks) || ('submission' in deal && deal.submission?.status === 'finished')

  return {
    cashIn,
    totalExpenses,
    realizedNetProfit,
    realizedMargin,
    projectedNetProfit,
    projectedMargin,
    totalPrice,
    leftToPay,
    pctPaid,
    isFullyPaid,
    hasDepositPaid,
    isAwaitingDeposit,
    proofCount,
    proofs,
    dealTx,
    incomeTx,
    expenseTx,
    dealExpenses,
    itemExpensesTotal,
    totalTasks,
    doneTasks,
    isWorkFinished,
    isCompletedAndPaid: isWorkFinished && isFullyPaid,
  }
}

function dealWithTasks(deal: any): Task[] {
  return Array.isArray(deal.tasks) ? deal.tasks : []
}

export function calcStudioTotals(
  deals: Deal[],
  allTransactions: Transaction[],
  tasksMap: Record<string, Task[]> = {},
  allExpenses: ExpenseItem[] = []
) {
  const cashIn = allTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const txExpenses = allTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)
  const itemExpenses = allExpenses.reduce((s, e) => s + (e.amount || 0), 0)
  
  const totalExpenses = txExpenses + itemExpenses
  const netProfit = cashIn - totalExpenses
  const margin = cashIn > 0 ? Math.round((netProfit / cashIn) * 100) : 0

  const activeDeals = deals.filter((d) => d.submission_id)
  const billed = activeDeals.reduce((s, d) => s + (d.total_value || 0), 0)

  let totalLeftToPay = 0
  let totalDepositsCollected = 0
  let awaitingDepositCount = 0
  let depositPaidCount = 0
  let fullyPaidCount = 0
  let completedAndPaidCount = 0

  for (const deal of activeDeals) {
    const fin = calcDealFinancials(deal, allTransactions, tasksMap[deal.id], allExpenses)
    totalLeftToPay += fin.leftToPay
    if (fin.hasDepositPaid) {
      totalDepositsCollected += fin.cashIn
      depositPaidCount++
    } else if (fin.isAwaitingDeposit) {
      awaitingDepositCount++
    }
    if (fin.isFullyPaid) {
      fullyPaidCount++
    }
    if (fin.isCompletedAndPaid) {
      completedAndPaidCount++
    }
  }

  return {
    cashIn,
    expenses: totalExpenses,
    netProfit,
    margin,
    billed,
    totalLeftToPay,
    totalDepositsCollected,
    awaitingDepositCount,
    depositPaidCount,
    fullyPaidCount,
    completedAndPaidCount,
    activeDealsCount: activeDeals.length,
  }
}

export function fmt(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function extractFinancialsFromSubmission(sub: any) {
  let total = 0
  if (sub.documents && typeof sub.documents === 'object') {
    if (sub.documents.deposit_invoice) {
      const text = String(sub.documents.deposit_invoice)
      const match = text.match(/Total Project Value:\s*\$([0-9,]+(\.[0-9]{2})?)/i)
      if (match && match[1]) {
        total = parseFloat(match[1].replace(/,/g, '')) || 0
      }
    }
    if (!total && sub.documents.final_invoice) {
      const text = String(sub.documents.final_invoice)
      const match = text.match(/Total Project Value:\s*\$([0-9,]+(\.[0-9]{2})?)/i)
      if (match && match[1]) {
        total = parseFloat(match[1].replace(/,/g, '')) || 0
      }
    }
  }
  if (!total && sub.deal_value && /^[0-9.]+$/.test(String(sub.deal_value))) {
    total = parseFloat(sub.deal_value) || 0
  }
  if (!total && sub.budget) {
    if (sub.budget === 'Under $5k') total = 3500
    else if (sub.budget === '$5k - $10k') total = 7500
    else if (sub.budget === '$10k - $20k') total = 15000
    else if (sub.budget === '$20k+') total = 25000
  }
  const deposit = Math.round(total * 0.5)
  const finalVal = total - deposit
  return { total, deposit, finalVal }
}
