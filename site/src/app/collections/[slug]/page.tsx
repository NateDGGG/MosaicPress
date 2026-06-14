import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { itemInclude } from "@/lib/items";
import ItemCard from "@/components/ItemCard";

export const dynamic = "force-dynamic";

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = await prisma.collection.findUnique({
    where: { slug: params.slug },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: { item: { include: itemInclude } },
      },
    },
  });

  if (!collection) notFound();

  const items = collection.items.map((ci) => ci.item).filter((it) => it.status === "published");

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{collection.title}</h1>
        {collection.description && <p className="mt-2 text-slate-600">{collection.description}</p>}
        <p className="mt-3 text-sm text-slate-400">
          {items.length} items · mixed hosted &amp; external · one format
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
