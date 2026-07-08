import { useEffect, useState } from 'react'
import { Plus, FileCheck2, Check, Table2, CalendarDays, CheckCheck } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Badge from '../../components/ui/Badge.jsx'
import FilingsCalendar from '../../components/filings/FilingsCalendar.jsx'

const FILING_TYPES = ['GSTR1', 'GSTR3B', 'ITR', 'TDS', 'AUDIT']

// Parses "YYYY-MM-DD" as local calendar components rather than through `new Date(str)`,
// which parses date-only strings as UTC and can display as the previous day in
// timezones behind UTC.
function formatDueDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Filings() {
  const [view, setView] = useState('calendar')
  const [filings, setFilings] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ clientId: '', filingType: 'GSTR1', periodLabel: '', dueDate: '', notes: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkMarking, setBulkMarking] = useState(false)

  function loadFilings() {
    setLoading(true)
    apiClient.get('/filings', { params: { size: 100, sort: 'dueDate,asc' } })
      .then(({ data }) => setFilings(data.content || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadFilings()
    apiClient.get('/clients', { params: { size: 200 } }).then(({ data }) => setClients(data.content || []))
  }, [])

  function openCreate() {
    setForm({ clientId: clients[0]?.id || '', filingType: 'GSTR1', periodLabel: '', dueDate: '', notes: '' })
    setFormError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await apiClient.post('/filings', form)
      setModalOpen(false)
      loadFilings()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not create this filing.')
    } finally {
      setSaving(false)
    }
  }

  async function markFiled(id) {
    await apiClient.patch(`/filings/${id}/mark-filed`)
    loadFilings()
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const unfiledIds = filings.filter((f) => f.status !== 'FILED').map((f) => f.id)

  function toggleSelectAll() {
    setSelectedIds((prev) => prev.length === unfiledIds.length ? [] : unfiledIds)
  }

  async function bulkMarkFiled() {
    setBulkMarking(true)
    try {
      await apiClient.patch('/filings/bulk-mark-filed', { filingIds: selectedIds })
      setSelectedIds([])
      loadFilings()
    } finally {
      setBulkMarking(false)
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="label-eyebrow">Filings</span>
          <h1 className="mt-2 font-display text-3xl font-medium text-parchment">Filing tracker</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-md border border-ink-border p-1">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 font-sans text-xs transition-colors ${
                view === 'calendar' ? 'bg-brass/10 text-brass' : 'text-parchment-muted hover:text-parchment'
              }`}
            >
              <CalendarDays size={14} /> Calendar
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 font-sans text-xs transition-colors ${
                view === 'table' ? 'bg-brass/10 text-brass' : 'text-parchment-muted hover:text-parchment'
              }`}
            >
              <Table2 size={14} /> Table
            </button>
          </div>
          {view === 'table' && selectedIds.length > 0 && (
            <button onClick={bulkMarkFiled} disabled={bulkMarking} className="btn-ghost !px-4 !py-2.5 text-sm disabled:opacity-60">
              <CheckCheck size={16} /> {bulkMarking ? 'Marking…' : `Bulk mark as filed (${selectedIds.length})`}
            </button>
          )}
          <button onClick={openCreate} disabled={clients.length === 0} className="btn-brass !py-2.5 disabled:opacity-50">
            <Plus size={16} /> New filing
          </button>
        </div>
      </div>

      {clients.length === 0 && !loading && (
        <div className="mb-6 rounded-md border border-brass/30 bg-brass/5 px-4 py-3 font-sans text-sm text-parchment-muted">
          Add a client first, then you can start tracking their filings.
        </div>
      )}

      {view === 'calendar' ? (
        <FilingsCalendar />
      ) : loading ? (
        <div className="card h-64 animate-pulse bg-ink-raised/50" />
      ) : filings.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No filings tracked yet"
          body="Create a filing for a client to see it show up on your deadline calendar."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b border-ink-border">
                <tr>
                  <th className="w-10 px-6 py-3">
                    <input
                      type="checkbox"
                      checked={unfiledIds.length > 0 && selectedIds.length === unfiledIds.length}
                      onChange={toggleSelectAll}
                      aria-label="Select all unfiled filings"
                    />
                  </th>
                  <th className="px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment-faint">Client</th>
                  <th className="px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment-faint">Type</th>
                  <th className="px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment-faint">Period</th>
                  <th className="px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment-faint">Due</th>
                  <th className="px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment-faint">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-border">
                {filings.map((f) => (
                  <tr key={f.id} className="transition-colors hover:bg-ink-raised/40">
                    <td className="px-6 py-4">
                      {f.status !== 'FILED' && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(f.id)}
                          onChange={() => toggleSelected(f.id)}
                          aria-label={`Select ${f.client?.name} ${f.filingType}`}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 font-sans text-sm font-medium text-parchment">{f.client?.name}</td>
                    <td className="px-6 py-4 font-mono text-sm text-parchment-muted">{f.filingType}</td>
                    <td className="px-6 py-4 font-sans text-sm text-parchment-muted">{f.periodLabel}</td>
                    <td className="px-6 py-4 font-mono text-sm text-parchment-muted">
                      {formatDueDate(f.dueDate)}
                    </td>
                    <td className="px-6 py-4"><Badge status={f.status} /></td>
                    <td className="px-6 py-4">
                      {f.status !== 'FILED' && (
                        <button
                          onClick={() => markFiled(f.id)}
                          className="flex items-center gap-1.5 rounded-md border border-ink-border px-3 py-1.5 font-sans text-xs text-parchment-muted hover:border-ledger-teal/50 hover:text-ledger-teal"
                        >
                          <Check size={13} /> Mark filed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create a filing">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-md border border-ledger-red/30 bg-ledger-red/10 px-4 py-3 font-sans text-sm text-ledger-red">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Client</label>
            <select required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="input-field">
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

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
            {saving ? 'Creating…' : 'Create filing'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
