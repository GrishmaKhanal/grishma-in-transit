import { hasDb } from "@/db";

export function DbNotice() {
  if (hasDb) return null;
  return (
    <p className="mb-6 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      No database connected (DATABASE_URL missing). The public site is showing seed content and
      edits can’t be saved. Connect Neon in Vercel → Storage, then run <code>npm run db:push</code>.
    </p>
  );
}
