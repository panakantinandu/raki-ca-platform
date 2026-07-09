import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

export default function Toast({ message, type = 'success', onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const Icon = type === 'error' ? XCircle : CheckCircle2
  const accent = type === 'error' ? 'text-ledger-red' : 'text-ledger-teal'

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border border-ink-border bg-ink-surface px-4 py-3 shadow-2xl transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <Icon size={18} className={`mt-0.5 flex-shrink-0 ${accent}`} />
      <p className="flex-1 font-sans text-sm text-parchment">{message}</p>
      <button onClick={onDismiss} className="text-parchment-faint hover:text-parchment" aria-label="Dismiss">
        <X size={15} />
      </button>
    </div>
  )
}
