"use client";

import { startTransition, useActionState, useState } from "react";
import type { Company, KV, Post, Project, SiteSettings } from "@/db/schema";
import { slugify } from "@/lib/slug";
import { login, saveCompany, savePost, saveProject, saveSettings } from "../actions";
import { RolesEditor } from "./roles";
import { RowsEditor } from "./rows";
import { SaveForm, btn } from "./save";
import { CountedField, Field, ImageField, MarkdownField, input } from "./fields";

const pathFor = (kind: string, slug: string) => `/${kind === "note" ? "notes" : "blog"}/${slug}`;

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
      {/* `action` covers submits before hydration (a real POST, never a GET with the password in
          the URL). After hydration onSubmit takes over, which skips React's reset of action forms
          so a typo doesn't clear the username. */}
      <form
        action={action}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd));
        }}
        className="space-y-5 border border-t-0 border-ink bg-panel p-6"
      >
        <label className="flex flex-col gap-1.5 text-[13px] text-ink-4">
          Username
          <input
            name="username"
            type="text"
            autoFocus
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className="border-0 border-b border-ink bg-transparent py-2 font-serif text-[19px] outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] text-ink-4">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="border-0 border-b border-ink bg-transparent py-2 font-serif text-[19px] outline-none focus:border-accent"
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <span aria-live="polite" className="font-serif text-sm text-accent">
            {state?.error}
          </span>
          <button className={btn} disabled={pending}>
            {pending ? "Checking…" : "Sign in →"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function PostForm({ post, created }: { post?: Post; created?: boolean }) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [kind, setKind] = useState(post?.kind ?? "blog");
  const [published, setPublished] = useState(post?.published ?? false);
  // A new post's slug follows the title until it's edited by hand; a saved post keeps its own.
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(post));
  const shownSlug = slugEdited ? slug : slugify(title);
  const path = pathFor(kind, shownSlug);
  const livePath = post?.published ? pathFor(post.kind, post.slug) : null;

  return (
    <SaveForm
      action={savePost}
      created={created}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      barClassName="lg:col-span-2"
      extra={
        livePath && (
          <a href={livePath} target="_blank" className="underline">
            View live ↗
          </a>
        )
      }
    >
      {post && <input type="hidden" name="id" value={post.id} />}
      <div className="min-w-0 space-y-4">
        <Field label="Title">
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required className={`${input} text-lg`} />
        </Field>
        <MarkdownField name="content" defaultValue={post?.content} />
      </div>
      <aside className="space-y-4">
        <label className="flex items-start gap-2.5 border border-rule bg-[#faf9f6] p-3 text-sm">
          <input type="checkbox" name="published" checked={published} onChange={(e) => setPublished(e.target.checked)} className="mt-0.5" />
          <span>
            <span className="font-medium">{published ? "Published" : "Draft"}</span>
            <span className="block text-xs text-ink-5">
              {published ? `Public at ${path} once saved.` : "Only visible here. Tick to publish on save."}
            </span>
          </span>
        </label>
        <Field label="Type">
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as Post["kind"])} className={input}>
            <option value="blog">Blog article (/blog/…)</option>
            <option value="note">Note (/notes/…)</option>
          </select>
        </Field>
        <Field
          label="Slug"
          hint={
            livePath && livePath !== path ? (
              <span className="text-accent">This post is live. Changing its URL breaks existing links to {livePath}.</span>
            ) : (
              <>
                URL: <span className="font-mono">{path}</span>
              </>
            )
          }
        >
          <input
            name="slug"
            value={shownSlug}
            onChange={(e) => {
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
              setSlugEdited(true);
            }}
            // Emptied by hand: go back to following the title rather than saving a blank.
            onBlur={() => {
              if (!slug) setSlugEdited(false);
            }}
            className={`${input} font-mono`}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="Lowercase letters, numbers and single dashes"
          />
        </Field>
        <Field label="Number" hint='Shown as "No. 001". Optional.'>
          <input name="number" type="number" min={0} defaultValue={post?.number ?? ""} className={input} />
        </Field>
        <Field label="Publish date (UTC)" hint="Leave empty to use the moment you publish.">
          <input type="datetime-local" name="publishedAt" defaultValue={dt(post?.publishedAt)} className={input} />
        </Field>
        <Field label="Tags" hint="Comma separated. The first one shows in lists.">
          <input name="tags" defaultValue={post?.tags.join(", ")} className={input} />
        </Field>
        <CountedField
          name="excerpt"
          label="Dek / excerpt"
          rows={3}
          max={160}
          defaultValue={post?.excerpt ?? ""}
          hint="The line under the title in lists and on the post; fallback meta description."
        />
        <ImageField name="coverImage" label="Cover / social image" defaultValue={post?.coverImage} />
        <details className="space-y-3">
          <summary className="cursor-pointer text-sm font-medium">SEO overrides ▾</summary>
          <CountedField name="seoTitle" label="SEO title" max={60} defaultValue={post?.seoTitle ?? ""} hint="Defaults to the title." />
          <CountedField
            name="seoDescription"
            label="Meta description"
            rows={3}
            max={155}
            defaultValue={post?.seoDescription ?? ""}
            hint="Defaults to the dek."
          />
        </details>
      </aside>
    </SaveForm>
  );
}

