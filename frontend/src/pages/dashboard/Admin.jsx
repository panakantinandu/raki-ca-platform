import { useEffect, useState } from 'react'
import { ShieldAlert, Mail } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'
import StatCard from '../../components/ui/StatCard.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useToast } from '../../context/ToastContext.jsx'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ContactSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/admin/contact-submissions', { params: { size: 50 } })
      .then(({ data }) => setSubmissions(data.content || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mt-8 card p-6">
      <h2 className="mb-5 font-display text-lg font-medium text-parchment">Contact form submissions</h2>
      {loading ? (
        <div className="h-24 animate-pulse rounded-md bg-ink-raised/50" />
      ) : submissions.length === 0 ? (
        <p className="font-sans text-sm text-parchment-muted">No submissions yet.</p>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <div key={s.id} className="rounded-md border border-ink-border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-sans text-sm font-medium text-parchment">{s.name}</p>
                <p className="font-mono text-[11px] text-parchment-faint">{formatDate(s.createdAt)}</p>
              </div>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-parchment-faint">
                <Mail size={12} /> {s.email}
              </p>
              <p className="mt-2 font-sans text-sm text-parchment-muted">{s.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReplyBox({ ticket, onReplied }) {
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  async function submitReply(e) {
    e.preventDefault()
    if (!reply.trim()) return
    setSaving(true)
    try {
      await apiClient.post(`/admin/support-tickets/${ticket.id}/reply`, { reply })
      setReply('')
      showToast('Reply sent.')
      onReplied()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submitReply} className="mt-3 flex gap-2">
      <input
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Type a reply…"
        className="input-field"
      />
      <button type="submit" disabled={saving} className="btn-ghost !px-4 !py-2 text-sm disabled:opacity-60">
        {saving ? 'Sending…' : 'Reply'}
      </button>
    </form>
  )
}

function SupportTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    apiClient.get('/admin/support-tickets', { params: { size: 50 } })
      .then(({ data }) => setTickets(data.content || []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div className="mt-8 card p-6">
      <h2 className="mb-5 font-display text-lg font-medium text-parchment">Support tickets</h2>
      {loading ? (
        <div className="h-24 animate-pulse rounded-md bg-ink-raised/50" />
      ) : tickets.length === 0 ? (
        <p className="font-sans text-sm text-parchment-muted">No tickets yet.</p>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-md border border-ink-border p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-sans text-sm font-medium text-parchment">{t.subject}</p>
                <Badge status={t.status} />
              </div>
              <p className="mt-1.5 font-sans text-sm text-parchment-muted">{t.message}</p>
              <p className="mt-2 font-mono text-[11px] text-parchment-faint">{formatDate(t.createdAt)}</p>

              {t.adminReply ? (
                <div className="mt-3 rounded-md border border-brass/20 bg-brass/5 px-3 py-2.5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-brass">Your reply</p>
                  <p className="mt-1 font-sans text-sm text-parchment">{t.adminReply}</p>
                </div>
              ) : (
                <ReplyBox ticket={t} onReplied={load} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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

  // Guard against an unexpected response shape rather than crashing on Object.entries()/.map().
  const recentSignups = Array.isArray(stats.recentSignups) ? stats.recentSignups : []
  const activeSubscriptionsByPlan = stats.activeSubscriptionsByPlan && typeof stats.activeSubscriptionsByPlan === 'object'
    ? stats.activeSubscriptionsByPlan
    : {}

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
          value={Object.values(activeSubscriptionsByPlan).reduce((a, b) => a + b, 0)}
          accent="brass"
        />
      </div>

      <div className="mt-8 card p-6">
        <h2 className="mb-5 font-display text-lg font-medium text-parchment">Active subscriptions by plan</h2>
        {Object.keys(activeSubscriptionsByPlan).length === 0 ? (
          <p className="font-sans text-sm text-parchment-muted">No active (paid) subscriptions yet.</p>
        ) : (
          <ul className="space-y-2">
            {Object.entries(activeSubscriptionsByPlan).map(([plan, count]) => (
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
        {recentSignups.length === 0 ? (
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
                {recentSignups.map((s) => (
                  <tr key={s.email}>
                    <td className="py-3 text-parchment">{s.fullName}</td>
                    <td className="py-3 text-parchment-muted">{s.email}</td>
                    <td className="py-3 font-mono text-xs text-parchment-faint">
                      {formatDate(s.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SupportTickets />
      <ContactSubmissions />
    </div>
  )
}
