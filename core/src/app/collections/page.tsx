import Link from "next/link";
import type { Metadata } from "next";
import { listCollections } from "../../lib/collections";
import { getLearner } from "../../lib/learner";
import { completedItemIds } from "../../lib/progress";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Learning paths" };

export default async function CollectionsIndex() {
  const learner = await getLearner();
  const done = learner ? await completedItemIds(learner) : new Set<string>();
  const cols = (await listCollections())
    .map((c) => ({ ...c, published: c.items.filter((i) => i.item.status === "published") }))
    .filter((c) => c.published.length > 0);

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Learning paths</h1>
      <p className="mb-8 max-w-2xl text-slate-600">Guided sequences of lessons — start at the top and work your way through.</p>

      {cols.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">No learning paths yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cols.map((c) => {
            const cover = c.coverImage || c.published.find((i) => i.item.coverImage)?.item.coverImage || null;
            return (
              <Link key={c.id} href={`/collections/${c.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                <div className="aspect-video bg-slate-100">
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">Learning path</div>
                  <h2 className="mb-1 font-semibold leading-snug text-slate-900 group-hover:text-brand">{c.title}</h2>
                  {c.description && <p className="line-clamp-2 text-sm text-slate-600">{c.description}</p>}
                  {(() => {
                    const total = c.published.length;
                    const completed = c.published.filter((i) => done.has(i.item.id)).length;
                    return (
                      <div className="mt-3">
                        <p className="text-xs text-slate-400">
                          {completed > 0 ? `${completed} of ${total} complete` : `${total} ${total === 1 ? "lesson" : "lessons"}`}
                        </p>
                        {completed > 0 && (
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round((completed / total) * 100)}%` }} />
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
