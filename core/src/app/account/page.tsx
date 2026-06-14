import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "../../lib/auth";
import { getActiveSubscription } from "../../lib/membership";
import { priceFormat } from "../../lib/items";
import SignOutButton from "../../components/SignOutButton";
import CancelMembershipButton from "../../components/CancelMembershipButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = getSessionUser();
  if (!user) redirect("/login");
  const sub = await getActiveSubscription(user.id);

  return (
    <div className="mx-auto max-w-xl">
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
    </div>
  );
}
