import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MailCheck } from 'lucide-react'
import apiClient from '../api/axiosClient.js'
import AuthLayout from '../components/AuthLayout.jsx'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // The backend always returns 200 here regardless of whether the email exists,
      // so this request can't be used to tell whether an account is registered.
      await apiClient.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Reset your password"
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a link to reset it."
    >
      {sent ? (
        <div className="flex flex-col items-center rounded-md border border-ink-border bg-ink-raised px-6 py-10 text-center">
          <MailCheck size={28} className="text-ledger-teal" />
          <p className="mt-4 font-sans text-sm text-parchment">
            If an account exists for <span className="font-medium">{email}</span>, we've sent a reset link to it.
          </p>
          <p className="mt-2 font-sans text-xs text-parchment-faint">Check your inbox (and spam folder).</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-ledger-red/30 bg-ledger-red/10 px-4 py-3 font-sans text-sm text-ledger-red">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block font-sans text-sm text-parchment-muted">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@yourfirm.com"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-brass w-full disabled:opacity-60">
            {loading ? 'Sending…' : (<>Send reset link <ArrowRight size={16} /></>)}
          </button>
        </form>
      )}

      <p className="mt-8 text-center font-sans text-sm text-parchment-muted">
        Remembered it?{' '}
        <Link to="/login" className="text-brass hover:text-brass-light">Log in</Link>
      </p>
    </AuthLayout>
  )
}
