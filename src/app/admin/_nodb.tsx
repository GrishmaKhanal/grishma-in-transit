import { hasDb } from "@/db";

export function DbNotice() {
  if (hasDb) return null;
  return (
    <p className="mb-6 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      No database connected (DATABASE_URL is not set). The public site is
      showing seed content and edits can’t be saved. See <code>docs/deploy/</code> to connect one.
    </p>
  );
}
