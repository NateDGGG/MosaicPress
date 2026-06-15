import Link from "next/link";
import { prisma } from "../../lib/db";
import { itemInclude } from "../../lib/items";
import { getSettings, DEFAULT_SETTINGS } from "../../lib/settings";
import { listTags } from "../../lib/taxonomy";
import AdminItemTable from "../../components/AdminItemTable";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [items, settings, collectionsCount, nonDefaultTags, tags] = await Promise.all([
    prisma.item.findMany({ include: itemInclude, orderBy: [{ updatedAt: "desc" }] }),
    getSettings(),
    prisma.collection.count(),
    prisma.tag.count({ where: { isDefault: false } }),
    listTags(),
  ]);

  const published = items.filter((i) => i.status === "published").length;
  const external = items.filter((i) => i.source === "external").length;

  const homeCustomized =
    settings.homeSections.some((sec) => sec.kind === "text") ||
    settings.homeSections.length !== DEFAULT_SETTINGS.homeSections.length;
  const steps = [
    { done: settings.siteName !== DEFAULT_SETTINGS.siteName, label: "Name your hub & pick a theme", href: "/admin/settings", cta: "Open settings" },
    { done: items.length > 0, label: "Add your first lessons", href: "/admin/new-from-link", cta: "Import from a link" },
    { done: nonDefaultTags > 0, label: "Create topics to organize content", href: "/admin/topics", cta: "Add topics" },
    { done: collectionsCount > 0, label: "Build a learning path", href: "/admin/collections", cta: "Create a path" },
    { done: homeCustomized, label: "Arrange your home page", href: "/admin/settings", cta: "Customize home" },
  ];
  const remaining = steps.filter((x) => !x.done).length;

  return (
    <div>
      {remaining > 0 && (
        <section className="mb-5 rounded-xl border border-brand/30 bg-blue-50/60 p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold text-slate-800">Get your hub going</h2>
            <span className="text-xs text-slate-500">{steps.length - remaining}/{steps.length} done</span>
          </div>
          <ul className="space-y-2">
            {steps.map((st) => (
              <li key={st.label} className="flex items-center gap-3">
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs ${st.done ? "bg-green-600 text-white" : "border border-slate-300 bg-white text-transparent"}`}>✓</span>
                <span className={`text-sm ${st.done ? "text-slate-400 line-through" : "text-slate-700"}`}>{st.label}</span>
                {!st.done && (
                  <Link href={st.href} className="ml-auto rounded-md border border-brand px-3 py-1 text-xs font-medium text-brand hover:bg-blue-50">
                    {st.cta} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Items" value={items.length} />
        <Stat label="Published" value={published} />
        <Stat label="External" value={external} />
      </div>

      <AdminItemTable
        items={items.map((item) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          type: item.type,
          source: item.source,
          status: item.status,
          sourceName: item.external?.sourceName,
        }))}
        tags={tags.map((t) => ({ id: t.id, name: t.name }))}
      />
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
