import { CompanyForm } from "../../_components/forms";
import { guard } from "../../_lib";
import { DbNotice } from "../../_nodb";

export default async function NewCompany() {
  await guard();
  return (
    <>
      <DbNotice />
      <h1 className="mb-6 font-serif text-[40px] leading-none font-bold tracking-[-.02em]">New company</h1>
      <CompanyForm />
    </>
  );
}
