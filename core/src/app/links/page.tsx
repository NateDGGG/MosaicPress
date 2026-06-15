import Link from "next/link";
import type { Metadata } from "next";
import { listItems } from "../../lib/items";
import { getSettings } from "../../lib/settings";
import ItemCard from "../../components/ItemCard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: "Links", description: `Links and reading from ${s.siteName}` };
}

export default async function LinksIndex() {
  const links = (await listItems({ publishedOnly: true })).filter((i) => i.type === "link");

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Links</h1>
      <p className="mb-8 text-slate-600">Curated links from around the web, with commentary.</p>

      {links.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No links yet. Add one in the <Link href="/admin/new-link" className="text-brand underline">admin</Link>.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((item) => <ItemCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
