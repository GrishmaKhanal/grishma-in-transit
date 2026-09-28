import type { Social } from "@/db/schema";

export function SocialRows({ socials, email }: { socials: Social[]; email?: string }) {
  const rows = [...socials, ...(email ? [{ label: "Email", handle: email, url: `mailto:${email}` }] : [])];
  return (
    <>
      {rows.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target={s.url.startsWith("http") ? "_blank" : undefined}
          rel="me noopener"
          className="flex justify-between gap-4 border-b border-rule py-[13px] text-sm"
        >
          <span className="font-medium">{s.label}</span>
          <span className="text-ink-4">{s.handle} ↗</span>
        </a>
      ))}
    </>
  );
}
