"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["Writing", "/blog"],
  ["Work", "/work"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

export function Nav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex min-w-[min(100%,320px)] flex-[0_1_480px]">
      {items.map(([label, href], i) => {
        const on = path === href || path.startsWith(`${href}/`) || (href === "/blog" && path.startsWith("/notes"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`box-border flex min-h-[76px] min-w-0 flex-1 basis-0 flex-col justify-between border-l border-ink px-4 py-3 ${
              on ? "bg-accent text-white hover:text-white" : "text-ink"
            }`}
          >
            {/* Faded only when inactive: white at 75% on the accent drops below 4.5:1. */}
            <span className={`font-mono text-[11px] ${on ? "" : "opacity-75"}`}>0{i + 1}</span>
            <span className="text-[15px] font-semibold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
