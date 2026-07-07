const STYLES = {
  PENDING: 'bg-parchment-faint/10 text-parchment-muted',
  IN_PROGRESS: 'bg-brass/10 text-brass',
  FILED: 'bg-ledger-teal/10 text-ledger-teal',
  OVERDUE: 'bg-ledger-red/10 text-ledger-red',
  ACTIVE: 'bg-ledger-teal/10 text-ledger-teal',
  INACTIVE: 'bg-parchment-faint/10 text-parchment-muted',
  TRIALING: 'bg-brass/10 text-brass',
  CANCELED: 'bg-ledger-red/10 text-ledger-red',
  PAST_DUE: 'bg-ledger-red/10 text-ledger-red'
}

export default function Badge({ status }) {
  const cls = STYLES[status] || 'bg-parchment-faint/10 text-parchment-muted'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${cls}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}
