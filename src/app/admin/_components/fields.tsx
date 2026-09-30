"use client";

import { useId, useRef, useState, useTransition } from "react";
import { readingTime, wordCount } from "@/lib/reading-time";
import { previewMarkdown, uploadImage } from "../actions";
import { Popconfirm } from "./popconfirm";
import { useMarkDirty } from "./save";

export const input =
  "w-full border border-rule bg-[#faf9f6] px-3 py-2 text-sm outline-none focus:border-ink focus:bg-white";

const IMAGE_TYPES = "image/png,image/jpeg,image/gif,image/webp,image/avif";

export function Field({
  label,
  hint,
  aside,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="flex items-baseline justify-between gap-3 text-sm font-medium">
        {label}
        {aside && <span className="font-mono text-xs font-normal">{aside}</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-ink-5">{hint}</span>}
    </label>
  );
}

/** Text field with a live count against a soft limit; search engines truncate past it. */
export function CountedField({
  name,
  label,
  hint,
  max,
  rows,
  defaultValue = "",
}: {
  name: string;
  label: string;
  hint?: string;
  max: number;
  rows?: number;
  defaultValue?: string;
}) {
  const [n, setN] = useState(defaultValue.length);
  const count = <span className={n > max ? "text-accent" : "text-ink-5"}>{n} / {max}</span>;
  return (
    <Field label={label} hint={hint} aside={count}>
      {rows ? (
        <textarea name={name} rows={rows} defaultValue={defaultValue} onInput={(e) => setN(e.currentTarget.value.length)} className={input} />
      ) : (
        <input name={name} defaultValue={defaultValue} onInput={(e) => setN(e.currentTarget.value.length)} className={input} />
      )}
    </Field>
  );
}

async function upload(file: File) {
  const fd = new FormData();
  fd.set("file", file);
  return uploadImage(fd);
}

export function ImageField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string | null }) {
  const id = useId();
  const markDirty = useMarkDirty();
  const [value, setValue] = useState(defaultValue ?? "");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  function pick(file?: File) {
    if (!file) return;
    start(async () => {
      const r = await upload(file);
      if (r.url) {
        setValue(r.url);
        markDirty();
      }
      setErr(r.error ?? "");
    });
  }

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="flex gap-2">
        <input id={id} name={name} value={value} onChange={(e) => setValue(e.target.value)} placeholder="/media/… or https://…" className={input} />
        <label className="cursor-pointer border border-rule px-3 py-2 text-sm whitespace-nowrap hover:border-ink">
          {pending ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept={IMAGE_TYPES}
            hidden
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = ""; // so picking the same file again still fires
            }}
          />
        </label>
      </div>
      {err ? (
        <p className="text-xs text-red-700">{err}</p>
      ) : (
        <p className="text-xs text-ink-5">Paste a URL or upload (PNG, JPEG, GIF, WebP, AVIF; max 4 MB).</p>
      )}
      {value && (
        <div className="flex items-end gap-3 pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="max-h-32 border border-rule" />
          <Popconfirm
            label="Remove"
            title="Remove this image?"
            description="Clears the field. The site keeps the old image until you save."
            confirmLabel="Remove"
            align="start"
            onConfirm={() => {
              setValue("");
              markDirty();
            }}
            triggerClassName="text-xs text-red-700 hover:underline"
          />
        </div>
      )}
    </div>
  );
}

const altFrom = (fileName: string) => fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");

