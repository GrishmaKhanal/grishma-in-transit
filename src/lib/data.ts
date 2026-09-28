import "server-only";
import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { companies, posts, projects, settings, type Company, type Project, type SiteSettings } from "@/db/schema";
import { seedCompanies, seedPosts, seedProjects, seedSettings } from "@/content/seed";

export type PostKind = "blog" | "note";

// Cache tags. Admin mutations expire these so public pages update instantly.
export const TAGS = { posts: "posts", work: "work", settings: "settings" } as const;

const DATE_KEYS = ["publishedAt", "createdAt", "updatedAt"];

// unstable_cache JSON-serializes results; revive Date fields (at any depth) afterwards.
function revive<T>(v: T): T {
  if (Array.isArray(v)) return v.map(revive) as T;
  if (v && typeof v === "object" && !(v instanceof Date)) {
    const o: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      o[k] = DATE_KEYS.includes(k) && typeof val === "string" ? new Date(val) : revive(val);
    }
    return o as T;
  }
  return v;
}

function cached<A extends unknown[], R>(fn: (...a: A) => Promise<R>, key: string, tags: string[]) {
  const c = unstable_cache(fn, [key], { tags, revalidate: 3600 });
  return async (...a: A) => revive(await c(...a));
}

async function _getSettings(): Promise<SiteSettings> {
  if (!hasDb) return seedSettings;
  const row = await db.query.settings.findFirst({ where: eq(settings.key, "site") });
  // Stored value may predate newer fields; fill gaps from the seed.
  return { ...seedSettings, ...(row?.value ?? {}) };
}

async function _getPublishedPosts(kind?: PostKind) {
  if (!hasDb) {
    return seedPosts.filter((p) => p.published && (!kind || p.kind === kind));
    // (seed is already in display order)
  }
  return db
    .select()
    .from(posts)
    .where(kind ? and(eq(posts.published, true), eq(posts.kind, kind)) : eq(posts.published, true))
    .orderBy(sql`${posts.number} desc nulls last`, desc(posts.publishedAt));
}

async function _getPublishedPost(kind: PostKind, slug: string) {
  if (!hasDb) {
    return seedPosts.find((p) => p.published && p.kind === kind && p.slug === slug) ?? null;
  }
  const [row] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.kind, kind), eq(posts.published, true)))
    .limit(1);
  return row ?? null;
}

export type CompanyWithProjects = Company & { projects: Project[] };

async function _getWork(): Promise<{ companies: CompanyWithProjects[]; side: Project[] }> {
  let cs: Company[];
  let ps: Project[];
  if (!hasDb) {
    cs = seedCompanies;
    ps = seedProjects;
  } else {
    [cs, ps] = await Promise.all([
      db.select().from(companies).where(eq(companies.published, true)).orderBy(asc(companies.sortOrder), asc(companies.id)),
      db.select().from(projects).where(eq(projects.published, true)).orderBy(asc(projects.sortOrder), asc(projects.id)),
    ]);
  }
  const published = ps.filter((p) => p.published);
  return {
    companies: cs
      .filter((c) => c.published)
      .map((c) => ({ ...c, projects: published.filter((p) => p.companyId === c.id) })),
    side: published.filter((p) => p.companyId === null),
  };
}

export const getSettings = cached(_getSettings, "settings", [TAGS.settings]);
export const getPublishedPosts = cached(_getPublishedPosts, "posts", [TAGS.posts]);
export const getPublishedPost = cached(_getPublishedPost, "post", [TAGS.posts]);
export const getWork = cached(_getWork, "work", [TAGS.work]);
