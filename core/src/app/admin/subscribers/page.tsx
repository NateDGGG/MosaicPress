import { redirect } from "next/navigation";
import { getSessionUser, hasRole } from "../../../lib/auth";
import { listSubscribers, subscriberCounts } from "../../../lib/newsletter";
import SubscriberRow from "../../../components/SubscriberRow";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const me = getSessionUser();
  if (!hasRole(me, "editor")) redirect("/admin");
  const [subs, counts] = await Promise.all([listSubscribers(), subscriberCounts()]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Subscribers</h1>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{counts.active} active · {counts.total} total</span>
          {counts.total > 0 && (
            <a href="/api/newsletter?format=csv" className="rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-blue-50">Export CSV</a>
          )}
        </div>
      </div>
      {subs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No subscribers yet. Enable the newsletter under Settings → Newsletter.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-3 py-2">Email</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Joined</th><th className="px-3 py-2 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {subs.map((sb) => (
                <SubscriberRow key={sb.id} s={{ id: sb.id, email: sb.email, name: sb.name, status: sb.status, createdAt: sb.createdAt.toISOString() }} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
