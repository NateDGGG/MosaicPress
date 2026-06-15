"use client";

import { useEffect } from "react";

// Injects an owner-provided analytics snippet (GA, Plausible, Fathom, etc.) into
// <head>, executing any <script> tags. Owner-only content (set in Settings).
export default function AnalyticsInjector({ snippet }: { snippet?: string }) {
  useEffect(() => {
    if (!snippet) return;
    const tmp = document.createElement("div");
    tmp.innerHTML = snippet;
    const added: Element[] = [];
    Array.from(tmp.childNodes).forEach((n) => {
      if (n.nodeType !== 1) return;
      const el = n as Element;
      if (el.tagName === "SCRIPT") {
        const sc = document.createElement("script");
        Array.from(el.attributes).forEach((a) => sc.setAttribute(a.name, a.value));
        sc.text = el.textContent || "";
        document.head.appendChild(sc);
        added.push(sc);
      } else {
        document.head.appendChild(el);
        added.push(el);
      }
    });
    return () => added.forEach((x) => x.remove());
  }, [snippet]);
  return null;
}
