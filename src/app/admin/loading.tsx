// Instant feedback on admin navigation while the next page queries the database.
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <div className="h-10 w-56 bg-panel" />
      <div className="mt-8 space-y-3">
        <div className="h-4 w-full max-w-2xl bg-panel" />
        <div className="h-4 w-full max-w-xl bg-panel" />
        <div className="h-4 w-full max-w-lg bg-panel" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
