import "server-only";
import { Marked, type Tokens } from "marked";
import { codeToHtml } from "shiki";
import { escapeAttr, safeUrl } from "./html-attr";
import { slugify } from "./slug";

export type Heading = { id: string; text: string; depth: number };

/**
 * Render admin-authored markdown to HTML on the server. Raw HTML in the source is
 * passed through (the admin is trusted), but the attributes built here are escaped
 * and limited to safe URL schemes.
 * Code blocks are highlighted with shiki so no highlighting JS ships.
 */
export async function renderMarkdown(src: string) {
  const headings: Heading[] = [];
  const seen = new Map<string, number>();

  const marked = new Marked({
    async: true,
    gfm: true,
    async walkTokens(token) {
      if (token.type !== "code") return;
      const t = token as Tokens.Code & { html?: string };
      try {
        t.html = await codeToHtml(t.text, {
          lang: t.lang || "text",
          theme: "github-dark-default",
        });
      } catch {
        t.html = await codeToHtml(t.text, {
          lang: "text",
          theme: "github-dark-default",
        });
      }
    },
    renderer: {
      code(token) {
        return (token as Tokens.Code & { html?: string }).html ?? false;
      },
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const plain = text.replace(/<[^>]+>/g, "");
        let id = slugify(plain) || "section";
        const n = seen.get(id) ?? 0;
        seen.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        if (depth <= 3) headings.push({ id, text: plain, depth });
        return `<h${depth} id="${id}"><a href="#${id}" class="anchor">${text}</a></h${depth}>`;
      },
      image({ href, title, text }) {
        const t = title ? ` title="${escapeAttr(title)}"` : "";
        return `<img src="${escapeAttr(safeUrl(href, "image"))}" alt="${escapeAttr(text)}"${t} loading="lazy" decoding="async" />`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const url = safeUrl(href);
        const external = /^https?:\/\//.test(url);
        const t = title ? ` title="${escapeAttr(title)}"` : "";
        const rel = external ? ` target="_blank" rel="noopener noreferrer"` : "";
        return `<a href="${escapeAttr(url)}"${t}${rel}>${text}</a>`;
      },
    },
  });

  const html = await marked.parse(src);
  return { html, headings };
}

export { readingTime } from "./reading-time";
