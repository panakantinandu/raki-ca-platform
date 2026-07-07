export default function StatCard({ label, value, accent = 'brass', hint }) {
  const accentClass = {
    brass: 'text-brass',
    teal: 'text-ledger-teal',
    red: 'text-ledger-red'
  }[accent]

  return (
    <div className="card p-6">
      <p className="font-mono text-xs uppercase tracking-wider text-parchment-faint">{label}</p>
      <p className={`mt-3 font-display text-3xl font-medium ${accentClass}`}>{value}</p>
      {hint && <p className="mt-1 font-sans text-xs text-parchment-faint">{hint}</p>}
    </div>
  )
}
