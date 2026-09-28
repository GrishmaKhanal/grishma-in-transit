"use client";

import { useActionState } from "react";
import type { Company, KV, Post, Project, SiteSettings } from "@/db/schema";
import { login, saveCompany, savePost, saveProject, saveSettings } from "../actions";
import { RolesEditor } from "./roles";
import { Field, ImageField, MarkdownField, Status, input } from "./fields";

const btn =
  "cursor-pointer bg-ink px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-50";

// datetime-local wants "YYYY-MM-DDTHH:mm" (UTC here, matching the server).
const dt = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 16) : "");

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <div className="mx-auto mt-[12vh] max-w-sm">
      <div className="flex border border-ink">
        <div className="flex w-16 flex-none items-center justify-center bg-ink font-serif text-lg font-extrabold text-paper">GK</div>
        <div className="px-4 py-3">
          <div className="font-serif text-lg font-extrabold">Admin</div>
          <div className="font-mono text-[11px] text-ink-4">Sign in to edit the site</div>
        </div>
      </div>
      <form action={action} className="space-y-5 border border-t-0 border-ink bg-panel p-6">
        <label className="flex flex-col gap-1.5 text-[13px] text-ink-4">
          Password
          <input
            name="password"
            type="password"
            autoFocus
            required
            autoComplete="current-password"
            className="border-0 border-b border-ink bg-transparent py-2 font-serif text-[19px] outline-none focus:border-accent"
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <span className="font-serif text-sm text-accent">{state?.error}</span>
          <button className={btn} disabled={pending}>
            {pending ? "Checking…" : "Sign in →"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function PostForm({ post }: { post?: Post }) {
  const [state, action, pending] = useActionState(savePost, undefined);
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {post && <input type="hidden" name="id" value={post.id} />}
      <div className="space-y-4">
        <Field label="Title">
          <input name="title" defaultValue={post?.title} required className={`${input} text-lg`} />
        </Field>
        <MarkdownField name="content" defaultValue={post?.content} />
      </div>
      <aside className="space-y-4">
        <div className="flex items-center gap-3">
          <button className={btn} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
          <Status state={state} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={post?.published} /> Published
        </label>
        <Field label="Type">
          <select name="kind" defaultValue={post?.kind ?? "blog"} className={input}>
            <option value="blog">Blog article (/blog/…)</option>
            <option value="note">Note (/notes/…)</option>
          </select>
        </Field>
        <Field label="Number" hint='Shown as "No. 001". Optional.'>
          <input name="number" type="number" min={0} defaultValue={post?.number ?? ""} className={input} />
        </Field>
        <Field label="Slug" hint="The URL. Leave empty to generate from the title. Avoid changing after publishing.">
          <input name="slug" defaultValue={post?.slug} className={`${input} font-mono`} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
        </Field>
        <Field label="Publish date (UTC)">
          <input type="datetime-local" name="publishedAt" defaultValue={dt(post?.publishedAt)} className={input} />
        </Field>
        <Field label="Tags" hint="Comma separated">
          <input name="tags" defaultValue={post?.tags.join(", ")} className={input} />
        </Field>
        <Field label="Dek / excerpt" hint="The line under the title in lists and on the post; fallback meta description.">
          <textarea name="excerpt" rows={3} defaultValue={post?.excerpt ?? ""} className={input} />
        </Field>
        <ImageField name="coverImage" label="Cover / social image" defaultValue={post?.coverImage} />
        <details className="space-y-3">
          <summary className="cursor-pointer text-sm font-medium">SEO overrides</summary>
          <Field label="SEO title">
            <input name="seoTitle" defaultValue={post?.seoTitle ?? ""} className={input} />
          </Field>
          <Field label="Meta description" hint="~150 characters">
            <textarea name="seoDescription" rows={3} defaultValue={post?.seoDescription ?? ""} className={input} />
          </Field>
        </details>
      </aside>
    </form>
  );
}

