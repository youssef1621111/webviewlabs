import type { Locale, PageKey } from '../types'
import { pagePath } from './routes'

type SeoCopy = { title: string; description: string }

const seoCopy: Record<Locale, Record<PageKey, SeoCopy>> = {
  en: {
    home: { title: 'webviewlabs | Digital products, commerce & brand systems', description: 'webviewlabs is a Cairo-based digital studio building clear websites, commerce experiences, brand platforms, and products for ambitious businesses.' },
    about: { title: 'About webviewlabs | Digital studio for ambitious brands', description: 'Learn how webviewlabs combines strategy, design, software engineering, and AI to make businesses easier to choose online.' },
    projects: { title: 'Projects | webviewlabs digital products and commerce', description: 'Explore WebViewLabs projects including Shakalita bilingual e-commerce and Eloobor dairy products website experiences.' },
    approach: { title: 'Approach | Clear digital products for ambitious businesses', description: 'The WebViewLabs approach: make the offer legible, the product useful, and the digital experience unmistakably yours.' },
    people: { title: 'People | Youssef Mohamed and Bejimy Milad | webviewlabs', description: 'Meet Youssef Mohamed and Bejimy Milad, the founders and engineers behind WebViewLabs digital products and brand systems.' },
    contact: { title: 'Start a project | webviewlabs', description: 'Tell WebViewLabs what is changing in your business. Share your context, ambition, and constraint to begin a focused digital project.' },
    admin: { title: 'Admin Portal | webviewlabs', description: 'Internal admin portal for managing client briefs.' },
  },
  ar: {
    home: { title: 'webviewlabs | استوديو رقمي وتجارب تجارة إلكترونية وهوية للعلامات', description: 'webviewlabs استوديو رقمي من القاهرة يبني مواقع واضحة وتجارب تجارة إلكترونية ومنصات للعلامات ومنتجات رقمية للأعمال الطموحة.' },
    about: { title: 'عن webviewlabs | استوديو رقمي للعلامات الطموحة', description: 'اكتشف كيف تجمع webviewlabs بين الاستراتيجية والتصميم وهندسة البرمجيات والذكاء الاصطناعي لتجعل اختيار عملك أسهل عبر الإنترنت.' },
    projects: { title: 'مشاريع webviewlabs | منتجات رقمية وتجارة إلكترونية', description: 'تعرّف على مشاريع webviewlabs، ومنها متجر Shakalita ثنائي اللغة وموقع Eloobor لمنتجات الألبان.' },
    approach: { title: 'منهجنا | منتجات رقمية واضحة للأعمال الطموحة', description: 'منهج webviewlabs: نبسّط قيمة العرض، نصمم منتجات مفيدة، ونبني تجربة رقمية تحمل بصمتك.' },
    people: { title: 'فريق webviewlabs | يوسف محمد وبيجيمي ميلاد', description: 'تعرّف على يوسف محمد وبيجيمي ميلاد، المؤسسين والمهندسين خلف منتجات webviewlabs الرقمية وأنظمة العلامات.' },
    contact: { title: 'ابدأ مشروعك | webviewlabs', description: 'شارك webviewlabs ما الذي يتغير في عملك. اكتب السياق والطموح والقيد الأهم لبدء مشروع رقمي واضح.' },
    admin: { title: 'لوحة التحكم | webviewlabs', description: 'لوحة التحكم الداخلية لإدارة طلبات المشاريع.' },
  },
}

function siteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL
  return (configured || window.location.origin).replace(/\/$/, '')
}

function setMeta(attribute: 'name' | 'property', key: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = value
}

function setLink(rel: string, href: string, extra: Record<string, string> = {}) {
  const selector = `link[rel="${rel}"]${extra.hreflang ? `[hreflang="${extra.hreflang}"]` : ''}`
  let element = document.head.querySelector<HTMLLinkElement>(selector)
  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    element.dataset.seo = 'true'
    Object.entries(extra).forEach(([key, value]) => element!.setAttribute(key, value))
    document.head.appendChild(element)
  }
  element.dataset.seo = 'true'
  element.href = href
}

export function updateSeo(locale: Locale, page: PageKey) {
  const copy = seoCopy[locale][page]
  const base = siteUrl()
  const canonical = `${base}${pagePath(locale, page)}`
  const englishUrl = `${base}${pagePath('en', page)}`
  const arabicUrl = `${base}${pagePath('ar', page)}`

  document.title = copy.title
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  setMeta('name', 'description', copy.description)
  setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
  setMeta('name', 'author', 'webviewlabs')
  setMeta('property', 'og:title', copy.title)
  setMeta('property', 'og:description', copy.description)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:site_name', 'webviewlabs')
  setMeta('property', 'og:url', canonical)
  setMeta('property', 'og:locale', locale === 'ar' ? 'ar_EG' : 'en_US')
  setMeta('property', 'og:image', `${base}/og-image.svg`)
  setMeta('property', 'og:image:alt', 'webviewlabs — digital products with a point of view')
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', copy.title)
  setMeta('name', 'twitter:description', copy.description)
  setMeta('name', 'twitter:image', `${base}/og-image.svg`)
  setLink('canonical', canonical)
  setLink('alternate', englishUrl, { hreflang: 'en' })
  setLink('alternate', arabicUrl, { hreflang: 'ar' })
  setLink('alternate', englishUrl, { hreflang: 'x-default' })

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${base}/#organization`,
        name: 'webviewlabs',
        alternateName: 'WebViewLabs',
        url: base,
        logo: `${base}/favicon.svg`,
        description: seoCopy.en.home.description,
        founder: [
          { '@type': 'Person', name: 'Youssef Mohamed', jobTitle: 'CEO & Co-founder · Software Engineer · AI Engineer', url: 'https://www.linkedin.com/in/youssef-mohamed-53506127b/' },
          { '@type': 'Person', name: 'Bejimy Milad', jobTitle: 'Co-founder & CTO · Full-stack Developer & Engineer' },
        ],
        sameAs: ['https://www.linkedin.com/in/youssef-mohamed-53506127b/'],
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: base,
        name: 'webviewlabs',
        description: seoCopy[locale].home.description,
        publisher: { '@id': `${base}/#organization` },
        inLanguage: locale,
      },
      {
        '@type': page === 'projects' ? 'CollectionPage' : 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: copy.title,
        description: copy.description,
        isPartOf: { '@id': `${base}/#website` },
        inLanguage: locale,
      },
    ],
  }

  let script = document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]')
  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.seoJsonld = 'true'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(structuredData)
}
