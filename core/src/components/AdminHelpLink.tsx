"use client";

import { usePathname } from "next/navigation";
import HelpLink from "./HelpLink";

// A context-aware "Learn more ↗" link for the admin: it detects the current
// admin section from the URL and opens the in-app help popup at the matching
// section. Lives in the admin layout, so every admin page gets a help link.
const MAP: Array<{ test: (p: string) => boolean; id: string }> = [
  { test: (p) => p === "/admin", id: "manage-content" },
  { test: (p) => p.startsWith("/admin/presenters"), id: "presenters" },
  { test: (p) => p.startsWith("/admin/topics"), id: "manage-topics" },
  { test: (p) => p.startsWith("/admin/collections"), id: "collections" },
  { test: (p) => p.startsWith("/admin/media"), id: "media" },
  { test: (p) => p.startsWith("/admin/health"), id: "health" },
  { test: (p) => p.startsWith("/admin/orders"), id: "orders" },
  { test: (p) => p.startsWith("/admin/messages"), id: "messages" },
  { test: (p) => p.startsWith("/admin/subscribers"), id: "subscribers" },
  { test: (p) => p.startsWith("/admin/bookings"), id: "bookings" },
  { test: (p) => p.startsWith("/admin/testimonials"), id: "testimonials" },
  { test: (p) => p.startsWith("/admin/plans"), id: "plans" },
  { test: (p) => p.startsWith("/admin/about"), id: "about" },
  { test: (p) => p.startsWith("/admin/users"), id: "users" },
  { test: (p) => p.startsWith("/admin/settings"), id: "getting-started" },
  { test: (p) => /\/admin\/(new|new-blog|new-link|new-from-link|import-book|bulk-import|new-product)/.test(p), id: "add-content" },
  { test: (p) => p.startsWith("/admin/items"), id: "manage-content" },
];

export default function AdminHelpLink() {
  const pathname = usePathname() || "/admin";
  const id = (MAP.find((m) => m.test(pathname)) || { id: "getting-started" }).id;
  return (
    <HelpLink id={id} className="text-sm font-medium text-brand hover:underline">
      Learn more ↗
    </HelpLink>
  );
}
