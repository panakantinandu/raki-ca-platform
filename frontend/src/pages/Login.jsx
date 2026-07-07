import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import GoogleButton from '../components/GoogleButton.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/app')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not log in. Check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to Raki"
      subtitle="Pick up where you left off with your clients and filings."
    >
      <GoogleButton label="Continue with Google" />

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-ink-border" />
        <span className="font-mono text-xs text-parchment-faint">OR</span>
        <div className="h-px flex-1 bg-ink-border" />
      </div>

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

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block font-sans text-sm text-parchment-muted">Password</label>
            <Link to="/forgot-password" className="font-sans text-xs text-brass hover:text-brass-light">Forgot?</Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-11"
              placeholder="••••••••"
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
        </div>

        <button type="submit" disabled={loading} className="btn-brass w-full disabled:opacity-60">
          {loading ? 'Logging in…' : (<>Log in <ArrowRight size={16} /></>)}
        </button>
      </form>

      <p className="mt-8 text-center font-sans text-sm text-parchment-muted">
        New to Raki?{' '}
        <Link to="/signup" className="text-brass hover:text-brass-light">Start a free trial</Link>
      </p>
    </AuthLayout>
  )
}
