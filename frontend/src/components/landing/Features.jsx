import { FileScan, CalendarClock, MessageCircle, ShieldCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: FileScan,
    title: 'Documents, read automatically',
    body: 'Upload invoices, bank statements, and salary slips. Raki extracts the numbers and lines them up against the right filing - no manual data entry.'
  },
  {
    icon: CalendarClock,
    title: 'Deadlines that chase themselves',
    body: 'GSTR-1, GSTR-3B, TDS, ITR - every due date for every client, tracked automatically, with escalating reminders before anything goes overdue.'
  },
  {
    icon: MessageCircle,
    title: 'Clients updated on WhatsApp',
    body: 'Send status updates and document requests where your clients already are. No more chasing replies over email.'
  },
  {
    icon: ShieldCheck,
    title: 'A record for every filing',
    body: 'Every document, status change, and filing is logged and exportable - ready the moment a client or an audit asks for history.'
  }
]

export default function Features() {
  return (
    <section id="product" className="relative border-t border-ink-border py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <span className="label-eyebrow">What Raki does</span>
          <h2 className="mt-4 font-display text-4xl font-medium tracking-tight text-parchment md:text-5xl">
            The parts of practice that don't need a CA's judgment.
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card group p-8 transition-colors hover:border-brass/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brass/10 transition-colors group-hover:bg-brass/20">
                <Icon size={20} className="text-brass" />
              </div>
              <h3 className="mt-6 font-display text-xl font-medium text-parchment">{title}</h3>
              <p className="mt-3 font-sans text-[15px] leading-relaxed text-parchment-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
