import Link from "next/link";
import { listItems } from "@/lib/items";
import { getSettings } from "@/lib/settings";
import ItemCard from "@/components/ItemCard";
import Band from "@/components/Band";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [items, settings] = await Promise.all([listItems({ publishedOnly: true }), getSettings()]);

  return (
    <div>
      {/* Hero — full-bleed gradient section */}
      <Band tone="hero" flush className="py-14">
        <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">{settings.tagline}</h1>
        <p className="mt-3 max-w-2xl text-white/80">
          Articles, video, shopping, and links. Hosted by you or linked from anywhere,
          presented side-by-side in the same polished layout.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-block rounded-lg bg-white px-4 py-2 font-semibold text-brand hover:bg-white/90"
        >
          Open the admin →
        </Link>
      </Band>

      {/* Content (page-bg section) */}
      <div className="pt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold">Latest</h2>
          <span className="text-sm text-slate-500">
            {items.length} published {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
            Nothing published yet. Head to the <Link href="/admin" className="text-brand underline">admin</Link> to add content.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Accent CTA band */}
      <Band tone="band" className="my-12 py-12 text-center">
        <h2 className="text-2xl font-bold">One format for everything you publish</h2>
        <p className="mx-auto mt-2 max-w-xl opacity-80">
          Your content and the web&rsquo;s best, side by side — hosted or linked.
        </p>
        <Link href="/membership" className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark">
          Become a member
        </Link>
      </Band>
    </div>
  );
}
