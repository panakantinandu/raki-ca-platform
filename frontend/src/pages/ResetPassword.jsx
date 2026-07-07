import { useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Check, X, CircleAlert } from 'lucide-react'
import apiClient from '../api/axiosClient.js'
import AuthLayout from '../components/AuthLayout.jsx'

const RULES = [
  { key: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'number', label: 'One number', test: (p) => /\d/.test(p) },
  { key: 'special', label: 'One special character', test: (p) => /[@$!%*?&#^()_+=-]/.test(p) }
]

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const passwordChecks = useMemo(
    () => RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password]
  )
  const allPassed = passwordChecks.every((r) => r.passed)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!allPassed) {
      setError('Your password needs to meet all the requirements below.')
      return
    }
    setLoading(true)
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword: password })
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset your password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout eyebrow="Reset your password" title="Link missing" subtitle="">
        <div className="flex flex-col items-center rounded-md border border-ledger-red/30 bg-ledger-red/5 px-6 py-10 text-center">
          <CircleAlert size={28} className="text-ledger-red" />
          <p className="mt-4 font-sans text-sm text-parchment">This reset link is missing its token.</p>
          <Link to="/forgot-password" className="mt-4 text-sm text-brass hover:text-brass-light">Request a new link</Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow="Reset your password"
      title="Choose a new password"
      subtitle="Make it something you haven't used here before."
    >
      {done ? (
        <div className="flex flex-col items-center rounded-md border border-ledger-teal/30 bg-ledger-teal/5 px-6 py-10 text-center">
          <Check size={28} className="text-ledger-teal" />
          <p className="mt-4 font-sans text-sm text-parchment">Password updated. Redirecting you to log in…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-ledger-red/30 bg-ledger-red/10 px-4 py-3 font-sans text-sm text-ledger-red">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="mb-1.5 block font-sans text-sm text-parchment-muted">New password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-11"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-faint hover:text-parchment"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {password.length > 0 && (
              <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {passwordChecks.map((r) => (
                  <li key={r.key} className="flex items-center gap-1.5 font-mono text-xs">
                    {r.passed ? (
                      <Check size={13} className="text-ledger-teal" />
                    ) : (
                      <X size={13} className="text-parchment-faint" />
                    )}
                    <span className={r.passed ? 'text-parchment-muted' : 'text-parchment-faint'}>{r.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-brass w-full disabled:opacity-60">
            {loading ? 'Updating…' : (<>Update password <ArrowRight size={16} /></>)}
          </button>
        </form>
      )}

      <p className="mt-8 text-center font-sans text-sm text-parchment-muted">
        <Link to="/login" className="text-brass hover:text-brass-light">Back to log in</Link>
      </p>
    </AuthLayout>
  )
}
