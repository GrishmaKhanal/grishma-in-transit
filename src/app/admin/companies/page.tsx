import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { companies, projects } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";
import { PageHeader, StatusPill, newBtn } from "../_components/ui";

export default async function CompaniesAdmin() {
  await guard();
  const [rows, ps] = hasDb
    ? await Promise.all([
        db.select().from(companies).orderBy(asc(companies.sortOrder), asc(companies.id)),
        db.select({ companyId: projects.companyId }).from(projects),
      ])
    : [[], []];
  const projectCount = (id: number) => ps.filter((p) => p.companyId === id).length;
  return (
    <>
      <DbNotice />
      <PageHeader actions={<Link href={`${ADMIN}/companies/new`} className={newBtn}>New company</Link>}>Companies</PageHeader>
      <p className="mb-4 text-sm text-ink-5">Shown on the home page work band and /work, lowest sort order first.</p>
      <div className="border-t border-ink">
        {rows.map((c) => (
          <div key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 border-b border-rule py-3 sm:grid-cols-[minmax(0,1fr)_180px_auto_auto]">
            <Link href={`${ADMIN}/companies/${c.id}`} className="group min-w-0">
              <div className="truncate font-medium group-hover:underline">{c.name}</div>
              <div className="truncate text-xs text-ink-5">{c.span}</div>
            </Link>
            <span className="hidden font-mono text-xs text-ink-5 sm:block">
              {c.roles.length} role{c.roles.length === 1 ? "" : "s"} ·{" "}
              <Link href={`${ADMIN}/projects`} className="hover:underline">
                {projectCount(c.id)} project{projectCount(c.id) === 1 ? "" : "s"}
              </Link>
            </span>
            <StatusPill live={c.published} off="Hidden" />
            <span className="hidden font-mono text-xs text-ink-5 sm:block" title="Sort order">
              #{c.sortOrder}
            </span>
          </div>
        ))}
        {!rows.length && <p className="py-6 text-sm text-ink-5">No companies yet.</p>}
      </div>
    </>
  );
}
