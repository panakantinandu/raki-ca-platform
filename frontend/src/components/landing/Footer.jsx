import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-ink-border py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="7" fill="#C9A227" fillOpacity="0.15" />
            <path d="M9 16.5l4.5 4.5L23 11" stroke="#C9A227" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display text-base text-parchment">Raki</span>
        </div>

        <p className="font-mono text-xs text-parchment-faint">
          © {new Date().getFullYear()} Raki Technologies. Built for practices, not portals.
        </p>

        <div className="flex gap-6 font-sans text-sm text-parchment-muted">
          <Link to="/privacy" className="hover:text-parchment">Privacy</Link>
          <Link to="/terms" className="hover:text-parchment">Terms</Link>
          <Link to="/contact" className="hover:text-parchment">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
