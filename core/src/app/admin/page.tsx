import { prisma } from "../../lib/db";
import { itemInclude } from "../../lib/items";
import AdminItemRow from "../../components/AdminItemRow";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const items = await prisma.item.findMany({
    include: itemInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  const published = items.filter((i) => i.status === "published").length;
  const external = items.filter((i) => i.source === "external").length;

  return (
    <div>
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Items" value={items.length} />
        <Stat label="Published" value={published} />
        <Stat label="External" value={external} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <AdminItemRow
                key={item.id}
                item={{
                  id: item.id,
                  slug: item.slug,
                  title: item.title,
                  type: item.type,
                  source: item.source,
                  status: item.status,
                  sourceName: item.external?.sourceName,
                }}
              />
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  No content yet. Use “New” or “New from link”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
