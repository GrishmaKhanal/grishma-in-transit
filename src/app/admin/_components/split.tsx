"use client";

import { useRef, useState, useSyncExternalStore } from "react";

const MIN = 0.25;
const MAX = 0.75;
const clamp = (r: number) => Math.min(MAX, Math.max(MIN, r));

const CHANGE = "admin-pref-change";
// Used when storage is blocked, so the controls still work for this page view.
const memory = new Map<string, string>();

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE, cb);
  };
}

/**
 * A per-browser preference. The server render uses the fallback; storage can be blocked
 * (private mode), so every access is guarded and falls back too.
 */
export function useStored<T extends string>(key: string, fallback: T, valid: (v: string) => v is T) {
  const read = () => {
    try {
      const v = localStorage.getItem(key) ?? memory.get(key) ?? null;
      return v !== null && valid(v) ? v : fallback;
    } catch {
      const v = memory.get(key);
      return v !== undefined && valid(v) ? v : fallback;
    }
  };
  const value = useSyncExternalStore(subscribe, read, () => fallback);
  function set(v: T) {
    memory.set(key, v);
    try {
      localStorage.setItem(key, v);
    } catch {}
    window.dispatchEvent(new Event(CHANGE));
  }
  return [value, set] as const;
}

const isRatio = (v: string): v is string => Number(v) >= MIN && Number(v) <= MAX;

/**
 * Left pane's share of a two-pane split, plus a drag handle for between them.
 * Double-click resets to half; arrow keys nudge it when the handle has focus.
 */
export function useSplit(key: string) {
  const box = useRef<HTMLDivElement>(null);
  const [stored, store] = useStored(key, "0.5", isRatio);
  const [dragging, setDragging] = useState(false);
  const ratio = Number(stored);
  const set = (r: number) => store(clamp(r).toFixed(3));

  const handle = (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize editor and preview"
      aria-valuemin={MIN * 100}
      aria-valuemax={MAX * 100}
      aria-valuenow={Math.round(ratio * 100)}
      tabIndex={0}
      title="Drag to resize, double-click to reset"
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }}
      onPointerMove={(e) => {
        const rect = box.current?.getBoundingClientRect();
        if (dragging && rect) set((e.clientX - rect.left) / rect.width);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onDoubleClick={() => set(0.5)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") set(ratio - 0.05);
        else if (e.key === "ArrowRight") set(ratio + 0.05);
        else return;
        e.preventDefault();
      }}
      className="group hidden cursor-col-resize touch-none items-stretch justify-center outline-none lg:flex"
    >
      <span
        className={`w-px transition-colors group-hover:w-0.5 group-hover:bg-ink group-focus-visible:w-0.5 group-focus-visible:bg-accent ${dragging ? "w-0.5 bg-ink" : "bg-rule"}`}
      />
    </div>
  );

  return { box, ratio, handle, dragging };
}
