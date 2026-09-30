import { eq } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { settings } from "@/db/schema";
import { seedSettings } from "@/content/seed";
import { SettingsForm } from "../_components/forms";
import { PageHeader } from "../_components/ui";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";

export default async function SettingsAdmin() {
  await guard();
  const row = hasDb ? await db.query.settings.findFirst({ where: eq(settings.key, "site") }) : null;
  return (
    <>
      <DbNotice />
      <PageHeader>Site content &amp; contact</PageHeader>
      <SettingsForm s={{ ...seedSettings, ...(row?.value ?? {}) }} />
    </>
  );
}
