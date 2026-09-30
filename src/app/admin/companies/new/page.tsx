import { ADMIN } from "@/lib/admin-path";
import { CompanyForm } from "../../_components/forms";
import { PageHeader } from "../../_components/ui";
import { guard } from "../../_lib";
import { DbNotice } from "../../_nodb";

export default async function NewCompany() {
  await guard();
  return (
    <>
      <DbNotice />
      <PageHeader back={["Companies", `${ADMIN}/companies`]}>New company</PageHeader>
      <CompanyForm />
    </>
  );
}
