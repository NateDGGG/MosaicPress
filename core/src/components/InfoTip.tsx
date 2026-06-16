"use client";

import { useId, useState } from "react";
import { openHelp } from "./HelpLink";

// Accessible help tooltip: a small "?" trigger that reveals an explanation on
// hover or keyboard focus (and tap, via click toggle). When `helpId` is set the
// tooltip also offers a "Learn more ↗" link that opens the in-app help popup at
// that section. The native `title` attribute is a no-JS fallback.
export default function InfoTip({
  text,
  helpId,
  className = "",
}: {
  text: string;
  helpId?: string;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    // Hover/focus handlers live on the wrapper so moving from the "?" to the
    // tooltip (e.g. to click "Learn more") doesn't dismiss it.
    <span
      className={`relative inline-flex align-middle ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="More information"
        aria-describedby={open ? id : undefined}
        title={text}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="grid h-4 w-4 place-items-center rounded-full border border-slate-300 text-[10px] font-bold leading-none text-slate-400 transition hover:border-brand hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 z-30 mb-2 w-60 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-left text-xs font-normal normal-case leading-snug text-white shadow-lg"
        >
          {text}
          {helpId && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openHelp(helpId); }}
              className="mt-1.5 block font-semibold text-sky-300 hover:underline"
            >
              Learn more ↗
            </button>
          )}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
}
