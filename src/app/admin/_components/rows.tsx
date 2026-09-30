"use client";

import { useState } from "react";
import { input } from "./fields";
import { Popconfirm } from "./popconfirm";
import { useMarkDirty } from "./save";

type Col = { placeholder: string; type?: "text" | "url"; wide?: boolean };

/**
 * Repeating rows of short fields for settings lists (socials, skills, education...).
 * Serialises to the "a | b | c" per line text that saveSettings already parses.
 */
export function RowsEditor({
  name,
  label,
  hint,
  cols,
  initial,
  addLabel = "Add",
}: {
  name: string;
  label: string;
  hint?: string;
  cols: Col[];
  initial: string[][];
  addLabel?: string;
}) {
  const markDirty = useMarkDirty();
  const [rows, setRowsState] = useState(initial);
  const setRows = (next: string[][]) => {
    setRowsState(next);
    markDirty();
  };
  const move = (i: number, d: -1 | 1) => {
    const next = [...rows];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setRows(next);
  };
  // The server drops rows with an empty cell, so say so instead of losing them silently.
  const incomplete = rows.some((r) => r.some((c) => c.trim()) && r.some((c) => !c.trim()));
  const grid = { "--cols": cols.map((c) => (c.wide ? "2fr" : "1fr")).join(" ") } as React.CSSProperties;

  return (
    <div className="space-y-2">
      <textarea name={name} hidden readOnly value={rows.map((r) => r.map((c) => c.trim()).join(" | ")).join("\n")} />
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <button
          type="button"
          onClick={() => setRows([...rows, cols.map(() => "")])}
          className="border border-rule px-3 py-1 text-sm hover:border-ink"
        >
          + {addLabel}
        </button>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="flex items-start gap-2">
          <div style={grid} className="grid flex-1 gap-2 sm:grid-cols-[var(--cols)]">
            {cols.map((c, j) => (
              <input
                key={j}
                type={c.type ?? "text"}
                aria-label={`${label} ${i + 1}: ${c.placeholder}`}
                placeholder={c.placeholder}
                value={r[j] ?? ""}
                onChange={(e) => setRows(rows.map((row, k) => (k === i ? row.map((v, m) => (m === j ? e.target.value : v)) : row)))}
                className={`${input} ${r.some((v) => v.trim()) && !r[j]?.trim() ? "border-accent" : ""}`}
              />
            ))}
          </div>
          <div className="flex flex-none items-center gap-1 pt-1.5 text-sm text-ink-5">
            <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="px-1 hover:text-ink disabled:opacity-30">
              ↑
            </button>
            <button type="button" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)} className="px-1 hover:text-ink disabled:opacity-30">
              ↓
            </button>
            <Popconfirm
              label="✕"
              ariaLabel="Remove"
              title="Remove this row?"
              description="Nothing changes on the site until you save."
              confirmLabel="Remove"
              skip={!r.some((v) => v.trim())}
              onConfirm={() => setRows(rows.filter((_, k) => k !== i))}
              triggerClassName="px-1 hover:text-red-700"
            />
          </div>
        </div>
      ))}
      {!rows.length && <p className="text-sm text-ink-5">None yet.</p>}
      {incomplete ? (
        <p className="text-xs text-accent">Rows with an empty field are not saved. Fill them in or remove them.</p>
      ) : (
        hint && <p className="text-xs text-ink-5">{hint}</p>
      )}
    </div>
  );
}
