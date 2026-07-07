import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="card relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl font-medium text-parchment">{title}</h3>
          <button onClick={onClose} className="text-parchment-faint hover:text-parchment" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
