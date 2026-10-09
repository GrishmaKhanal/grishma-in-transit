import type { Metadata } from "next";
import { SocialRows } from "@/components/SocialRows";
import { getSettings } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { ContactForm, LocalTime } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return pageMetadata(s, { title: "Contact", description: s.contactIntro, path: "/contact" });
}

export default async function Contact() {
  const s = await getSettings();
  return (
    <div className="wrap">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-x-[72px] gap-y-14 pt-[clamp(56px,8vw,88px)] pb-20">
        <div>
          <h1 className="m-0 font-serif text-[clamp(52px,7vw,80px)] leading-none font-bold tracking-[-.025em]">{s.contactHeading}</h1>
          <p className="pretty mt-6 mb-0 max-w-[460px] font-serif text-lg leading-[1.6] text-ink-3">{s.contactIntro}</p>
          {s.email && (
            <a
              href={`mailto:${s.email}`}
              className="mt-8 block border-b border-ink pb-2.5 font-serif text-[clamp(24px,3vw,34px)] leading-[1.2] font-bold tracking-[-.01em] break-all"
            >
              {s.email}
            </a>
          )}
          <div className="mt-6 flex flex-col">
            <SocialRows socials={s.socials} />
          </div>
          <div className="mt-6 flex items-center gap-2.5 text-[13px] text-ink-4">
            <span className="h-[7px] w-[7px] rounded-full bg-online" />
            {s.location} · <LocalTime timeZone={s.timezone} /> {s.tzLabel}
          </div>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
