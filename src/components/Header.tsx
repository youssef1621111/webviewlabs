import type { Copy, Locale, PageKey } from '../types'
import { pagePath } from '../lib/routes'

type HeaderProps = {
  copy: Copy
  locale: Locale
  page: PageKey
  onLocaleChange: () => void
}

export function Header({ copy, locale, page, onLocaleChange }: HeaderProps) {
  const tabs: Array<{ key: PageKey; label: string }> = [
    { key: 'home', label: copy.nav.home },
    { key: 'about', label: copy.nav.about },
    { key: 'projects', label: copy.nav.work },
    { key: 'approach', label: copy.nav.approach },
    { key: 'people', label: copy.nav.people },
    { key: 'contact', label: copy.nav.contact },
  ]

  return (
    <header className="site-header">
      <a className={`wordmark ${page === 'home' ? 'wordmark-current' : ''}`} href={pagePath(locale, 'home')}>
        <span className="wordmark-mark">wv</span>
        <span>webviewlabs</span>
      </a>
      <nav className="main-nav" aria-label="Primary navigation">
        {tabs.map((tab) => <a className={page === tab.key ? 'nav-current' : ''} href={pagePath(locale, tab.key)} aria-current={page === tab.key ? 'page' : undefined} key={tab.key}>{tab.label}</a>)}
      </nav>
      <div className="header-actions">
        <button className="locale-toggle" type="button" onClick={onLocaleChange}>
          <span className={locale === 'en' ? 'locale-active' : ''}>EN</span>
          <span className="locale-slash">/</span>
          <span className={locale === 'ar' ? 'locale-active' : ''}>AR</span>
          <span className="sr-only">{copy.nav.switchTo}</span>
        </button>
        <a className={`header-cta ${page === 'contact' ? 'header-cta-current' : ''}`} href={pagePath(locale, 'contact')}>{copy.nav.contact}<span aria-hidden="true">↗</span></a>
      </div>
    </header>
  )
}
