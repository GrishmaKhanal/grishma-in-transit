import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { companies, projects } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";
import { PageHeader, StatusPill, newBtn } from "../_components/ui";

export default async function ProjectsAdmin() {
  await guard();
  const [rows, cos] = hasDb
    ? await Promise.all([
        db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.id)),
        db.select({ id: companies.id, name: companies.name, published: companies.published }).from(companies).orderBy(asc(companies.sortOrder), asc(companies.id)),
      ])
    : [[], []];
  // Grouped the way the site shows them: under each company, then Tinkering.
  const groups = [
    ...cos.map((c) => ({ id: c.id, name: c.name, hidden: !c.published, items: rows.filter((p) => p.companyId === c.id) })),
    { id: null, name: "Tinkering", hidden: false, items: rows.filter((p) => p.companyId === null) },
  ];
  return (
    <>
      <DbNotice />
      <PageHeader actions={<Link href={`${ADMIN}/projects/new`} className={newBtn}>New project</Link>}>Projects</PageHeader>
      <p className="mb-6 text-sm text-ink-5">Within each group, lower sort order comes first.</p>
      <div className="space-y-10">
        {groups.map((g) => (
          <section key={g.id ?? "side"}>
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink pb-2">
              <h2 className="eyebrow m-0 text-ink-4">
                {g.name}
                {g.hidden && <span className="ml-2 normal-case tracking-normal text-accent">(company hidden)</span>}
              </h2>
              <Link href={`${ADMIN}/projects/new${g.id ? `?company=${g.id}` : ""}`} className="text-sm underline">
                Add project here
              </Link>
            </div>
            {g.items.map((p) => (
              <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto_40px] items-center gap-x-6 border-b border-rule py-3">
                <Link href={`${ADMIN}/projects/${p.id}`} className="group min-w-0">
                  <div className="truncate font-medium group-hover:underline">{p.title}</div>
                  {p.tags.length > 0 && <div className="truncate font-mono text-xs text-ink-5">{p.tags.join(" · ")}</div>}
                </Link>
                <StatusPill live={p.published} off="Hidden" />
                <span className="text-right font-mono text-xs text-ink-5" title="Sort order">
                  #{p.sortOrder}
                </span>
              </div>
            ))}
            {!g.items.length && <p className="py-3 text-sm text-ink-5">No projects here yet.</p>}
          </section>
        ))}
      </div>
    </>
  );
}
