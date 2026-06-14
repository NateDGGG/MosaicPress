import Link from "next/link";
import { prisma } from "../../../lib/db";
import RunSyncButton from "../../../components/RunSyncButton";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  ok: "bg-green-100 text-green-700",
  stale: "bg-amber-100 text-amber-700",
  broken: "bg-red-100 text-red-700",
  paywalled: "bg-purple-100 text-purple-700",
};

export default async function HealthPage() {
  const items = await prisma.item.findMany({
    where: { source: "external" },
    include: { external: true },
    orderBy: { updatedAt: "desc" },
  });

  const counts = items.reduce<Record<string, number>>((acc, it) => {
    const s = it.external?.syncStatus || "ok";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Link health &amp; sync</h1>
        <RunSyncButton />
      </div>
      <p className="mb-5 text-sm text-slate-500">
        External content is re-checked for dead links, paywall changes, and price drift.
        Schedule <code className="rounded bg-slate-100 px-1">npm run sync</code> (e.g. hourly) for automatic runs.
      </p>

      <div className="mb-5 flex gap-2 text-xs">
        {["ok", "broken", "paywalled", "stale"].map((s) => (
          <span key={s} className={`rounded-full px-2 py-1 font-medium ${STATUS[s]}`}>
            {s}: {counts[s] || 0}
          </span>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Last checked</th>
              <th className="px-3 py-2">URL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <Link href={`/admin/items/${it.id}`} className="font-medium hover:text-brand">{it.title}</Link>
                </td>
                <td className="px-3 py-2 text-slate-500">{it.external?.sourceName || "—"}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[it.external?.syncStatus || "ok"]}`}>
                    {it.external?.syncStatus || "ok"}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-400">
                  {it.external?.lastSyncedAt ? new Date(it.external.lastSyncedAt).toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2 max-w-[16rem] truncate text-slate-400">
                  <a href={it.external?.url} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-brand">
                    {it.external?.url}
                  </a>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">No external content to monitor.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
