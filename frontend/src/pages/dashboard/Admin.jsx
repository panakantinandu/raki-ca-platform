import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'
import StatCard from '../../components/ui/StatCard.jsx'

export default function Admin() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    let mounted = true
    apiClient.get('/admin/stats')
      .then(({ data }) => { if (mounted) setStats(data) })
      .catch((err) => {
        if (!mounted) return
        if (err.response?.status === 403) setForbidden(true)
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card h-28 animate-pulse bg-ink-raised/50" />
        ))}
      </div>
    )
  }

  if (forbidden || !stats) {
    return (
      <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ledger-red/10">
          <ShieldAlert size={22} className="text-ledger-red" />
        </div>
        <h3 className="font-display text-lg font-medium text-parchment">Not authorized</h3>
        <p className="mt-2 max-w-sm font-sans text-sm text-parchment-muted">
          This page is only visible to the platform admin.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <span className="label-eyebrow">Admin</span>
        <h1 className="mt-2 font-display text-3xl font-medium text-parchment">Platform overview</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="Total signups" value={stats.totalSignups} accent="brass" />
        <StatCard label="Active trials" value={stats.activeTrials} accent="teal" />
        <StatCard
          label="Active subscriptions"
          value={Object.values(stats.activeSubscriptionsByPlan).reduce((a, b) => a + b, 0)}
          accent="brass"
        />
      </div>

      <div className="mt-8 card p-6">
        <h2 className="mb-5 font-display text-lg font-medium text-parchment">Active subscriptions by plan</h2>
        {Object.keys(stats.activeSubscriptionsByPlan).length === 0 ? (
          <p className="font-sans text-sm text-parchment-muted">No active (paid) subscriptions yet.</p>
        ) : (
          <ul className="space-y-2">
            {Object.entries(stats.activeSubscriptionsByPlan).map(([plan, count]) => (
              <li key={plan} className="flex items-center justify-between font-sans text-sm">
                <span className="text-parchment-muted">{plan}</span>
                <span className="font-mono text-parchment">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 card p-6">
        <h2 className="mb-5 font-display text-lg font-medium text-parchment">Recent signups</h2>
        {stats.recentSignups.length === 0 ? (
          <p className="font-sans text-sm text-parchment-muted">No signups yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-ink-border text-xs uppercase tracking-wider text-parchment-faint">
                  <th className="pb-3 font-mono font-normal">Name</th>
                  <th className="pb-3 font-mono font-normal">Email</th>
                  <th className="pb-3 font-mono font-normal">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-border">
                {stats.recentSignups.map((s) => (
                  <tr key={s.email}>
                    <td className="py-3 text-parchment">{s.fullName}</td>
                    <td className="py-3 text-parchment-muted">{s.email}</td>
                    <td className="py-3 font-mono text-xs text-parchment-faint">
                      {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
