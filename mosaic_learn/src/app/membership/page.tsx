import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/membership";
import { priceFormat } from "@/lib/items";
import SubscribeButton from "@/components/SubscribeButton";

export const dynamic = "force-dynamic";

export default async function MembershipPage() {
  const user = getSessionUser();
  const [plans, active] = await Promise.all([
    prisma.plan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    user ? getActiveSubscription(user.id) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-center text-3xl font-bold">Become a member</h1>
      <p className="mb-8 text-center text-slate-600">
        Support the work and unlock members-only articles and videos.
      </p>

      {active && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-center text-green-800">
          You&rsquo;re an active member ({active.plan.name}).{" "}
          <Link href="/account" className="underline">Manage your membership →</Link>
        </div>
      )}

      {plans.length === 0 ? (
        <p className="text-center text-slate-400">No plans available yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold">{p.name}</h2>
              {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
              <div className="my-4 text-3xl font-bold">
                {priceFormat(p.priceCents, p.currency)}
                <span className="text-base font-normal text-slate-500">/{p.interval}</span>
              </div>
              <div className="mt-auto">
                <SubscribeButton planId={p.id} loggedIn={!!user} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
