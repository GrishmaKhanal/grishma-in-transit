import Link from "next/link";

export const title = "font-serif text-[clamp(32px,5vw,40px)] leading-none font-bold tracking-[-.02em]";
export const newBtn = "bg-ink px-4 py-2 text-sm whitespace-nowrap text-paper hover:text-paper";

/** Page title with an optional back link above and actions on the right. */
export function PageHeader({
  children,
  back,
  actions,
}: {
  children: React.ReactNode;
  back?: [label: string, href: string];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back[1]} className="mb-3 inline-block text-[13px] font-medium text-ink-4">
          ← {back[0]}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={title}>{children}</h1>
        {actions}
      </div>
    </div>
  );
}

export function StatusPill({ live, on = "Live", off = "Draft" }: { live: boolean; on?: string; off?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${live ? "text-ink" : "text-ink-5"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-online" : "border border-ink-6"}`} />
      {live ? on : off}
    </span>
  );
}

/** Filter chips driven by a query param, e.g. ?status=draft. */
export function Filters({ items, current }: { items: [key: string, label: string, n: number, href: string][]; current: string }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter">
      {items.map(([key, label, n, href]) => (
        <Link
          key={key}
          href={href}
          aria-current={key === current ? "true" : undefined}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            key === current ? "border-ink bg-ink text-paper hover:text-paper" : "border-rule-strong"
          }`}
        >
          {label} <span className="opacity-60">{n}</span>
        </Link>
      ))}
    </div>
  );
}
