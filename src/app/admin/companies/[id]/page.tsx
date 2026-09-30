import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, hasDb } from "@/db";
import { companies } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { deleteCompany } from "../../actions";
import { ConfirmDelete } from "../../_components/fields";
import { CompanyForm } from "../../_components/forms";
import { PageHeader } from "../../_components/ui";
import { guard } from "../../_lib";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

export default async function EditCompany({ params, searchParams }: Props) {
  await guard();
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  if (!hasDb) notFound();
  const company = await db.query.companies.findFirst({ where: eq(companies.id, Number(id)) });
  if (!company) notFound();
  return (
    <>
      <PageHeader
        back={["Companies", `${ADMIN}/companies`]}
        actions={<ConfirmDelete action={deleteCompany} id={company.id} label="Delete company (its projects become hidden drafts)" />}
      >
        Edit company
      </PageHeader>
      <CompanyForm company={company} created={created === "1"} />
    </>
  );
}
