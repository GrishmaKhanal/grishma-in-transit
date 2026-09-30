"use client";

import { useState } from "react";
import type { Role } from "@/db/schema";
import { input } from "./fields";
import { useMarkDirty } from "./save";

type Draft = { title: string; period: string; duration: string; points: string; stack: string };

const toDraft = (r: Role): Draft => ({ ...r, points: r.points.join("\n"), stack: r.stack.join(", ") });
const fromDraft = (d: Draft): Role => ({
  title: d.title,
  period: d.period,
  duration: d.duration,
  points: d.points.split("\n"),
  stack: d.stack.split(","),
});

/** Repeating role editor; serialises to a hidden `roles` JSON field. */
export function RolesEditor({ initial }: { initial: Role[] }) {
  const markDirty = useMarkDirty();
  const [roles, setRolesState] = useState<Draft[]>(initial.map(toDraft));
  // Typing already marks the form dirty; add, remove and reorder are clicks, so flag those here.
  const setRoles: typeof setRolesState = (next) => {
    setRolesState(next);
    markDirty();
  };
  const set = (i: number, k: keyof Draft, v: string) => setRoles((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: -1 | 1) =>
    setRoles((rs) => {
      const next = [...rs];
      const [r] = next.splice(i, 1);
      next.splice(Math.max(0, Math.min(rs.length - 1, i + d)), 0, r);
      return next;
    });

  return (
    <div className="space-y-3">
      <input type="hidden" name="roles" value={JSON.stringify(roles.map(fromDraft))} />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Roles (newest first)</span>
        <button
          type="button"
          onClick={() => setRoles((rs) => [{ title: "", period: "", duration: "", points: "", stack: "" }, ...rs])}
          className=" border border-rule px-3 py-1 text-sm"
        >
          + Add role
        </button>
      </div>
      {roles.map((r, i) => (
        <div key={i} className="space-y-3 border border-rule p-4">
          <div className="grid gap-3 sm:grid-cols-[2fr_1.5fr_1fr]">
            <input placeholder="Title" value={r.title} onChange={(e) => set(i, "title", e.target.value)} className={input} />
            <input placeholder="Period - e.g. Nov 2025 - Present" value={r.period} onChange={(e) => set(i, "period", e.target.value)} className={input} />
            <input placeholder="Duration - e.g. 11 mo" value={r.duration} onChange={(e) => set(i, "duration", e.target.value)} className={input} />
          </div>
          <textarea
            placeholder="What you did - one bullet per line"
            rows={4}
            value={r.points}
            onChange={(e) => set(i, "points", e.target.value)}
            className={input}
          />
          <input placeholder="Stack - comma separated" value={r.stack} onChange={(e) => set(i, "stack", e.target.value)} className={input} />
          <div className="flex gap-4 text-sm text-ink-5">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0}>↑ Up</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === roles.length - 1}>↓ Down</button>
            <button type="button" onClick={() => setRoles((rs) => rs.filter((_, j) => j !== i))} className="ml-auto text-red-600">
              Remove role
            </button>
          </div>
        </div>
      ))}
      {!roles.length && <p className="text-sm text-ink-5">No roles yet.</p>}
    </div>
  );
}
