import Link from "next/link";
import type { SiteSettings } from "@/db/schema";
import { Nav } from "./Nav";

export function Header({ s }: { s: SiteSettings }) {
  return (
    <header className="border-b border-ink">
      <div className="flex min-h-[76px] flex-wrap">
        <Link
          href="/"
          aria-label={`${s.name} — home`}
          className="flex min-h-[76px] w-[84px] flex-none items-center justify-center bg-ink font-serif text-[22px] font-extrabold tracking-[-.02em] text-paper hover:text-paper"
        >
          {s.monogram}
        </Link>
        <Link href="/" className="flex flex-[1_1_240px] flex-col justify-center px-6 py-3">
          <span className="font-serif text-[21px] font-extrabold tracking-[-.015em]">{s.name}</span>
          <span className="mt-1 font-mono text-xs text-ink-4">
            {s.role} · {s.location}
          </span>
        </Link>
        <Nav />
      </div>
    </header>
  );
}

export function Footer({ s }: { s: SiteSettings }) {
  return (
    <footer className="wrap box-border w-full pb-10">
      <div className="flex flex-wrap justify-between gap-4 border-t border-ink pt-5 text-[13px] text-ink-4">
        <span>
          © {new Date().getFullYear()} {s.name} · {s.location}
        </span>
        <div className="flex flex-wrap gap-5">
          <Link href="/blog">Writing</Link>
          <Link href="/work">Work</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/sitemap">Sitemap</Link>
          {s.socials.map((x) => (
            <a key={x.url} href={x.url} rel="me noopener" target="_blank">
              {x.label} ↗
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/** Rule-topped section label: "LATEST WRITING ........ ARCHIVE →" */
export function SectionLabel({ children, right, strong }: { children: React.ReactNode; right?: React.ReactNode; strong?: boolean }) {
  return (
    <div className={`eyebrow flex justify-between text-ink-4 ${strong ? "border-t-2 border-ink pt-3.5" : "border-b border-rule pb-3"}`}>
      <span>{children}</span>
      {right}
    </div>
  );
}

export function PageIntro({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-end gap-x-16 gap-y-8 pt-[clamp(56px,8vw,88px)] pb-14">
      <h1 className="m-0 font-serif text-[clamp(52px,7vw,80px)] leading-none font-bold tracking-[-.025em]">{title}</h1>
      <p className="pretty m-0 font-serif text-[17px] leading-[1.6] text-ink-3">{intro}</p>
    </div>
  );
}
