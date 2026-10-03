import { useEffect, useMemo, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { AdminPortal } from './components/AdminPortal'
import { CommerceSpotlight } from './components/CommerceSpotlight'
import { ContactForm } from './components/ContactForm'
import { DirectFaq } from './components/DirectFaq'
import { Founders } from './components/Founders'
import { Header } from './components/Header'
import { LiveDemo } from './components/LiveDemo'
import { ServicesGrid } from './components/ServicesGrid'
import { WhatsAppButton } from './components/WhatsAppButton'
import { WorkGrid } from './components/WorkGrid'
import { content } from './content'
import { localeFromPathname, pageFromPathname, pagePath } from './lib/routes'
import { updateSeo } from './lib/seo'
import type { Copy, Locale, PageKey } from './types'

function PageMast({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return <div className="page-mast"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div><p>{body}</p></div>
}

function HomePage({ copy, locale }: { copy: Copy; locale: Locale }) {
  return <>
    <section className="hero section-pad">
      <div className="hero-grid content-width">
        <div className="hero-copy">
          <span className="eyebrow">{copy.hero.eyebrow}</span>
          <h1>{copy.hero.title}</h1>
          <p className="hero-body">{copy.hero.body}</p>
          <div className="hero-actions">
            <a className="button button-dark" href={pagePath(locale, 'contact')}>
              {copy.hero.primaryCta}
              <span aria-hidden="true">↗</span>
            </a>
            <a className="button button-paper" href={`#services`}>
              {locale === 'ar' ? 'ماذا نقدّم؟' : 'What we build'}
              <span aria-hidden="true">↓</span>
            </a>
            <a className="text-link" href={pagePath(locale, 'projects')}>
              {copy.hero.secondaryCta}
              <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="hero-note">
            <span className="note-line" />
            <span>{copy.hero.note}</span>
          </div>
        </div>
        <div className="hero-demo"><LiveDemo copy={copy} locale={locale} /></div>
      </div>
      <div className="proof-bar content-width">
        {copy.proof.map((item) => (
          <div className="proof-item" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>

    <ServicesGrid copy={copy} locale={locale} />

    <section className="section-pad section-rule content-width home-spotlight-wrap">
      <CommerceSpotlight copy={copy} locale={locale} />
    </section>

    <DirectFaq copy={copy} locale={locale} />

    <section className="home-message section-pad section-rule">
      <div className="content-width home-message-grid">
        <div>
          <span className="eyebrow">{copy.about.promiseTitle}</span>
          <h2>{copy.about.promiseBody}</h2>
        </div>
        <div className="home-message-links">
          <a href={pagePath(locale, 'about')}>{copy.nav.about}<span aria-hidden="true">↗</span></a>
          <a href={pagePath(locale, 'projects')}>{copy.nav.work}<span aria-hidden="true">↗</span></a>
          <a href={pagePath(locale, 'contact')}>{copy.nav.contact}<span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>
  </>
}

function AboutPage({ copy, locale }: { copy: Copy; locale: Locale }) {
  return <section className="studio-page section-pad"><div className="content-width">
    <PageMast eyebrow={copy.about.eyebrow} title={copy.about.title} body={copy.about.body} />
    <div className="about-feature-grid">
      <article className="about-story">
        <span className="eyebrow eyebrow-light">{copy.about.storyTitle}</span>
        <h2>{copy.about.storyTitle}</h2>
        <p>{copy.about.storyBody}</p>
        <a className="inline-link" href={pagePath(locale, 'people')}>{copy.nav.people}<span aria-hidden="true">↗</span></a>
      </article>
      <article className="promise-panel">
        <span className="promise-mark">wv</span>
        <span className="eyebrow">{copy.about.promiseTitle}</span>
        <h2>{copy.about.promiseBody}</h2>
        <div className="promise-list">
          {copy.about.principles.map((principle, index) => (
            <div key={principle.label}>
              <span>0{index + 1}</span>
              <p><strong>{principle.label}</strong>{principle.body}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  </div></section>
}

function ProjectsPage({ copy, locale }: { copy: Copy; locale: Locale }) {
  return <section className="studio-page section-pad"><div className="content-width">
    <PageMast eyebrow={copy.work.eyebrow} title={copy.work.title} body={copy.work.intro} />
    <CommerceSpotlight copy={copy} locale={locale} />
    <div className="projects-list-heading"><span className="eyebrow">{copy.nav.work}</span><p>{copy.work.intro}</p></div>
    <WorkGrid copy={copy} />
  </div></section>
}

function ApproachPage({ copy, locale }: { copy: Copy; locale: Locale }) {
  return <>
    <section className="approach-section approach-page section-pad">
      <div className="content-width approach-grid">
        <div className="approach-title">
          <span className="eyebrow eyebrow-light">{copy.approach.eyebrow}</span>
          <h1>{copy.approach.title}</h1>
          <p>{copy.approach.body}</p>
          <a className="button button-paper" href={pagePath(locale, 'contact')}>
            {copy.nav.contact}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="principles">
          {copy.approach.principles.map((principle, index) => (
            <article key={principle.label}>
              <span className="principle-number">0{index + 1}</span>
              <div>
                <h3>{principle.label}</h3>
                <p>{principle.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
    <DirectFaq copy={copy} locale={locale} />
  </>
}

function PeoplePage({ copy }: { copy: Copy }) {
  return <section className="studio-page section-pad"><div className="content-width"><PageMast eyebrow={copy.people.eyebrow} title={copy.people.title} body={copy.people.intro} /><Founders copy={copy} /></div></section>
}

function ContactPage({ copy, locale }: { copy: Copy; locale: Locale }) {
  const isArabic = locale === 'ar'
  const waUrl = `https://wa.me/${copy.whatsapp.number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(copy.whatsapp.message)}`

  return (
    <section className="contact-section contact-page section-pad">
      <div className="content-width contact-grid">
        <div className="contact-intro">
          <span className="eyebrow eyebrow-light">{copy.contact.eyebrow}</span>
          <h1>{copy.contact.title}</h1>
          <p>{copy.contact.body}</p>

          <div className="contact-whatsapp-box">
            <div className="wa-box-header">
              <span className="wa-icon-badge" aria-hidden="true">💬</span>
              <div>
                <strong>{isArabic ? 'تواصل فوري ومباشر عبر واتساب' : 'Direct WhatsApp Chat'}</strong>
                <p>{isArabic ? 'عاوز رد فوري واستشارة سريعة لنشاطك التجاري؟ كلمنا مباشرة على واتساب.' : 'Want a quick answer or consultation for your business? Chat directly with us.'}</p>
              </div>
            </div>
            <a
              className="button button-whatsapp"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span aria-hidden="true">💬</span>
              {copy.whatsapp.directCta}
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="contact-social">
            <span className="contact-social-label">{isArabic ? 'تابعنا على وسائل التواصل' : 'Follow our studio'}</span>
            <div className="contact-social-links">
              <a href="https://www.instagram.com/webviewlabs/" target="_blank" rel="noopener noreferrer" className="contact-social-btn">Instagram <span aria-hidden="true">↗</span></a>
              <a href="https://www.linkedin.com/company/webviewlabs-studio/" target="_blank" rel="noopener noreferrer" className="contact-social-btn">LinkedIn <span aria-hidden="true">↗</span></a>
              <a href="https://www.facebook.com/profile.php?id=61593463393675" target="_blank" rel="noopener noreferrer" className="contact-social-btn">Facebook <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div className="contact-stamp"><span>WV</span><small>working<br />edition</small></div>
        </div>
        <ContactForm copy={copy} />
      </div>
    </section>
  )
}

function App() {
  const [locale, setLocale] = useState<Locale>(() => localeFromPathname(window.location.pathname))
  const [page, setPage] = useState<PageKey>(() => pageFromPathname(window.location.pathname))
  const copy = useMemo(() => content[locale], [locale])

  useEffect(() => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.history.replaceState({}, '', '/ar/')
      setLocale('ar')
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setLocale(localeFromPathname(window.location.pathname))
      setPage(pageFromPathname(window.location.pathname))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = (event.target as HTMLElement | null)?.closest('a')
      if (!target || !target.href) return
      if (target.target && target.target !== '_self') return
      if (target.hasAttribute('download')) return

      const url = new URL(target.href, window.location.origin)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.hash) return

      event.preventDefault()
      const nextLocale = localeFromPathname(url.pathname)
      const nextPage = pageFromPathname(url.pathname)
      const targetPath = pagePath(nextLocale, nextPage)

      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath)
      }
      setLocale(nextLocale)
      setPage(nextPage)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    updateSeo(locale, page)
  }, [locale])

  useEffect(() => {
    updateSeo(locale, page)
  }, [page])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [page])

  function goTo(nextPage: PageKey, nextLocale = locale) {
    window.history.pushState({}, '', pagePath(nextLocale, nextPage))
    setLocale(nextLocale)
    setPage(nextPage)
  }

  return (
    <div id="top" className={`site-shell locale-${locale} page-${page}`}>
      <Header copy={copy} locale={locale} page={page} onLocaleChange={() => goTo(page, locale === 'en' ? 'ar' : 'en')} />
      <main key={page} className="page-transition">
        {page === 'home' && <HomePage copy={copy} locale={locale} />}
        {page === 'about' && <AboutPage copy={copy} locale={locale} />}
        {page === 'projects' && <ProjectsPage copy={copy} locale={locale} />}
        {page === 'approach' && <ApproachPage copy={copy} locale={locale} />}
        {page === 'people' && <PeoplePage copy={copy} />}
        {page === 'contact' && <ContactPage copy={copy} locale={locale} />}
        {page === 'admin' && <AdminPortal locale={locale} />}
      </main>
      <footer className="site-footer">
        <div className="content-width footer-inner">
          <div className="footer-brand">
            <a className="wordmark footer-wordmark" href={pagePath(locale, 'home')}>
              <span className="wordmark-mark">wv</span>
              <span>webviewlabs</span>
            </a>
            <p>{copy.footer.statement}</p>
          </div>
          <div className="footer-social" aria-label="Social media links">
            <a href="https://www.instagram.com/webviewlabs/" target="_blank" rel="noopener noreferrer" className="footer-social-link">Instagram <span aria-hidden="true">↗</span></a>
            <a href="https://www.linkedin.com/company/webviewlabs-studio/" target="_blank" rel="noopener noreferrer" className="footer-social-link">LinkedIn <span aria-hidden="true">↗</span></a>
            <a href="https://www.facebook.com/profile.php?id=61593463393675" target="_blank" rel="noopener noreferrer" className="footer-social-link">Facebook <span aria-hidden="true">↗</span></a>
          </div>
          <div className="footer-meta">
            <span>{copy.footer.legal}</span>
            <span>Cairo · 30°03′N</span>
          </div>
        </div>
      </footer>
      <WhatsAppButton copy={copy} />
      <Analytics />
    </div>
  )
}

export default App
