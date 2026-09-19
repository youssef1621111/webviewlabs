import { useState } from 'react'
import type { Copy } from '../types'
import type { Locale } from '../types'
import { pagePath } from '../lib/routes'

type LiveDemoProps = { copy: Copy; locale: Locale }

const signals = [
  {
    icon: '🛒',
    en: 'E-Commerce Store',
    ar: 'متجر إلكتروني للبيع أونلاين',
    subEn: 'Sell 24/7 with automated orders',
    subAr: 'بيع واستقبل طلباتك أوتوماتيك',
    detailsEn: 'Complete mobile-first store with InstaPay, Vodafone Cash, shipping calculator, and an easy smartphone dashboard.',
    detailsAr: 'متجر سريع جاهز بالكامل: سلة ذكية، ربط إنستاباي وفودافون كاش، حساب شحن المحافظات، ولوحة تحكم عربي من الموبايل.',
    timeframeEn: 'Delivery: 7–14 days',
    timeframeAr: 'التسليم: 7–14 يوم عمل',
  },
  {
    icon: '⚡',
    en: 'High-Converting Landing Page',
    ar: 'صفحة هبوط لمبيعات الإعلانات',
    subEn: 'Maximize ROI on Meta & TikTok ads',
    subAr: 'لمضاعفة أرباح حملاتك الإعلانية',
    detailsEn: 'Blazing-fast, single-focus landing page with 1-click WhatsApp order, lead forms, and Meta Pixel tracking.',
    detailsAr: 'صفحة سريعة وخاطفة مخصصة لإعلانات فيسبوك وتيك توك، تحوّل الزائر لمشترٍ فوراً مع ربط واتساب وبيكسل التتبع.',
    timeframeEn: 'Delivery: 3–5 days',
    timeframeAr: 'التسليم: 3–5 أيام فقط',
  },
  {
    icon: '🏢',
    en: 'Official Company Website',
    ar: 'موقع رسمي للشركة وبناء الثقة',
    subEn: 'Build immediate client prestige',
    subAr: 'واجهة مشرفة تعكس حجم بيزنسك',
    detailsEn: 'Custom brand platform with official company emails, client portfolio, and Google SEO setup.',
    detailsAr: 'واجهة مشرفة تعكس حجم شركتك: دومين خاص، إيميلات رسمية، سابقة أعمال، وظهور قوي في بحث جوجل (SEO).',
    timeframeEn: 'Delivery: 7–10 days',
    timeframeAr: 'التسليم: 7–10 أيام عمل',
  },
]

export function LiveDemo({ copy, locale }: LiveDemoProps) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(0)

  const isArabic = copy.localeLabel === 'العربية'
  const activeSignal = selected === null ? null : signals[selected]

  function moveForward() {
    if (step === 0 && selected === null) return
    setStep((current) => Math.min(2, current + 1))
  }

  function reset() {
    setStep(0)
    setSelected(0)
  }

  return (
    <div className="demo-frame">
      <div className="demo-topline">
        <span><i className="live-dot" />{copy.demo.live}</span>
        <span>{copy.hero.edition}</span>
      </div>
      <div className="demo-heading">
        <div>
          <span className="eyebrow eyebrow-light">{copy.demo.eyebrow}</span>
          <h2>{copy.demo.title}</h2>
        </div>
        <span className="demo-index">0{step + 1}<small>/03</small></span>
      </div>
      <p className="demo-intro">{copy.demo.intro}</p>
      <div className="demo-progress" aria-label={copy.demo.steps.join(', ')}>
        {copy.demo.steps.map((item, index) => <span key={item} className={index <= step ? 'progress-active' : ''}>{index + 1}. {item}</span>)}
      </div>
      <div className="demo-body">
        {step === 0 && (
          <div className="signal-picker">
            <p className="demo-label">{copy.demo.request}</p>
            <div className="signal-grid">
              {signals.map((signal, index) => {
                const label = isArabic ? signal.ar : signal.en
                const sub = isArabic ? signal.subAr : signal.subEn
                return <button key={label} className={`signal-card ${selected === index ? 'signal-selected' : ''}`} type="button" onClick={() => setSelected(index)} aria-pressed={selected === index}>
                  <span className="signal-icon" aria-hidden="true">{signal.icon}</span>
                  <div className="signal-text">
                    <strong>{label}</strong>
                    <small>{sub}</small>
                  </div>
                  <span className="signal-arrow" aria-hidden="true">↗</span>
                </button>
              })}
            </div>
          </div>
        )}
        {step === 1 && activeSignal && (
          <div className="demo-result">
            <span className="result-kicker">{copy.demo.selected}</span>
            <strong>{isArabic ? activeSignal.ar : activeSignal.en}</strong>
            <p>{isArabic ? activeSignal.detailsAr : activeSignal.detailsEn}</p>
            <div className="demo-meta-pill">
              <span className="time-icon" aria-hidden="true">⏱</span>
              <span>{isArabic ? activeSignal.timeframeAr : activeSignal.timeframeEn}</span>
            </div>
          </div>
        )}
        {step === 2 && activeSignal && (
          <div className="demo-result demo-ready">
            <span className="ready-symbol" aria-hidden="true">✓</span>
            <strong>{copy.demo.ready}</strong>
            <p>{isArabic ? 'جاهزون لبدء التنفيذ فوراً بدون أي تعقيدات. احجز موقعك الآن أو تواصل معنا مباشرة عبر واتساب.' : 'Ready to begin immediately without hassles. Start your brief or chat with us directly on WhatsApp.'}</p>
            <div className="demo-ready-actions">
              <a className="demo-link button button-dark" href={pagePath(locale, 'contact')}>
                {copy.nav.contact}
                <span aria-hidden="true">↗</span>
              </a>
              <a
                className="button button-whatsapp-small"
                href={`https://wa.me/${copy.whatsapp.number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(isArabic ? `مرحباً، اخترت من الموقع: ${activeSignal.ar}` : `Hello, I selected: ${activeSignal.en}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>💬</span>
                {copy.whatsapp.label}
              </a>
            </div>
          </div>
        )}
      </div>
      <div className="demo-footer">
        <span>{copy.demo.proof}</span>
        <div>
          {step > 0 && <button className="demo-reset" type="button" onClick={reset}>{copy.demo.reset}</button>}
          {step < 2 && <button className="demo-next" type="button" onClick={moveForward} disabled={step === 0 && selected === null}>{step === 0 ? copy.demo.next : copy.demo.next}<span aria-hidden="true">→</span></button>}
        </div>
      </div>
    </div>
  )
}
