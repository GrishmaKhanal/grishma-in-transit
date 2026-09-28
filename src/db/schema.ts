import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  // URL segment: /blog/<slug> or /notes/<slug>. Kept stable once published.
  slug: text("slug").notNull().unique(),
  kind: text("kind", { enum: ["blog", "note"] }).notNull().default("blog"),
  // Shown as "No. 001". Optional; posts without one sort by date.
  number: integer("number"),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  excerpt: text("excerpt"), // the "dek" under titles
  content: text("content").notNull().default(""), // markdown
  tags: text("tags").array().notNull().default([]),
  coverImage: text("cover_image"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Role = {
  title: string;
  period: string; // "Nov 2025 - Present"
  duration: string; // "11 mo"
  points: string[];
  stack: string[];
};

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  span: text("span").notNull().default(""), // "Nov 2025 - now"
  location: text("location").notNull().default(""), // "Remote"
  siteUrl: text("site_url"),
  siteLabel: text("site_label"),
  summary: text("summary").notNull().default(""),
  stack: text("stack").array().notNull().default([]),
  roles: jsonb("roles").$type<Role[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// A project with a company is shown under that company; without one it is "Tinkering".
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  tags: text("tags").array().notNull().default([]), // stack
  liveUrl: text("live_url"),
  linkLabel: text("link_label"), // "Product", "Live"
  repoUrl: text("repo_url"),
  status: text("status"), // "Not deployed"
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Social = { label: string; handle: string; url: string };
export type KV = { k: string; v: string };

export type SiteSettings = {
  // identity
  name: string;
  monogram: string;
  role: string;
  location: string;
  country: string;
  countryCode: string;
  timezone: string; // IANA, for the contact-page clock
  tzLabel: string;
  worksFor: string;
  alumniOf: string;
  email: string;
  socials: Social[];
  seoDescription: string;
  // home
  heroEyebrow: string;
  heroHeadline: string;
  heroIntro: string;
  langs: string[];
  homeWorkLabel: string;
  homeOffClock: string;
  // section intros
  writingIntro: string;
  workIntro: string;
  tinkeringIntro: string;
  // about
  aboutHeading: string;
  aboutBody: string; // markdown
  aboutPhoto: string;
  aboutPhotoCaption: string;
  now: string[];
  skills: KV[];
  education: KV[]; // k = qualification, v = "School · year"
  certificates: string[];
  offClock: KV[]; // k = title, v = one-liner
  // contact
  contactHeading: string;
  contactIntro: string;
};

// Single-row key/value store for editable site-wide content.
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Partial<SiteSettings>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Post = typeof posts.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Message = typeof messages.$inferSelect;
