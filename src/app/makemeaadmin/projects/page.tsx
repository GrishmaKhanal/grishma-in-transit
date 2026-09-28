import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { companies, projects } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";

export default async function ProjectsAdmin() {
  await guard();
  const [rows, cos] = hasDb
    ? await Promise.all([
        db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.id)),
        db.select({ id: companies.id, name: companies.name }).from(companies),
      ])
    : [[], []];
  const coName = new Map(cos.map((c) => [c.id, c.name]));
  return (
    <>
      <DbNotice />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-[40px] leading-none font-bold tracking-[-.02em]">Projects</h1>
        <Link href={`${ADMIN}/projects/new`} className=" bg-ink px-4 py-2 text-sm text-paper hover:text-paper">
          New project
        </Link>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-ink-5">
          <tr><th className="py-2">Name</th><th>Appears under</th><th>Status</th><th>Order</th></tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-rule">
              <td className="py-2"><Link href={`${ADMIN}/projects/${p.id}`} className="font-medium hover:underline">{p.title}</Link></td>
              <td>{p.companyId ? coName.get(p.companyId) : "Tinkering"}</td>
              <td>{p.published ? "Published" : "Hidden"}</td>
              <td>{p.sortOrder}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={4} className="py-6 text-ink-5">No projects yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
