import { Footer, Header } from "@/components/chrome";
import { getSettings } from "@/lib/data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:p-3">
        Skip to content
      </a>
      <Header s={s} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer s={s} />
    </div>
  );
}
