"use client";

import { useRef, useState, useTransition } from "react";
import { previewMarkdown, uploadImage } from "../actions";

export const input =
  "w-full border border-rule bg-[#faf9f6] px-3 py-2 text-sm outline-none focus:border-ink focus:bg-white";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-5">{hint}</span>}
    </label>
  );
}

async function upload(file: File) {
  const fd = new FormData();
  fd.set("file", file);
  return uploadImage(fd);
}

export function ImageField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <Field label={label} hint={err || "Paste a URL or upload (PNG, JPEG, GIF, WebP, AVIF; max 4 MB)."}>
      <div className="flex gap-2">
        <input name={name} value={value} onChange={(e) => setValue(e.target.value)} className={input} />
        <label className="cursor-pointer whitespace-nowrap border border-rule px-3 py-2 text-sm">
          {pending ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              start(async () => {
                const r = await upload(f);
                if (r.url) setValue(r.url);
                setErr(r.error ?? "");
              });
            }}
          />
        </label>
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-2 max-h-32 border border-rule" />
      )}
    </Field>
  );
}

export function MarkdownField({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [html, setHtml] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  function insert(text: string) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    el.value = value.slice(0, a) + text + value.slice(b);
    el.selectionStart = el.selectionEnd = a + text.length;
    el.focus();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        {(["write", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              if (t === "preview") start(async () => setHtml(await previewMarkdown(ref.current?.value ?? "")));
            }}
            className={` px-3 py-1 capitalize ${tab === t ? "bg-ink text-paper" : "text-ink-5"}`}
          >
            {t}
          </button>
        ))}
        <label className="ml-auto cursor-pointer border border-rule px-3 py-1">
          Insert image
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setMsg("Uploading…");
              start(async () => {
                const r = await upload(f);
                if (r.url) insert(`\n![${f.name.replace(/\.[^.]+$/, "")}](${r.url})\n`);
                setMsg(r.error ?? "");
              });
            }}
          />
        </label>
      </div>
      {msg && <p className="text-xs text-red-600">{msg}</p>}
      <textarea
        ref={ref}
        name={name}
        defaultValue={defaultValue}
        rows={24}
        hidden={tab !== "write"}
        className={`${input} font-mono`}
        placeholder="Write in Markdown. ```python fences get syntax highlighting."
      />
      {tab === "preview" && (
        <div
          className="article min-h-64 border border-rule bg-[#faf9f6] p-6"
          dangerouslySetInnerHTML={{ __html: pending ? "<p>Rendering…</p>" : html }}
        />
      )}
    </div>
  );
}

export function Status({ state }: { state?: { error?: string; ok?: string } }) {
  if (state?.error) return <p className="text-sm text-red-600">{state.error}</p>;
  if (state?.ok) return <p className="text-sm text-green-700">{state.ok}</p>;
  return null;
}

export function ConfirmDelete({ action, id, label = "Delete" }: { action: (fd: FormData) => void; id: number; label?: string }) {
  const [armed, setArmed] = useState(false);
  return armed ? (
    <form action={action} className="flex items-center gap-2 text-sm">
      <input type="hidden" name="id" value={id} />
      <span>Permanently delete?</span>
      <button className=" bg-red-600 px-3 py-1 text-white">Yes, delete</button>
      <button type="button" onClick={() => setArmed(false)} className="px-2 py-1">
        Cancel
      </button>
    </form>
  ) : (
    <button type="button" onClick={() => setArmed(true)} className="text-sm text-red-600">
      {label}
    </button>
  );
}
