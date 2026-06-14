import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTagBySlug, tagItems } from "@/lib/taxonomy";
import ItemCard from "@/components/ItemCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const t = await getTagBySlug(params.slug);
  return { title: t ? `${t.name} — Topic` : "Topic" };
}

export default async function TopicPage({ params }: { params: { slug: string } }) {
  const tag = await getTagBySlug(params.slug);
  if (!tag) notFound();
  const items = await tagItems(tag.id, { publishedOnly: true });

  return (
    <div>
      <Link href="/topics" className="text-sm text-slate-400 hover:text-brand">← All topics</Link>
      <h1 className="my-3 text-3xl font-bold">{tag.name}</h1>
      <p className="mb-6 text-slate-500">{items.length} {items.length === 1 ? "item" : "items"}</p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
