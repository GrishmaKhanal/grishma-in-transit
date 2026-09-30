import { ADMIN } from "@/lib/admin-path";
import { PostForm } from "../../_components/forms";
import { PageHeader } from "../../_components/ui";
import { guard } from "../../_lib";
import { DbNotice } from "../../_nodb";

export default async function NewPost() {
  await guard();
  return (
    <>
      <DbNotice />
      <PageHeader back={["Posts", `${ADMIN}/posts`]}>New post</PageHeader>
      <PostForm />
    </>
  );
}
