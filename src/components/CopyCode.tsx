"use client";

import { useEffect } from "react";

// Adds a copy button to each code block of the server-rendered article body. The markup
// stays static HTML; this only decorates it after hydration.
export function CopyCode() {
  useEffect(() => {
    const wraps = [...document.querySelectorAll<HTMLPreElement>(".article pre")].map((pre) => {
      const wrap = document.createElement("div");
      wrap.className = "code-wrap";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-code";
      button.textContent = "Copy";
      button.addEventListener("click", async () => {
        const code = pre.querySelector("code") ?? pre;
        try {
          await navigator.clipboard.writeText(code.textContent ?? "");
          button.textContent = "Copied";
        } catch {
          window.getSelection()?.selectAllChildren(code); // no clipboard access: select it instead
          button.textContent = "Selected";
        }
        setTimeout(() => (button.textContent = "Copy"), 1600);
      });
      pre.replaceWith(wrap);
      wrap.append(pre, button);
      return wrap;
    });
    return () => wraps.forEach((w) => w.replaceWith(w.firstChild!));
  }, []);
  return null;
}
