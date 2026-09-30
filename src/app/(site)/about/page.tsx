import type { Metadata } from "next";
import Image from "next/image";
import { SocialRows } from "@/components/SocialRows";
import { getSettings } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: "About",
    description: `${s.aboutHeading} ${s.aboutBody.split("\n")[0]}`.slice(0, 160),
    alternates: { canonical: "/about" },
    openGraph: { type: "profile" },
  };
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <h2 className="eyebrow m-0 border-b border-ink pb-3 text-ink-5">{children}</h2>
);

export default async function About() {
  const s = await getSettings();
  const { html } = await renderMarkdown(s.aboutBody);
  return (
    <div className="wrap">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-start gap-x-16 gap-y-10 pt-[clamp(56px,8vw,88px)] pb-16">
        {/* Without a portrait the column is left out, so the text takes the full width. */}
        {(s.aboutPhoto || s.aboutPhotoCaption) && (
          <div className="max-w-[420px]">
            {s.aboutPhoto && (
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-panel">
                <Image
                  src={s.aboutPhoto}
                  alt={`Portrait of ${s.name}`}
                  fill
                  sizes="(max-width: 720px) 100vw, 420px"
                  className="object-cover object-[50%_10%]"
                  preload
                />
              </div>
            )}
            {s.aboutPhotoCaption && <div className="mt-2.5 font-serif text-sm text-ink-5">{s.aboutPhotoCaption}</div>}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="m-0 font-serif text-[clamp(48px,6vw,72px)] leading-[1.02] font-bold tracking-[-.025em]">{s.aboutHeading}</h1>
          <div
            className="mt-7 flex max-w-[600px] flex-col gap-[18px] font-serif text-[19px] leading-[1.65] text-ink-body [&_a]:border-b [&_a]:border-ink [&_p]:m-0 [&_p]:text-pretty"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <div className="mt-9 flex max-w-[600px] flex-col border-t border-ink">
            <SocialRows socials={s.socials} email={s.email} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-14 gap-y-12 pb-[72px]">
        {(s.education.length > 0 || s.certificates.length > 0) && (
          <section>
            <Label>Education</Label>
            {s.education.map((e) => (
              <div key={e.k} className="border-b border-rule py-3">
                <div className="font-serif text-[17px] leading-[1.4]">{e.k}</div>
                <div className="mt-1 text-[13px] text-ink-4">{e.v}</div>
              </div>
            ))}
            {s.certificates.length > 0 && (
              <>
                <h3 className="eyebrow mt-7 mb-0 pb-1 text-ink-5">Certificates</h3>
                {s.certificates.map((c) => (
                  <div key={c} className="py-2 font-serif text-[15px] leading-[1.5] text-ink-2">
                    {c}
                  </div>
                ))}
              </>
            )}
          </section>
        )}
        {s.skills.length > 0 && (
          <section>
            <Label>What I reach for</Label>
            <dl className="m-0">
              {s.skills.map((g) => (
                <div key={g.k} className="grid grid-cols-[90px_1fr] gap-4 border-b border-rule py-3">
                  <dt className="font-mono text-xs leading-[1.9] text-ink-5">{g.k}</dt>
                  <dd className="m-0 font-serif text-base leading-[1.5]">{g.v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {s.offClock.length > 0 && (
        <section className="border-t border-ink pt-7 pb-[72px]">
          <h2 className="eyebrow m-0 text-ink-5">Off the clock</h2>
          <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-8">
            {s.offClock.map((o) => (
              <div key={o.k}>
                <h3 className="m-0 font-serif text-[26px] font-bold">{o.k}</h3>
                <p className="mt-2 mb-0 font-serif text-base leading-[1.6] text-ink-3">{o.v}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
