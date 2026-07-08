import { useEffect, useRef, useState } from 'react'
import { Upload, FolderOpen, FileText, Sparkles } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'
import EmptyState from '../../components/ui/EmptyState.jsx'
import ExtractionReviewModal from '../../components/ui/ExtractionReviewModal.jsx'

const EXTRACTABLE_TYPES = ['application/pdf', 'image/png', 'image/jpeg']

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [extractingId, setExtractingId] = useState(null)
  const [reviewDocument, setReviewDocument] = useState(null)
  const fileInputRef = useRef(null)

  function loadDocuments() {
    setLoading(true)
    apiClient.get('/documents', { params: { size: 100 } })
      .then(({ data }) => setDocuments(data.content || []))
      .finally(() => setLoading(false))
  }

  useEffect(loadDocuments, [])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      await apiClient.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      loadDocuments()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload this file.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleExtract(doc) {
    setError('')
    setExtractingId(doc.id)
    try {
      const { data } = await apiClient.post(`/documents/${doc.id}/extract`)
      setReviewDocument(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not extract details from this document.')
    } finally {
      setExtractingId(null)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="label-eyebrow">Documents</span>
          <h1 className="mt-2 font-display text-3xl font-medium text-parchment">Client documents</h1>
        </div>
        <div>
          <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-brass !py-2.5 disabled:opacity-60">
            <Upload size={16} /> {uploading ? 'Uploading…' : 'Upload document'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-ledger-red/30 bg-ledger-red/10 px-4 py-3 font-sans text-sm text-ledger-red">
          {error}
        </div>
      )}

      <p className="mb-6 font-sans text-sm text-parchment-muted">
        Accepts PDF, PNG, JPEG, CSV, and Excel files up to 15MB. Every upload is scanned for type and size before it's stored.
      </p>

      {loading ? (
        <div className="card h-64 animate-pulse bg-ink-raised/50" />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents uploaded yet"
          body="Upload invoices, statements, or salary slips to start building your extraction pipeline."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div key={doc.id} className="card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brass/10">
                <FileText size={18} className="text-brass" />
              </div>
              <p className="mt-4 truncate font-sans text-sm font-medium text-parchment" title={doc.fileName}>
                {doc.fileName}
              </p>
              <p className="mt-1 font-mono text-xs text-parchment-faint">
                {formatSize(doc.sizeBytes)} &middot; {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
              </p>
              {EXTRACTABLE_TYPES.includes(doc.contentType) && (
                <button
                  onClick={() => handleExtract(doc)}
                  disabled={extractingId === doc.id}
                  className="btn-ghost mt-4 w-full !py-2 text-xs disabled:opacity-60"
                >
                  <Sparkles size={13} /> {extractingId === doc.id ? 'Extracting…' : 'Extract details'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ExtractionReviewModal
        open={Boolean(reviewDocument)}
        document={reviewDocument}
        onClose={() => setReviewDocument(null)}
        onSaved={() => { setReviewDocument(null); loadDocuments() }}
      />
    </div>
  )
}
