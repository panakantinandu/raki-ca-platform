import { useState } from 'react'
import { Plus } from 'lucide-react'
import { LANDING_FAQS as FAQS } from '../../data/faqContent.js'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="faq" className="relative border-t border-ink-border py-28">
      <div className="mx-auto max-w-3xl px-6">
        <span className="label-eyebrow">Questions</span>
        <h2 className="mt-4 font-display text-4xl font-medium tracking-tight text-parchment">
          Before you start the trial
        </h2>

        <div className="mt-12 divide-y divide-ink-border border-t border-ink-border">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div key={item.q}>
                <button
                  className="flex w-full items-center justify-between py-6 text-left"
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                >
                  <span className="font-sans text-base font-medium text-parchment pr-6">{item.q}</span>
                  <Plus
                    size={18}
                    className={`flex-shrink-0 text-brass transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                  />
                </button>
                <div
                  className="grid overflow-hidden transition-all duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-6 font-sans text-sm leading-relaxed text-parchment-muted">{item.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
