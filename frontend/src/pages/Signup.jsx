import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Check, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import GoogleButton from '../components/GoogleButton.jsx'

const RULES = [
  { key: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'number', label: 'One number', test: (p) => /\d/.test(p) },
  { key: 'special', label: 'One special character', test: (p) => /[@$!%*?&#^()_+=-]/.test(p) }
]

export default function Signup() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [firmName, setFirmName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      await register(fullName, email, password, firmName)
      navigate('/app')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="14-day free trial"
      title="Set up your practice"
      subtitle="No card required. You can invite your team once you're in."
    >
      <GoogleButton label="Sign up with Google" />

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
          <label htmlFor="fullName" className="mb-1.5 block font-sans text-sm text-parchment-muted">Full name</label>
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-field"
            placeholder="Priya Sharma"
          />
        </div>

        <div>
          <label htmlFor="firmName" className="mb-1.5 block font-sans text-sm text-parchment-muted">Firm name (optional)</label>
          <input
            id="firmName"
            value={firmName}
            onChange={(e) => setFirmName(e.target.value)}
            className="input-field"
            placeholder="Sharma & Associates"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block font-sans text-sm text-parchment-muted">Work email</label>
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
          <label htmlFor="password" className="mb-1.5 block font-sans text-sm text-parchment-muted">Password</label>
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
          {loading ? 'Creating account…' : (<>Start free trial <ArrowRight size={16} /></>)}
        </button>
      </form>

      <p className="mt-8 text-center font-sans text-sm text-parchment-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-brass hover:text-brass-light">Log in</Link>
      </p>
    </AuthLayout>
  )
}
