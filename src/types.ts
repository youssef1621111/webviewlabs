export type Locale = 'en' | 'ar'
export type Direction = 'ltr' | 'rtl'
export type PageKey = 'home' | 'about' | 'projects' | 'approach' | 'people' | 'contact' | 'admin'
export type ProjectKind = 'commerce' | 'brand'

export type Project = {
  index: string
  title: string
  category: string
  description: string
  tags: string[]
  features: string[]
  accent: 'red' | 'blue' | 'cream'
  kind: ProjectKind
  isLead?: boolean
  demoUrl: string
  demoLabel: string
}

export type ServiceItem = {
  id: string
  title: string
  badge: string
  tagline: string
  description: string
  forWhom: string
  deliverables: string[]
  timeframe: string
  cta: string
}

export type FaqItem = {
  question: string
  answer: string
  highlight?: string
}

export type ServicesCopy = {
  eyebrow: string
  title: string
  subtitle: string
  items: ServiceItem[]
}

export type FaqCopy = {
  eyebrow: string
  title: string
  subtitle: string
  items: FaqItem[]
  askMoreCta: string
  askMoreBody: string
}

export type WhatsAppCopy = {
  label: string
  tooltip: string
  number: string
  message: string
  directCta: string
}

export type Copy = {
  localeLabel: string
  nav: {
    home: string
    about: string
    work: string
    approach: string
    people: string
    contact: string
    switchTo: string
  }
  hero: {
    eyebrow: string
    title: string
    body: string
    primaryCta: string
    secondaryCta: string
    edition: string
    note: string
  }
  proof: Array<{ value: string; label: string }>
  services: ServicesCopy
  faq: FaqCopy
  whatsapp: WhatsAppCopy
  about: {
    eyebrow: string
    title: string
    body: string
    storyTitle: string
    storyBody: string
    promiseTitle: string
    promiseBody: string
    principles: Array<{ label: string; body: string }>
  }
  work: {
    eyebrow: string
    title: string
    intro: string
    filters: { all: string; commerce: string; brand: string }
    open: string
    featuresLabel: string
    featured: string
    commerceBadge: string
    commerceTitle: string
    commerceBody: string
    commerceCta: string
    bestSeller: string
  }
  approach: {
    eyebrow: string
    title: string
    body: string
    principles: Array<{ label: string; body: string }>
  }
  people: {
    eyebrow: string
    title: string
    intro: string
    founders: Array<{ name: string; role: string; body: string; linkLabel: string; link: string }>
  }
  contact: {
    eyebrow: string
    title: string
    body: string
    labels: { name: string; phone: string; email: string; company: string; brief: string; budget: string; submit: string }
    placeholders: { name: string; phone: string; email: string; company: string; brief: string }
    budgetOptions: string[]
    note: string
    success: string
    fallbackSuccess: string
    error: string
    sending: string
  }
  footer: { statement: string; legal: string }
  demo: {
    eyebrow: string
    title: string
    intro: string
    steps: string[]
    request: string
    selected: string
    start: string
    next: string
    reset: string
    ready: string
    live: string
    proof: string
  }
  projects: Project[]
}
