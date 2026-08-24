import type { Copy } from '../types'
import type { Locale } from '../types'
import { pagePath } from '../lib/routes'

export function CommerceSpotlight({ copy, locale }: { copy: Copy; locale: Locale }) {
  const lead = copy.projects.find((project) => project.isLead) ?? copy.projects[0]

  return <section className="commerce-spotlight">
    <div className="spotlight-copy">
      <span className="eyebrow">{copy.work.commerceBadge}</span>
      <h2>{copy.work.commerceTitle}</h2>
      <p>{copy.work.commerceBody}</p>
      <div className="spotlight-actions"><a className="button button-dark" href={lead.demoUrl} target="_blank" rel="noreferrer">{copy.work.commerceCta}<span aria-hidden="true">↗</span></a><a className="text-link" href={pagePath(locale, 'projects')}>{copy.nav.work}<span aria-hidden="true">→</span></a></div>
    </div>
    <div className="spotlight-art" aria-label={`${lead.title} ${copy.work.bestSeller}`} role="img">
      <span className="spotlight-edition">01 / COMMERCE LEAD</span>
      <strong>{lead.title}</strong>
      <span className="spotlight-stamp">{copy.work.bestSeller}</span>
      <span className="spotlight-url">{lead.demoLabel}</span>
    </div>
  </section>
}
