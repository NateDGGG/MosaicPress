"use client";

import { useEffect, useRef } from "react";

// Minimal WYSIWYG inline editor (bold / italic / link) built on contentEditable.
// Uncontrolled by design: we set the initial HTML once and only report changes
// out, so the caret never jumps on re-render.
export default function RichTextField({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && value != null) ref.current.innerHTML = value;
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML);
  }
  function exec(cmd: string, arg?: string) {
    ref.current?.focus();
    // execCommand is deprecated but universally supported and dependency-free.
    document.execCommand(cmd, false, arg);
    emit();
  }
  function addLink() {
    const url = window.prompt("Link URL (https://…)");
    if (url) exec("createLink", url);
  }

  const btn = "rounded px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-200";

  return (
    <div className="rounded-lg border border-slate-300 focus-within:border-brand">
      <div className="flex gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1">
        <button type="button" onClick={() => exec("bold")} className={`${btn} font-bold`} title="Bold">B</button>
        <button type="button" onClick={() => exec("italic")} className={`${btn} italic`} title="Italic">I</button>
        <button type="button" onClick={() => exec("underline")} className={`${btn} underline`} title="Underline">U</button>
        <button type="button" onClick={addLink} className={btn} title="Link">🔗</button>
        <button type="button" onClick={() => exec("removeFormat")} className={btn} title="Clear formatting">⨯</button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        className="rich-editable min-h-[5rem] px-3 py-2 text-sm leading-relaxed focus:outline-none"
        suppressContentEditableWarning
      />
    </div>
  );
}
