import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, hasDb } from "@/db";
import { companies } from "@/db/schema";
import { deleteCompany } from "../../actions";
import { ConfirmDelete } from "../../_components/fields";
import { CompanyForm } from "../../_components/forms";
import { guard } from "../../_lib";

export default async function EditCompany({ params }: { params: Promise<{ id: string }> }) {
  await guard();
  const { id } = await params;
  if (!hasDb) notFound();
  const company = await db.query.companies.findFirst({ where: eq(companies.id, Number(id)) });
  if (!company) notFound();
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-[40px] leading-none font-bold tracking-[-.02em]">Edit company</h1>
        <ConfirmDelete action={deleteCompany} id={company.id} label="Delete company (its projects become hidden drafts)" />
      </div>
      <CompanyForm company={company} />
    </>
  );
}
