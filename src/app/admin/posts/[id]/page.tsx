import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, hasDb } from "@/db";
import { posts } from "@/db/schema";
import { deletePost } from "../../actions";
import { ConfirmDelete } from "../../_components/fields";
import { PostForm } from "../../_components/forms";
import { guard } from "../../_lib";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  await guard();
  const { id } = await params;
  if (!hasDb) notFound();
  const post = await db.query.posts.findFirst({ where: eq(posts.id, Number(id)) });
  if (!post) notFound();
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-[40px] leading-none font-bold tracking-[-.02em]">Edit post</h1>
        <ConfirmDelete action={deletePost} id={post.id} />
      </div>
      <PostForm post={post} />
    </>
  );
}