export function MarkdownField({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [html, setHtml] = useState("");
  const [text, setText] = useState(defaultValue);
  const [uploading, setUploading] = useState(0);
  const [err, setErr] = useState("");
  const [rendering, startRender] = useTransition();

  // execCommand keeps the browser's undo history and fires an input event, so the form
  // sees the change. setRangeText is the fallback where execCommand is unavailable.
  function insert(snippet: string) {
    const el = ref.current;
    if (!el) return;
    el.focus();
    if (!document.execCommand("insertText", false, snippet)) {
      el.setRangeText(snippet, el.selectionStart, el.selectionEnd, "end");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function wrap(before: string, after: string, placeholder: string) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const inner = value.slice(a, b) || placeholder;
    insert(before + inner + after);
    el.setSelectionRange(a + before.length, a + before.length + inner.length);
  }

  async function uploadAll(files: File[]) {
    setErr("");
    setUploading((n) => n + files.length);
    for (const f of files) {
      const r = await upload(f);
      setUploading((n) => n - 1);
      if (r.url) insert(`\n![${altFrom(f.name)}](${r.url})\n`);
      else setErr(r.error ?? "Upload failed.");
    }
  }

  // Returns true when the event carried images, so the caller can stop the default paste/drop.
  function takeImages(list: FileList | undefined) {
    const images = [...(list ?? [])].filter((f) => f.type.startsWith("image/"));
    if (images.length) uploadAll(images);
    return images.length > 0;
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "b") wrap("**", "**", "bold");
    else if (k === "i") wrap("_", "_", "italic");
    else if (k === "k") {
      const el = e.currentTarget;
      const label = el.value.slice(el.selectionStart, el.selectionEnd) || "link text";
      const start = el.selectionStart + label.length + 3;
      insert(`[${label}](https://)`);
      el.setSelectionRange(start, start + 8);
    } else return;
    e.preventDefault();
  }

  const words = wordCount(text);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {(["write", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              if (t === "preview") startRender(async () => setHtml(await previewMarkdown(ref.current?.value ?? "")));
            }}
            className={`px-3 py-1 capitalize ${tab === t ? "bg-ink text-paper" : "text-ink-5 hover:text-ink"}`}
          >
            {t}
          </button>
        ))}
        <span aria-live="polite" className={`ml-2 text-xs ${err ? "text-red-700" : "text-ink-5"}`}>
          {err || (uploading > 0 && `Uploading ${uploading} image${uploading === 1 ? "" : "s"}…`)}
        </span>
        <label className="ml-auto cursor-pointer border border-rule px-3 py-1 hover:border-ink">
          Insert image
          <input
            type="file"
            accept={IMAGE_TYPES}
            multiple
            hidden
            onChange={(e) => {
              takeImages(e.target.files ?? undefined);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <textarea
        ref={ref}
        name={name}
        defaultValue={defaultValue}
        rows={24}
        hidden={tab !== "write"}
        onInput={(e) => setText(e.currentTarget.value)}
        onKeyDown={onKeyDown}
        onPaste={(e) => takeImages(e.clipboardData.files) && e.preventDefault()}
        onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}
        onDrop={(e) => takeImages(e.dataTransfer.files) && e.preventDefault()}
        className={`${input} font-mono leading-relaxed`}
        placeholder="Write in Markdown. ```python fences get syntax highlighting."
      />
      {tab === "preview" && (
        <div
          className="article min-h-64 border border-rule bg-[#faf9f6] p-6"
          dangerouslySetInnerHTML={{ __html: rendering ? "<p>Rendering…</p>" : html }}
        />
      )}
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-ink-5">
        <span>Paste or drop images to upload them. Ctrl/⌘ + B bold, I italic, K link.</span>
        <span className="font-mono">
          {words} words · {readingTime(text)} min read
        </span>
      </div>
    </div>
  );
}

export function ConfirmDelete({
  action,
  id,
  label = "Delete",
  title = "Delete this?",
  description = "This can't be undone.",
  align = "end",
}: {
  action: (fd: FormData) => void;
  id: number;
  label?: string;
  title?: string;
  description?: string;
  align?: "start" | "end";
}) {
  return (
    <form action={action} className="inline-flex">
      <input type="hidden" name="id" value={id} />
      <Popconfirm
        label={label}
        title={title}
        description={description}
        confirmLabel="Delete"
        align={align}
        triggerClassName="text-sm text-red-700 hover:underline"
      />
    </form>
  );
}
