import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Pencil, Trash2 } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'
import ClientFormModal from '../../components/ui/ClientFormModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Badge from '../../components/ui/Badge.jsx'

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [deletingClient, setDeletingClient] = useState(null)

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
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="label-eyebrow">Clients</span>
          <h1 className="mt-2 font-display text-3xl font-medium text-parchment">Your client book</h1>
        </div>
        <button onClick={openCreate} className="btn-brass !py-2.5">
          <Plus size={16} /> Add client
        </button>
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
                    className="cursor-pointer transition-colors hover:bg-ink-raised/40"
                  >
                    <td className="px-6 py-4">
                      <p className="font-sans text-sm font-medium text-parchment">{c.name}</p>
                      <p className="font-mono text-xs text-parchment-faint">{c.email}</p>
                    </td>
                    <td className="px-6 py-4 font-sans text-sm text-parchment-muted">{c.entityType}</td>
                    <td className="px-6 py-4 font-mono text-sm text-parchment-muted">{c.gstin || '-'}</td>
                    <td className="px-6 py-4"><Badge status={c.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
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
        onSaved={() => { setModalOpen(false); loadClients() }}
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
    </div>
  )
}
