import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "../../lib/auth";
import { getActiveSubscription } from "../../lib/membership";
import { priceFormat } from "../../lib/items";
import { listSaved, listCompleted } from "../../lib/progress";
import ItemCard from "../../components/ItemCard";
import SignOutButton from "../../components/SignOutButton";
import CancelMembershipButton from "../../components/CancelMembershipButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = getSessionUser();
  if (!user) redirect("/login");
  const learner = { kind: "user" as const, userId: user.id };
  const [sub, saved, completed] = await Promise.all([
    getActiveSubscription(user.id),
    listSaved(learner),
    listCompleted(learner),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your account</h1>
        <SignOutButton />
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="text-sm text-slate-500">Signed in as</div>
        <div className="font-medium">{user.name || user.email}</div>
        <div className="text-sm text-slate-500">{user.email}</div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 font-semibold">Membership</h2>
        {sub ? (
          <>
            <p className="mb-1">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>{" "}
              {sub.plan.name} — {priceFormat(sub.plan.priceCents, sub.plan.currency)}/{sub.plan.interval}
            </p>
            {sub.currentPeriodEnd && (
              <p className="mb-4 text-sm text-slate-500">
                Renews/expires {new Date(sub.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            <CancelMembershipButton />
          </>
        ) : (
          <>
            <p className="mb-4 text-slate-600">You don&rsquo;t have an active membership.</p>
            <Link href="/membership" className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
              View plans →
            </Link>
          </>
        )}
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-bold">Saved for later</h2>
        {saved.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((it) => <ItemCard key={it.id} item={it} />)}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
            Nothing saved yet. Use &ldquo;Save for later&rdquo; on any lesson.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">Completed</h2>
        {completed.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((it) => <ItemCard key={it.id} item={it} />)}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
            Mark lessons complete to track what you&rsquo;ve finished.
          </p>
        )}
      </section>
    </div>
  );
}
