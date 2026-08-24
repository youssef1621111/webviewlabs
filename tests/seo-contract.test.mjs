import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const indexSource = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const routesSource = await readFile(new URL('../src/lib/routes.ts', import.meta.url), 'utf8')
const seoSource = await readFile(new URL('../src/lib/seo.ts', import.meta.url), 'utf8')
const robotsSource = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8')
const sitemapSource = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
const llmsSource = await readFile(new URL('../public/llms.txt', import.meta.url), 'utf8')
const vercelSource = await readFile(new URL('../vercel.json', import.meta.url), 'utf8')

test('static head exposes bilingual indexing signals', () => {
  assert.match(indexSource, /<html lang="en" dir="ltr">/)
  assert.match(indexSource, /rel="canonical" href="https:\/\/webviewlabs\.vercel\.app\/en\/"/)
  assert.match(indexSource, /hreflang="ar" href="https:\/\/webviewlabs\.vercel\.app\/ar\/"/)
  assert.match(indexSource, /application\/ld\+json/)
  assert.match(indexSource, /og:image/)
})

test('runtime SEO uses crawlable paths and localized alternates', () => {
  assert.match(routesSource, /return page === 'home' \? `\/\$\{locale\}\/` : `\/\$\{locale\}\/\$\{page\}\/`/)
  assert.match(routesSource, /localeFromPathname/)
  assert.match(routesSource, /pageFromPathname/)
  assert.doesNotMatch(routesSource, /hashchange|pageFromHash/)
  assert.match(seoSource, /hreflang: 'en'/)
  assert.match(seoSource, /hreflang: 'ar'/)
  assert.match(seoSource, /application\/ld\+json|structuredData/)
})

test('crawl assets exclude the private admin area and stale project copy', () => {
  assert.match(robotsSource, /Disallow: \/admin/)
  assert.match(robotsSource, /Sitemap: https:\/\/webviewlabs\.vercel\.app\/sitemap\.xml/)
  assert.equal((sitemapSource.match(/<loc>/g) ?? []).length, 12)
  assert.doesNotMatch(llmsSource, /Flix/i)
})

test('Vercel serves English and Arabic route paths through the SPA entry', () => {
  assert.match(vercelSource, /"source": "\/en\/:path\*"/)
  assert.match(vercelSource, /"source": "\/ar\/:path\*"/)
  assert.match(vercelSource, /"destination": "\/index\.html"/)
})
