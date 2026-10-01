"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  /** Text of the trigger button. */
  label: React.ReactNode;
  /** For icon-only triggers such as "✕". */
  ariaLabel?: string;
  title: string;
  description?: string;
  confirmLabel: string;
  /** Without it the confirm button submits the enclosing <form> (a Server Action). */
  onConfirm?: () => void;
  /** Nothing to lose (e.g. an empty row): act on the first click, no prompt. */
  skip?: boolean;
  /** Which edge of the trigger the panel lines up with. */
  align?: "start" | "end";
  danger?: boolean;
  /** Wrapper layout; defaults to inline-flex. */
  className?: string;
  triggerClassName?: string;
};

/**
 * A small confirm panel anchored under (or above) its trigger. Focus starts on Cancel so a
 * stray Enter never confirms; Escape, a click outside or tabbing away closes it.
 */
export function Popconfirm({
  label,
  ariaLabel,
  title,
  description,
  confirmLabel,
  onConfirm,
  skip,
  align = "end",
  danger = true,
  className = "",
  triggerClassName = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const [side, setSide] = useState(align);
  const wrap = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    cancel.current?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault(); // handled: the post editor's focus mode stays open
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (skip && onConfirm) return onConfirm();
    // Flip up, or to the other edge, when the panel wouldn't fit on screen (e.g. on a phone).
    const r = trigger.current?.getBoundingClientRect();
    if (r) {
      const width = Math.min(256, window.innerWidth - 32);
      setAbove(window.innerHeight - r.bottom < 190);
      if (align === "start" && r.left + width > window.innerWidth - 8) setSide("end");
      else if (align === "end" && r.right - width < 8) setSide("start");
      else setSide(align);
    }
    setOpen((o) => !o);
  }

  return (
    <span
      ref={wrap}
      className={`relative ${className || "inline-flex"}`}
      // Keyboard users tabbing out close it. A null relatedTarget (a click) is left to the
      // pointerdown handler, since Safari doesn't focus buttons on click.
      onBlur={(e) => {
        if (open && e.relatedTarget && !wrap.current?.contains(e.relatedTarget)) close(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={toggle}
        className={`cursor-pointer ${triggerClassName}`}
      >
        {label}
      </button>
      {open && (
        <span
          id={id}
          role="dialog"
          aria-labelledby={`${id}-title`}
          className={`absolute z-50 flex w-64 max-w-[calc(100vw-2rem)] flex-col gap-3 border border-ink bg-paper p-4 text-left text-sm font-normal text-ink normal-case shadow-[0_8px_24px_rgb(0_0_0/0.14)] ${
            above ? "bottom-full mb-2" : "top-full mt-2"
          } ${side === "end" ? "right-0" : "left-0"}`}
        >
          <span id={`${id}-title`} className="font-semibold">
            {title}
          </span>
          {description && <span className="text-[13px] leading-snug text-ink-4">{description}</span>}
          <span className="flex justify-end gap-2">
            <button ref={cancel} type="button" onClick={() => close()} className="cursor-pointer border border-rule px-3 py-1 hover:border-ink">
              Cancel
            </button>
            {onConfirm ? (
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  setOpen(false);
                }}
                className={confirmClass(danger)}
              >
                {confirmLabel}
              </button>
            ) : (
              <SubmitConfirm label={confirmLabel} danger={danger} />
            )}
          </span>
        </span>
      )}
    </span>
  );
}

const confirmClass = (danger: boolean) =>
  `cursor-pointer px-3 py-1 text-white disabled:opacity-60 ${danger ? "bg-red-700 hover:bg-red-800" : "bg-ink hover:bg-ink-3"}`;

// Separate component so useFormStatus reads the enclosing form's submission.
function SubmitConfirm({ label, danger }: { label: string; danger: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={confirmClass(danger)}>
      {pending ? "Working…" : label}
    </button>
  );
}
