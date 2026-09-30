import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, hasDb } from "@/db";
import { companies, projects } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { deleteProject } from "../../actions";
import { ConfirmDelete } from "../../_components/fields";
import { ProjectForm } from "../../_components/forms";
import { PageHeader } from "../../_components/ui";
import { guard } from "../../_lib";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

export default async function EditProject({ params, searchParams }: Props) {
  await guard();
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  if (!hasDb) notFound();
  const [project, cos] = await Promise.all([
    db.query.projects.findFirst({ where: eq(projects.id, Number(id)) }),
    db.select({ id: companies.id, name: companies.name }).from(companies).orderBy(asc(companies.sortOrder)),
  ]);
  if (!project) notFound();
  return (
    <>
      <PageHeader back={["Projects", `${ADMIN}/projects`]} actions={<ConfirmDelete action={deleteProject} id={project.id} title="Delete this project?" />}>
        Edit project
      </PageHeader>
      <ProjectForm project={project} companies={cos} created={created === "1"} />
    </>
  );
}
