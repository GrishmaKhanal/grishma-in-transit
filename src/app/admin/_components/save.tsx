"use client";

import { createContext, startTransition, useActionState, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { FormState } from "../actions";

type SaveAction = (prev: FormState, fd: FormData) => Promise<FormState>;
// `edits` is the change count the last successful save covered; `at` is when it came back.
type Saved = (FormState & { at?: number; edits?: number }) | undefined;

export const btn = "cursor-pointer bg-ink px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-50";

const MarkDirty = createContext<() => void>(() => {});

/** For controls that change the form without an input event, e.g. add/remove/reorder buttons. */
export const useMarkDirty = () => useContext(MarkDirty);

/**
 * Shell for every admin editor. Submits without React's automatic form reset, so a failed
 * save keeps what was typed. Tracks unsaved changes, saves on Ctrl/Cmd+S, and asks before
 * leaving with edits pending.
 */
export function SaveForm({
  action,
  created,
  label = "Save",
  className = "",
  barClassName = "",
  extra,
  children,
}: {
  action: SaveAction;
  created?: boolean;
  label?: string;
  className?: string;
  barClassName?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [edits, setEdits] = useState(0);
  const markDirty = useCallback(() => setEdits((n) => n + 1), []);
  const [state, dispatch, pending] = useActionState(
    async (prev: Saved, { fd, snapshot }: { fd: FormData; snapshot: number }): Promise<Saved> => {
      const r = await action(prev, fd);
      return { ...r, at: Date.now(), edits: r?.ok ? snapshot : (prev?.edits ?? 0) };
    },
    created ? { ok: "Created." } : undefined,
  );
  const dirty = edits !== (state?.edits ?? 0);

  // "?created=1" comes from the redirect after a first save; drop it so a reload doesn't repeat it.
  useEffect(() => {
    if (created) window.history.replaceState(null, "", window.location.pathname);
  }, [created]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        ref.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    // Client-side navigation never fires beforeunload, so in-app links ask too.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      const href = a?.getAttribute("href") ?? "";
      if (!a || href.startsWith("#") || a.getAttribute("target") === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (!window.confirm("You have unsaved changes. Leave without saving?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const fd = new FormData(e.currentTarget);
    const snapshot = edits;
    startTransition(() => dispatch({ fd, snapshot }));
  }

  let status: React.ReactNode = <span className="text-ink-5">Ctrl+S or ⌘S saves</span>;
  if (pending) status = null;
  else if (state?.error) status = <span className="text-red-700">{state.error}</span>;
  else if (dirty)
    status = (
      <span className="flex items-center gap-2 text-ink-3">
        <span className="h-2 w-2 rounded-full bg-accent" /> Unsaved changes
      </span>
    );
  else if (state?.ok)
    status = (
      <span className="text-green-800">
        {state.ok.replace(/\.$/, "")}
        {state.at && ` at ${new Date(state.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
      </span>
    );

  return (
    <MarkDirty.Provider value={markDirty}>
      {/* method="post" so a submit before hydration can't put the form's contents in the URL. */}
      <form ref={ref} method="post" onSubmit={onSubmit} onInput={markDirty} className={className}>
        {children}
        <div
          className={`sticky bottom-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink bg-paper py-3 ${barClassName}`}
        >
          <button className={btn} disabled={pending}>
            {pending ? "Saving…" : label}
          </button>
          <span aria-live="polite" className="text-sm">
            {status}
          </span>
          {extra && <div className="ml-auto flex flex-wrap items-center gap-4 text-sm">{extra}</div>}
        </div>
      </form>
    </MarkDirty.Provider>
  );
}
