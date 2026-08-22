import { useState } from 'react'
import type { Copy } from '../types'
import type { Locale } from '../types'
import { pagePath } from '../lib/routes'

type LiveDemoProps = { copy: Copy; locale: Locale }

const signals = [
  { icon: '↗', en: 'A store people return to', ar: 'متجر يعود إليه الناس' },
  { icon: '◒', en: 'A brand people remember', ar: 'علامة يتذكرها الناس' },
  { icon: '⌁', en: 'A system ready to scale', ar: 'نظام مستعد للنمو' },
]

export function LiveDemo({ copy, locale }: LiveDemoProps) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)

  const isArabic = copy.localeLabel === 'العربية'
  const activeSignal = selected === null ? null : signals[selected]

  function moveForward() {
    if (step === 0 && selected === null) return
    setStep((current) => Math.min(2, current + 1))
  }

  function reset() {
    setStep(0)
    setSelected(null)
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
                return <button key={label} className={`signal-card ${selected === index ? 'signal-selected' : ''}`} type="button" onClick={() => setSelected(index)} aria-pressed={selected === index}>
                  <span className="signal-icon" aria-hidden="true">{signal.icon}</span><span>{label}</span><span className="signal-arrow" aria-hidden="true">↗</span>
                </button>
              })}
            </div>
          </div>
        )}
        {step === 1 && activeSignal && (
          <div className="demo-result">
            <span className="result-kicker">{copy.demo.selected}</span>
            <strong>{isArabic ? activeSignal.ar : activeSignal.en}</strong>
            <p>{isArabic ? 'سنحوّل هذه الإشارة إلى تجربة واضحة، قابلة للاستخدام، ومصممة حول هدفك الحقيقي.' : 'We will turn this signal into a clear, useful experience shaped around the outcome that matters.'}</p>
            <div className="result-lines"><span /><span /><span className="short" /></div>
          </div>
        )}
        {step === 2 && (
          <div className="demo-result demo-ready">
            <span className="ready-symbol" aria-hidden="true">✓</span>
            <strong>{copy.demo.ready}</strong>
            <p>{copy.demo.proof}</p>
            <a className="demo-link" href={pagePath(locale, 'contact')}>{copy.nav.contact}<span aria-hidden="true">↗</span></a>
          </div>
        )}
      </div>
      <div className="demo-footer">
        <span>{copy.demo.proof}</span>
        <div>
          {step > 0 && <button className="demo-reset" type="button" onClick={reset}>{copy.demo.reset}</button>}
          {step < 2 && <button className="demo-next" type="button" onClick={moveForward} disabled={step === 0 && selected === null}>{step === 0 ? copy.demo.start : copy.demo.next}<span aria-hidden="true">→</span></button>}
        </div>
      </div>
    </div>
  )
}
