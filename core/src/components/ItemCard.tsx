import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { actionLabel, type ItemType, type Source, TYPE_LABELS } from "../lib/types";
import { priceFormat, durationFormat, readTimeLabel, LEVEL_LABELS } from "../lib/items";

// Item with all relations included.
type FullItem = Prisma.ItemGetPayload<{
  include: {
    external: true; videoMeta: true; productMeta: true; linkMeta: true;
    presenter: true; tags: { include: { tag: true } };
  };
}>;

const TYPE_COLOR: Record<ItemType, string> = {
  article: "bg-blue-100 text-blue-700",
  blog: "bg-indigo-100 text-indigo-700",
  video: "bg-rose-100 text-rose-700",
  product: "bg-purple-100 text-purple-700",
  link: "bg-cyan-100 text-cyan-700",
  book: "bg-amber-100 text-amber-800",
};

function SourceTag({ item }: { item: FullItem }) {
  if (item.source === "hosted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        ● Hosted
      </span>
    );
  }
  const ext = item.external;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {ext?.favicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ext.favicon} alt="" className="h-3.5 w-3.5 rounded-sm" />
      ) : (
        "↗"
      )}
      {ext?.sourceName || ext?.sourceDomain || "External"}
    </span>
  );
}

/**
 * The unified card. Layout is driven by `type`; the only source-dependent
 * difference is the action label and whether the link is internal or external.
 * This is the side-by-side promise made concrete.
 */
export default function ItemCard({
  item,
  showStock = false,
  lowStockThreshold = 5,
}: {
  item: FullItem;
  showStock?: boolean;
  lowStockThreshold?: number;
}) {
  const type = item.type as ItemType;
  const source = item.source as Source;
  const action = actionLabel(type, source, item.external?.sourceName);

  const price = priceFormat(item.productMeta?.priceCents, item.productMeta?.currency);
  const duration = durationFormat(item.videoMeta?.duration);
  const readTime = readTimeLabel(item);
  const level = item.level ? LEVEL_LABELS[item.level] || item.level : null;

  // Low-stock / sold-out badge — only for hosted products when commerce is on.
  const inv = item.productMeta?.inventory;
  let stock: { text: string; cls: string } | null = null;
  if (showStock && item.source === "hosted" && type === "product" && inv != null) {
    if (inv <= 0) stock = { text: "Sold out", cls: "bg-red-100 text-red-700" };
    else if (inv <= lowStockThreshold) stock = { text: `Only ${inv} left`, cls: "bg-amber-100 text-amber-700" };
  }

  const href =
    source === "external" && type === "link"
      ? item.external?.url || "#"
      : `/i/${item.slug}`;
  const isExternalDirect = href.startsWith("http");

  const Inner = (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-video bg-slate-100">
        {item.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.coverImage} alt="" className="h-full w-full object-cover" />
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLOR[type]}`}>
          {TYPE_LABELS[type]}
        </span>
        {item.access === "members" && (
          <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            🔒 Members
          </span>
        )}
        {level && (
          <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs font-medium text-white">
            {level}
          </span>
        )}
        {type === "video" && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-black/55 text-white">▶</span>
          </span>
        )}
        {duration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">{duration}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <SourceTag item={item} />
          {stock && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stock.cls}`}>{stock.text}</span>}
          {price && <span className="ml-auto text-sm font-semibold text-slate-900">{price}</span>}
        </div>
        <h3 className="mb-1 line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-brand">
          {item.title}
        </h3>
        {item.summary && <p className="line-clamp-2 text-sm text-slate-600">{item.summary}</p>}
        <div className="mt-3 flex items-center justify-between pt-2 text-sm">
          <span className="font-medium text-brand">
            {action}{isExternalDirect ? " ↗" : " →"}
          </span>
          <span className="text-xs text-slate-400">
            {[readTime, item.presenter?.name || item.author].filter(Boolean).join(" · ")}
          </span>
        </div>
      </div>
    </article>
  );

  return isExternalDirect ? (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="block h-full">
      {Inner}
    </a>
  ) : (
    <Link href={href} className="block h-full">
      {Inner}
    </Link>
  );
}
