import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { FileCheck2, AlertCircle } from 'lucide-react'
import Badge from '../components/ui/Badge.jsx'

// Parses "YYYY-MM-DD" as local calendar components, same fix as everywhere else this
// codebase renders a LocalDate string, to avoid a UTC-vs-local off-by-one-day display bug.
function formatDueDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Public, read-only, no-login page. Deliberately uses a bare axios call (not the app's
 * apiClient) - no Authorization header, no refresh-token/401-redirect interceptor. Anyone
 * with the link can view this without an account.
 */
export default function PublicStatus() {
  const { token } = useParams()
  const [status, setStatus] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    axios.get(`${base}/public/status/${token}`)
      .then(({ data }) => setStatus(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-lg">
        {loading ? (
          <div className="card h-48 animate-pulse bg-ink-raised/50" />
        ) : notFound || !status ? (
          <div className="card flex flex-col items-center p-10 text-center">
            <AlertCircle size={28} className="text-parchment-faint" />
            <h1 className="mt-4 font-display text-xl font-medium text-parchment">Link not found</h1>
            <p className="mt-2 font-sans text-sm text-parchment-muted">
              This status link doesn't exist or is no longer active.
            </p>
          </div>
        ) : (
          <div className="card p-6">
            <span className="label-eyebrow">Filing status</span>
            <h1 className="mt-2 font-display text-2xl font-medium text-parchment">{status.clientName}</h1>

            <div className="mt-6">
              {status.filings.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <FileCheck2 size={26} className="text-parchment-faint" />
                  <p className="mt-3 font-sans text-sm text-parchment-muted">No filings on record yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-ink-border">
                  {status.filings.map((f, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-3.5">
                      <div>
                        <p className="font-sans text-sm font-medium text-parchment">{f.filingType} &middot; {f.periodLabel}</p>
                        <p className="font-mono text-xs text-parchment-faint">Due {formatDueDate(f.dueDate)}</p>
                      </div>
                      <Badge status={f.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
