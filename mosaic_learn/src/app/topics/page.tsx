import Link from "next/link";
import { listTags } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const tags = await listTags();
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Topics</h1>
      <p className="mb-8 text-slate-600">Explore lessons by subject.</p>
      {tags.length === 0 ? (
        <p className="text-slate-500">No topics yet.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((t) => (
            <Link
              key={t.id}
              href={`/topics/${t.slug}`}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-800 hover:border-brand hover:text-brand"
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
