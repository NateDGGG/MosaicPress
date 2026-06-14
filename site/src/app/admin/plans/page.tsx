import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/auth";
import PlanManager from "@/components/PlanManager";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const me = getSessionUser();
  if (!hasRole(me, "owner")) redirect("/admin");
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Membership plans</h1>
      <p className="mb-5 text-sm text-slate-500">
        Plans members can subscribe to. Mark items &ldquo;Members only&rdquo; to gate them.
      </p>
      <PlanManager plans={plans} />
    </div>
  );
}
