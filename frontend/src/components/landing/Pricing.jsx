import { useEffect, useState } from 'react'
import { Check, CircleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import apiClient from '../../api/axiosClient.js'

// Growth is the plan we spotlight with the "Most common" badge on the landing page.
const HIGHLIGHTED_CODE = 'GROWTH'

export default function Pricing() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let mounted = true
    apiClient.get('/plans')
      .then(({ data }) => {
        if (!mounted) return
        // The API is expected to return a plain array. If something upstream ever
        // returns an error body or a differently-shaped response instead, fall back
        // to an explicit error state rather than crashing the whole page on .map().
        if (Array.isArray(data)) {
          setPlans(data)
        } else {
          setLoadError(true)
        }
      })
      .catch(() => { if (mounted) setLoadError(true) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  return (
    <section id="pricing" className="relative border-t border-ink-border py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <span className="label-eyebrow">Pricing</span>
          <h2 className="mx-auto mt-4 max-w-xl font-display text-4xl font-medium tracking-tight text-parchment md:text-5xl">
            Priced per firm, not per headache.
          </h2>
          <p className="mx-auto mt-4 max-w-md font-sans text-parchment-muted">
            Every plan starts with a 14-day trial. Upgrade or downgrade whenever your client book changes.
          </p>
        </div>

        {loading ? (
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-96 animate-pulse bg-ink-raised/50" />
            ))}
          </div>
        ) : loadError ? (
          <div className="mt-16 flex flex-col items-center rounded-xl border border-ink-border bg-ink-surface px-6 py-16 text-center">
            <CircleAlert size={28} className="text-parchment-faint" />
            <p className="mt-4 font-sans text-sm text-parchment-muted">Pricing temporarily unavailable. Please check back shortly.</p>
          </div>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const highlighted = plan.code === HIGHLIGHTED_CODE
              return (
                <div
                  key={plan.code}
                  className={`card relative flex flex-col p-8 ${
                    highlighted ? 'border-brass/50 shadow-xl shadow-brass/5' : ''
                  }`}
                >
                  {highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brass px-3 py-1 font-mono text-[11px] font-medium text-ink">
                      Most common
                    </span>
                  )}

                  <h3 className="font-display text-xl font-medium text-parchment">{plan.name}</h3>
                  <p className="mt-1 font-sans text-sm text-parchment-muted">{plan.description}</p>

                  {plan.foundingActive ? (
                    <>
                      <span className="mt-5 inline-block w-fit rounded-full bg-brass/10 px-2.5 py-1 font-mono text-[11px] font-medium text-brass">
                        Founding Firms &mdash; {plan.foundingSlotsRemaining} of {plan.foundingSlotsTotal} spots left
                      </span>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-mono text-sm text-parchment-faint">₹</span>
                        <span className="font-display text-4xl font-medium text-parchment">{plan.foundingPriceInrMonthly.toLocaleString('en-IN')}</span>
                        <span className="font-sans text-sm text-parchment-faint">/month</span>
                      </div>
                      <p className="mt-1 flex items-baseline gap-2 font-sans text-sm text-parchment-faint">
                        <span className="line-through">₹{plan.priceInrMonthly.toLocaleString('en-IN')}/month</span>
                        <span>locked for {plan.foundingPriceLockMonths} months</span>
                      </p>
                    </>
                  ) : (
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="font-mono text-sm text-parchment-faint">₹</span>
                      <span className="font-display text-4xl font-medium text-parchment">{plan.priceInrMonthly.toLocaleString('en-IN')}</span>
                      <span className="font-sans text-sm text-parchment-faint">/month</span>
                    </div>
                  )}

                  <ul className="mt-8 flex-1 space-y-3">
                    {(Array.isArray(plan.features) ? plan.features : []).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 font-sans text-sm text-parchment-muted">
                        <Check size={16} className="mt-0.5 flex-shrink-0 text-ledger-teal" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/signup"
                    className={`mt-8 ${highlighted ? 'btn-brass' : 'btn-ghost'}`}
                  >
                    Start free trial
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
