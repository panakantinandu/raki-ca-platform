import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'

const DEMO_ROWS = [
  { client: 'Raghunath Textiles', type: 'GSTR-3B', period: 'Jun 2026' },
  { client: 'Meridian Foods Pvt Ltd', type: 'GSTR-1', period: 'Jun 2026' },
  { client: 'S. Iyer & Associates', type: 'TDS 26Q', period: 'Q1 FY27' },
  { client: 'Kalyan Auto Components', type: 'ITR-4', period: 'AY 2026-27' }
]

function LedgerTicker() {
  return (
    <div className="card relative w-full max-w-md overflow-hidden shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-ink-border px-5 py-4">
        <span className="label-eyebrow">Filing queue &mdash; today</span>
        <span
          className="rounded-full bg-ledger-teal/10 px-2.5 py-1 font-mono text-[11px] text-ledger-teal opacity-0 animate-fadeUp"
          style={{ animationDelay: '2.1s', animationFillMode: 'forwards' }}
        >
          All caught up
        </span>
      </div>

      <ul className="divide-y divide-ink-border">
        {DEMO_ROWS.map((row, i) => (
          <li
            key={row.client}
            className="flex items-center justify-between px-5 py-4 opacity-0 animate-rowRise"
            style={{ animationDelay: `${i * 0.35}s`, animationFillMode: 'forwards' }}
          >
            <div>
              <p className="font-sans text-sm font-medium text-parchment">{row.client}</p>
              <p className="font-mono text-xs text-parchment-faint">{row.type} &middot; {row.period}</p>
            </div>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full bg-brass opacity-0 animate-tickIn"
              style={{ animationDelay: `${i * 0.35 + 0.3}s`, animationFillMode: 'forwards' }}
            >
              <Check size={15} strokeWidth={3} className="text-ink" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-36 md:pt-44">
      {/* Ambient glow, quiet and restrained */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brass/5 blur-3xl" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
        <div>
          <span className="label-eyebrow">For chartered accountants &amp; tax consultants</span>
          <h1 className="mt-5 font-display text-5xl font-medium leading-[1.08] tracking-tight text-parchment md:text-6xl">
            Every filing,<br />
            <span className="text-brass">filed on time.</span>
          </h1>
          <p className="mt-6 max-w-lg font-sans text-lg leading-relaxed text-parchment-muted">
            Raki reads client documents, fills GST and ITR forms, tracks every
            deadline, and messages clients on WhatsApp &mdash; so your desk stays
            clear for the work that actually needs a CA.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link to="/signup" className="btn-brass">
              Start your 14-day trial <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works" className="btn-ghost">
              See how it works
            </a>
          </div>

          <p className="mt-5 font-mono text-xs text-parchment-faint">
            No card required &middot; Cancel anytime &middot; Data stays in India
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <LedgerTicker />
        </div>
      </div>
    </section>
  )
}
