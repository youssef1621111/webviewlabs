import { useCallback, useEffect, useMemo, useState } from 'react'
import { CommerceSpotlight } from './components/CommerceSpotlight'
import { ContactForm } from './components/ContactForm'
import { Founders } from './components/Founders'
import { Header } from './components/Header'
import { LiveDemo } from './components/LiveDemo'
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
          <div className="hero-actions"><a className="button button-dark" href={pagePath(locale, 'contact')}>{copy.hero.primaryCta}<span aria-hidden="true">↗</span></a><a className="text-link" href={pagePath(locale, 'projects')}>{copy.hero.secondaryCta}</a></div>
          <div className="hero-note"><span className="note-line" /><span>{copy.hero.note}</span></div>
        </div>
        <div className="hero-demo"><LiveDemo copy={copy} locale={locale} /></div>
      </div>
      <div className="proof-bar content-width">{copy.proof.map((item) => <div className="proof-item" key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}</div>
    </section>
    <section className="section-pad section-rule content-width home-spotlight-wrap"><CommerceSpotlight copy={copy} locale={locale} /></section>
    <section className="home-message section-pad section-rule"><div className="content-width home-message-grid"><div><span className="eyebrow">{copy.about.promiseTitle}</span><h2>{copy.about.promiseTitle}</h2><p>{copy.about.promiseBody}</p></div></div></section>
  </>
}

function AboutPage({ copy, locale }: { copy: Copy; locale: Locale }) {
  return <section className="studio-page section-pad"><div className="content-width">
    <PageMast eyebrow={copy.about.eyebrow} title={copy.about.title} body={copy.about.body} />
    <div className="about-feature-grid">
      <article className="about-story"><span className="eyebrow eyebrow-light">{copy.about.storyTitle}</span><h2>{copy.about.storyTitle}</h2><p>{copy.about.storyBody}</p><a className="inline-link" href={pagePath(locale, 'contact')}>{copy.about.cta}</a></article>
      <article className="promise-panel"><span className="promise-mark">wv</span><span className="eyebrow">{copy.about.promiseTitle}</span><h2>{copy.about.promiseBody}</h2><div className="promise-list">{copy.about.promiseList.map((p) => <div key={p}><strong>{p}</strong></div>)}</div></article>
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
  return <section className="approach-section approach-page section-pad"><div className="content-width approach-grid"><div className="approach-title"><span className="eyebrow eyebrow-light">{copy.approach.eyebrow}</span><h2>{copy.approach.title}</h2></div></div></section>
}

function PeoplePage({ copy }: { copy: Copy }) {
  return <section className="studio-page section-pad"><div className="content-width"><PageMast eyebrow={copy.people.eyebrow} title={copy.people.title} body={copy.people.intro} /><Founders copy={copy} /></div></section>
}

function ContactPage({ copy }: { copy: Copy }) {
  return <section className="contact-section contact-page section-pad"><div className="content-width contact-grid"><div className="contact-intro"><span className="eyebrow eyebrow-light">{copy.contact.eyebrow}</span><h2>{copy.contact.title}</h2><p>{copy.contact.intro}</p></div><ContactForm copy={copy} /></div></section>
}

function App() {
  const [locale, setLocale] = useState<Locale>(() => localeFromPathname(window.location.pathname))
  const [page, setPage] = useState<PageKey>(() => pageFromPathname(window.location.pathname))
  const copy = useMemo(() => content[locale], [locale])

  useEffect(() => {
    const handlePopState = () => {
      setLocale(localeFromPathname(window.location.pathname))
      setPage(pageFromPathname(window.location.pathname))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
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

  const goTo = useCallback((nextPage: PageKey, nextLocale: Locale = locale) => {
    window.history.pushState({}, '', pagePath(nextLocale, nextPage))
    setLocale(nextLocale)
    setPage(nextPage)
  }, [locale])

  // Intercept internal anchor clicks and route client-side (prevent full page reload)
  useEffect(() => {
    const onDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return
      // Only left-clicks
      // @ts-ignore
      if ((e as any).button && (e as any).button !== 0) return

      let el = e.target as HTMLElement | null
      // walk up to nearest anchor
      while (el && el.nodeName !== 'A') el = el.parentElement
      if (!el) return
      const a = el as HTMLAnchorElement
      const href = a.getAttribute('href')
      if (!href) return
      // ignore fragments, mailto, tel, external links, and explicit new tab/downloads
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      if (a.target === '_blank' || a.hasAttribute('download')) return
      // build absolute URL to inspect origin/path
      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return

      // now we have an internal link; derive locale/page and route via SPA
      const nextLocale = localeFromPathname(url.pathname)
      const nextPage = pageFromPathname(url.pathname)
      // if the computed page or locale matches current state, still prevent default and use pushState to keep SPA behavior
      e.preventDefault()
      goTo(nextPage, nextLocale)
    }

    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [goTo])

  return <div id="top" className={`site-shell locale-${locale} page-${page}`}>
    <Header copy={copy} locale={locale} page={page} onLocaleChange={() => goTo(page, locale === 'en' ? 'ar' : 'en')} />
    <main key={page} className="page-transition">
      {page === 'home' && <HomePage copy={copy} locale={locale} />}
      {page === 'about' && <AboutPage copy={copy} locale={locale} />}
      {page === 'projects' && <ProjectsPage copy={copy} locale={locale} />}
      {page === 'approach' && <ApproachPage copy={copy} locale={locale} />}
      {page === 'people' && <PeoplePage copy={copy} />}
      {page === 'contact' && <ContactPage copy={copy} />}
    </main>
    <footer className="site-footer"><div className="content-width footer-inner"><div><a className="wordmark footer-wordmark" href={pagePath(locale, 'home')}><span className="wordmark-mark">wv</span><span>webviewlabs</span></a></div><div><a className="text-link" href="https://webviewlabs.vercel.app/privacy">Privacy</a></div></div></footer>
  </div>
}

export default App
