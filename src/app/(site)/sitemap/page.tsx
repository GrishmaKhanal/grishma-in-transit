import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, SectionLabel } from "@/components/chrome";
import { getPublishedPosts, getWork } from "@/lib/data";
import { postNo } from "@/lib/format";
import { postPath } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Every page on this site.",
  alternates: { canonical: "/sitemap" },
};

export default async function SitemapPage() {
  const [posts, work] = await Promise.all([getPublishedPosts(), getWork()]);
  const pages = [
    ["Home", "/"],
    ["Writing", "/blog"],
    ["Work", "/work"],
    ["About", "/about"],
    ["Contact", "/contact"],
  ];
  return (
    <div className="wrap pb-16">
      <PageIntro title="Sitemap" intro="Every page on the site. Machine-readable versions: sitemap.xml and the RSS feed." />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-14 gap-y-12">
        <section>
          <SectionLabel>Pages</SectionLabel>
          {pages.map(([label, href]) => (
            <Link key={href} href={href} className="block border-b border-rule py-3 font-serif text-[17px]">
              {label}
            </Link>
          ))}
          <a href="/sitemap.xml" className="block border-b border-rule py-3 font-mono text-sm text-ink-4">sitemap.xml</a>
          <a href="/blog/rss.xml" className="block border-b border-rule py-3 font-mono text-sm text-ink-4">rss.xml</a>
        </section>
        <section>
          <SectionLabel>Writing</SectionLabel>
          {posts.map((p) => (
            <Link key={p.id} href={postPath(p)} className="flex gap-4 border-b border-rule py-3 font-serif text-[17px] leading-[1.35]">
              <span className="w-9 flex-none text-[15px] text-accent">{postNo(p)}</span>
              <span>{p.title}</span>
            </Link>
          ))}
          {!posts.length && <p className="py-3 font-serif text-ink-5">Nothing yet.</p>}
        </section>
        <section>
          <SectionLabel>Work</SectionLabel>
          {work.companies.map((c) => (
            <Link key={c.id} href="/work" className="block border-b border-rule py-3 font-serif text-[17px]">
              {c.name}
            </Link>
          ))}
          <Link href="/work" className="block border-b border-rule py-3 font-serif text-[17px]">
            Tinkering
          </Link>
        </section>
      </div>
    </div>
  );
}
