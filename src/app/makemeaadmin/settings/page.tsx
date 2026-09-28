import { eq } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { settings } from "@/db/schema";
import { seedSettings } from "@/content/seed";
import { SettingsForm } from "../_components/forms";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";

export default async function SettingsAdmin() {
  await guard();
  const row = hasDb ? await db.query.settings.findFirst({ where: eq(settings.key, "site") }) : null;
  return (
    <>
      <DbNotice />
      <h1 className="mb-6 font-serif text-[40px] leading-none font-bold tracking-[-.02em]">Site content &amp; contact</h1>
      <SettingsForm s={{ ...seedSettings, ...(row?.value ?? {}) }} />
    </>
  );
}
