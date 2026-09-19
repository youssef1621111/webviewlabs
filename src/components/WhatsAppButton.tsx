import type { Copy } from '../types'

type WhatsAppButtonProps = {
  copy: Copy
}

export function WhatsAppButton({ copy }: WhatsAppButtonProps) {
  const { whatsapp } = copy
  const encodedMsg = encodeURIComponent(whatsapp.message)
  const waUrl = `https://wa.me/${whatsapp.number.replace(/[^0-9]/g, '')}?text=${encodedMsg}`

  return (
    <aside className="floating-whatsapp" aria-label={whatsapp.tooltip}>
      <a
        className="whatsapp-float-btn"
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={whatsapp.tooltip}
      >
        <span className="whatsapp-float-icon" aria-hidden="true">💬</span>
        <span className="whatsapp-float-label">{whatsapp.label}</span>
      </a>
    </aside>
  )
}