export function ProjectForm({
  project,
  companies,
  created,
  companyId,
}: {
  project?: Project;
  companies: Pick<Company, "id" | "name">[];
  created?: boolean;
  companyId?: number;
}) {
  return (
    <SaveForm action={saveProject} created={created} className="max-w-2xl space-y-4">
      {project && <input type="hidden" name="id" value={project.id} />}
      <Field label="Name">
        <input name="title" defaultValue={project?.title} required className={`${input} text-lg`} />
      </Field>
      <Field label="Where it appears">
        <select name="companyId" defaultValue={project?.companyId ?? companyId ?? ""} className={input}>
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
      <Field label="Stack" hint="Comma separated - shown as “Azure · BullMQ · TS”">
        <input name="tags" defaultValue={project?.tags.join(", ")} className={input} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Link URL" hint="Leave empty to show “Internal” for work projects.">
          <input name="liveUrl" type="url" defaultValue={project?.liveUrl ?? ""} placeholder="https://" className={input} />
        </Field>
        <Field label="Link label" hint="e.g. Product, Live, Demo">
          <input name="linkLabel" defaultValue={project?.linkLabel ?? ""} className={input} />
        </Field>
        <Field label="Code URL" hint="Shows a “Code ↗” link.">
          <input name="repoUrl" type="url" defaultValue={project?.repoUrl ?? ""} placeholder="https://" className={input} />
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
    </SaveForm>
  );
}

export function CompanyForm({ company, created }: { company?: Company; created?: boolean }) {
  return (
    <SaveForm action={saveCompany} created={created} className="max-w-3xl space-y-4">
      {company && <input type="hidden" name="id" value={company.id} />}
      <Field label="Company">
        <input name="name" defaultValue={company?.name} required className={`${input} text-lg`} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Span" hint="e.g. Nov 2025 - now">
          <input name="span" defaultValue={company?.span} className={input} />
        </Field>
        <Field label="Location" hint="e.g. Remote">
          <input name="location" defaultValue={company?.location} className={input} />
        </Field>
        <Field label="Website">
          <input name="siteUrl" type="url" defaultValue={company?.siteUrl ?? ""} placeholder="https://" className={input} />
        </Field>
        <Field label="Website label" hint="e.g. example.com">
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
    </SaveForm>
  );
}

const kv = (xs: KV[]) => xs.map((x) => [x.k, x.v]);

const SECTIONS = [
  ["identity", "Identity", "/"],
  ["contact", "Contact & socials", "/contact"],
  ["home", "Home page", "/"],
  ["intros", "Section intros", "/blog"],
  ["about", "About page", "/about"],
] as const;

function Section({ id, children }: { id: (typeof SECTIONS)[number][0]; children: React.ReactNode }) {
  const [, title, href] = SECTIONS.find((s) => s[0] === id)!;
  return (
    <fieldset id={id} className="scroll-mt-6 space-y-4 border border-rule bg-[#faf9f6] p-5">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      <a href={href} target="_blank" className="float-right -mt-2 text-xs text-ink-5 underline">
        View {href} ↗
      </a>
      {children}
    </fieldset>
  );
}

