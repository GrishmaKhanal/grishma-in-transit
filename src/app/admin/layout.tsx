import type { Metadata } from "next";
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { messages } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { ADMIN } from "@/lib/admin-path";
import { AdminNav, LogoutButton } from "./_components/nav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();
  const unread =
    authed && hasDb
      ? (await db.select({ n: count() }).from(messages).where(eq(messages.read, false)))[0].n
      : 0;

  return (
    <div className="min-h-screen bg-paper text-ink">
      {authed && (
        <header className="border-b border-ink">
          <div className="flex flex-wrap xl:flex-nowrap">
            <Link
              href={ADMIN}
              className="flex min-h-[56px] w-[64px] flex-none items-center justify-center bg-ink font-serif text-lg font-extrabold text-paper hover:text-paper xl:min-h-[64px] xl:w-[72px]"
            >
              GK
            </Link>
            <div className="flex flex-1 flex-col justify-center px-4 py-2 xl:flex-none xl:px-5">
              <span className="font-serif text-lg font-extrabold tracking-[-.015em]">Admin</span>
              <span className="font-mono text-[11px] text-ink-4">Content manager</span>
            </div>
            <AdminNav unread={unread} base={ADMIN} />
            <div className="flex items-stretch border-l border-ink text-[13px] font-medium">
              <Link href="/" target="_blank" className="flex items-center px-4">
                View site ↗
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-6xl px-[clamp(16px,4vw,40px)] py-6 sm:py-10">{children}</main>
    </div>
  );
}
