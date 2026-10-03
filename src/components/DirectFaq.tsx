import { useState } from 'react'
import type { Copy, Locale } from '../types'

type DirectFaqProps = {
  copy: Copy
  locale: Locale
}

export function DirectFaq({ copy, locale }: DirectFaqProps) {
  const { faq, whatsapp } = copy
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const isArabic = locale === 'ar'

  const encodedMsg = encodeURIComponent(
    isArabic
      ? `مرحباً webviewlabs، عندي سؤال بخصوص عمل موقع أو متجر إلكتروني لمشروعي.`
      : `Hello webviewlabs, I have a question regarding a website or e-commerce store.`
  )
  const waLink = `https://wa.me/${whatsapp.number.replace(/[^0-9]/g, '')}?text=${encodedMsg}`

  function toggleQuestion(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section className="faq-section section-pad section-rule" id="faq">
      <div className="content-width">
        <div className="section-heading faq-heading">
          <div>
            <span className="eyebrow">{faq.eyebrow}</span>
            <h2>{faq.title}</h2>
          </div>
          <p>{faq.subtitle}</p>
        </div>

        <div className="faq-list">
          {faq.items.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <article
                className={`faq-card ${isOpen ? 'faq-card-open' : ''}`}
                key={item.question}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleQuestion(index)}
                  aria-expanded={isOpen}
                >
                  <div className="faq-question-content">
                    <span className="faq-q-badge">{isArabic ? 'س' : 'Q'}</span>
                    <span className="faq-question-text">{item.question}</span>
                  </div>
                  <div className="faq-question-meta">
                    {item.highlight && <span className="faq-highlight-pill">{item.highlight}</span>}
                    <span className="faq-toggle-icon" aria-hidden="true">
                      {isOpen ? '−' : '+'}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="faq-answer-pane">
                    <div className="faq-a-badge" aria-hidden="true">{isArabic ? 'ج' : 'A'}</div>
                    <div className="faq-answer-text">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>

        <div className="faq-cta-banner">
          <div className="faq-cta-text">
            <strong>{faq.askMoreCta}</strong>
            <p>{faq.askMoreBody}</p>
          </div>
          <a
            className="button button-whatsapp"
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="wa-icon" aria-hidden="true">💬</span>
            {whatsapp.directCta}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  )
}
