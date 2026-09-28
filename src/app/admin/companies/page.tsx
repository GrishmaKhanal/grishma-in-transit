import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { companies } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";

export default async function CompaniesAdmin() {
  await guard();
  const rows = hasDb ? await db.select().from(companies).orderBy(asc(companies.sortOrder), asc(companies.id)) : [];
  return (
    <>
      <DbNotice />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-[40px] leading-none font-bold tracking-[-.02em]">Companies</h1>
        <Link href={`${ADMIN}/companies/new`} className=" bg-ink px-4 py-2 text-sm text-paper hover:text-paper">
          New company
        </Link>
      </div>
      <p className="mb-4 text-sm text-ink-5">Shown on the home page work band and /work. Add projects to a company from Projects.</p>
      <table className="w-full text-left text-sm">
        <thead className="text-ink-5">
          <tr><th className="py-2">Company</th><th>Span</th><th>Roles</th><th>Status</th><th>Order</th></tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-t border-rule">
              <td className="py-2"><Link href={`${ADMIN}/companies/${c.id}`} className="font-medium hover:underline">{c.name}</Link></td>
              <td>{c.span}</td>
              <td>{c.roles.length}</td>
              <td>{c.published ? "Published" : "Hidden"}</td>
              <td>{c.sortOrder}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={5} className="py-6 text-ink-5">No companies yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
