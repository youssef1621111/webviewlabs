import type { Copy } from '../types'

export function Founders({ copy }: { copy: Copy }) {
  return <div className="founder-grid">
    {copy.people.founders.map((founder, index) => <article className="founder-card" key={founder.name}>
      <div className="founder-number">0{index + 1}</div>
      <div className="founder-avatar" aria-hidden="true">{founder.name.split(' ').map((part) => part[0]).join('')}</div>
      <div className="founder-copy"><h3>{founder.name}</h3><p className="founder-role">{founder.role}</p><p>{founder.body}</p><a className="inline-link" href={founder.link} target="_blank" rel="noreferrer">{founder.linkLabel}<span aria-hidden="true">↗</span></a></div>
    </article>)}
  </div>
}
