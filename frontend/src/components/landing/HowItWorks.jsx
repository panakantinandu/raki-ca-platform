const STEPS = [
  {
    n: '01',
    title: 'Add your clients',
    body: 'Import your client list once - entity type, GSTIN, PAN. Raki builds the filing calendar for each one automatically.'
  },
  {
    n: '02',
    title: 'Documents come in',
    body: 'Clients upload or WhatsApp their documents directly. Raki extracts the relevant figures and flags anything that looks off.'
  },
  {
    n: '03',
    title: 'You review, not retype',
    body: 'Forms arrive pre-filled. You check the numbers, approve, and file - instead of starting from a blank return.'
  },
  {
    n: '04',
    title: 'Everything stays logged',
    body: 'Every filing, document, and client message is timestamped and searchable, ready whenever you need the history.'
  }
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative border-t border-ink-border py-28">
      <div className="mx-auto max-w-7xl px-6">
        <span className="label-eyebrow">The workflow</span>
        <h2 className="mt-4 max-w-xl font-display text-4xl font-medium tracking-tight text-parchment md:text-5xl">
          From client intake to filed return.
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.n} className="relative">
              <span className="font-mono text-sm text-brass/70">{step.n}</span>
              <h3 className="mt-3 font-display text-lg font-medium text-parchment">{step.title}</h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-parchment-muted">{step.body}</p>
              {i < STEPS.length - 1 && (
                <div className="mt-8 hidden h-px w-full bg-gradient-to-r from-ink-border to-transparent lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
