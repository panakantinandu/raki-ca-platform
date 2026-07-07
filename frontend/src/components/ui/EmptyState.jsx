export default function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brass/10">
          <Icon size={22} className="text-brass" />
        </div>
      )}
      <h3 className="font-display text-lg font-medium text-parchment">{title}</h3>
      <p className="mt-2 max-w-sm font-sans text-sm text-parchment-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
