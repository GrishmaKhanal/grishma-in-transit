import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPost, getPublishedPosts, getSettings, type PostKind } from "@/lib/data";
import { readingTime, renderMarkdown } from "@/lib/markdown";
import { abs, postPath } from "@/lib/site";
import { WEBSITE_ID, pageMetadata, personRef } from "@/lib/seo";
import { CopyCode } from "./CopyCode";
import { JsonLd } from "./JsonLd";
import { postEyebrow } from "@/lib/format";

const section = { blog: ["Writing", "/blog"], note: ["Writing", "/blog"] } as const;

export async function articleParams(kind: PostKind) {
  const posts = await getPublishedPosts(kind);
  return posts.map((p) => ({ slug: p.slug }));
}

export async function articleMetadata(kind: PostKind, slug: string): Promise<Metadata> {
  const p = await getPublishedPost(kind, slug);
  if (!p) return { title: "Not found", robots: { index: false } };
  const s = await getSettings();
  const title = p.seoTitle || p.title;
  const description = p.seoDescription || p.excerpt || p.subtitle || undefined;
  return {
    ...pageMetadata(s, {
      title,
      description,
      path: postPath(p),
      // The post's own title on social cards, without the site name. The image
      // comes from the colocated opengraph-image.tsx.
      openGraph: {
        type: "article",
        title,
        publishedTime: p.publishedAt?.toISOString(),
        modifiedTime: p.updatedAt.toISOString(),
        authors: [s.name],
        tags: p.tags,
      },
      ownImage: true,
    }),
    keywords: p.tags,
  };
}

export async function Article({ kind, slug }: { kind: PostKind; slug: string }) {
  const p = await getPublishedPost(kind, slug);
  if (!p) notFound();
  const [s, { html }] = await Promise.all([getSettings(), renderMarkdown(p.content)]);
  const [sectionName, sectionPath] = section[kind];
  const url = abs(postPath(p));

  return (
    <article className="wrap">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: p.title,
            alternativeHeadline: p.subtitle ?? undefined,
            description: p.seoDescription || p.excerpt || undefined,
            image: [abs(p.coverImage || "/opengraph-image")],
            datePublished: p.publishedAt?.toISOString(),
            dateModified: p.updatedAt.toISOString(),
            keywords: p.tags.join(", "),
            wordCount: p.content.split(/\s+/).length,
            author: personRef(s),
            publisher: personRef(s),
            inLanguage: "en",
            isPartOf: { "@id": WEBSITE_ID },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            url,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
              { "@type": "ListItem", position: 2, name: sectionName, item: abs(sectionPath) },
              { "@type": "ListItem", position: 3, name: p.title, item: url },
            ],
          },
        ]}
      />
      <div className="mx-auto max-w-[720px] pt-[clamp(48px,7vw,80px)]">
        <Link href="/blog" className="text-[13px] font-medium text-ink-4">
          ← All writing
        </Link>
        <div className="mt-10 font-serif text-base text-accent">{postEyebrow(p)}</div>
        <h1 className="balance mt-3.5 mb-0 font-serif text-[clamp(40px,6vw,60px)] leading-[1.05] font-bold tracking-[-.02em]">
          {p.title}
        </h1>
        {(p.excerpt || p.subtitle) && (
          <p className="pretty mt-5 mb-0 font-serif text-[21px] leading-[1.5] text-ink-3">{p.excerpt || p.subtitle}</p>
        )}
        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-b border-t-ink border-b-rule py-3.5 font-mono text-xs text-ink-5">
          <span>{s.name}</span>
          {p.publishedAt && <time dateTime={p.publishedAt.toISOString()}>{fmtDate(p.publishedAt)}</time>}
          <span>{readingTime(p.content)} min read</span>
          {p.tags.length > 0 && <span>{p.tags.join(" · ")}</span>}
        </div>
        <div className="article pt-9" dangerouslySetInnerHTML={{ __html: html }} />
        <CopyCode />
        <div className="mt-16 grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-6 border-t border-ink pt-6 pb-14">
          <div>
            <div className="eyebrow text-ink-5">Written by</div>
            <div className="mt-2 font-serif text-[17px] leading-[1.5]">
              {s.name} - {s.role.toLowerCase()} in {s.location}.{" "}
              <Link href="/about" className="border-b border-ink">
                About
              </Link>
            </div>
          </div>
          <div>
            <div className="eyebrow text-ink-5">Reply</div>
            <div className="mt-2 font-serif text-[17px] leading-[1.5]">
              Spotted a mistake or have a better approach?{" "}
              <Link href="/contact" className="border-b border-ink">
                Tell me
              </Link>
              .
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";
