import { PostForm } from "../../_components/forms";
import { guard } from "../../_lib";
import { DbNotice } from "../../_nodb";

export default async function NewPost() {
  await guard();
  return (
    <>
      <DbNotice />
      <h1 className="mb-6 font-serif text-[40px] leading-none font-bold tracking-[-.02em]">New post</h1>
      <PostForm />
    </>
  );
}
