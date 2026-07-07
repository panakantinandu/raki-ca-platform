export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="card relative w-full max-w-sm p-6 shadow-2xl">
        <h3 className="font-display text-lg font-medium text-parchment">{title}</h3>
        {body && <p className="mt-2 font-sans text-sm leading-relaxed text-parchment-muted">{body}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="btn-ghost !px-4 !py-2 text-sm">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={
              danger
                ? 'inline-flex items-center justify-center gap-2 rounded-md bg-ledger-red px-4 py-2 font-sans text-sm font-semibold text-ink transition-all hover:bg-ledger-red/90 active:scale-[0.98]'
                : 'btn-brass !px-4 !py-2 text-sm'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
