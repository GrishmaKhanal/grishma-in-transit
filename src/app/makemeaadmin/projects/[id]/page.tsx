import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, hasDb } from "@/db";
import { companies, projects } from "@/db/schema";
import { deleteProject } from "../../actions";
import { ConfirmDelete } from "../../_components/fields";
import { ProjectForm } from "../../_components/forms";
import { guard } from "../../_lib";

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  await guard();
  const { id } = await params;
  if (!hasDb) notFound();
  const [project, cos] = await Promise.all([
    db.query.projects.findFirst({ where: eq(projects.id, Number(id)) }),
    db.select({ id: companies.id, name: companies.name }).from(companies).orderBy(asc(companies.sortOrder)),
  ]);
  if (!project) notFound();
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-[40px] leading-none font-bold tracking-[-.02em]">Edit project</h1>
        <ConfirmDelete action={deleteProject} id={project.id} />
      </div>
      <ProjectForm project={project} companies={cos} />
    </>
  );
}
