import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'
import Badge from '../../components/ui/Badge.jsx'

export default function Billing() {
  const [subscription, setSubscription] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState(false)

  function load() {
    setLoading(true)
    Promise.all([
      apiClient.get('/subscription/me'),
      apiClient.get('/plans')
    ]).then(([subRes, plansRes]) => {
      setSubscription(subRes.data)
      setPlans(plansRes.data)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleChangePlan(planCode) {
    if (subscription?.planCode === planCode) return
    setChanging(true)
    try {
      // In production this opens a Razorpay checkout instead of applying instantly -
      // see SubscriptionService.requestPlanChange for the swap-in point.
      await apiClient.post('/subscription/change-plan', null, { params: { planCode } })
      load()
    } finally {
      setChanging(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <span className="label-eyebrow">Billing</span>
        <h1 className="mt-2 font-display text-3xl font-medium text-parchment">Subscription</h1>
      </div>

      {loading ? (
        <div className="card h-40 animate-pulse bg-ink-raised/50" />
      ) : (
        <>
          <div className="card mb-8 flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-parchment-faint">Current plan</p>
              <p className="mt-2 font-display text-2xl font-medium text-parchment">{subscription?.planName}</p>
              {subscription?.foundingActive ? (
                <p className="mt-1 flex items-baseline gap-2 font-sans text-sm text-parchment-muted">
                  <span className="font-medium text-brass">₹{subscription.foundingPriceInrMonthly}/month</span>
                  <span className="text-parchment-faint line-through">₹{subscription.priceInrMonthly}/month</span>
                </p>
              ) : (
                <p className="mt-1 font-sans text-sm text-parchment-muted">₹{subscription?.priceInrMonthly}/month</p>
              )}
            </div>
            <Badge status={subscription?.status} />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = subscription?.planCode === plan.code
              return (
                <div key={plan.code} className={`card p-6 ${isCurrent ? 'border-brass/50' : ''}`}>
                  <h3 className="font-display text-lg font-medium text-parchment">{plan.name}</h3>
                  <p className="mt-1 font-sans text-sm text-parchment-muted">{plan.description}</p>
                  {plan.foundingActive ? (
                    <>
                      <span className="mt-4 inline-block rounded-full bg-brass/10 px-2.5 py-1 font-mono text-[11px] font-medium text-brass">
                        Founding Firms &mdash; {plan.foundingSlotsRemaining} of {plan.foundingSlotsTotal} spots left
                      </span>
                      <p className="mt-2 flex items-baseline gap-2">
                        <span className="font-display text-2xl font-medium text-parchment">
                          ₹{plan.foundingPriceInrMonthly}<span className="font-sans text-sm text-parchment-faint">/month</span>
                        </span>
                        <span className="font-sans text-sm text-parchment-faint line-through">₹{plan.priceInrMonthly}</span>
                      </p>
                      <p className="font-mono text-[11px] text-parchment-faint">Locked for {plan.foundingPriceLockMonths} months</p>
                    </>
                  ) : (
                    <p className="mt-4 font-display text-2xl font-medium text-parchment">
                      ₹{plan.priceInrMonthly}<span className="font-sans text-sm text-parchment-faint">/month</span>
                    </p>
                  )}
                  <ul className="mt-5 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 font-sans text-xs text-parchment-muted">
                        <Check size={13} className="mt-0.5 flex-shrink-0 text-ledger-teal" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleChangePlan(plan.code)}
                    disabled={isCurrent || changing}
                    className={`mt-6 w-full ${isCurrent ? 'btn-ghost opacity-50' : 'btn-brass'}`}
                  >
                    {isCurrent ? 'Current plan' : 'Switch to this plan'}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
