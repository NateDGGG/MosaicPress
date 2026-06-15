import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTagBySlug, tagItems } from "../../../lib/taxonomy";
import { listItems } from "../../../lib/items";
import ItemCard from "../../../components/ItemCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const t = await getTagBySlug(params.slug);
  return { title: t ? `${t.name} — Topic` : "Topic" };
}

export default async function TopicPage({ params }: { params: { slug: string } }) {
  const tag = await getTagBySlug(params.slug);
  if (!tag) notFound();
  // The default ("catch-all") topic shows everything; other topics show only
  // the content assigned to them.
  const items = tag.isDefault
    ? await listItems({ publishedOnly: true })
    : await tagItems(tag.id, { publishedOnly: true, sortMode: tag.sortMode });

  return (
    <div>
      <Link href="/topics" className="text-sm text-slate-400 hover:text-brand">← All topics</Link>
      <h1 className="my-3 text-3xl font-bold">{tag.name}</h1>
      {tag.intro && <p className="mb-4 max-w-2xl text-slate-600">{tag.intro}</p>}
      <p className="mb-6 text-sm text-slate-400">{items.length} {items.length === 1 ? "lesson" : "lessons"}</p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
