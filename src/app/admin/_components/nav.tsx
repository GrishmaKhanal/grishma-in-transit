"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["Dashboard", ""],
  ["Posts", "/posts"],
  ["Companies", "/companies"],
  ["Projects", "/projects"],
  ["Site content", "/settings"],
  ["Messages", "/messages"],
] as const;

// `base` comes from the server layout so the secret path isn't baked into client JS.
export function AdminNav({ unread, base }: { unread: number; base: string }) {
  const pathname = usePathname();
  // Depending on render timing this may be the public or the internal URL.
  const rel = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\/admin/, "");
  return (
    <nav aria-label="Admin" className="flex flex-1 flex-wrap">
      {items.map(([label, href], i) => {
        const full = `${base}${href}`;
        const on = href ? rel.startsWith(href) : rel === "";
        return (
          <Link
            key={href}
            href={full}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-[64px] min-w-[112px] flex-1 flex-col justify-between border-l border-ink px-4 py-2.5 ${
              on ? "bg-accent text-white hover:text-white" : "text-ink"
            }`}
          >
            <span className="font-mono text-[11px] opacity-75">0{i + 1}</span>
            <span className="text-sm font-semibold">
              {label}
              {label === "Messages" && unread > 0 && (
                <span className={`ml-1.5 px-1.5 font-mono text-[11px] ${on ? "bg-white text-accent" : "bg-accent text-white"}`}>{unread}</span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
