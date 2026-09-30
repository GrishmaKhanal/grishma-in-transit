"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

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
  const ref = useRef<HTMLElement>(null);
  // Depending on render timing this may be the public or the internal URL.
  const rel = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\/admin/, "");

  // Below xl the nav is one scrolling row; keep the current section in view.
  useEffect(() => {
    ref.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [rel]);

  return (
    <nav
      ref={ref}
      aria-label="Admin"
      className="order-last flex w-full overflow-x-auto border-t border-ink xl:order-none xl:w-auto xl:flex-1 xl:border-t-0"
    >
      {items.map(([label, href], i) => {
        const full = `${base}${href}`;
        const on = href ? rel.startsWith(href) : rel === "";
        return (
          <Link
            key={href}
            href={full}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-[52px] min-w-[104px] flex-1 shrink-0 flex-col justify-between border-l border-ink px-4 py-2 first:border-l-0 xl:min-h-[64px] xl:py-2.5 xl:first:border-l ${
              on ? "bg-accent text-white hover:text-white" : "text-ink"
            }`}
          >
            <span className="font-mono text-[11px] opacity-75">0{i + 1}</span>
            <span className="text-sm font-semibold whitespace-nowrap">
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
