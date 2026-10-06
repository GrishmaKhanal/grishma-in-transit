import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { escapeAttr, safeUrl } from "../src/lib/html-attr";

test("escapeAttr escapes everything that can end or open an attribute", () => {
  assert.equal(escapeAttr(`a" onerror="x' <b>&`), "a&quot; onerror=&quot;x&#39; &lt;b&gt;&amp;");
});

test("safeUrl keeps safe and relative URLs", () => {
  for (const u of ["https://x.dev/a?b=1", "http://x.dev", "/blog/a", "#top", "./a.png", "a.html", "?q=1", "mailto:a@b.c", "tel:+977"]) {
    assert.equal(safeUrl(u), u, u);
  }
  assert.equal(safeUrl("https://x.dev/a.png", "image"), "https://x.dev/a.png");
  assert.equal(safeUrl("/media/abc", "image"), "/media/abc");
});

test("safeUrl blocks script and data schemes, however they're spelled", () => {
  for (const u of ["javascript:alert(1)", "JavaScript:alert(1)", " javascript:alert(1)", "java\tscript:alert(1)", "vbscript:x", "data:text/html,<b>"]) {
    assert.equal(safeUrl(u), "#", JSON.stringify(u));
  }
  assert.equal(safeUrl("data:image/svg+xml,<svg/onload=alert(1)>", "image"), "#");
  assert.equal(safeUrl("mailto:a@b.c", "image"), "#");
});

// markdown.ts imports "server-only", which only loads under the react-server condition.
test("renderMarkdown escapes link and image attributes end to end", () => {
  const src = `[a](javascript:alert(1) "t\\"x") ![q" onerror="alert(1)](https://x.dev/i.png "t") [ok](https://x.dev)`;
  const code = `import("./src/lib/markdown.ts").then(async (m) => console.log((await m.renderMarkdown(${JSON.stringify(src)})).html))`;
  const r = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "-e", code], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const html = r.stdout;
  assert.doesNotMatch(html, /javascript:/);
  assert.doesNotMatch(html, /" onerror="/);
  assert.match(html, /<a href="#" title="t&quot;x">a<\/a>/);
  assert.match(html, /alt="q&quot; onerror=&quot;alert\(1\)"/);
  assert.match(html, /<a href="https:\/\/x.dev" target="_blank" rel="noopener noreferrer">ok<\/a>/);
});
