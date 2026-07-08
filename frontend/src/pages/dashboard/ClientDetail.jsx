import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, FileCheck2, FolderOpen, Check, UserX, FileText, Repeat, X, Link2, Copy, Sparkles } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import ClientFormModal from '../../components/ui/ClientFormModal.jsx'
import FilingTemplateModal from '../../components/ui/FilingTemplateModal.jsx'
import ExtractionReviewModal from '../../components/ui/ExtractionReviewModal.jsx'

const EXTRACTABLE_TYPES = ['application/pdf', 'image/png', 'image/jpeg']

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Parses a "YYYY-MM-DD" LocalDate string as local calendar components rather than
// through `new Date(str)` (which parses as UTC and can render as the previous day in
// timezones behind UTC) - same fix applied in FilingsCalendar.
function formatDueDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ClientDetail() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [filings, setFilings] = useState([])
  const [documents, setDocuments] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [shareUpdating, setShareUpdating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [extractingId, setExtractingId] = useState(null)
  const [reviewDocument, setReviewDocument] = useState(null)
  const [extractError, setExtractError] = useState('')

  function load() {
    setLoading(true)
    setNotFound(false)
    Promise.all([
      apiClient.get(`/clients/${id}`),
      apiClient.get('/filings', { params: { clientId: id, size: 100, sort: 'dueDate,desc' } }),
      apiClient.get('/documents', { params: { clientId: id, size: 100 } }),
      apiClient.get('/filing-templates', { params: { clientId: id } })
    ]).then(([clientRes, filingsRes, documentsRes, templatesRes]) => {
      setClient(clientRes.data)
      setFilings(filingsRes.data.content || [])
      setDocuments(documentsRes.data.content || [])
      setTemplates(templatesRes.data || [])
    }).catch((err) => {
      if (err.response?.status === 404) setNotFound(true)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [id])

  async function markFiled(filingId) {
    await apiClient.patch(`/filings/${filingId}/mark-filed`)
    load()
  }

  async function deactivateTemplate(templateId) {
    await apiClient.patch(`/filing-templates/${templateId}/deactivate`)
    load()
  }

  async function toggleShareLink() {
    setShareUpdating(true)
    try {
      await apiClient.patch(`/clients/${id}/share-link`, null, { params: { enabled: !client.shareEnabled } })
      load()
    } finally {
      setShareUpdating(false)
    }
  }

  function copyShareLink() {
    const url = `${window.location.origin}/status/${client.shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleExtract(doc) {
    setExtractError('')
    setExtractingId(doc.id)
    try {
      const { data } = await apiClient.post(`/documents/${doc.id}/extract`)
      setReviewDocument(data)
    } catch (err) {
      setExtractError(err.response?.data?.message || 'Could not extract details from this document.')
    } finally {
      setExtractingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card h-36 animate-pulse bg-ink-raised/50" />
        <div className="card h-48 animate-pulse bg-ink-raised/50" />
        <div className="card h-48 animate-pulse bg-ink-raised/50" />
      </div>
    )
  }

  if (notFound || !client) {
    return (
      <EmptyState
        icon={UserX}
        title="Client not found"
        body="This client doesn't exist, or isn't part of your account."
        action={<Link to="/app/clients" className="btn-brass">Back to clients</Link>}
      />
    )
  }

  return (
    <div>
      <Link to="/app/clients" className="mb-6 inline-flex items-center gap-2 font-sans text-sm text-parchment-muted hover:text-parchment">
        <ArrowLeft size={15} /> Back to clients
      </Link>

      <div className="card mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-medium text-parchment">{client.name}</h1>
              <Badge status={client.status} />
            </div>
            <p className="mt-1 font-sans text-sm text-parchment-muted">{client.entityType}</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-ghost !px-4 !py-2 text-sm">
            <Pencil size={14} /> Edit
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-parchment-faint">GSTIN</p>
            <p className="mt-1 font-mono text-sm text-parchment">{client.gstin || '—'}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-parchment-faint">PAN</p>
            <p className="mt-1 font-mono text-sm text-parchment">{client.pan || '—'}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-parchment-faint">Email</p>
            <p className="mt-1 truncate font-sans text-sm text-parchment">{client.email || '—'}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-parchment-faint">Phone</p>
            <p className="mt-1 font-sans text-sm text-parchment">{client.phone || '—'}</p>
          </div>
        </div>
      </div>

      <div className="card mb-6 p-6">
        <h2 className="mb-5 font-display text-lg font-medium text-parchment">Filings</h2>
        {filings.length === 0 ? (
          <EmptyState icon={FileCheck2} title="No filings yet" body="Create a filing for this client to see its history here." />
        ) : (
          <ul className="divide-y divide-ink-border">
            {filings.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div>
                  <p className="font-sans text-sm font-medium text-parchment">{f.filingType} &middot; {f.periodLabel}</p>
                  <p className="font-mono text-xs text-parchment-faint">Due {formatDueDate(f.dueDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={f.status} />
                  {f.status !== 'FILED' && (
                    <button
                      onClick={() => markFiled(f.id)}
                      className="flex items-center gap-1.5 rounded-md border border-ink-border px-3 py-1.5 font-sans text-xs text-parchment-muted hover:border-ledger-teal/50 hover:text-ledger-teal"
                    >
                      <Check size={13} /> Mark filed
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mb-6 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-medium text-parchment">Client status link</h2>
            <p className="mt-1 font-sans text-sm text-parchment-muted">
              A read-only, no-login page this client can use to check their own filing status.
            </p>
          </div>
          <button
            onClick={toggleShareLink}
            disabled={shareUpdating}
            className={client.shareEnabled ? 'btn-ghost !px-4 !py-2 text-sm' : 'btn-brass !px-4 !py-2 text-sm'}
          >
            <Link2 size={14} /> {client.shareEnabled ? 'Disable link' : 'Enable link'}
          </button>
        </div>
        {client.shareEnabled && client.shareToken && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-ink-border bg-ink-raised/30 px-4 py-3">
            <code className="flex-1 truncate font-mono text-xs text-parchment-muted">
              {window.location.origin}/status/{client.shareToken}
            </code>
            <button onClick={copyShareLink} className="flex items-center gap-1.5 font-sans text-xs text-brass hover:text-brass-light">
              <Copy size={13} /> {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      <div className="card mb-6 p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-parchment">Recurring filings</h2>
          <button onClick={() => setTemplateModalOpen(true)} className="btn-ghost !px-4 !py-2 text-sm">
            <Repeat size={14} /> Set up recurring filing
          </button>
        </div>
        {templates.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No recurring filings set up"
            body="Set one up so this client's monthly filings (e.g. GSTR-3B) are created automatically."
          />
        ) : (
          <ul className="divide-y divide-ink-border">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3.5">
                <div>
                  <p className="font-sans text-sm font-medium text-parchment">{t.filingType}</p>
                  <p className="font-mono text-xs text-parchment-faint">Due on day {t.dayOfMonthDue} of every month</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={t.active ? 'ACTIVE' : 'INACTIVE'} />
                  {t.active && (
                    <button
                      onClick={() => deactivateTemplate(t.id)}
                      className="flex items-center gap-1.5 rounded-md border border-ink-border px-3 py-1.5 font-sans text-xs text-parchment-muted hover:border-ledger-red/50 hover:text-ledger-red"
                    >
                      <X size={13} /> Deactivate
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mb-6 p-6">
        <h2 className="mb-5 font-display text-lg font-medium text-parchment">Documents</h2>
        {extractError && (
          <div className="mb-4 rounded-md border border-ledger-red/30 bg-ledger-red/10 px-4 py-3 font-sans text-sm text-ledger-red">
            {extractError}
          </div>
        )}
        {documents.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No documents yet" body="Upload a document for this client from the Documents page." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div key={doc.id} className="rounded-lg border border-ink-border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brass/10">
                  <FileText size={18} className="text-brass" />
                </div>
                <p className="mt-3 truncate font-sans text-sm font-medium text-parchment" title={doc.fileName}>
                  {doc.fileName}
                </p>
                <p className="mt-1 font-mono text-xs text-parchment-faint">
                  {formatSize(doc.sizeBytes)} &middot; {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                </p>
                {EXTRACTABLE_TYPES.includes(doc.contentType) && (
                  <button
                    onClick={() => handleExtract(doc)}
                    disabled={extractingId === doc.id}
                    className="btn-ghost mt-3 w-full !py-2 text-xs disabled:opacity-60"
                  >
                    <Sparkles size={13} /> {extractingId === doc.id ? 'Extracting…' : 'Extract details'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-parchment">Notes</h2>
          <button onClick={() => setModalOpen(true)} className="font-sans text-xs text-brass hover:text-brass-light">Edit</button>
        </div>
        {client.notes ? (
          <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-parchment-muted">{client.notes}</p>
        ) : (
          <p className="font-sans text-sm text-parchment-faint">No notes yet.</p>
        )}
      </div>

      <ClientFormModal
        open={modalOpen}
        client={client}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load() }}
      />

      <FilingTemplateModal
        open={templateModalOpen}
        clientId={id}
        onClose={() => setTemplateModalOpen(false)}
        onSaved={() => { setTemplateModalOpen(false); load() }}
      />

      <ExtractionReviewModal
        open={Boolean(reviewDocument)}
        document={reviewDocument}
        onClose={() => setReviewDocument(null)}
        onSaved={() => { setReviewDocument(null); load() }}
      />
    </div>
  )
}
