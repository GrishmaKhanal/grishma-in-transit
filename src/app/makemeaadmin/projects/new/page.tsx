import { asc } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { companies } from "@/db/schema";
import { ProjectForm } from "../../_components/forms";
import { guard } from "../../_lib";
import { DbNotice } from "../../_nodb";

export default async function NewProject() {
  await guard();
  const cos = hasDb ? await db.select({ id: companies.id, name: companies.name }).from(companies).orderBy(asc(companies.sortOrder)) : [];
  return (
    <>
      <DbNotice />
      <h1 className="mb-6 font-serif text-[40px] leading-none font-bold tracking-[-.02em]">New project</h1>
      <ProjectForm companies={cos} />
    </>
  );
}
