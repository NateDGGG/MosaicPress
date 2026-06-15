import Link from "next/link";
import type { Metadata } from "next";
import { listItems } from "../../lib/items";
import { getSettings } from "../../lib/settings";
import ItemCard from "../../components/ItemCard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: "Shop", description: `Products from ${s.siteName}` };
}

export default async function ShopPage() {
  const settings = await getSettings();
  const products = (await listItems({ publishedOnly: true })).filter((i) => i.type === "product");
  const ours = products.filter((i) => i.source === "hosted");
  const recommended = products.filter((i) => i.source === "external");

  const grid = (items: typeof products) => (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => <ItemCard key={item.id} item={item} showStock={settings.commerceEnabled && settings.trackInventory} lowStockThreshold={settings.lowStockThreshold} />)}
    </div>
  );

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Shop</h1>
      <p className="mb-8 text-slate-600">Things we make, and things we recommend.</p>

      {products.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No products yet. Add some in the <Link href="/admin/new-product" className="text-brand underline">admin</Link>.
        </p>
      )}

      {ours.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold">From our store</h2>
          {grid(ours)}
        </section>
      )}

      {recommended.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 text-xl font-bold">Recommended</h2>
          <p className="mb-4 text-sm text-slate-500">Picks from around the web (we may earn a commission).</p>
          {grid(recommended)}
        </section>
      )}
    </div>
  );
}
