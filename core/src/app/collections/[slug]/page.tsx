import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollection } from "../../../lib/collections";
import { getLearner } from "../../../lib/learner";
import { completedItemIds } from "../../../lib/progress";
import { TYPE_LABELS, type ItemType } from "../../../lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await getCollection(params.slug);
  return { title: c ? c.title : "Learning path" };
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = await getCollection(params.slug);
  if (!collection) notFound();

  const items = collection.items.map((ci) => ci.item).filter((it) => it.status === "published");
  const learner = await getLearner();
  const done = learner ? await completedItemIds(learner) : new Set<string>();
  const completedCount = items.filter((it) => done.has(it.id)).length;
  const firstIncomplete = items.find((it) => !done.has(it.id));
  const ctaItem = firstIncomplete || items[0];
  const ctaLabel = completedCount === 0 ? "Start path" : firstIncomplete ? "Resume" : "Review";
  const pct = items.length ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/collections" className="text-sm text-slate-400 hover:text-brand">← All learning paths</Link>
      <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand">Learning path</div>
      <h1 className="mb-2 text-3xl font-bold">{collection.title}</h1>
      {collection.description && <p className="mb-4 max-w-2xl text-slate-600">{collection.description}</p>}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-400">
          {completedCount > 0 ? `${completedCount} of ${items.length} complete` : `${items.length} ${items.length === 1 ? "lesson" : "lessons"}`}
        </span>
        {ctaItem && (
          <Link href={`/i/${ctaItem.slug}`} className="rounded-lg bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark">
            {ctaLabel} →
          </Link>
        )}
      </div>
      {completedCount > 0 && (
        <div className="mb-8 h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
      )}

      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={item.id}>
            <Link href={`/i/${item.slug}`}
              className={`group flex items-center gap-4 rounded-xl border bg-white p-3 transition hover:border-brand hover:shadow-sm ${done.has(item.id) ? "border-green-200" : "border-slate-200"}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${done.has(item.id) ? "bg-green-600 text-white" : "bg-brand/10 text-brand"}`}>
                {done.has(item.id) ? "✓" : i + 1}
              </span>
              {item.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.coverImage} alt="" className="h-14 w-24 shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-900 group-hover:text-brand">{item.title}</div>
                <div className="text-xs text-slate-400">
                  {TYPE_LABELS[item.type as ItemType]}{item.presenter?.name ? ` · ${item.presenter.name}` : ""}
                </div>
              </div>
              <span className="ml-auto text-brand">→</span>
            </Link>
          </li>
        ))}
        {items.length === 0 && <p className="text-slate-500">No published lessons in this path yet.</p>}
      </ol>
    </div>
  );
}
