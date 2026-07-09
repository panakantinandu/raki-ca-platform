import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useToast } from '../../context/ToastContext.jsx'

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function Notifications() {
  const { showToast } = useToast()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    apiClient.get('/notifications', { params: { size: 50 } })
      .then(({ data }) => {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
        setUnreadCount(data.unreadCount || 0)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  async function markRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await apiClient.patch(`/notifications/${id}/read`)
    } catch {
      load()
    }
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.readAt)
    if (unread.length === 0) return
    await Promise.all(unread.map((n) => apiClient.patch(`/notifications/${n.id}/read`)))
    load()
    showToast('All notifications marked as read.')
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="label-eyebrow">Notifications</span>
          <h1 className="mt-2 font-display text-3xl font-medium text-parchment">
            Notifications {unreadCount > 0 && <span className="font-mono text-lg text-brass">({unreadCount} unread)</span>}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-ghost !px-4 !py-2.5 text-sm">
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="card h-64 animate-pulse bg-ink-raised/50" />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          body="You'll see updates here about overdue filings, support replies, document extractions, and recurring filings as they happen."
        />
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-ink-border">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => !n.readAt && markRead(n.id)}
                  className={`flex w-full items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-ink-raised/40 ${
                    n.readAt ? 'opacity-60' : ''
                  }`}
                >
                  {!n.readAt && <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brass" />}
                  <div className={n.readAt ? 'pl-3.5' : ''}>
                    <p className="font-sans text-sm text-parchment">{n.message}</p>
                    <p className="mt-1 font-mono text-xs text-parchment-faint">{formatDate(n.createdAt)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
