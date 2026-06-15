"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type M = { id: string; name: string; email: string; subject: string | null; message: string; read: boolean; createdAt: string };

export default function MessageRow({ m }: { m: M }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(!m.read);

  async function setRead(read: boolean) {
    setBusy(true);
    await fetch("/api/contact", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: m.id, read }) });
    setBusy(false); router.refresh();
  }
  async function remove() {
    if (!confirm("Delete this message?")) return;
    setBusy(true);
    await fetch(`/api/contact?id=${m.id}`, { method: "DELETE" });
    setBusy(false); router.refresh();
  }

  return (
    <div className={`rounded-xl border bg-white p-4 ${m.read ? "border-slate-200" : "border-brand/40"}`}>
      <div className="flex items-center gap-2">
        {!m.read && <span className="h-2 w-2 rounded-full bg-brand" title="Unread" />}
        <button onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
          <span className="font-semibold text-slate-800">{m.name}</span>
          <span className="ml-2 text-sm text-slate-500">{m.email}</span>
          {m.subject && <span className="ml-2 text-sm text-slate-400">· {m.subject}</span>}
        </button>
        <span className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</span>
      </div>
      {open && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="whitespace-pre-line text-sm text-slate-700">{m.message}</p>
          <div className="mt-3 flex gap-3 text-sm">
            <a href={`mailto:${m.email}${m.subject ? `?subject=Re: ${encodeURIComponent(m.subject)}` : ""}`} className="font-medium text-brand hover:underline">Reply →</a>
            <button disabled={busy} onClick={() => setRead(!m.read)} className="text-slate-500 hover:underline disabled:opacity-50">{m.read ? "Mark unread" : "Mark read"}</button>
            <button disabled={busy} onClick={remove} className="text-red-600 hover:underline disabled:opacity-50">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
