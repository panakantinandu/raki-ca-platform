import { useEffect, useState } from 'react'
import apiClient from '../../api/axiosClient.js'
import Modal from './Modal.jsx'

const ENTITY_TYPES = ['INDIVIDUAL', 'PROPRIETORSHIP', 'PARTNERSHIP', 'COMPANY', 'LLP']

const EMPTY_FORM = { name: '', entityType: 'INDIVIDUAL', gstin: '', pan: '', email: '', phone: '', notes: '' }

/**
 * Shared create/edit form for a client - used by both the Clients list page and the
 * client detail page, so there's exactly one place that knows how to save a client.
 */
export default function ClientFormModal({ open, client, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(client ? {
      name: client.name, entityType: client.entityType, gstin: client.gstin || '',
      pan: client.pan || '', email: client.email || '', phone: client.phone || '', notes: client.notes || ''
    } : EMPTY_FORM)
    setFormError('')
  }, [open, client])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (client) {
        await apiClient.put(`/clients/${client.id}`, form)
      } else {
        await apiClient.post('/clients', form)
      }
      onSaved()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save this client.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={client ? 'Edit client' : 'Add a client'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-md border border-ledger-red/30 bg-ledger-red/10 px-4 py-3 font-sans text-sm text-ledger-red">
            {formError}
          </div>
        )}

        <div>
          <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
        </div>

        <div>
          <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Entity type</label>
          <select value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value })} className="input-field">
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block font-sans text-sm text-parchment-muted">GSTIN</label>
            <input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} className="input-field" maxLength={15} />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-sm text-parchment-muted">PAN</label>
            <input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} className="input-field" maxLength={10} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Notes</label>
          <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field resize-none" />
        </div>

        <button type="submit" disabled={saving} className="btn-brass w-full disabled:opacity-60">
          {saving ? 'Saving…' : client ? 'Save changes' : 'Add client'}
        </button>
      </form>
    </Modal>
  )
}
