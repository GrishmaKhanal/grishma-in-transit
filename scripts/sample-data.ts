import "dotenv/config";
import { readFileSync } from "node:fs";
import { gte, like } from "drizzle-orm";
import { db } from "../src/db";
import { companies, media, messages, posts, projects, type Role } from "../src/db/schema";
import { sniffImageType } from "../src/lib/image-type";

// Local-only test data for every admin screen. Sample rows use ids from 9001 (media ids start
// with "sample"), so a rerun replaces them and `--remove` deletes them without a visible marker.
const FIRST_ID = 9001;
const IMAGE_ID = "sampleimage00001"; // /media/[id] accepts 16 url-safe chars
const IMAGE = `/media/${IMAGE_ID}`;

const url = process.env.DATABASE_URL ?? "";
if (!/^postgres(ql)?:\/\/([^@/]*@)?(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
  console.error("sample-data: refusing to run, DATABASE_URL is not a local database.");
  process.exit(1);
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const fence = "```";

const samplePosts = [
  {
    id: 9001,
    slug: "idempotent-bullmq-consumers",
    kind: "blog" as const,
    number: 2,
    title: "Idempotent queue consumers with BullMQ",
    excerpt: "A retry is only safe if doing the job twice does nothing the second time. Here is how I make BullMQ workers behave that way.",
    tags: ["TypeScript", "Queues", "Reliability"],
    published: true,
    publishedAt: new Date("2026-03-14T09:00:00Z"),
    updatedAt: new Date("2026-03-15T11:20:00Z"),
    content: `Queues retry. That is the point of them, and also the trap: a job that half-finished and then retried can send two emails, charge twice, or write a duplicate row.

## The rule

> Every job should be safe to run twice.

If that holds, retries stop being scary and you can turn them up.

## Give each job a natural key

BullMQ lets you set a \`jobId\`. When it is derived from the work itself (not random), adding the same job twice is a no-op:

${fence}ts
await queue.add("ingest", { blobPath }, {
  jobId: \`ingest:\${blobPath}\`,
  attempts: 5,
  backoff: { type: "exponential", delay: 2_000 },
});
${fence}

## Record what you already did

The worker checks a small table before doing anything with side effects:

${fence}ts
const done = await db.query.processed.findFirst({ where: eq(processed.key, job.id) });
if (done) return "skipped";
await doTheWork(job.data);
await db.insert(processed).values({ key: job.id }).onConflictDoNothing();
${fence}

## Checklist

1. Derive \`jobId\` from the input.
2. Make writes upserts, not inserts.
3. Put the "already done" check before the first side effect.
4. Log the skip, so a retry storm is visible.

That's most of it. The rest is picking sensible backoff numbers.`,
  },
  {
    id: 9002,
    slug: "azure-blob-events-without-gaps",
    kind: "blog" as const,
    number: 3,
    title: "Reading Azure Blob events without missing any",
    excerpt: "Event Grid is at-least-once and unordered. A small reconciliation job closes the gaps.",
    tags: ["Azure", "Python", "Event-driven"],
    coverImage: IMAGE,
    published: true,
    publishedAt: new Date("2026-05-02T06:30:00Z"),
    updatedAt: new Date("2026-05-04T08:00:00Z"),
    content: `Blob-created events are the easy way to react to uploads. They are also **at-least-once** and **unordered**, and during an outage some never arrive.

![A road through the hills, standing in for a data pipeline](${IMAGE})

## What can go wrong

| Problem | Symptom | Fix |
|---|---|---|
| Duplicate event | File processed twice | Idempotent handler |
| Out of order | Old version overwrites new | Compare \`etag\` / timestamps |
| Missed event | File never processed | Nightly reconciliation |

## The reconciliation job

Once a night, list what landed and compare it with what was processed:

${fence}python
from azure.storage.blob import ContainerClient

def unprocessed(container: ContainerClient, seen: set[str]) -> list[str]:
    return [b.name for b in container.list_blobs(name_starts_with="inbox/") if b.name not in seen]
${fence}

Anything it finds goes back on the queue, and the idempotent handler makes that safe.

${fence}bash
az storage blob list --container-name inbox --prefix inbox/ --output table
${fence}

---

The events handle the fast path. The reconciliation job means you don't have to trust them completely.`,
  },
  {
    id: 9003,
    slug: "postgres-who-holds-the-lock",
    kind: "note" as const,
    number: null,
    title: "Postgres: find what's holding a lock",
    excerpt: "The one query I keep coming back to when a migration hangs.",
    tags: ["PostgreSQL", "Notes"],
    published: true,
    publishedAt: new Date("2026-06-20T14:00:00Z"),
    updatedAt: new Date("2026-06-20T14:00:00Z"),
    content: `When \`ALTER TABLE\` just sits there, something else holds a lock on the table:

${fence}sql
select blocked.pid as waiting, blocking.pid as holding, blocking.query
from pg_stat_activity blocked
join pg_stat_activity blocking on blocking.pid = any(pg_blocking_pids(blocked.pid));
${fence}

Then \`select pg_cancel_backend(<pid>)\` if it is safe to stop.`,
  },
  {
    id: 9004,
    slug: "mv3-extension-that-fills-forms",
    kind: "blog" as const,
    number: 4,
    title: "Writing a Manifest V3 extension that fills forms",
    excerpt: "Content scripts, service workers and the message passing between them, in the order you actually hit them.",
    tags: ["JavaScript", "Browser extensions"],
    published: true,
    publishedAt: new Date("2026-08-11T03:15:00Z"),
    updatedAt: new Date("2026-08-12T10:40:00Z"),
    content: `Manifest V3 splits an extension into pieces that can't see each other directly. Most of the work is moving data between them.

## The pieces

- **Service worker**: background logic. It sleeps when idle, so keep no state in memory.
- **Content script**: runs inside the page and can read and fill the form.
- **Popup**: the small UI you click.

## Filling a field so the page notices

Setting \`input.value\` is not enough for most frameworks. Fire the events they listen for:

${fence}js
function fill(input, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
${fence}

### Waiting for the form to exist

Single-page apps render late. A \`MutationObserver\` beats a timeout:

${fence}js
const ready = new Promise((resolve) => {
  const check = () => document.querySelector("#signup-form") && resolve();
  new MutationObserver(check).observe(document.body, { childList: true, subtree: true });
  check();
});
${fence}

## Message passing

The popup asks, the content script answers:

${fence}js
chrome.tabs.sendMessage(tabId, { type: "fill", data });
chrome.runtime.onMessage.addListener((msg) => msg.type === "fill" && fillAll(msg.data));
${fence}

## Things that bit me

1. The service worker restarted mid-flow and lost its variables. Store state in \`chrome.storage.session\`.
2. Pages with strict CSP blocked injected scripts. Content scripts are exempt, injected \`<script>\` tags are not.
3. Iframes need \`all_frames: true\` in the manifest.

See the [Chrome extension docs](https://developer.chrome.com/docs/extensions) for the full API.`,
  },
  {
    id: 9005,
    slug: "cache-tags-in-nextjs",
    kind: "blog" as const,
    number: null,
    title: "Caching with tags in Next.js",
    excerpt: "Draft: how updateTag makes static pages feel live.",
    tags: ["Next.js", "Caching"],
    published: false,
    publishedAt: null,
    updatedAt: daysAgo(1),
    content: `## Outline

- Static pages are fast but stale
- Tag every cached read
- Expire the tag from the write

TODO: add the diagram and a real example.`,
  },
  {
    id: 9006,
    slug: "untitled-note",
    kind: "note" as const,
    number: null,
    title: "Untitled note",
    excerpt: null,
    tags: [],
    published: false,
    publishedAt: null,
    updatedAt: daysAgo(3),
    content: "",
  },
];

const role = (r: Role) => r;

const sampleCompanies = [
  {
    id: 9001,
    name: "Lumen Freight",
    span: "Jun 2023 - Dec 2023",
    location: "Remote",
    siteUrl: "https://lumen-freight.example.com",
    siteLabel: "lumen-freight.example.com",
    summary: "Internship on a logistics platform: shipment tracking views and a rate-limited proxy in front of carrier APIs.",
    stack: ["TypeScript", "React", "Node", "Redis"],
    roles: [
      role({
        title: "Software Engineering Intern",
        period: "Jun 2023 - Dec 2023",
        duration: "7 mo",
        points: [
          "Built a shipment tracking dashboard used by the operations team.",
          "Added a Redis-backed rate limiter in front of three carrier APIs.",
          "Wrote integration tests for the tracking webhooks.",
        ],
        stack: ["TypeScript", "React", "Node", "Redis"],
      }),
    ],
    sortOrder: 3,
    published: true,
  },
  {
    id: 9002,
    name: "Kestrel Studio",
    span: "2022",
    location: "Kathmandu",
    siteUrl: null,
    siteLabel: null,
    summary: "Freelance work for a small design studio. Hidden, to test how the admin shows unpublished companies.",
    stack: ["Django", "PostgreSQL"],
    roles: [role({ title: "Freelance Developer", period: "Mar 2022 - Aug 2022", duration: "6 mo", points: ["Built a small CMS for client galleries."], stack: ["Django"] })],
    sortOrder: 4,
    published: false,
  },
];

const sampleProjects = [
  { id: 9001, companyId: 9001, title: "Shipment tracking dashboard", summary: "Live map and timeline of every shipment, fed by carrier webhooks.", tags: ["React", "TypeScript"], liveUrl: "https://track.example.com", linkLabel: "Demo", repoUrl: null, status: null, sortOrder: 1, published: true },
  { id: 9002, companyId: 9001, title: "Carrier API rate-limit proxy", summary: "Keeps calls under each carrier's quota and queues the overflow.", tags: ["Node", "Redis"], liveUrl: null, linkLabel: null, repoUrl: null, status: null, sortOrder: 2, published: true },
  { id: 9003, companyId: 9002, title: "Gallery CMS", summary: "Upload, tag and publish photo sets for studio clients.", tags: ["Django"], liveUrl: null, linkLabel: null, repoUrl: null, status: null, sortOrder: 1, published: true },
  { id: 9004, companyId: null, title: "Markdown to PDF CLI", summary: "Turns a folder of notes into one printable PDF with a table of contents.", tags: ["Python", "WeasyPrint"], liveUrl: null, linkLabel: null, repoUrl: "https://git.example.com/md2pdf", status: "Not deployed", sortOrder: 12, published: true },
  { id: 9005, companyId: null, title: "Weather bot", summary: "Half-built chat bot that posts the Kathmandu forecast each morning.", tags: ["Python"], liveUrl: null, linkLabel: null, repoUrl: null, status: "Work in progress", sortOrder: 13, published: false },
];

const sampleMessages = [
  { id: 9001, name: "Alex Morgan", email: "alex.morgan@example.com", read: false, createdAt: new Date(Date.now() - 3_600_000), body: "Hi Grishma,\n\nI'm hiring for a backend role on a small platform team and your posts on queues caught my eye.\n\nWould you be open to a short call next week?\n\nThanks,\nAlex" },
  { id: 9002, name: "Priya Sharma", email: "priya@example.org", read: false, createdAt: daysAgo(2), body: "Loved the Aho-Corasick write-up. Did you benchmark it against a compiled regex on real documents? Curious where the crossover point is." },
  { id: 9003, name: "Tom Becker", email: "tom.becker@example.net", read: true, createdAt: daysAgo(10), body: "Quick question on the BullMQ post: do you clear the processed-keys table ever, or let it grow?" },
  { id: 9004, name: "Sam", email: "sam@example.com", read: true, createdAt: daysAgo(30), body: "Small thing in the regex section: \"when patterns number in the thousands\" reads oddly. Maybe \"when there are thousands of patterns\"?" },
  { id: 9005, name: "Long Message Tester", email: "long@example.com", read: false, createdAt: daysAgo(5), body: "This one is long on purpose, to check wrapping in the inbox.\n\n" + "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ".repeat(6) + "\n\nAnd a very long unbroken token: " + "a".repeat(120) },
];

async function removeSamples() {
  await db.delete(projects).where(gte(projects.id, FIRST_ID));
  await db.delete(companies).where(gte(companies.id, FIRST_ID));
  await db.delete(posts).where(gte(posts.id, FIRST_ID));
  await db.delete(messages).where(gte(messages.id, FIRST_ID));
  await db.delete(media).where(like(media.id, "sample%"));
}

async function main() {
  await removeSamples();
  if (process.argv.includes("--remove")) {
    console.log("Sample data removed.");
    return;
  }

  const bytes = readFileSync("public/video/prithvi-highway-poster.webp");
  const contentType = sniffImageType(bytes);
  if (!contentType) throw new Error("sample image is not a supported type");
  await db.insert(media).values({ id: IMAGE_ID, contentType, size: bytes.length, data: bytes.toString("base64") });

  await db.insert(posts).values(samplePosts.map((p) => ({ ...p, createdAt: p.updatedAt })));
  await db.insert(companies).values(sampleCompanies);
  await db.insert(projects).values(sampleProjects);
  await db.insert(messages).values(sampleMessages);

  console.log(
    `Sample data loaded: ${samplePosts.length} posts, ${sampleCompanies.length} companies, ` +
      `${sampleProjects.length} projects, ${sampleMessages.length} messages, 1 image. Remove with: npm run db:sample -- --remove`,
  );
}

main();
