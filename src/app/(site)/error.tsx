"use client";

// Public pages: no error message (it can carry server details), only the digest,
// which matches the server log entry.
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="wrap py-[clamp(56px,8vw,120px)]">
      <div className="eyebrow text-accent">Error</div>
      <h1 className="mt-4 mb-0 font-serif text-[clamp(52px,7vw,80px)] leading-none font-bold tracking-[-.025em]">Something broke.</h1>
      <p className="mt-6 max-w-[460px] font-serif text-lg leading-[1.6] text-ink-3">
        This page hit an error on the way to you. Try again, or come back in a minute.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-5">ref {error.digest}</p>}
      <button onClick={retry} className="mt-6 cursor-pointer bg-ink px-[22px] py-[13px] text-sm font-medium text-paper">
        Try again
      </button>
    </div>
  );
}
