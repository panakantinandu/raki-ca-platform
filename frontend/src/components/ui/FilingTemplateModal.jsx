import { useState } from 'react'
import apiClient from '../../api/axiosClient.js'
import Modal from './Modal.jsx'

const FILING_TYPES = ['GSTR1', 'GSTR3B', 'ITR', 'TDS', 'AUDIT']

const EMPTY_FORM = { filingType: 'GSTR3B', dayOfMonthDue: 20 }

export default function FilingTemplateModal({ open, clientId, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await apiClient.post('/filing-templates', { clientId, ...form, dayOfMonthDue: Number(form.dayOfMonthDue) })
      setForm(EMPTY_FORM)
      onSaved()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save this recurring filing.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Set up recurring filing">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-md border border-ledger-red/30 bg-ledger-red/10 px-4 py-3 font-sans text-sm text-ledger-red">
            {formError}
          </div>
        )}

        <p className="font-sans text-sm text-parchment-muted">
          A new filing for this type is created automatically each month, on the due day below,
          if one doesn't already exist for that period.
        </p>

        <div>
          <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Filing type</label>
          <select value={form.filingType} onChange={(e) => setForm({ ...form, filingType: e.target.value })} className="input-field">
            {FILING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Due day of month</label>
          <input
            required type="number" min={1} max={31}
            value={form.dayOfMonthDue}
            onChange={(e) => setForm({ ...form, dayOfMonthDue: e.target.value })}
            className="input-field"
          />
        </div>

        <button type="submit" disabled={saving} className="btn-brass w-full disabled:opacity-60">
          {saving ? 'Saving…' : 'Set up recurring filing'}
        </button>
      </form>
    </Modal>
  )
}