export function SettingsForm({ s }: { s: SiteSettings }) {
  const t = (name: keyof SiteSettings, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <input name={name} defaultValue={String(s[name] ?? "")} className={input} />
    </Field>
  );
  const area = (name: string, label: string, value: string, rows = 3, hint?: string) => (
    <Field label={label} hint={hint}>
      <textarea name={name} rows={rows} defaultValue={value} className={input} />
    </Field>
  );
  return (
    <div className="grid gap-8 lg:grid-cols-[160px_minmax(0,1fr)]">
      <nav aria-label="Sections" className="flex flex-wrap gap-2 lg:sticky lg:top-6 lg:flex-col lg:self-start">
        {SECTIONS.map(([id, title]) => (
          <a key={id} href={`#${id}`} className="border border-rule px-3 py-1.5 text-sm hover:border-ink lg:border-0 lg:border-l-2 lg:px-3 lg:py-1">
            {title}
          </a>
        ))}
      </nav>
      <SaveForm action={saveSettings} label="Save settings" className="max-w-3xl min-w-0 space-y-6">
        <Section id="identity">
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
          <CountedField name="seoDescription" label="Default meta description" rows={3} max={155} defaultValue={s.seoDescription} hint="Used by search engines when a page has none of its own." />
        </Section>

        <Section id="contact">
          <div className="grid gap-4 sm:grid-cols-2">
            {t("email", "Public email")}
            {t("timezone", "Time zone", "IANA name, e.g. Asia/Kathmandu")}
            {t("tzLabel", "Time zone label", "e.g. NPT (UTC+5:45)")}
          </div>
          <RowsEditor
            name="socials"
            label="Social links"
            addLabel="Add link"
            cols={[{ placeholder: "Label, e.g. GitHub" }, { placeholder: "Handle, e.g. @you" }, { placeholder: "https://…", type: "url", wide: true }]}
            initial={s.socials.map((x) => [x.label, x.handle, x.url])}
            hint="Shown in the footer, home hero, about and contact pages."
          />
          {t("contactHeading", "Contact page heading")}
          {area("contactIntro", "Contact page intro", s.contactIntro)}
        </Section>

        <Section id="home">
          {t("heroEyebrow", "Eyebrow")}
          {area("heroHeadline", "Headline", s.heroHeadline, 2)}
          {area("heroIntro", "Intro", s.heroIntro, 3)}
          {area("langs", "“Mostly in” chips", s.langs.join("\n"), 3, "One per line")}
          {t("homeWorkLabel", "Work band label", "e.g. Work, 2024 - now")}
          {area("homeOffClock", "Off the clock (short)", s.homeOffClock, 3)}
        </Section>

        <Section id="intros">
          {area("writingIntro", "Writing page", s.writingIntro)}
          {area("workIntro", "Work page", s.workIntro)}
          {t("tinkeringIntro", "Tinkering section")}
        </Section>

        <Section id="about">
          {t("aboutHeading", "Heading")}
          {area("aboutBody", "Body (Markdown)", s.aboutBody, 10)}
          <ImageField name="aboutPhoto" label="Portrait (4:5)" defaultValue={s.aboutPhoto} />
          {t("aboutPhotoCaption", "Photo caption")}
          <RowsEditor
            name="skills"
            label="What I reach for"
            addLabel="Add group"
            cols={[{ placeholder: "Group, e.g. Languages" }, { placeholder: "Items, e.g. Python, SQL", wide: true }]}
            initial={kv(s.skills)}
          />
          <RowsEditor
            name="education"
            label="Education"
            addLabel="Add qualification"
            cols={[{ placeholder: "Qualification" }, { placeholder: "School · year", wide: true }]}
            initial={kv(s.education)}
          />
          {area("certificates", "Certificates", s.certificates.join("\n"), 3, "One per line")}
          <RowsEditor
            name="offClock"
            label="Off the clock"
            addLabel="Add item"
            cols={[{ placeholder: "Title, e.g. Football" }, { placeholder: "One-liner", wide: true }]}
            initial={kv(s.offClock)}
          />
        </Section>
      </SaveForm>
    </div>
  );
}
