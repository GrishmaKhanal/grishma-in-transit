"use client";

// Catches anything a page or action throws, below the admin header so navigation still works.
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="max-w-xl border border-ink bg-panel p-6">
      <div className="eyebrow text-accent">Something went wrong</div>
      <p className="mt-3 mb-0 font-serif text-lg leading-snug">
        This screen hit an error. Anything you saved before is safe.
      </p>
      <p className="mt-2 mb-0 font-mono text-xs break-words text-ink-5">
        {error.message}
        {error.digest && ` (ref ${error.digest})`}
      </p>
      <button onClick={retry} className="mt-5 cursor-pointer bg-ink px-4 py-2 text-sm text-paper">
        Try again
      </button>
    </div>
  );
}
