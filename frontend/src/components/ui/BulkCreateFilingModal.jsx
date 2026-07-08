import { useState } from 'react'
import apiClient from '../../api/axiosClient.js'
import Modal from './Modal.jsx'

const FILING_TYPES = ['GSTR1', 'GSTR3B', 'ITR', 'TDS', 'AUDIT']

const EMPTY_FORM = { filingType: 'GSTR3B', periodLabel: '', dueDate: '', notes: '' }

/** Creates one filing per selected client in a single request, and reports per-client results. */
export default function BulkCreateFilingModal({ open, clientIds, onClose, onDone }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [results, setResults] = useState(null)

  function reset() {
    setForm(EMPTY_FORM)
    setFormError('')
    setResults(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const { data } = await apiClient.post('/filings/bulk-create', { clientIds, ...form })
      setResults(data)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not create these filings.')
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    const hadResults = Boolean(results)
    reset()
    onClose()
    if (hadResults) onDone()
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Bulk create filing (${clientIds.length} clients)`}>
      {results ? (
        <div className="space-y-4">
          <div className="rounded-md border border-ledger-teal/30 bg-ledger-teal/10 px-4 py-3 font-sans text-sm text-ledger-teal">
            {results.filter((r) => r.success).length} of {results.length} filings created successfully.
          </div>
          {results.some((r) => !r.success) && (
            <ul className="space-y-1.5">
              {results.filter((r) => !r.success).map((r) => (
                <li key={r.clientId} className="font-mono text-xs text-ledger-red">
                  {r.clientId}: {r.message}
                </li>
              ))}
            </ul>
          )}
          <button onClick={handleClose} className="btn-brass w-full">Done</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-md border border-ledger-red/30 bg-ledger-red/10 px-4 py-3 font-sans text-sm text-ledger-red">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Filing type</label>
            <select value={form.filingType} onChange={(e) => setForm({ ...form, filingType: e.target.value })} className="input-field">
              {FILING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Period label</label>
              <input required placeholder="e.g. Jul 2026" value={form.periodLabel} onChange={(e) => setForm({ ...form, periodLabel: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Due date</label>
              <input required type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input-field" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field resize-none" />
          </div>

          <button type="submit" disabled={saving} className="btn-brass w-full disabled:opacity-60">
            {saving ? 'Creating…' : `Create ${clientIds.length} filing${clientIds.length === 1 ? '' : 's'}`}
          </button>
        </form>
      )}
    </Modal>
  )
}
