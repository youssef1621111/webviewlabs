import type { Copy, Locale } from '../types'
import { pagePath } from '../lib/routes'

type ServicesGridProps = {
  copy: Copy
  locale: Locale
}

export function ServicesGrid({ copy, locale }: ServicesGridProps) {
  const { services, whatsapp } = copy
  const isArabic = locale === 'ar'

  return (
    <section className="services-section section-pad section-rule" id="services">
      <div className="content-width">
        <div className="section-heading services-heading">
          <div>
            <span className="eyebrow">{services.eyebrow}</span>
            <h2>{services.title}</h2>
          </div>
          <p>{services.subtitle}</p>
        </div>

        <div className="services-grid">
          {services.items.map((service, index) => {
            const encodedMsg = encodeURIComponent(
              isArabic
                ? `مرحباً webviewlabs، أنا مهتم بـ: ${service.title} لمشروعي.`
                : `Hello webviewlabs, I am interested in: ${service.title} for my project.`
            )
            const waLink = `https://wa.me/${whatsapp.number.replace(/[^0-9]/g, '')}?text=${encodedMsg}`

            return (
              <article className={`service-card service-${service.id}`} key={service.id}>
                <div className="service-header">
                  <div className="service-badge-row">
                    <span className="service-number">0{index + 1}</span>
                    <span className="service-badge">{service.badge}</span>
                  </div>
                  <h3>{service.title}</h3>
                  <p className="service-tagline">{service.tagline}</p>
                </div>

                <div className="service-body">
                  <p className="service-description">{service.description}</p>
                  <div className="service-target">
                    <strong>{isArabic ? 'لمن هذا الحل؟' : 'Who is this for?'}</strong>
                    <span>{service.forWhom}</span>
                  </div>

                  <div className="service-deliverables">
                    <strong>{isArabic ? 'ما الذي تستلمه؟' : 'What is included?'}</strong>
                    <ul>
                      {service.deliverables.map((item) => (
                        <li key={item}>
                          <span className="check-icon" aria-hidden="true">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="service-footer">
                  <span className="service-timeframe">
                    <span className="time-icon" aria-hidden="true">⏱</span>
                    {service.timeframe}
                  </span>
                  <div className="service-actions">
                    <a className="button button-dark service-btn" href={pagePath(locale, 'contact')}>
                      {service.cta}
                      <span aria-hidden="true">↗</span>
                    </a>
                    <a
                      className="service-wa-link"
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={whatsapp.tooltip}
                    >
                      <span className="wa-icon" aria-hidden="true">💬</span>
                      <span>{isArabic ? 'واتساب مباشر' : 'Direct WhatsApp'}</span>
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
