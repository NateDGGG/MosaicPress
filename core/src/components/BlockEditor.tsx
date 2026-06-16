"use client";

import { useState } from "react";
import {
  BLOCK_LABELS, BLOCK_TYPES, emptyBlock, parseBlocks, type Block, type BlockType,
} from "../lib/blocks";
import RichTextField from "./RichTextField";

// A block-based article editor. Manages an array of blocks and reports changes
// back as a JSON string (the same shape BlockRenderer reads).
//
// Each block carries a stable internal `id` (not persisted) used as the React
// key. This is essential: the paragraph/quote fields are uncontrolled
// (contentEditable set once on mount), so keying by array index would leave
// their DOM content behind when blocks are reordered — making content appear to
// swap or vanish. Stable keys move the actual field instances with their block.
type Row = { id: string; block: Block };
const rid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

export default function BlockEditor({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (json: string) => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => parseBlocks(value).map((b) => ({ id: rid(), block: b })));

  function commit(next: Row[]) {
    setRows(next);
    onChange(JSON.stringify(next.map((r) => r.block)));
  }
  const update = (i: number, patch: Partial<Block>) =>
    commit(rows.map((r, idx) => (idx === i ? { ...r, block: { ...r.block, ...patch } as Block } : r)));
  const add = (type: BlockType) => commit([...rows, { id: rid(), block: emptyBlock(type) }]);
  const remove = (i: number) => commit(rows.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  async function uploadImage(i: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: fd });
    if (res.ok) update(i, { url: (await res.json()).media.url } as Partial<Block>);
  }

  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none";

  return (
    <div>
      <div className="space-y-3">
        {rows.map(({ id, block }, i) => (
          <div key={id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{BLOCK_LABELS[block.type]}</span>
              <div className="ml-auto flex items-center gap-1 text-slate-400">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 hover:text-brand disabled:opacity-30" title="Move up">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="px-1 hover:text-brand disabled:opacity-30" title="Move down">↓</button>
                <button type="button" onClick={() => remove(i)} className="px-1 hover:text-red-600" title="Delete">✕</button>
              </div>
            </div>

            {block.type === "heading" && (
              <div className="flex gap-2">
                <select value={block.level || 2} onChange={(e) => update(i, { level: Number(e.target.value) as 2 | 3 } as Partial<Block>)}
                  className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                </select>
                <input value={block.text} onChange={(e) => update(i, { text: e.target.value } as Partial<Block>)} placeholder="Heading text" className={field} />
              </div>
            )}

            {(block.type === "paragraph" || block.type === "quote") && (
              <RichTextField
                value={block.text}
                onChange={(html) => update(i, { text: html } as Partial<Block>)}
                placeholder={block.type === "quote" ? "Quote…" : "Write a paragraph… (select text to format)"}
              />
            )}

            {block.type === "code" && (
              <textarea value={block.text} onChange={(e) => update(i, { text: e.target.value } as Partial<Block>)} rows={4}
                placeholder="Code…" className={`${field} font-mono`} />
            )}

            {block.type === "list" && (
              <div>
                <label className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                  <input type="checkbox" checked={!!block.ordered} onChange={(e) => update(i, { ordered: e.target.checked } as Partial<Block>)} />
                  Numbered
                </label>
                <textarea
                  value={block.items.join("\n")}
                  onChange={(e) => update(i, { items: e.target.value.split("\n") } as Partial<Block>)}
                  rows={4} placeholder="One item per line" className={field}
                />
              </div>
            )}

            {block.type === "image" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={block.url} onChange={(e) => update(i, { url: e.target.value } as Partial<Block>)} placeholder="Image URL or upload →" className={field} />
                  <label className="cursor-pointer whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-white">
                    Upload
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(i, f); }} />
                  </label>
                </div>
                {block.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={block.url} alt="" className="max-h-40 rounded-lg object-cover" />
                )}
                <input value={block.caption || ""} onChange={(e) => update(i, { caption: e.target.value } as Partial<Block>)} placeholder="Caption (optional)" className={field} />
              </div>
            )}

            {block.type === "embed" && (
              <input value={block.url} onChange={(e) => update(i, { url: e.target.value } as Partial<Block>)} placeholder="YouTube/Vimeo URL" className={field} />
            )}

            {block.type === "divider" && <div className="border-t border-dashed border-slate-300" />}
          </div>
        ))}
        {rows.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">No blocks yet — add one below.</p>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {BLOCK_TYPES.map((t) => (
          <button key={t} type="button" onClick={() => add(t)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:border-brand hover:text-brand">
            + {BLOCK_LABELS[t]}
          </button>
        ))}
      </div>
    </div>
  );
}
