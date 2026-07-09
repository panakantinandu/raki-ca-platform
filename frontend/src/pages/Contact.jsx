import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import apiClient from '../api/axiosClient.js'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const EMPTY_FORM = { name: '', email: '', message: '' }

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      await apiClient.post('/public/contact', form)
      setSent(true)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink font-sans text-parchment">
      <Navbar />
      <main className="mx-auto max-w-xl px-6 pb-24 pt-32">
        <span className="label-eyebrow">Get in touch</span>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-parchment">Contact us</h1>
        <p className="mt-4 font-sans text-sm leading-relaxed text-parchment-muted">
          Questions about Raki, privacy, or anything else - send us a message and we'll get
          back to you personally. We're a small team, so replies come from a real person.
        </p>

        <div className="card mt-8 p-6">
          {sent ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ledger-teal/10">
                <CheckCircle2 size={22} className="text-ledger-teal" />
              </div>
              <h3 className="font-display text-lg font-medium text-parchment">Message sent</h3>
              <p className="mt-2 max-w-sm font-sans text-sm text-parchment-muted">
                Thanks for reaching out - we'll reply to your email as soon as we can.
              </p>
              <button onClick={() => setSent(false)} className="btn-ghost mt-6 !px-4 !py-2 text-sm">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md border border-ledger-red/30 bg-ledger-red/10 px-4 py-3 font-sans text-sm text-ledger-red">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Message</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input-field resize-none"
                />
              </div>

              <button type="submit" disabled={sending} className="btn-brass w-full disabled:opacity-60">
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
