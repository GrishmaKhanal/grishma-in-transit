// Helpers for building HTML attributes from markdown input by hand. The admin is the
// only author today, but pasted markdown shouldn't be able to break out of an
// attribute or run script through a javascript: link.

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escape a value for use inside a double-quoted HTML attribute. */
export const escapeAttr = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

/**
 * The URL if its scheme is allowed, else "#". Relative URLs (/x, #x, ./x, x.html,
 * ?q) have no scheme and pass. Images get http(s) only; links also mailto: and tel:.
 */
export function safeUrl(href: string, kind: "link" | "image" = "link"): string {
  // Browsers ignore control characters and whitespace inside a scheme ("java\tscript:").
  const probe = href.replace(/[\u0000- \u007f]/g, "");
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(probe)?.[1].toLowerCase();
  if (!scheme) return href;
  const allowed = kind === "image" ? ["http", "https"] : ["http", "https", "mailto", "tel"];
  return allowed.includes(scheme) ? href : "#";
}
