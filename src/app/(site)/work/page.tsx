import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { PageIntro, SectionLabel } from "@/components/chrome";
import { getSettings, getWork } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: "Work", description: s.workIntro, alternates: { canonical: "/work" } };
}

export default async function Work() {
  const [s, { companies, side }] = await Promise.all([getSettings(), getWork()]);
  return (
    <div className="wrap">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: s.name,
            url: SITE_URL,
            hasOccupation: companies.flatMap((c) =>
              c.roles.map((r) => ({ "@type": "Occupation", name: r.title, skills: r.stack.join(", ") })),
            ),
          },
        }}
      />
      <PageIntro title="Work" intro={s.workIntro} />

      {companies.map((c) => (
        <section
          key={c.id}
          className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-x-14 gap-y-6 border-t border-ink pt-7 pb-14"
        >
          <div>
            <h2 className="m-0 font-serif text-[34px] leading-[1.1] font-bold tracking-[-.01em]">{c.name}</h2>
            <div className="mt-2.5 text-[13px] text-ink-4">
              {c.span}
              {c.location && ` · ${c.location}`}
            </div>
            {c.siteUrl && (
              <a href={c.siteUrl} target="_blank" rel="noopener" className="mt-3.5 inline-block border-b border-ink pb-0.5 text-[13px] font-medium">
                {c.siteLabel || c.siteUrl.replace(/^https?:\/\//, "")} ↗
              </a>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-8 md:col-span-2">
            {c.roles.map((r) => (
              <div key={r.title + r.period}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="m-0 font-serif text-[22px] font-semibold text-accent">{r.title}</h3>
                  <span className="font-mono text-xs text-ink-4">
                    {r.period}
                    {r.duration && ` · ${r.duration}`}
                  </span>
                </div>
                <ul className="mt-3 mb-0 flex list-disc flex-col gap-1.5 pl-[18px] font-serif text-[17px] leading-[1.6] text-ink-2">
                  {r.points.map((pt) => (
                    <li key={pt} className="pretty">
                      {pt}
                    </li>
                  ))}
                </ul>
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {r.stack.map((t) => (
                    <span key={t} className="rounded-full border border-rule px-[9px] py-1 font-mono text-[11.5px] text-ink-4">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {c.projects.length > 0 && (
              <div>
                <SectionLabel>Projects here</SectionLabel>
                {c.projects.map((p) => (
                  <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1.5 border-b border-rule-soft py-3.5">
                    <div>
                      <h4 className="m-0 font-serif text-[19px] font-semibold">{p.title}</h4>
                      <div className="mt-1 text-sm leading-[1.55] text-ink-4">{p.summary}</div>
                    </div>
                    <div className="text-right font-mono text-xs text-ink-5">
                      {p.liveUrl ? (
                        <a href={p.liveUrl} target="_blank" rel="noopener" className="text-accent">
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
          </div>
        </section>
      ))}

      {side.length > 0 && (
        <section className="border-t border-ink pt-7 pb-16">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="m-0 font-serif text-[34px] leading-[1.1] font-bold">Tinkering</h2>
            <span className="font-serif text-base text-ink-5">{s.tinkeringIntro}</span>
          </div>
          <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-10">
            {side.map((p) => (
              <div key={p.id} className="flex flex-col gap-2 border-t border-rule pt-[18px] pb-6">
                <h3 className="m-0 font-serif text-xl font-semibold">{p.title}</h3>
                <div className="pretty text-[14.5px] leading-[1.55] text-ink-4">{p.summary}</div>
                <div className="mt-1 flex justify-between gap-3 font-mono text-xs text-ink-5">
                  <span>{p.tags.join(" · ")}</span>
                  <span className="flex gap-3">
                    {p.liveUrl && (
                      <a href={p.liveUrl} target="_blank" rel="noopener" className="text-accent">
                        {p.linkLabel || "Live"} ↗
                      </a>
                    )}
                    {p.repoUrl && (
                      <a href={p.repoUrl} target="_blank" rel="noopener" className="text-accent">
                        Code ↗
                      </a>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
