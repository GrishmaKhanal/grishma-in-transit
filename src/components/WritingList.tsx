"use client";

import Link from "next/link";
import { useState } from "react";

export type WritingItem = { id: number; href: string; no: string; title: string; dek: string; tag: string; read: string; tags: string[] };

// Every post is server-rendered; the tag buttons only filter on the client.
export function WritingList({ items, tags }: { items: WritingItem[]; tags: string[] }) {
  const [tag, setTag] = useState("All");
  const shown = tag === "All" ? items : items.filter((i) => i.tags.includes(tag));
  return (
    <>
      {tags.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b border-ink pb-[18px]" role="group" aria-label="Filter by tag">
          {["All", ...tags].map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tag === t}
              onClick={() => setTag(t)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium ${
                tag === t ? "border-ink bg-ink text-paper" : "border-rule-strong bg-transparent text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {shown.map((p) => (
        <Link
          key={p.id}
          href={p.href}
          className="grid grid-cols-[48px_minmax(0,1fr)] items-baseline gap-x-8 gap-y-2 border-b border-rule py-8 sm:grid-cols-[80px_minmax(0,1fr)_auto]"
        >
          <span className="font-serif text-lg text-accent">{p.no}</span>
          <div>
            <h2 className="m-0 font-serif text-[clamp(26px,3vw,34px)] leading-[1.15] font-bold tracking-[-.01em]">{p.title}</h2>
            {p.dek && <p className="mt-2.5 mb-0 max-w-[620px] font-serif text-base leading-[1.6] text-ink-3">{p.dek}</p>}
          </div>
          <div className="col-start-2 font-mono text-xs leading-[1.8] text-ink-5 sm:col-start-auto sm:text-right">
            {p.tag}
            <br />
            {p.read}
          </div>
        </Link>
      ))}
      {!shown.length && <p className="py-8 font-serif text-ink-5">Nothing tagged {tag} yet.</p>}
    </>
  );
}
