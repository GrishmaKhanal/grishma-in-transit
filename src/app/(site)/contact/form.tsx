"use client";

import { useActionState, useSyncExternalStore } from "react";
import { sendMessage } from "@/app/actions/contact";

const field =
  "border-0 border-b border-ink bg-transparent py-2 font-serif text-[19px] font-semibold outline-none focus:border-accent";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendMessage, undefined);
  return (
    <form action={action} className="flex flex-col gap-[22px] bg-panel p-[clamp(24px,4vw,40px)]">
      <div className="eyebrow text-ink-4">Write a note</div>
      {state?.ok ? (
        <p className="m-0 font-serif text-[19px] leading-[1.55]">Thanks — your note landed in my inbox. I&apos;ll reply by email.</p>
      ) : (
        <>
          <label className="flex flex-col gap-1.5 text-[13px] text-ink-4">
            Your name
            <input name="name" required autoComplete="name" maxLength={120} className={field} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] text-ink-4">
            Email
            <input name="email" type="email" required autoComplete="email" maxLength={200} className={field} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] text-ink-4">
            Message
            <textarea name="body" rows={5} required maxLength={5000} className={`${field} resize-y leading-[1.5] font-normal`} />
          </label>
          {/* honeypot: hidden from people, filled by bots */}
          <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`font-serif text-sm ${state?.error ? "text-accent" : "text-ink-5"}`}>
              {state?.error ?? "Goes straight to my inbox."}
            </span>
            <button disabled={pending} className="cursor-pointer border-0 bg-ink px-[22px] py-[13px] text-sm font-medium text-paper disabled:opacity-60">
              {pending ? "Sending…" : "Send message →"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

const subscribeMinute = (cb: () => void) => {
  const t = setInterval(cb, 15_000);
  return () => clearInterval(t);
};

export function LocalTime({ timeZone }: { timeZone: string }) {
  const time = useSyncExternalStore(
    subscribeMinute,
    () => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone }).format(new Date()),
    () => "--:--", // server render: time is filled in on the client
  );
  return <time>{time}</time>;
}
