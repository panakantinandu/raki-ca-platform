import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'

const POLL_INTERVAL_MS = 20000

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/**
 * Polling-based (every 20s), not WebSockets - simple and reliable for this app's scale.
 * A push channel would feel more instant but isn't worth the added infra complexity yet.
 */
export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const load = useCallback(() => {
    apiClient.get('/notifications', { params: { size: 10 } })
      .then(({ data }) => {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
        setUnreadCount(data.unreadCount || 0)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function markRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await apiClient.patch(`/notifications/${id}/read`)
    } catch {
      load() // resync on failure, since we already applied it optimistically
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-parchment-muted transition-colors hover:bg-ink-raised hover:text-parchment"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brass px-1 font-mono text-[10px] font-semibold text-ink">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-md border border-ink-border bg-ink-surface shadow-2xl">
          <div className="border-b border-ink-border px-4 py-3">
            <span className="font-sans text-sm font-medium text-parchment">Notifications</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center font-sans text-sm text-parchment-muted">
                Nothing here yet.
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.readAt && markRead(n.id)}
                  className={`block w-full border-b border-ink-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-ink-raised/60 ${
                    n.readAt ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.readAt && <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brass" />}
                    <div className={n.readAt ? 'pl-3.5' : ''}>
                      <p className="font-sans text-sm text-parchment">{n.message}</p>
                      <p className="mt-1 font-mono text-[11px] text-parchment-faint">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <Link
            to="/app/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-ink-border px-4 py-3 text-center font-sans text-xs font-medium text-brass hover:text-brass-light"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
