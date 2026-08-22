import { useMemo, useState } from 'react'
import type { Copy, ProjectKind } from '../types'

type WorkGridProps = { copy: Copy }
type Filter = 'all' | ProjectKind

export function WorkGrid({ copy }: WorkGridProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const filters: Array<{ key: Filter; label: string }> = [
    { key: 'all', label: copy.work.filters.all },
    { key: 'commerce', label: copy.work.filters.commerce },
    { key: 'brand', label: copy.work.filters.brand },
  ]
  const projects = useMemo(() => filter === 'all' ? copy.projects : copy.projects.filter((project) => project.kind === filter), [copy.projects, filter])

  return <>
    <div className="project-filters" role="tablist" aria-label={copy.work.eyebrow}>
      {filters.map((item) => <button className={filter === item.key ? 'filter-current' : ''} type="button" role="tab" aria-selected={filter === item.key} onClick={() => setFilter(item.key)} key={item.key}>{item.label}<span aria-hidden="true">↗</span></button>)}
    </div>
    <div className="work-grid">
      {projects.map((project, index) => <article className={`project-card project-${project.accent} ${project.isLead ? 'project-lead' : ''}`} key={project.title}>
        <div className="project-topline"><span>{project.index} / {project.category}</span><span>{project.isLead ? copy.work.featured : 'webviewlabs'}</span></div>
        <div className="project-art" aria-hidden="true"><span className="art-label">{project.demoLabel}</span><span className="art-word">{project.title}</span><span className="art-corner">↗</span>{project.isLead && <span className="best-seller-badge">{copy.work.bestSeller}</span>}</div>
        <div className="project-copy"><h3>{project.title}</h3><p>{project.description}</p><div className="tag-row">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><ul className="project-feature-list" aria-label={copy.work.featuresLabel}>{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></div>
        <div className="project-links"><a href={project.demoUrl} target="_blank" rel="noreferrer">{copy.work.open}<span aria-hidden="true">↗</span></a></div>
      </article>)}
      {!projects.length && <p className="empty-projects">{copy.work.intro}</p>}
    </div>
  </>
}
