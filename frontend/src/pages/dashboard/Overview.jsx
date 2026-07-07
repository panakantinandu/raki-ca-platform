import { useEffect, useState } from 'react'
import { Clock, CheckCircle2 } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'
import StatCard from '../../components/ui/StatCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

// Parses "YYYY-MM-DD" as local calendar components rather than through `new Date(str)`,
// which parses date-only strings as UTC and can display as the previous day in
// timezones behind UTC. Same fix as Filings.jsx / FilingsCalendar.jsx.
function formatDueDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function Overview() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    apiClient.get('/dashboard/stats')
      .then(({ data }) => { if (mounted) setStats(data) })
      .catch(() => { if (mounted) setError('Could not load your dashboard right now.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  return (
    <div>
      <div className="mb-8">
        <span className="label-eyebrow">Overview</span>
        <h1 className="mt-2 font-display text-3xl font-medium text-parchment">
          Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
        </h1>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-ink-raised/50" />
          ))}
        </div>
      )}

      {error && (
        <div className="card border-ledger-red/30 bg-ledger-red/5 p-6 font-sans text-sm text-ledger-red">
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total clients" value={stats.totalClients} accent="brass" />
            <StatCard label="Pending filings" value={stats.pendingFilings} accent="brass" />
            <StatCard label="Overdue" value={stats.overdueFilings} accent="red" />
            <StatCard label="Filed" value={stats.filedThisMonth} accent="teal" />
          </div>

          <div className="mt-8 card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-medium text-parchment">Upcoming deadlines</h2>
              <span className="font-mono text-xs text-parchment-faint">Next 14 days</span>
            </div>

            {(Array.isArray(stats.upcomingDeadlines) ? stats.upcomingDeadlines : []).length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 size={28} className="text-ledger-teal" />
                <p className="mt-3 font-sans text-sm text-parchment-muted">Nothing due in the next two weeks.</p>
              </div>
            ) : (
              <ul className="divide-y divide-ink-border">
                {stats.upcomingDeadlines.map((d) => (
                  <li key={d.filingId} className="flex items-center justify-between py-3.5">
                    <div>
                      <p className="font-sans text-sm font-medium text-parchment">{d.clientName}</p>
                      <p className="font-mono text-xs text-parchment-faint">{d.filingType} &middot; {d.periodLabel}</p>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs text-parchment-muted">
                      <Clock size={13} />
                      {formatDueDate(d.dueDate)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
