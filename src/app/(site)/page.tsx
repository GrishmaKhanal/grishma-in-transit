import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { HeroVideo } from "@/components/HeroVideo";
import { Sign } from "@/components/Sign";
import { SectionLabel } from "@/components/chrome";
import { getPublishedPosts, getSettings, getWork } from "@/lib/data";
import { postEyebrow, postNo } from "@/lib/format";
import { postPath } from "@/lib/site";
import { homeLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return pageMetadata(s, { description: s.seoDescription, path: "/" });
}

export default async function Home() {
  const [s, posts, work] = await Promise.all([getSettings(), getPublishedPosts(), getWork()]);
  const [latest] = posts;

  return (
    <>
      <JsonLd data={homeLd(s)} />

      {/* Below xl: text, then the full video. At xl the video fills the section and the text
          sits top-left over the sky, clear of the bus in the lower third. */}
      <section className="relative border-b border-ink xl:h-[min(56.25vw,calc(100svh-77px))] xl:min-h-[640px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] hidden bg-[radial-gradient(ellipse_62%_78%_at_0%_22%,rgb(241_240_236/.96)_0%,rgb(241_240_236/.9)_42%,rgb(241_240_236/0)_78%)] xl:block"
        />
        <div className="relative z-[2] mx-auto max-w-[1120px] px-[clamp(20px,5vw,56px)] pt-[clamp(56px,8vw,88px)] pb-14 xl:mx-0 xl:w-fit xl:max-w-none xl:pt-[clamp(56px,6.5vh,88px)] xl:pr-0 xl:pb-0 xl:pl-[108px]">
          <div className="max-w-[820px] xl:max-w-[680px]">
            <div className="text-xs font-semibold tracking-[.12em] text-accent uppercase">{s.heroEyebrow}</div>
            <h1 className="balance mt-4 mb-0 font-serif text-[clamp(40px,5.6vw,60px)] leading-[1.04] font-bold tracking-[-.025em] xl:text-[clamp(46px,3.4vw,60px)]">
              {s.heroHeadline}
            </h1>
            <p className="pretty mt-[22px] mb-0 max-w-[640px] font-serif text-[19px] leading-[1.55] text-ink-3">{s.heroIntro}</p>
            {s.langs.length > 0 && (
              <div className="mt-[26px] flex flex-wrap items-center gap-2">
                <span className="mr-1.5 text-[11px] font-medium tracking-[.12em] text-ink-4 uppercase">Mostly in</span>
                {s.langs.map((l) => (
                  <span key={l} className="border border-ink px-[11px] py-1.5 font-mono text-[13px] font-medium">
                    {l}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-[18px] text-[13px] font-medium">
              <Link href="/about" className="border-b border-ink pb-0.5">
                More about me
              </Link>
              {s.socials.map((x) => (
                <a key={x.url} href={x.url} rel="me noopener" target="_blank" className="text-ink-4">
                  {x.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
        <HeroVideo className="aspect-video border-t border-ink xl:absolute xl:inset-0 xl:z-0 xl:aspect-auto xl:border-t-0" />
      </section>

      <div className="wrap pt-16">
        <section className="max-w-[920px]" aria-labelledby="latest-writing">
          <SectionLabel strong right={<Link href="/blog">All writing →</Link>}>
            <span id="latest-writing">Latest writing</span>
          </SectionLabel>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-x-16 gap-y-10 pt-8 pb-20">
            {latest ? (
              <Link href={postPath(latest)} className="group block">
                <div className="font-serif text-[15px] text-accent">{postEyebrow(latest)}</div>
                <h2 className="balance mt-3 mb-0 font-serif text-[clamp(24px,2.3vw,28px)] leading-[1.2] font-bold tracking-[-.01em]">
                  {latest.title}
                </h2>
                {latest.excerpt && (
                  <p className="mt-4 mb-0 max-w-[520px] font-serif text-[17px] leading-[1.6] text-ink-3">{latest.excerpt}</p>
                )}
                <div className="mt-5 inline-block border-b border-ink pb-0.5 text-[13px] font-medium">Read the article</div>
              </Link>
            ) : (
              <p className="font-serif text-ink-5">First post coming soon.</p>
            )}
            <div className="border-l border-rule pl-8">
              <div className="eyebrow mb-2.5 text-ink-5">Index</div>
              {posts.slice(0, 8).map((p) => (
                <Link key={p.id} href={postPath(p)} className="flex gap-4 border-b border-rule py-3 font-serif text-[17px] leading-[1.35]">
                  <span className="w-9 flex-none font-serif text-[15px] text-accent">{postNo(p)}</span>
                  <span>{p.title}</span>
                </Link>
              ))}
              <div className="py-3 font-serif text-[15px] text-ink-5">New entries slot in on top.</div>
            </div>
          </div>
        </section>
      </div>

      {work.companies.length > 0 && (
        <section className="bg-night text-night-1" aria-label="Work">
          <div className="wrap pt-16 pb-[72px]">
            <div className="eyebrow flex items-baseline justify-between border-b border-night-rule pb-3.5 text-night-4">
              <span>{s.homeWorkLabel}</span>
              <Link href="/work" className="text-accent-light">
                Full history →
              </Link>
            </div>
            {work.companies.map((c) => (
              <details key={c.id} name="home-company" className="group border-b border-night-rule">
                <summary className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-x-10 gap-y-4 py-7">
                  <div>
                    <h3 className="m-0 font-serif text-[26px] leading-[1.15] font-bold">{c.name}</h3>
                    <div className="mt-2 text-[13px] text-night-4">{c.span}</div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {c.roles.map((r) => (
                      <div key={r.title + r.period} className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                        <span className="font-serif text-[19px] font-semibold text-accent-light">{r.title}</span>
                        <span className="font-mono text-xs text-night-4">{r.period}</span>
                      </div>
                    ))}
                    <p className="pretty mt-1.5 mb-0 font-serif text-base leading-[1.6] text-night-2">{c.summary}</p>
                  </div>
                  <div className="flex flex-col justify-between gap-3.5">
                    <div className="text-[13px] leading-[1.8] text-night-4">{c.stack.join(" · ")}</div>
                    {c.projects.length > 0 && (
                      <div className="flex items-center gap-2.5 font-mono text-xs font-medium text-night-1">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-night-6">
                          <Sign />
                        </span>
                        {c.projects.length} project{c.projects.length === 1 ? "" : "s"}
                      </div>
                    )}
                  </div>
                </summary>
                {c.projects.length > 0 && (
                  <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-3 pb-7">
                    {c.projects.map((p) => (
                      <div key={p.id} className="flex flex-col gap-2 border border-night-rule bg-night-card px-[22px] py-5">
                        <h4 className="m-0 font-serif text-xl leading-[1.2] font-semibold">{p.title}</h4>
                        <div className="pretty text-sm leading-[1.55] text-night-3">{p.summary}</div>
                        <div className="mt-auto flex justify-between gap-3 pt-2.5 font-mono text-xs text-night-5">
                          <span>{p.tags.join(" · ")}</span>
                          {p.liveUrl ? (
                            <a href={p.liveUrl} target="_blank" rel="noopener" className="text-accent-light">
                              {p.linkLabel || "Link"} ↗
                            </a>
                          ) : (
                            <span>Internal</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </details>
            ))}
          </div>
        </section>
      )}

      <div className="wrap grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-x-16 gap-y-12 pt-16 pb-4">
        {work.side.length > 0 && (
          <section aria-label="Tinkering">
            <SectionLabel>Tinkering</SectionLabel>
            {work.side.map((p) => (
              <details key={p.id} name="home-side" className="group border-b border-rule-soft">
                <summary className="flex justify-between gap-4 py-3 font-serif text-[17px]">
                  <span>
                    {p.title} <span className="text-ink-5">- {p.tags.join(" · ")}</span>
                  </span>
                  <span className="font-mono text-[13px] text-ink-5">
                    <Sign />
                  </span>
                </summary>
                <div className="flex flex-col gap-2.5 pb-4">
                  <p className="m-0 font-serif text-[15px] leading-[1.6] text-ink-3">{p.summary}</p>
                  <div className="flex gap-4 font-mono text-xs text-ink-5">
                    {p.status && <span>{p.status}</span>}
                    {p.repoUrl && (
                      <a href={p.repoUrl} target="_blank" rel="noopener" className="text-accent">
                        Code ↗
                      </a>
                    )}
                    {p.liveUrl && (
                      <a href={p.liveUrl} target="_blank" rel="noopener" className="text-accent">
                        {p.linkLabel || "Live"} ↗
                      </a>
                    )}
                  </div>
                </div>
              </details>
            ))}
          </section>
        )}
        {s.homeOffClock && (
          <section aria-label="Off the clock">
            <SectionLabel>Off the clock</SectionLabel>
            <p className="pretty mt-[18px] mb-0 font-serif text-[19px] leading-[1.55] text-ink-3">{s.homeOffClock}</p>
            <Link href="/about" className="mt-[18px] inline-block border-b border-ink pb-0.5 text-[13px] font-medium">
              The longer version
            </Link>
          </section>
        )}
      </div>
    </>
  );
}
