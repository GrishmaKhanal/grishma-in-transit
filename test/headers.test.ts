import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { securityHeaders } from "../next.config";

test("public/_headers repeats every security header from next.config.ts", () => {
  const lines = readFileSync("public/_headers", "utf8").split("\n");
  const parsed = new Map(
    lines.filter((l) => /^\s+\S+:/.test(l)).map((l) => {
      const i = l.indexOf(":");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()] as const;
    }),
  );
  for (const { key, value } of securityHeaders) assert.equal(parsed.get(key), value, key);
  assert.equal(parsed.size, securityHeaders.length, "no extra headers in public/_headers");
});
