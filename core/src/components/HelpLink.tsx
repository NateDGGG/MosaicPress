"use client";

// A link that opens the in-app help in a small popup window, optionally deep-
// linked to a section anchor. Falls back to a normal new tab if popups are blocked.
export function openHelp(id?: string) {
  if (typeof window === "undefined") return;
  const url = "/admin/help" + (id ? `#${id}` : "");
  window.open(url, "mosaic-help", "popup=yes,width=560,height=720,scrollbars=yes,resizable=yes");
}

export default function HelpLink({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={"/admin/help" + (id ? `#${id}` : "")}
      target="mosaic-help"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openHelp(id); }}
      className={className || "text-xs font-medium text-brand hover:underline"}
    >
      {children || "Help ↗"}
    </a>
  );
}
