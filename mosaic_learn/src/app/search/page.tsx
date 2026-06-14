import Link from "next/link";
import { searchItems } from "@/lib/search";
import ItemCard from "@/components/ItemCard";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || "").trim();
  const hits = q ? await searchItems(q) : [];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Search</h1>

      <form action="/search" method="GET" className="mb-8 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search articles, videos, products, links…"
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand focus:outline-none"
          autoFocus
        />
        <button className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark">Search</button>
      </form>

      {q && (
        <p className="mb-4 text-sm text-slate-500">
          {hits.length} result{hits.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
        </p>
      )}

      {q && hits.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Nothing matched. Try different keywords.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hits.map(({ item }) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {!q && (
        <p className="text-slate-500">
          Type a query above, or <Link href="/" className="text-brand hover:underline">browse everything</Link>.
        </p>
      )}
    </div>
  );
}
