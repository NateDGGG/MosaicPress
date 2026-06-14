import Link from "next/link";
import { ITEM_TYPES, TYPE_LABELS } from "../lib/types";

type Tag = { slug: string; name: string };

// Left filter menu: by content type and by topic. Filters are applied via
// query params on the home page (?type= / ?topic=).
export default function FilterSidebar({
  tags,
  activeType,
  activeTopic,
}: {
  tags: Tag[];
  activeType?: string;
  activeTopic?: string;
}) {
  const cls = (active: boolean) =>
    `block rounded px-2 py-1 text-sm ${active ? "bg-brand font-medium text-white" : "text-slate-600 hover:bg-slate-100"}`;
  return (
    <aside className="w-44 shrink-0">
      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Type</h3>
        <Link href="/" className={cls(!activeType && !activeTopic)}>All</Link>
        {ITEM_TYPES.map((t) => (
          <Link key={t} href={`/?type=${t}`} className={cls(activeType === t)}>{TYPE_LABELS[t]}</Link>
        ))}
      </div>
      {tags.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Topic</h3>
          {tags.map((t) => (
            <Link key={t.slug} href={`/?topic=${t.slug}`} className={cls(activeTopic === t.slug)}>{t.name}</Link>
          ))}
        </div>
      )}
    </aside>
  );
}