export function ProjectForm({ project, companies }: { project?: Project; companies: Pick<Company, "id" | "name">[] }) {
  const [state, action, pending] = useActionState(saveProject, undefined);
  return (
    <form action={action} className="max-w-2xl space-y-4">
      {project && <input type="hidden" name="id" value={project.id} />}
      <Field label="Name">
        <input name="title" defaultValue={project?.title} required className={`${input} text-lg`} />
      </Field>
      <Field label="Where it appears">
        <select name="companyId" defaultValue={project?.companyId ?? ""} className={input}>
          <option value="">Tinkering (personal / university)</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              Under {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Description" hint="One or two sentences.">
        <textarea name="summary" rows={3} defaultValue={project?.summary ?? ""} className={input} />
      </Field>
      <Field label="Stack" hint="Comma separated — shown as “Azure · BullMQ · TS”">
        <input name="tags" defaultValue={project?.tags.join(", ")} className={input} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Link URL" hint="Leave empty to show “Internal” for work projects.">
          <input name="liveUrl" type="url" defaultValue={project?.liveUrl ?? ""} className={input} />
        </Field>
        <Field label="Link label" hint="e.g. Product, Live, Demo">
          <input name="linkLabel" defaultValue={project?.linkLabel ?? ""} className={input} />
        </Field>
        <Field label="Code URL" hint="Shows a “Code ↗” link.">
          <input name="repoUrl" type="url" defaultValue={project?.repoUrl ?? ""} className={input} />
        </Field>
        <Field label="Status" hint="e.g. Not deployed">
          <input name="status" defaultValue={project?.status ?? ""} className={input} />
        </Field>
        <Field label="Sort order" hint="Lower comes first">
          <input name="sortOrder" type="number" defaultValue={project?.sortOrder ?? 0} className={input} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={project?.published ?? true} /> Published
      </label>
      <div className="flex items-center gap-3">
        <button className={btn} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function CompanyForm({ company }: { company?: Company }) {
  const [state, action, pending] = useActionState(saveCompany, undefined);
  return (
    <form action={action} className="max-w-3xl space-y-4">
      {company && <input type="hidden" name="id" value={company.id} />}
      <Field label="Company">
        <input name="name" defaultValue={company?.name} required className={`${input} text-lg`} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Span" hint="e.g. Nov 2025 — now">
          <input name="span" defaultValue={company?.span} className={input} />
        </Field>
        <Field label="Location" hint="e.g. Remote">
          <input name="location" defaultValue={company?.location} className={input} />
        </Field>
        <Field label="Website">
          <input name="siteUrl" type="url" defaultValue={company?.siteUrl ?? ""} className={input} />
        </Field>
        <Field label="Website label" hint="e.g. odinmortgage.com">
          <input name="siteLabel" defaultValue={company?.siteLabel ?? ""} className={input} />
        </Field>
      </div>
      <Field label="Summary" hint="Shown on the home page work band.">
        <textarea name="summary" rows={3} defaultValue={company?.summary} className={input} />
      </Field>
      <Field label="Headline stack" hint="Comma separated">
        <input name="stack" defaultValue={company?.stack.join(", ")} className={input} />
      </Field>
      <RolesEditor initial={company?.roles ?? []} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sort order" hint="Lower comes first">
          <input name="sortOrder" type="number" defaultValue={company?.sortOrder ?? 0} className={input} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={company?.published ?? true} /> Published
      </label>
      <div className="flex items-center gap-3">
        <button className={btn} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

const kv = (xs: KV[]) => xs.map((x) => `${x.k} | ${x.v}`).join("\n");

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border border-rule bg-[#faf9f6] p-5">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

export function SettingsForm({ s }: { s: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  const t = (name: keyof SiteSettings, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <input name={name} defaultValue={String(s[name] ?? "")} className={input} />
    </Field>
  );
  const area = (name: string, label: string, value: string, rows = 3, hint?: string, mono = false) => (
    <Field label={label} hint={hint}>
      <textarea name={name} rows={rows} defaultValue={value} className={`${input} ${mono ? "font-mono" : ""}`} />
    </Field>
  );
  return (
    <form action={action} className="max-w-3xl space-y-6">
      <Section title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          {t("name", "Name")}
          {t("monogram", "Monogram", "Header block, e.g. GK")}
          {t("role", "Role", "e.g. Software Engineer")}
          {t("location", "City")}
          {t("country", "Country")}
          {t("countryCode", "Country code", "e.g. NP (for search engines)")}
          {t("worksFor", "Current employer", "For search engines")}
          {t("alumniOf", "University", "For search engines")}
        </div>
        {area("seoDescription", "Default meta description", s.seoDescription, 3, "~155 characters, used by search engines")}
      </Section>

      <Section title="Contact & socials">
        <div className="grid gap-4 sm:grid-cols-2">
          {t("email", "Public email")}
          {t("timezone", "Time zone", "IANA name, e.g. Asia/Kathmandu")}
          {t("tzLabel", "Time zone label", "e.g. NPT (UTC+5:45)")}
        </div>
        {area("socials", "Social links", s.socials.map((x) => `${x.label} | ${x.handle} | ${x.url}`).join("\n"), 4, "One per line: Label | handle | https://url", true)}
        {t("contactHeading", "Contact page heading")}
        {area("contactIntro", "Contact page intro", s.contactIntro)}
      </Section>

      <Section title="Home page">
        {t("heroEyebrow", "Eyebrow")}
        {area("heroHeadline", "Headline", s.heroHeadline, 2)}
        {area("heroIntro", "Intro", s.heroIntro, 3)}
        {area("langs", "“Mostly in” chips", s.langs.join("\n"), 3, "One per line")}
        {t("homeWorkLabel", "Work band label", "e.g. Work, 2024 — now")}
        {area("homeOffClock", "Off the clock (short)", s.homeOffClock, 3)}
      </Section>

      <Section title="Section intros">
        {area("writingIntro", "Writing page", s.writingIntro)}
        {area("workIntro", "Work page", s.workIntro)}
        {t("tinkeringIntro", "Tinkering section")}
      </Section>

      <Section title="About page">
        {t("aboutHeading", "Heading")}
        {area("aboutBody", "Body (Markdown)", s.aboutBody, 10)}
        <ImageField name="aboutPhoto" label="Portrait (4:5)" defaultValue={s.aboutPhoto} />
        {t("aboutPhotoCaption", "Photo caption")}
        {area("now", "Now", s.now.join("\n"), 4, "One per line")}
        {area("skills", "What I reach for", kv(s.skills), 5, "One per line: Group | items", true)}
        {area("education", "Education", kv(s.education), 3, "One per line: Qualification | School · year", true)}
        {area("certificates", "Certificates", s.certificates.join("\n"), 3, "One per line")}
        {area("offClock", "Off the clock", kv(s.offClock), 4, "One per line: Title | one-liner", true)}
      </Section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-rule bg-paper py-3">
        <button className={btn} disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}
