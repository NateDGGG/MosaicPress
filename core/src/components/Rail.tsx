import Link from "next/link";
import type { Prisma } from "@prisma/client";
import ItemCard from "./ItemCard";

type FullItem = Prisma.ItemGetPayload<{
  include: {
    external: true; videoMeta: true; productMeta: true; linkMeta: true;
    presenter: true; tags: { include: { tag: true } };
  };
}>;

// A horizontally-scrolling row of cards — the PragerU-style "shelf".
export default function Rail({
  title,
  href,
  items,
  commentaryMode = "hidden",
}: {
  title: string;
  href?: string;
  items: FullItem[];
  commentaryMode?: "hidden" | "excerpt" | "full";
}) {
  if (items.length === 0) return null;
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        {href && (
          <Link href={href} className="text-sm font-medium text-brand hover:underline">
            See all →
          </Link>
        )}
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
        {items.map((item) => (
          <div key={item.id} className="w-72 shrink-0">
            <ItemCard item={item} commentaryMode={commentaryMode} />
          </div>
        ))}
      </div>
    </section>
  );
}
