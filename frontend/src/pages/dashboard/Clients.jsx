import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Pencil, Trash2, FileStack, ChevronRight, CheckSquare, X, Download } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'
import ClientFormModal from '../../components/ui/ClientFormModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Badge from '../../components/ui/Badge.jsx'
import BulkCreateFilingModal from '../../components/ui/BulkCreateFilingModal.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { downloadFile } from '../../utils/downloadFile.js'

export default function Clients() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [deletingClient, setDeletingClient] = useState(null)
  // Bulk-select is opt-in (toggled via "Select"), not shown by default - a row's primary
  // action is opening its detail page, and permanently-visible checkboxes on every row made
  // that ambiguous (looked like a selection list first, a navigable table second).
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds([])
  }

  async function handleExport() {
    setExporting(true)
    try {
      await downloadFile('/clients/export', 'clients.csv')
      showToast('Client list exported.')
    } catch {
      showToast('Could not export clients.', { type: 'error' })
    } finally {
      setExporting(false)
    }
  }

  function loadClients() {
    setLoading(true)
    apiClient.get('/clients', { params: { size: 100 } })
      .then(({ data }) => setClients(data.content || []))
      .finally(() => setLoading(false))
  }

  useEffect(loadClients, [])

  function openCreate() {
    setEditingClient(null)
    setModalOpen(true)
  }

  function openEdit(client) {
    setEditingClient(client)
    setModalOpen(true)
  }

  async function confirmDelete() {
    await apiClient.delete(`/clients/${deletingClient.id}`)
    setDeletingClient(null)
    loadClients()
    showToast('Client removed.')
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => prev.length === clients.length ? [] : clients.map((c) => c.id))
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="label-eyebrow">Clients</span>
          <h1 className="mt-2 font-display text-3xl font-medium text-parchment">Your client book</h1>
        </div>
        <div className="flex items-center gap-3">
          {selectMode ? (
            <>
              {selectedIds.length > 0 && (
                <button onClick={() => setBulkModalOpen(true)} className="btn-ghost !px-4 !py-2.5 text-sm">
                  <FileStack size={16} /> Bulk create filing ({selectedIds.length})
                </button>
              )}
              <button onClick={exitSelectMode} className="btn-ghost !px-4 !py-2.5 text-sm">
                <X size={16} /> Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={handleExport} disabled={exporting} className="btn-ghost !px-4 !py-2.5 text-sm disabled:opacity-60">
                <Download size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
              <button onClick={() => setSelectMode(true)} className="btn-ghost !px-4 !py-2.5 text-sm">
                <CheckSquare size={16} /> Select
              </button>
              <button onClick={openCreate} className="btn-brass !py-2.5">
                <Plus size={16} /> Add client
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card h-64 animate-pulse bg-ink-raised/50" />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          body="Add your first client to start tracking their filings and documents."
          action={<button onClick={openCreate} className="btn-brass">Add your first client</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="border-b border-ink-border">
                <tr>
                  {selectMode && (
                    <th className="w-10 px-6 py-3">
                      <input
                        type="checkbox"
                        checked={clients.length > 0 && selectedIds.length === clients.length}
                        onChange={toggleSelectAll}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Select all clients"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment-faint">Name</th>
                  <th className="px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment-faint">Type</th>
                  <th className="px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment-faint">GSTIN</th>
                  <th className="px-6 py-3 font-mono text-xs uppercase tracking-wider text-parchment-faint">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-border">
                {clients.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/app/clients/${c.id}`)}
                    className="group cursor-pointer transition-colors hover:bg-ink-raised/40"
                  >
                    {selectMode && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleSelected(c.id)}
                          aria-label={`Select ${c.name}`}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <p className="font-sans text-sm font-medium text-parchment">{c.name}</p>
                      <p className="font-mono text-xs text-parchment-faint">{c.email}</p>
                    </td>
                    <td className="px-6 py-4 font-sans text-sm text-parchment-muted">{c.entityType}</td>
                    <td className="px-6 py-4 font-mono text-sm text-parchment-muted">{c.gstin || '-'}</td>
                    <td className="px-6 py-4"><Badge status={c.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {!selectMode && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(c) }}
                              className="rounded-md p-2 text-parchment-faint hover:bg-ink-raised hover:text-brass"
                              aria-label="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeletingClient(c) }}
                              className="rounded-md p-2 text-parchment-faint hover:bg-ink-raised hover:text-ledger-red"
                              aria-label="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                            <ChevronRight
                              size={16}
                              className="ml-1 text-parchment-faint opacity-0 transition-opacity group-hover:opacity-100"
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ClientFormModal
        open={modalOpen}
        client={editingClient}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); loadClients(); showToast(editingClient ? 'Client updated.' : 'Client saved.') }}
      />

      <ConfirmDialog
        open={Boolean(deletingClient)}
        title="Remove this client?"
        body={deletingClient ? `${deletingClient.name}'s filings and documents will remain in your records.` : ''}
        confirmLabel="Remove client"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeletingClient(null)}
      />

      <BulkCreateFilingModal
        open={bulkModalOpen}
        clientIds={selectedIds}
        onClose={() => setBulkModalOpen(false)}
        onDone={() => { exitSelectMode(); loadClients(); showToast('Bulk action completed.') }}
      />
    </div>
  )
}
