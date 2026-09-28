import type { Post } from "@/db/schema";
import { readingTime } from "./reading-time";

export const postNo = (p: Pick<Post, "number">) => (p.number != null ? String(p.number).padStart(3, "0") : "-");

/** "No. 001 - Python, Algorithms" */
export const postEyebrow = (p: Pick<Post, "number" | "tags">) =>
  [p.number != null ? `No. ${postNo(p)}` : null, p.tags.slice(0, 2).join(", ") || null]
    .filter(Boolean)
    .join(" - ");

export const readMin = (p: Pick<Post, "content">) => `${readingTime(p.content)} min`;
