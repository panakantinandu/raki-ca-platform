import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'
import Modal from './Modal.jsx'

const FIELDS = [
  { key: 'vendorName', label: 'Vendor / party name' },
  { key: 'gstin', label: 'GSTIN' },
  { key: 'documentNumber', label: 'Invoice / document number' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' }
]

const EMPTY_FORM = { vendorName: '', gstin: '', documentNumber: '', amount: '', date: '' }

/**
 * Shows the AI's extracted fields as an editable, pre-filled form - never auto-saved. The CA
 * reviews (and corrects, if needed) before anything is persisted as confirmed via "Confirm".
 */
export default function ExtractionReviewModal({ open, document, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !document) return
    const data = document.extractedData || {}
    setForm({
      vendorName: data.vendorName ?? '',
      gstin: data.gstin ?? '',
      documentNumber: data.documentNumber ?? '',
      amount: data.amount != null ? String(data.amount) : '',
      date: data.date ?? ''
    })
    setError('')
  }, [open, document])

  if (!document) return null

  const data = document.extractedData || {}
  const missingFields = FIELDS.filter((f) => data[f.key] == null).map((f) => f.label)

  async function handleConfirm(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiClient.put(`/documents/${document.id}/extracted-data`, form)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save these values.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Review extracted details">
      <form onSubmit={handleConfirm} className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border border-brass/30 bg-brass/5 px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-brass" />
          <p className="font-sans text-xs text-parchment-muted">
            AI-extracted &mdash; please verify these values before relying on them. Correct anything
            that's wrong, then confirm to save.
          </p>
        </div>

        {missingFields.length > 0 && (
          <p className="font-sans text-xs text-parchment-faint">
            Couldn't read: {missingFields.join(', ')}. Fill these in manually if you have them.
          </p>
        )}

        {error && (
          <div className="rounded-md border border-ledger-red/30 bg-ledger-red/10 px-4 py-3 font-sans text-sm text-ledger-red">
            {error}
          </div>
        )}

        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1.5 block font-sans text-sm text-parchment-muted">{f.label}</label>
            <input
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              placeholder={data[f.key] == null ? 'Not read from document' : ''}
              className="input-field"
            />
          </div>
        ))}

        <button type="submit" disabled={saving} className="btn-brass w-full disabled:opacity-60">
          {saving ? 'Saving…' : 'Confirm and save'}
        </button>
      </form>
    </Modal>
  )
}
