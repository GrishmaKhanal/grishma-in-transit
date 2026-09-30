import { asc } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { companies } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { ProjectForm } from "../../_components/forms";
import { PageHeader } from "../../_components/ui";
import { guard } from "../../_lib";
import { DbNotice } from "../../_nodb";

// ?company=<id> comes from "Add project here" on the projects list.
export default async function NewProject({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  await guard();
  const { company } = await searchParams;
  const cos = hasDb ? await db.select({ id: companies.id, name: companies.name }).from(companies).orderBy(asc(companies.sortOrder)) : [];
  return (
    <>
      <DbNotice />
      <PageHeader back={["Projects", `${ADMIN}/projects`]}>New project</PageHeader>
      <ProjectForm companies={cos} companyId={Number(company) || undefined} />
    </>
  );
}
