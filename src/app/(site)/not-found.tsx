import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap py-[clamp(56px,8vw,120px)]">
      <div className="eyebrow text-accent">404</div>
      <h1 className="mt-4 mb-0 font-serif text-[clamp(52px,7vw,80px)] leading-none font-bold tracking-[-.025em]">Not here.</h1>
      <p className="mt-6 max-w-[460px] font-serif text-lg leading-[1.6] text-ink-3">
        That page doesn&apos;t exist, or it moved. Try the{" "}
        <Link href="/blog" className="border-b border-ink">writing archive</Link> or the{" "}
        <Link href="/sitemap" className="border-b border-ink">sitemap</Link>.
      </p>
    </div>
  );
}
