import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, hasDb } from "@/db";
import { posts } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { deletePost } from "../../actions";
import { ConfirmDelete } from "../../_components/fields";
import { PostForm } from "../../_components/forms";
import { PageHeader } from "../../_components/ui";
import { guard } from "../../_lib";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

export default async function EditPost({ params, searchParams }: Props) {
  await guard();
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  if (!hasDb) notFound();
  const post = await db.query.posts.findFirst({ where: eq(posts.id, Number(id)) });
  if (!post) notFound();
  return (
    <>
      <PageHeader back={["Posts", `${ADMIN}/posts`]} actions={
          <ConfirmDelete
            action={deletePost}
            id={post.id}
            title="Delete this post?"
            description={post.published ? "It's live: its URL will start returning 404. This can't be undone." : "This can't be undone."}
          />
        }>
        Edit post
      </PageHeader>
      <PostForm post={post} created={created === "1"} />
    </>
  );
}
