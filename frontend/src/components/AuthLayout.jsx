import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

const HIGHLIGHTS = [
  'AI reads your clients\u2019 documents automatically',
  'Every GST, TDS and ITR deadline tracked for you',
  'WhatsApp updates your clients actually read'
]

export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-ink lg:grid-cols-2">
      {/* Left: branding panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-ink-border p-12 lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brass/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-ledger-teal/5 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="7" fill="#C9A227" fillOpacity="0.15" />
            <path d="M9 16.5l4.5 4.5L23 11" stroke="#C9A227" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display text-xl font-medium text-parchment">Raki</span>
        </Link>

        <div className="relative">
          <p className="font-display text-3xl font-medium leading-snug text-parchment">
            "The filing calendar finally manages itself."
          </p>
          <p className="mt-4 font-sans text-sm text-parchment-muted">
            &mdash; What every CA says by their second filing season on Raki
          </p>

          <ul className="mt-10 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-2.5 font-sans text-sm text-parchment-muted">
                <Check size={16} className="mt-0.5 flex-shrink-0 text-brass" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-xs text-parchment-faint">
          Trusted by independent CAs and growing firms across India
        </p>
      </div>

      {/* Right: form panel */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <span className="label-eyebrow">{eyebrow}</span>
          <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-parchment">{title}</h1>
          <p className="mt-2 font-sans text-sm text-parchment-muted">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
