import type { Locale, PageKey } from '../types'

export const publicPageKeys: PageKey[] = ['home', 'about', 'projects', 'approach', 'people', 'contact']

export function pagePath(locale: Locale, page: PageKey): string {
  return page === 'home' ? `/${locale}/` : `/${locale}/${page}/`
}

export function localeFromPathname(pathname: string): Locale {
  return pathname.split('/').filter(Boolean)[0] === 'en' ? 'en' : 'ar'
}

export function pageFromPathname(pathname: string): PageKey {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.includes('admin')) return 'admin'
  const candidate = parts[0] === 'en' || parts[0] === 'ar' ? parts[1] : parts[0]
  if (candidate === 'admin') return 'admin'
  return publicPageKeys.includes(candidate as PageKey) ? candidate as PageKey : 'home'
}
