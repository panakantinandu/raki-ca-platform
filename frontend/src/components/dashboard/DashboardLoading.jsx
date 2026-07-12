// Suspense fallback shown while a lazy-loaded dashboard route chunk downloads. Kept as a
// plain skeleton (no sidebar/header) since DashboardLayout itself is one of the lazy chunks -
// there's nothing else on screen yet for it to sit alongside.
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-border border-t-brass" />
    </div>
  )
}
