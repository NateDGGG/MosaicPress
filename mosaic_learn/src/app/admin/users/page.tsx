import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/auth";
import NewUserForm from "@/components/NewUserForm";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = getSessionUser();
  if (!hasRole(me, "owner")) redirect("/admin");

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Users</h1>
      <p className="mb-5 text-sm text-slate-500">
        Owners manage everything. Editors publish. Contributors create drafts only.
      </p>

      <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2 text-slate-500">{u.name || "—"}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewUserForm />
    </div>
  );
}
