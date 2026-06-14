"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: string;
  slug: string;
  title: string;
  type: string;
  source: string;
  status: string;
  sourceName?: string | null;
};

const TYPE_COLOR: Record<string, string> = {
  article: "bg-blue-100 text-blue-700",
  video: "bg-rose-100 text-rose-700",
  product: "bg-purple-100 text-purple-700",
  link: "bg-cyan-100 text-cyan-700",
};

export default function AdminItemRow({ item }: { item: Row }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(status: string) {
    setBusy(true);
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete "${item.title}"?`)) return;
    setBusy(true);
    await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50">
      <td className="px-3 py-2">
        <Link href={`/admin/items/${item.id}`} className="font-medium text-slate-800 hover:text-brand">
          {item.title}
        </Link>
      </td>
      <td className="px-3 py-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[item.type] || "bg-slate-100"}`}>
          {item.type}
        </span>
      </td>
      <td className="px-3 py-2 text-sm">
        {item.source === "hosted" ? (
          <span className="text-emerald-600">Hosted</span>
        ) : (
          <span className="text-slate-500">External · {item.sourceName || "link"}</span>
        )}
      </td>
      <td className="px-3 py-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            item.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {item.status}
        </span>
      </td>
      <td className="px-3 py-2 text-right text-sm">
        <div className="flex justify-end gap-2">
          <Link href={`/i/${item.slug}`} className="text-slate-500 hover:text-brand">View</Link>
          {item.status === "published" ? (
            <button disabled={busy} onClick={() => setStatus("draft")} className="text-amber-600 hover:underline disabled:opacity-50">
              Unpublish
            </button>
          ) : (
            <button disabled={busy} onClick={() => setStatus("published")} className="text-green-600 hover:underline disabled:opacity-50">
              Publish
            </button>
          )}
          <button disabled={busy} onClick={remove} className="text-red-600 hover:underline disabled:opacity-50">
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
