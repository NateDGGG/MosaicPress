import Link from "next/link";
import type { Prisma } from "@prisma/client";
import ItemCard from "./ItemCard";
import AutoScroller from "./AutoScroller";

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
  autoScroll = false,
}: {
  title: string;
  href?: string;
  items: FullItem[];
  commentaryMode?: "hidden" | "excerpt" | "full";
  autoScroll?: boolean; // gently auto-scroll (carousel) when the row overflows
}) {
  if (items.length === 0) return null;
  // items-start so cards keep their natural height instead of stretching to the
  // tallest one in the row (which left short cards with trailing whitespace).
  const rowClass = "-mx-4 flex items-start gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]";
  const cards = items.map((item) => (
    <div key={item.id} className="w-72 shrink-0">
      <ItemCard item={item} commentaryMode={commentaryMode} />
    </div>
  ));
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
      {autoScroll ? (
        <AutoScroller className={rowClass}>{cards}</AutoScroller>
      ) : (
        <div className={rowClass}>{cards}</div>
      )}
    </section>
  );
}
