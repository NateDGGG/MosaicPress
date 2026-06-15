import Link from "next/link";
import { searchItems } from "../../lib/search";
import { homeTags, listTags } from "../../lib/taxonomy";
import { ITEM_TYPES, TYPE_LABELS, isItemType, type ItemType } from "../../lib/types";
import ItemCard from "../../components/ItemCard";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string; type?: string } }) {
  const q = (searchParams.q || "").trim();
  const activeType = isItemType(searchParams.type) ? (searchParams.type as ItemType) : undefined;

  const allHits = q ? await searchItems(q) : [];
  const hits = activeType ? allHits.filter((h) => h.item.type === activeType) : allHits;

  // Type facets with counts (only types that appear in results).
  const typeCounts = new Map<ItemType, number>();
  for (const h of allHits) {
    const t = h.item.type as ItemType;
    typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
  }

  // Topic suggestions: the most common topics among the results.
  const tagFreq = new Map<string, { slug: string; name: string; n: number }>();
  for (const h of allHits) {
    for (const t of h.item.tags) {
      const cur = tagFreq.get(t.tag.slug) || { slug: t.tag.slug, name: t.tag.name, n: 0 };
      cur.n += 1; tagFreq.set(t.tag.slug, cur);
    }
  }
  const topicSuggestions = [...tagFreq.values()].sort((a, b) => b.n - a.n).slice(0, 8);

  // For the no-query / no-results states, suggest topics to browse.
  const browseTopics = q ? [] : (await homeTags()).length ? await homeTags() : (await listTags()).slice(0, 10);

  const qs = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    return `/search?${sp.toString()}`;
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Search</h1>

      <form action="/search" method="GET" className="mb-6 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          aria-label="Search the library"
          placeholder="Search articles, videos, products, links…"
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand focus:outline-none"
          autoFocus
        />
        <button className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark">Search</button>
      </form>

      {q && allHits.length > 0 && (
        <>
          {/* Type facets */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Link href={qs({ type: undefined })}
              className={`rounded-full border px-3 py-1 text-sm ${!activeType ? "border-brand bg-blue-50 text-brand" : "border-slate-200 text-slate-600 hover:border-brand"}`}>
              All ({allHits.length})
            </Link>
            {ITEM_TYPES.filter((t) => typeCounts.get(t)).map((t) => (
              <Link key={t} href={qs({ type: t })}
                className={`rounded-full border px-3 py-1 text-sm ${activeType === t ? "border-brand bg-blue-50 text-brand" : "border-slate-200 text-slate-600 hover:border-brand"}`}>
                {TYPE_LABELS[t]} ({typeCounts.get(t)})
              </Link>
            ))}
          </div>

          {/* Topic suggestions */}
          {topicSuggestions.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">Related topics:</span>
              {topicSuggestions.map((t) => (
                <Link key={t.slug} href={`/topics/${t.slug}`} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:text-brand">
                  {t.name}
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {q && (
        <p className="mb-4 text-sm text-slate-500">
          {hits.length} result{hits.length === 1 ? "" : "s"}{activeType ? ` in ${TYPE_LABELS[activeType]}` : ""} for &ldquo;{q}&rdquo;
        </p>
      )}

      {q && hits.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="mb-3 text-slate-500">Nothing matched &ldquo;{q}&rdquo;. Try different keywords or browse a topic:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(await listTags()).slice(0, 10).map((t) => (
              <Link key={t.id} href={`/topics/${t.slug}`} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:text-brand">{t.name}</Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hits.map(({ item }) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {!q && (
        <div>
          <p className="mb-4 text-slate-500">
            Type a query above, or <Link href="/" className="text-brand hover:underline">browse everything</Link>.
          </p>
          {browseTopics.length > 0 && (
            <>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Popular topics</h2>
              <div className="flex flex-wrap gap-2">
                {browseTopics.map((t) => (
                  <Link key={t.id} href={`/topics/${t.slug}`}
                    className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand">
                    {t.name}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
