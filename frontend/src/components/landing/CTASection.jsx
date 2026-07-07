import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CTASection() {
  return (
    <section className="relative border-t border-ink-border py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass/5 blur-3xl" />

      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display text-4xl font-medium tracking-tight text-parchment md:text-5xl">
          Your next filing season,<br />without the scramble.
        </h2>
        <p className="mx-auto mt-5 max-w-md font-sans text-parchment-muted">
          Set up your first ten clients in under fifteen minutes. No card needed to start.
        </p>
        <div className="mt-9 flex justify-center">
          <Link to="/signup" className="btn-brass">
            Start your 14-day trial <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
