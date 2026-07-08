import { Info } from 'lucide-react'

export default function StatCard({ label, value, accent = 'brass', hint, estimated, estimatedTitle }) {
  const accentClass = {
    brass: 'text-brass',
    teal: 'text-ledger-teal',
    red: 'text-ledger-red'
  }[accent]

  return (
    <div className="card p-6">
      <div className="flex items-center gap-1.5">
        <p className="font-mono text-xs uppercase tracking-wider text-parchment-faint">{label}</p>
        {estimated && (
          <span
            title={estimatedTitle || 'This is an estimate, not an exact or guaranteed figure.'}
            className="inline-flex items-center gap-1 rounded-full bg-brass/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-brass"
          >
            <Info size={10} /> estimated
          </span>
        )}
      </div>
      <p className={`mt-3 font-display text-3xl font-medium ${accentClass}`}>{value}</p>
      {hint && <p className="mt-1 font-sans text-xs text-parchment-faint">{hint}</p>}
    </div>
  )
}
