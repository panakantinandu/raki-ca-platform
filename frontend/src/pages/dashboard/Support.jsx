import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, Send, MessageCircleQuestion, Sparkles } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'
import { useToast } from '../../context/ToastContext.jsx'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { LANDING_FAQS, DASHBOARD_FAQS } from '../../data/faqContent.js'

const ALL_FAQS = [...DASHBOARD_FAQS, ...LANDING_FAQS]

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function FaqSection() {
  const [query, setQuery] = useState('')
  const [openIndex, setOpenIndex] = useState(-1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_FAQS
    return ALL_FAQS.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="card p-6">
      <h2 className="mb-4 font-display text-lg font-medium text-parchment">Frequently asked questions</h2>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-parchment-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          className="input-field pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-4 font-sans text-sm text-parchment-muted">No matching questions - try a different search, or ask below.</p>
      ) : (
        <div className="divide-y divide-ink-border border-t border-ink-border">
          {filtered.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div key={item.q}>
                <button
                  className="flex w-full items-center justify-between py-4 text-left"
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                >
                  <span className="pr-6 font-sans text-sm font-medium text-parchment">{item.q}</span>
                  <Plus size={16} className={`flex-shrink-0 text-brass transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                </button>
                {isOpen && <p className="pb-4 font-sans text-sm leading-relaxed text-parchment-muted">{item.a}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AskAi({ onTicketCreated }) {
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleAsk(e) {
    e.preventDefault()
    if (!question.trim()) return
    setAsking(true)
    setError('')
    setResult(null)
    try {
      const { data } = await apiClient.post('/support/chat', { question })
      setResult(data)
      if (data.fallbackTicketId) onTicketCreated()
      setQuestion('')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the assistant. Please submit a ticket below instead.')
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={17} className="text-brass" />
        <h2 className="font-display text-lg font-medium text-parchment">Ask a question</h2>
      </div>
      <p className="mb-4 font-sans text-sm text-parchment-muted">
        Get an instant answer, or we'll open a support ticket for our team if we're not confident.
      </p>
      <form onSubmit={handleAsk} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. How do I share a client's status?"
          className="input-field"
        />
        <button type="submit" disabled={asking} className="btn-brass !px-4 disabled:opacity-60" aria-label="Ask">
          {asking ? '…' : <Send size={16} />}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-md border border-ledger-red/30 bg-ledger-red/10 px-4 py-3 font-sans text-sm text-ledger-red">
          {error}
        </div>
      )}

      {result && (
        <div
          className={`mt-4 rounded-md border px-4 py-3 font-sans text-sm ${
            result.answered
              ? 'border-ledger-teal/30 bg-ledger-teal/10 text-parchment'
              : 'border-brass/30 bg-brass/5 text-parchment-muted'
          }`}
        >
          {result.answer}
        </div>
      )}
    </div>
  )
}

function TicketForm({ onCreated }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiClient.post('/support/tickets', { subject, message })
      setSubject('')
      setMessage('')
      showToast('Support ticket submitted.')
      onCreated()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit this ticket.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircleQuestion size={17} className="text-brass" />
        <h2 className="font-display text-lg font-medium text-parchment">Submit a support ticket</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-ledger-red/30 bg-ledger-red/10 px-4 py-3 font-sans text-sm text-ledger-red">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Subject</label>
          <input required value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Message</label>
          <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="input-field resize-none" />
        </div>
        <button type="submit" disabled={saving} className="btn-brass w-full disabled:opacity-60">
          {saving ? 'Submitting…' : 'Submit ticket'}
        </button>
      </form>
    </div>
  )
}

function TicketHistory({ tickets, loading }) {
  return (
    <div className="card p-6">
      <h2 className="mb-4 font-display text-lg font-medium text-parchment">Your tickets</h2>
      {loading ? (
        <div className="h-24 animate-pulse rounded-md bg-ink-raised/50" />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={MessageCircleQuestion}
          title="No tickets yet"
          body="Questions you submit above will show up here, along with any reply from our team."
        />
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-md border border-ink-border p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-sans text-sm font-medium text-parchment">{t.subject}</p>
                <Badge status={t.status} />
              </div>
              <p className="mt-1.5 font-sans text-sm text-parchment-muted">{t.message}</p>
              <p className="mt-2 font-mono text-[11px] text-parchment-faint">{formatDate(t.createdAt)}</p>

              {t.adminReply && (
                <div className="mt-3 rounded-md border border-brass/20 bg-brass/5 px-3 py-2.5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-brass">Reply from our team</p>
                  <p className="mt-1 font-sans text-sm text-parchment">{t.adminReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Support() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  function loadTickets() {
    setLoading(true)
    apiClient.get('/support/tickets', { params: { size: 50, sort: 'createdAt,desc' } })
      .then(({ data }) => setTickets(data.content || []))
      .finally(() => setLoading(false))
  }

  useEffect(loadTickets, [])

  return (
    <div>
      <div className="mb-8">
        <span className="label-eyebrow">Support</span>
        <h1 className="mt-2 font-display text-3xl font-medium text-parchment">How can we help?</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <AskAi onTicketCreated={loadTickets} />
          <FaqSection />
        </div>
        <div className="space-y-6">
          <TicketForm onCreated={loadTickets} />
          <TicketHistory tickets={tickets} loading={loading} />
        </div>
      </div>
    </div>
  )
}
