"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { z } from "zod";
import { db, hasDb } from "@/db";
import { companies, messages, posts, projects, settings, type Role, type SiteSettings } from "@/db/schema";
import { TAGS } from "@/lib/data";
import { checkCredentials, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { renderMarkdown } from "@/lib/markdown";
import { SLUG_RE, slugify } from "@/lib/slug";
import { ADMIN } from "@/lib/admin-path";

export type FormState = { error?: string; ok?: string } | undefined;

function assertDb() {
  if (!hasDb) throw new Error("DATABASE_URL is not configured.");
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optional = (fd: FormData, k: string) => str(fd, k) || null;
const list = (fd: FormData, k: string) =>
  str(fd, k)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
const tags = (fd: FormData) => list(fd, "tags");
const lines = (fd: FormData, k: string) =>
  String(fd.get(k) ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
/** "a | b | c" per line → string[][] */
const piped = (fd: FormData, k: string, min: number) =>
  lines(fd, k)
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter((parts) => parts.length >= min && parts.slice(0, min).every(Boolean));
const pairs = (fd: FormData, k: string) => piped(fd, k, 2).map(([k2, ...v]) => ({ k: k2, v: v.join(" | ") }));

/* ---------- auth ---------- */

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  if (!checkCredentials(str(fd, "username"), String(fd.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: "Wrong username or password." };
  }
  await createSession();
  redirect(ADMIN);
}

export async function logout() {
  await destroySession();
  redirect(ADMIN);
}

/* ---------- posts ---------- */

const PostInput = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().regex(SLUG_RE, "Slug: lowercase letters, numbers and dashes only"),
  kind: z.enum(["blog", "note"]),
});

export async function savePost(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  assertDb();
  const id = Number(fd.get("id")) || null;
  const parsed = PostInput.safeParse({
    title: str(fd, "title"),
    slug: str(fd, "slug") || slugify(str(fd, "title")),
    kind: str(fd, "kind") || "blog",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const published = fd.get("published") === "on";
  const publishedAtRaw = str(fd, "publishedAt");
  const values = {
    ...parsed.data,
    number: str(fd, "number") ? Number(str(fd, "number")) : null,
    subtitle: optional(fd, "subtitle"),
    excerpt: optional(fd, "excerpt"),
    content: String(fd.get("content") ?? ""),
    tags: tags(fd),
    coverImage: optional(fd, "coverImage"),
    seoTitle: optional(fd, "seoTitle"),
    seoDescription: optional(fd, "seoDescription"),
    published,
    // The form shows/submits UTC ("YYYY-MM-DDTHH:mm", no zone) - parse it as UTC,
    // not server-local time, or every save shifts the date by the server's offset.
    publishedAt: publishedAtRaw ? new Date(`${publishedAtRaw}Z`) : published ? new Date() : null,
    updatedAt: new Date(),
  };

  let savedId = id;
  try {
    if (id) {
      await db.update(posts).set(values).where(eq(posts.id, id));
    } else {
      const [row] = await db.insert(posts).values(values).returning({ id: posts.id });
      savedId = row.id;
    }
  } catch (e) {
    if (String(e).includes("unique")) return { error: "That slug is already used." };
    throw e;
  }
  updateTag(TAGS.posts);
  if (!id) redirect(`${ADMIN}/posts/${savedId}`);
  return { ok: "Saved." };
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  assertDb();
  await db.delete(posts).where(eq(posts.id, Number(fd.get("id"))));
  updateTag(TAGS.posts);
  redirect(`${ADMIN}/posts`);
}

/* ---------- companies ---------- */

const RoleInput = z.array(
  z.object({
    title: z.string().trim().min(1, "Every role needs a title"),
    period: z.string().trim(),
    duration: z.string().trim(),
    points: z.array(z.string().trim()).transform((a) => a.filter(Boolean)),
    stack: z.array(z.string().trim()).transform((a) => a.filter(Boolean)),
  }),
);

export async function saveCompany(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  assertDb();
  const id = Number(fd.get("id")) || null;
  const name = str(fd, "name");
  if (!name) return { error: "Name is required" };
  let roles: Role[];
  try {
    const parsed = RoleInput.safeParse(JSON.parse(String(fd.get("roles") ?? "[]")));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    roles = parsed.data;
  } catch {
    return { error: "Roles could not be read." };
  }
  const values = {
    name,
    span: str(fd, "span"),
    location: str(fd, "location"),
    siteUrl: optional(fd, "siteUrl"),
    siteLabel: optional(fd, "siteLabel"),
    summary: str(fd, "summary"),
    stack: list(fd, "stack"),
    roles,
    sortOrder: Number(fd.get("sortOrder")) || 0,
    published: fd.get("published") === "on",
    updatedAt: new Date(),
  };
  let savedId = id;
  if (id) {
    await db.update(companies).set(values).where(eq(companies.id, id));
  } else {
    const [row] = await db.insert(companies).values(values).returning({ id: companies.id });
    savedId = row.id;
  }
  updateTag(TAGS.work);
  if (!id) redirect(`${ADMIN}/companies/${savedId}`);
  return { ok: "Saved." };
}

export async function deleteCompany(fd: FormData) {
  await requireAdmin();
  assertDb();
  // Its projects are kept (company_id is set to null) and move to Tinkering as drafts.
  const id = Number(fd.get("id"));
  await db.update(projects).set({ published: false }).where(eq(projects.companyId, id));
  await db.delete(companies).where(eq(companies.id, id));
  updateTag(TAGS.work);
  redirect(`${ADMIN}/companies`);
}

/* ---------- projects ---------- */

export async function saveProject(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  assertDb();
  const id = Number(fd.get("id")) || null;
  const title = str(fd, "title");
  if (!title) return { error: "Name is required" };
  const values = {
    title,
    companyId: Number(fd.get("companyId")) || null,
    summary: str(fd, "summary"),
    tags: tags(fd),
    liveUrl: optional(fd, "liveUrl"),
    linkLabel: optional(fd, "linkLabel"),
    repoUrl: optional(fd, "repoUrl"),
    status: optional(fd, "status"),
    sortOrder: Number(fd.get("sortOrder")) || 0,
    published: fd.get("published") === "on",
    updatedAt: new Date(),
  };
  let savedId = id;
  if (id) {
    await db.update(projects).set(values).where(eq(projects.id, id));
  } else {
    const [row] = await db.insert(projects).values(values).returning({ id: projects.id });
    savedId = row.id;
  }
  updateTag(TAGS.work);
  if (!id) redirect(`${ADMIN}/projects/${savedId}`);
  return { ok: "Saved." };
}

export async function deleteProject(fd: FormData) {
  await requireAdmin();
  assertDb();
  await db.delete(projects).where(eq(projects.id, Number(fd.get("id"))));
  updateTag(TAGS.work);
  redirect(`${ADMIN}/projects`);
}

/* ---------- settings ---------- */

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  assertDb();
  const value: SiteSettings = {
    name: str(fd, "name"),
    monogram: str(fd, "monogram"),
    role: str(fd, "role"),
    location: str(fd, "location"),
    country: str(fd, "country"),
    countryCode: str(fd, "countryCode"),
    timezone: str(fd, "timezone") || "UTC",
    tzLabel: str(fd, "tzLabel"),
    worksFor: str(fd, "worksFor"),
    alumniOf: str(fd, "alumniOf"),
    email: str(fd, "email"),
    socials: piped(fd, "socials", 3).map(([label, handle, url]) => ({ label, handle, url })),
    seoDescription: str(fd, "seoDescription"),
    heroEyebrow: str(fd, "heroEyebrow"),
    heroHeadline: str(fd, "heroHeadline"),
    heroIntro: str(fd, "heroIntro"),
    langs: lines(fd, "langs"),
    homeWorkLabel: str(fd, "homeWorkLabel"),
    homeOffClock: str(fd, "homeOffClock"),
    writingIntro: str(fd, "writingIntro"),
    workIntro: str(fd, "workIntro"),
    tinkeringIntro: str(fd, "tinkeringIntro"),
    aboutHeading: str(fd, "aboutHeading"),
    aboutBody: String(fd.get("aboutBody") ?? "").trim(),
    aboutPhoto: str(fd, "aboutPhoto"),
    aboutPhotoCaption: str(fd, "aboutPhotoCaption"),
    now: lines(fd, "now"),
    skills: pairs(fd, "skills"),
    education: pairs(fd, "education"),
    certificates: lines(fd, "certificates"),
    offClock: pairs(fd, "offClock"),
    contactHeading: str(fd, "contactHeading"),
    contactIntro: str(fd, "contactIntro"),
  };
  if (!value.name) return { error: "Name is required." };
  await db
    .insert(settings)
    .values({ key: "site", value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  updateTag(TAGS.settings);
  return { ok: "Saved." };
}

/* ---------- messages ---------- */

export async function toggleMessageRead(fd: FormData) {
  await requireAdmin();
  assertDb();
  await db
    .update(messages)
    .set({ read: fd.get("read") === "true" })
    .where(eq(messages.id, Number(fd.get("id"))));
  redirect(`${ADMIN}/messages`);
}

export async function deleteMessage(fd: FormData) {
  await requireAdmin();
  assertDb();
  await db.delete(messages).where(eq(messages.id, Number(fd.get("id"))));
  redirect(`${ADMIN}/messages`);
}

/* ---------- utilities ---------- */

export async function previewMarkdown(src: string) {
  await requireAdmin();
  return (await renderMarkdown(src)).html;
}

export async function uploadImage(fd: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { error: "Vercel Blob is not connected (BLOB_READ_WRITE_TOKEN missing)." };
  }
  const file = fd.get("file");
  if (!(file instanceof File) || !file.size) return { error: "No file." };
  if (!file.type.startsWith("image/")) return { error: "Images only." };
  if (file.size > 4 * 1024 * 1024) return { error: "Max 4 MB." };
  const blob = await put(`uploads/${slugify(file.name.replace(/\.[^.]+$/, ""))}${file.name.match(/\.[^.]+$/)?.[0] ?? ""}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return { url: blob.url };
}
